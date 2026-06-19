# Currentry

**Answers for public policy, all in one place.** A self-contained information
hub — a library research guide crossed with a policy newsstand — built so a
first-week undergraduate and a senior policy manager can both find their
footing.

**No server, no database, no build step, no AI engine.** It's plain HTML, CSS,
and JavaScript. Open `index.html` in any browser, or host the folder anywhere
static (GitHub Pages, Netlify, an internal share).

## What's here

```
currentry/
├── index.html              the page shell
├── css/styles.css          all styling
├── js/
│   ├── data.js             ← the only file you normally edit (sources + config)
│   └── app.js              rendering + routing
├── .github/workflows/
│   └── deploy.yml          auto-publishes to GitHub Pages on push
├── .nojekyll               tells Pages to serve files as-is
└── README.md
```

## How it works

The home dashboard leads with a **research guide** (how to do policy research)
and then offers two ways into the sources:

- **Start here — research guides**: short, plain-language how-tos synthesized
  from the public-policy research guides that top policy schools (Harvard
  Kennedy, Yale, Princeton, Michigan, Georgetown, George Mason, and others)
  publish for their students. Evergreen content that needs no automation.
- **Explore by category** — the *format*: News · Op-Eds & Commentary · Policy
  Briefs · U.S. Government Press Releases · Academic Research · Research Tools
  & Data (databases, aggregators, and data portals).
- **Explore by policy area** — the *subject*: Social · Environmental & Energy ·
  International & Foreign Affairs · Science & Technology · Economic & Fiscal ·
  Health · Education · Justice & Civil Rights · National Security & Defense.

Every opinionated category (news, op-eds, think-tank briefs) is stocked with a
**viewpoint-balanced** set of sources. Each source carries a lean label, and
each list shows a **balance bar** (left / center / right) plus a one-click
filter, so readers can build a balanced media diet on purpose.

### About the viewpoint labels

The `lean` on each source — Left, Lean Left, Center, Lean Right, Right, plus
Nonpartisan and Official/Govt — is an **editorial approximation** informed by
independent media-bias and think-tank classifications (e.g. AllSides, Ad Fontes
Media, and academic surveys of think-tank ideology). It's there to *aid
balance, not to endorse or dismiss* any outlet. Government and academic sources
are labeled Official or Nonpartisan and carry no left/right rating. Disagree
with a call? Edit it in `js/data.js`.

## Adding or changing sources

Open `js/data.js`. To add a source, append to the `SOURCES` array:

```js
{
  id: "unique-id",
  name: "Outlet or Institution",
  type: "policy-briefs",          // one CONTENT_TYPES id
  areas: ["economic", "health"],  // one or more POLICY_AREAS ids
  lean: "center",                 // a LEANS id
  url: "https://example.org",
  rss: "https://example.org/feed", // optional, for the future refresh job
  blurb: "One-line description.",
}
```

You can also rename or reorder categories, policy areas, and lean labels by
editing `CONTENT_TYPES`, `POLICY_AREAS`, and `LEANS`. The dashboard and balance
bars recompute themselves automatically.

## Publishing to GitHub Pages

1. Create a repo and push this folder to it (see below).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub
   Actions**.
3. The included `.github/workflows/deploy.yml` publishes the site on every push
   to `main`. Your site appears at `https://<user>.github.io/<repo>/`.

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

## Live news refresh

The News page updates itself without a server or database, using a build-time /
run-time split:

1. **`scripts/refresh-news.mjs`** fetches the outlets' RSS feeds, clusters
   headlines that several outlets cover at once into "trending" stories, and
   writes **`data/news.json`**. It's dependency-free (Node 18+ built-in fetch),
   so CI needs no `npm install`.
2. **`.github/workflows/refresh.yml`** runs that script — on a schedule and via
   the Actions **"Run workflow"** button — then commits the JSON and redeploys
   Pages in the same job.
3. **The page fetches `data/news.json`** at load and, while the News tab is
   open, **polls it every 5 minutes**. When `lastRefreshed` changes, the view
   re-renders on its own — no manual reload. Each fetch is cache-busted so an
   open tab isn't served a stale copy.

So "real time" works on two levels: new visitors always get the latest, and an
already-open tab updates itself within the poll interval after your refresh
runs. (A static host can't *push* like a websocket; polling is the standard,
robust equivalent.)

Notes:
- Opened directly from disk (`file://`), browsers block fetching local JSON, so
  the page falls back to the inline `NEWS_FEED` copy in `js/data.js`. Over
  http(s) — including GitHub Pages — the live fetch works.
- **Feed URLs in `scripts/refresh-news.mjs` are best-effort and drift over
  time;** any that fail are skipped, and you should review the `FEEDS` list
  periodically. Cross-outlet "trending" detection is a simple keyword heuristic,
  not a newsroom-grade clustering engine.
- Adjust cadence via the `cron` line in `refresh.yml` and the knobs at the top
  of the script.

## Roadmap

The skeleton stores everything as static data so it never depends on a live
backend. Natural next layers, all of which keep the running site static:

- **More live feeds** — extend the same `news.json` pattern to op-eds, briefs,
  or press releases (the Federal Register and GovInfo offer open APIs for
  official documents).
- **More research-guide content** — the six starter guides can grow into a
  glossary and topic-specific reading pathways for newcomers (the part that
  never goes stale). Guides live in the `GUIDES` array in `js/data.js`.
- **Personalization** — `localStorage`-based saved items and read/unread, with
  no accounts and no backend.
