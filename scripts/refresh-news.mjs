/*
 * refresh-news.mjs — regenerates data/news.json from live RSS feeds.
 *
 * Run by .github/workflows/refresh.yml (or locally: `node scripts/refresh-news.mjs`).
 * Dependency-free: uses Node's built-in fetch (Node 18+) and a small regex
 * RSS/Atom parser, so CI needs no `npm install`.
 *
 * What it does:
 *   1. Fetches each feed in FEEDS (failures are skipped, never fatal).
 *   2. Clusters recent headlines that appear across 2+ outlets — a rough but
 *      honest "trending" signal (a story multiple outlets cover at once).
 *   3. Writes the top clusters to data/news.json in the shape the app reads,
 *      with one link per outlet, spanning the viewpoint spectrum.
 *
 * Tune the knobs below. NOTE: feed URLs drift — review FEEDS periodically.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "data", "news.json");
const DATA_JS = join(__dirname, "..", "js", "data.js");

/* ---- knobs ---- */
const MAX_STORIES = 6; // trending clusters to publish
const MAX_PER_FEED = 25; // recent items to read per feed
const RECENT_DAYS = 4; // ignore items older than this
const MIN_OUTLETS = 2; // a cluster is "trending" if this many outlets cover it
const MIN_STORIES_TO_WRITE = 3; // refuse to overwrite a good file with junk
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

/* ---- light keyword -> policy area mapping (for the area tags) ---- */
const AREA_KEYWORDS = {
  social: ["immigration", "immigrant", "housing", "welfare", "labor", "union", "poverty", "wages"],
  environmental: ["climate", "energy", "emissions", "oil", "gas", "environmental", "epa", "renewable"],
  international: ["ukraine", "russia", "china", "israel", "gaza", "nato", "foreign", "trade", "tariff", "diplomatic"],
  "sci-tech": ["ai", "artificial", "tech", "technology", "data", "cyber", "chip", "semiconductor", "space"],
  economic: ["inflation", "economy", "fed", "rates", "budget", "deficit", "jobs", "market", "tax", "tariff"],
  health: ["health", "medicare", "medicaid", "fda", "cdc", "drug", "hospital", "abortion", "covid"],
  education: ["school", "student", "education", "college", "university", "teachers"],
  justice: ["court", "supreme", "justice", "lawsuit", "ruling", "police", "prison", "voting", "trial"],
  security: ["defense", "military", "pentagon", "war", "troops", "nuclear", "border", "homeland", "intelligence"],
};

const STOPWORDS = new Set(
  ("the a an and or but of to in on for with as at by from up about into over after "
    + "is are was were be been being has have had do does did will would can could should "
    + "new says say said report reports amid over under his her its their they them this that "
    + "what when where who why how than then more most us u.s america american").split(/\s+/)
);

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

