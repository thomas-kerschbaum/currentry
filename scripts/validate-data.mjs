/*
 * validate-data.mjs — guards against a typo blanking the whole site.
 *
 * Run locally (`node scripts/validate-data.mjs`) or in CI before deploy.
 * It loads js/data.js and data/news.json and checks referential integrity:
 * every source/guide/link points at a real type, area, lean, and level, and
 * ids are unique. Exits 1 with a list of problems, 0 if everything checks out.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const errors = [];
const err = (m) => errors.push(m);

/* ---- load data.js with a stub window ---- */
let D;
try {
  const code = readFileSync(join(root, "js", "data.js"), "utf8");
  const win = {};
  new Function("window", code)(win);
  D = win.PolicyHubData;
} catch (e) {
  console.error("FAIL: could not evaluate js/data.js —", e.message);
  process.exit(1);
}
if (!D) {
  console.error("FAIL: js/data.js did not set window.PolicyHubData");
  process.exit(1);
}

const ids = (arr) => new Set((arr || []).map((x) => x.id));
const typeIds = ids(D.CONTENT_TYPES);
const areaIds = ids(D.POLICY_AREAS);
const leanIds = ids(D.LEANS);
const levelIds = ids(D.READING_LEVELS);

function checkUnique(arr, label) {
  const seen = new Set();
  for (const x of arr || []) {
    if (!x.id) err(`${label}: an entry is missing an id`);
    else if (seen.has(x.id)) err(`${label}: duplicate id "${x.id}"`);
    else seen.add(x.id);
  }
}

checkUnique(D.CONTENT_TYPES, "CONTENT_TYPES");
checkUnique(D.POLICY_AREAS, "POLICY_AREAS");
checkUnique(D.LEANS, "LEANS");
checkUnique(D.SOURCES, "SOURCES");
checkUnique(D.GUIDES, "GUIDES");

/* ---- sources ---- */
for (const s of D.SOURCES || []) {
  const where = `SOURCE "${s.id || "?"}"`;
  if (!s.name) err(`${where}: missing name`);
  if (!s.url) err(`${where}: missing url`);
  if (!typeIds.has(s.type)) err(`${where}: unknown type "${s.type}"`);
  if (!leanIds.has(s.lean)) err(`${where}: unknown lean "${s.lean}"`);
  for (const a of s.areas || [])
    if (!areaIds.has(a)) err(`${where}: unknown area "${a}"`);
  if (s.access && !["open", "subscription"].includes(s.access))
    err(`${where}: invalid access "${s.access}"`);
  if (s.rss && typeof s.rss !== "string") err(`${where}: rss must be a string`);
}

/* ---- guides ---- */
for (const g of D.GUIDES || []) {
  const where = `GUIDE "${g.id || "?"}"`;
  if (!g.title) err(`${where}: missing title`);
  if (g.level && !levelIds.has(g.level)) err(`${where}: unknown level "${g.level}"`);
  if (!Array.isArray(g.sections) || !g.sections.length)
    err(`${where}: needs at least one section`);
  for (const sec of g.sections || [])
    if (!sec.h) err(`${where}: a section is missing a heading (h)`);
}

/* ---- inline NEWS_FEED fallback ---- */
validateFeed(D.NEWS_FEED, "NEWS_FEED (data.js fallback)");

/* ---- data/news.json (live feed) ---- */
const newsPath = join(root, "data", "news.json");
if (existsSync(newsPath)) {
  try {
    validateFeed(JSON.parse(readFileSync(newsPath, "utf8")), "data/news.json");
  } catch (e) {
    err(`data/news.json: invalid JSON — ${e.message}`);
  }
} else {
  err("data/news.json: file is missing");
}

function validateFeed(feed, label) {
  if (!feed || !Array.isArray(feed.trending)) {
    err(`${label}: missing trending array`);
    return;
  }
  feed.trending.forEach((st, i) => {
    if (!st.headline) err(`${label}: story #${i + 1} missing headline`);
    for (const a of st.areas || [])
      if (!areaIds.has(a)) err(`${label}: story "${st.id || i}" unknown area "${a}"`);
    for (const l of st.links || []) {
      if (!l.url) err(`${label}: a link in "${st.id || i}" is missing a url`);
      if (l.lean && !leanIds.has(l.lean))
        err(`${label}: a link in "${st.id || i}" has unknown lean "${l.lean}"`);
    }
  });
}

/* ---- report ---- */
if (errors.length) {
  console.error(`Data validation FAILED with ${errors.length} problem(s):\n`);
  for (const e of errors) console.error("  • " + e);
  process.exit(1);
}
console.log(
  `Data OK: ${D.SOURCES.length} sources, ${D.GUIDES.length} guides, ` +
    `${(D.SOURCES.filter((s) => s.type === "news" && s.rss) || []).length} live news feeds.`
);
