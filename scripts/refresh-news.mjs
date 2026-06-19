/*
 * refresh-news.mjs — regenerates data/news.json from live RSS feeds.
 *
 * Run by .github/workflows/refresh.yml (or locally: `node scripts/refresh-news.mjs`).
 * Dependency-free: uses Node's built-in fetch (Node 18+) and a small regex
 * RSS/Atom parser, so CI needs no `npm install`.
 *
 * What it does:
 *   1. Fetches every feed in FEEDS (failures are skipped, never fatal).
 *   2. Merges the results with the articles already in data/news.json, deduped
 *      by URL — so stories persist across runs (a rolling MEMORY_HOURS window).
 *   3. Drops anything older than MEMORY_HOURS and writes a flat list, newest
 *      first, in the shape the News page reads.
 *
 * No clustering or summaries: the News page lists each article's own headline
 * linking straight to the story. Tune the knobs below. NOTE: feed URLs drift —
 * the feed list is derived from js/data.js (sources with an `rss` field).
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "data", "news.json");
const DATA_JS = join(__dirname, "..", "js", "data.js");

/* ---- knobs ---- */
const MEMORY_HOURS = 24; // how long a story stays before it ages off
const MAX_PER_FEED = 40; // items to read per feed each run
const MAX_ARTICLES = 400; // hard cap on the stored list
const FETCH_TIMEOUT_MS = 15000;

/* ---- feeds: derived from js/data.js (single source of truth) ----
 * Every news SOURCE that carries an `rss` URL becomes a feed, using the same
 * `lean` shown in the UI. This guarantees the "live feed" badges and the
 * RSS-balance disclosure on the News page exactly match what we actually pull.
 * Feeds that 404 or change are simply skipped at runtime. */
function loadFeeds() {
  const code = readFileSync(DATA_JS, "utf8");
  const win = {};
  // data.js ends with `window.PolicyHubData = {...}`; run it with a stub window.
  new Function("window", code)(win);
  const sources = (win.PolicyHubData && win.PolicyHubData.SOURCES) || [];
  return sources
    .filter((s) => s.type === "news" && s.rss)
    .map((s) => ({ outlet: s.name, lean: s.lean, url: s.rss }));
}
const FEEDS = loadFeeds();

/* ---- helpers ---- */

function decode(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : "";
}

function atomLink(block) {
  const m = block.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i);
  return m ? m[1] : "";
}

function parseFeed(xml) {
  const blocks = xml.match(/<(item|entry)[\s\S]*?<\/\1>/gi) || [];
  return blocks.map((b) => {
    const title = decode(tag(b, "title"));
    const link = (decode(tag(b, "link")) || atomLink(b) || "").trim();
    const dateStr = tag(b, "pubDate") || tag(b, "updated") || tag(b, "published");
    const date = dateStr ? new Date(decode(dateStr)) : null;
    return { title, link, date: date && !isNaN(date) ? date : null };
  });
}

// Dedup key: ignore query string / fragment / trailing slash so the same
// article from a feed (often tagged ?at_medium=RSS) collapses to one entry.
function urlKey(u) {
  return (u || "").split("#")[0].split("?")[0].replace(/\/+$/, "");
}

const fetchTimeout = async (url) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "CurrentryBot/1.0 (+https://github.com)" },
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.text();
  } finally {
    clearTimeout(id);
  }
};

/* ---- main ---- */

async function main() {
  const now = Date.now();
  const cutoff = now - MEMORY_HOURS * 3600 * 1000;

  // 1. Seed the map with the previous run's articles (the memory). Each keeps
  //    its original `date`, so an item ages off MEMORY_HOURS after it first
  //    appeared (or after its publish time, when the feed provides one).
  const map = new Map();
  if (existsSync(OUT)) {
    try {
      const prev = JSON.parse(readFileSync(OUT, "utf8")).articles || [];
      for (const a of prev) {
        const ts = Date.parse(a.date);
        map.set(urlKey(a.url), {
          outlet: a.outlet,
          lean: a.lean,
          url: a.url,
          title: a.title,
          date: a.date,
          ts: isNaN(ts) ? now : ts,
        });
      }
    } catch (e) {
      console.log("warn  could not read existing feed:", e.message);
    }
  }

  // 2. Pull every feed and add anything new.
  let added = 0;
  for (const feed of FEEDS) {
    try {
      const xml = await fetchTimeout(feed.url);
      const parsed = parseFeed(xml).slice(0, MAX_PER_FEED);
      let n = 0;
      for (const it of parsed) {
        if (!it.title || !it.link) continue;
        const key = urlKey(it.link);
        if (map.has(key)) {
          map.get(key).title = it.title; // keep original date; refresh title
          continue;
        }
        const ts = it.date ? it.date.getTime() : now; // no pubDate -> first seen now
        if (ts < cutoff) continue;
        map.set(key, {
          outlet: feed.outlet,
          lean: feed.lean,
          url: it.link,
          title: it.title,
          date: new Date(ts).toISOString(),
          ts,
        });
        n++;
        added++;
      }
      console.log(`ok    ${feed.outlet}: ${parsed.length} read, ${n} new`);
    } catch (e) {
      console.log(`skip  ${feed.outlet}: ${e.message}`);
    }
  }

  // 3. Keep the last MEMORY_HOURS, newest first, capped.
  const articles = [...map.values()]
    .filter((a) => a.ts >= cutoff)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, MAX_ARTICLES)
    .map(({ outlet, lean, url, title, date }) => ({ outlet, lean, url, title, date }));

  // Safety guard: never clobber a good file with an empty list (e.g. if every
  // feed was down this run). Keep what's there.
  if (articles.length === 0 && existsSync(OUT)) {
    console.log("\nNo articles this run; keeping existing file unchanged.");
    return;
  }

  const out = { lastRefreshed: new Date(now).toISOString(), articles };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${articles.length} articles (${added} new this run) -> ${OUT}`);
}

main().catch((e) => {
  console.error("refresh failed:", e);
  process.exit(1);
});