// Strips the boilerplate outlets bury in RSS <description> fields.
function cleanSummary(s) {
  let out = decode(s)
    .replace(/The post .*? appeared first on .*/i, "")
    .replace(/Continue reading\.*\s*$/i, "")
    .replace(/\s*Read (more|full story).*$/i, "")
    .replace(/\s*\[(?:&#8230;|…|\.\.\.)\]\s*$/i, "")
    .replace(/&#8230;|…/g, "…")
    .replace(/\s+/g, " ")
    .trim();
  if (out.length > 220) out = out.slice(0, 217).replace(/\s+\S*$/, "") + "…";
  return out;
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
    let link = decode(tag(b, "link")) || atomLink(b);
    const desc = decode(tag(b, "description") || tag(b, "summary") || tag(b, "content"));
    const dateStr = tag(b, "pubDate") || tag(b, "updated") || tag(b, "published");
    const date = dateStr ? new Date(decode(dateStr)) : null;
    return { title, link: (link || "").trim(), desc, date: date && !isNaN(date) ? date : null };
  });
}

function keywords(title) {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
  );
}

function overlap(a, b) {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared;
}

function guessAreas(text) {
  const t = " " + text.toLowerCase() + " ";
  const hits = [];
  for (const [area, words] of Object.entries(AREA_KEYWORDS)) {
    if (words.some((w) => t.includes(" " + w))) hits.push(area);
  }
  return hits.slice(0, 3);
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
  const cutoff = Date.now() - RECENT_DAYS * 86400000;
  const items = [];

  for (const feed of FEEDS) {
    try {
      const xml = await fetchTimeout(feed.url);
      const parsed = parseFeed(xml).slice(0, MAX_PER_FEED);
      for (const it of parsed) {
        if (!it.title || !it.link) continue;
        if (it.date && it.date.getTime() < cutoff) continue;
        items.push({ ...it, outlet: feed.outlet, lean: feed.lean, kw: keywords(it.title) });
      }
      console.log(`ok    ${feed.outlet}: ${parsed.length} items`);
    } catch (e) {
      console.log(`skip  ${feed.outlet}: ${e.message}`);
    }
  }

  // Greedy clustering by shared significant keywords.
  const clusters = [];
  for (const it of items) {
    let best = null;
    let bestShared = 0;
    for (const c of clusters) {
      const shared = overlap(it.kw, c.kw);
      if (shared >= 2 && shared > bestShared) {
        best = c;
        bestShared = shared;
      }
    }
    if (best) {
      best.items.push(it);
      for (const w of it.kw) best.kw.add(w);
    } else {
      clusters.push({ kw: new Set(it.kw), items: [it] });
    }
  }

  const leanOrder = { left: 0, "lean-left": 1, center: 2, "lean-right": 3, right: 4 };
  const distinctOutlets = (c) => new Set(c.items.map((i) => i.outlet)).size;

  let trending = clusters
    .filter((c) => distinctOutlets(c) >= MIN_OUTLETS)
    .sort((a, b) => distinctOutlets(b) - distinctOutlets(a) || b.items.length - a.items.length);

  // Fallback: if outlets disagree on everything (few clusters), show the most
  // recent items as singleton stories so the page is never empty.
  if (trending.length < 3) {
    const recent = items
      .filter((i) => i.date)
      .sort((a, b) => b.date - a.date)
      .slice(0, MAX_STORIES)
      .map((i) => ({ kw: i.kw, items: [i] }));
    trending = trending.concat(recent).slice(0, MAX_STORIES);
  }

  const stories = trending.slice(0, MAX_STORIES).map((c, idx) => {
    const sorted = c.items
      .slice()
      .sort((a, b) => (b.date && a.date ? b.date - a.date : 0));
    const lead = sorted[0];

    // One link per outlet, ordered across the spectrum.
    const seen = new Set();
    const links = sorted
      .filter((i) => (seen.has(i.outlet) ? false : (seen.add(i.outlet), true)))
      .sort((a, b) => (leanOrder[a.lean] ?? 9) - (leanOrder[b.lean] ?? 9))
      .slice(0, 5)
      .map((i) => ({ outlet: i.outlet, lean: i.lean, url: i.link, title: i.title }));

    const summary = cleanSummary(
      (sorted.find((i) => cleanSummary(i.desc).length > 40) || lead).desc
    );

    return {
      id: "t" + (idx + 1),
      headline: lead.title,
      areas: guessAreas(c.items.map((i) => i.title + " " + i.desc).join(" ")),
      summary,
      links,
    };
  });

  // Safety guard: don't clobber a good feed file with a near-empty result
  // (e.g. if most feeds were down this run). Keep the last good file instead.
  if (stories.length < MIN_STORIES_TO_WRITE && existsSync(OUT)) {
    console.log(
      `\nOnly ${stories.length} stories (< ${MIN_STORIES_TO_WRITE}); keeping existing ${OUT} unchanged.`
    );
    return;
  }

  const out = { lastRefreshed: new Date().toISOString(), trending: stories };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${stories.length} stories -> ${OUT}`);
}

main().catch((e) => {
  console.error("refresh failed:", e);
  process.exit(1);
});
