/*
 * app.js — rendering + routing for Currentry.
 *
 * Pure vanilla JavaScript. No framework, no build step, no network calls,
 * no AI engine. It reads the plain data in data.js and paints the page.
 *
 * Routing uses the URL hash so the app works straight off the file system
 * (double-click index.html) as well as from a web server. Routes:
 *
 *   #/                       -> home dashboard
 *   #/type/<typeId>          -> sources of a content type
 *   #/area/<areaId>          -> sources in a policy area
 *   #/search?q=<terms>       -> search results
 */

(function () {
  "use strict";

  const { CONTENT_TYPES, POLICY_AREAS, READING_LEVELS, LEANS, SOURCES, GUIDES, NEWS_FEED, ITEMS } =
    window.PolicyHubData;

  const app = document.getElementById("app");
  const searchInput = document.getElementById("search-input");

  /* ---- small helpers ---- */

  const byId = (list, id) => list.find((x) => x.id === id);

  const typeLabel = (id) => (byId(CONTENT_TYPES, id) || {}).label || id;
  const areaLabel = (id) => (byId(POLICY_AREAS, id) || {}).label || id;
  const levelLabel = (id) => (byId(READING_LEVELS, id) || {}).label || id;
  const leanMeta = (id) => byId(LEANS, id) || { label: id, short: "?" };

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const newestFirst = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

  // Formats a refresh timestamp (full ISO or plain date) for the "Updated …" label.
  function fmtWhen(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // Collapse the 7 leans into 4 filter buckets for the chips.
  function leanGroup(leanId) {
    if (leanId === "left" || leanId === "lean-left") return "left";
    if (leanId === "right" || leanId === "lean-right") return "right";
    return leanId; // center | nonpartisan | official
  }

  // Order sources left -> right (then nonpartisan, official), then by name.
  const leanOrder = LEANS.reduce((m, l, i) => ((m[l.id] = i), m), {});
  function bySpectrum(a, b) {
    const d = (leanOrder[a.lean] ?? 99) - (leanOrder[b.lean] ?? 99);
    return d !== 0 ? d : a.name.localeCompare(b.name);
  }

  /* ---- source counts for the dashboard tiles ---- */

  const countSourcesForType = (id) =>
    SOURCES.filter((s) => s.type === id).length;
  const countSourcesForArea = (id) =>
    SOURCES.filter((s) => (s.areas || []).includes(id)).length;

  /* ---- rendering pieces ---- */

  function leanBadge(leanId) {
    const m = leanMeta(leanId);
    return `<span class="lean lean--${esc(leanId)}" title="Viewpoint: ${esc(
      m.label
    )}">${esc(m.label)}</span>`;
  }

  function sourceCard(s, opts) {
    opts = opts || {};
    const areas = (s.areas || [])
      .map((a) => `<span class="tag">${esc(areaLabel(a))}</span>`)
      .join(" ");
    const typeTag = opts.showType
      ? `<span class="tag tag-type">${esc(typeLabel(s.type))}</span>`
      : "";
    const rss = s.rss
      ? `<span class="rss-dot" title="A feed is available for auto-refresh">RSS</span>`
      : "";
    const access =
      s.access === "subscription"
        ? `<span class="access access-sub" title="Usually reached through a library login">Library access</span>`
        : s.access === "open"
        ? `<span class="access access-open" title="Free to anyone">Open</span>`
        : "";
    return `
      <article class="source">
        <div class="source-head">
          <h3><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(
      s.name
    )}</a></h3>
          ${leanBadge(s.lean)}
        </div>
        <p>${esc(s.blurb || "")}</p>
        <div class="source-tags">${typeTag}${access}${areas}${rss}</div>
      </article>`;
  }

  function sourceList(sources, opts) {
    if (!sources.length) {
      return `<div class="empty">No sources here yet. Add them in
        <code>js/data.js</code>.</div>`;
    }
    return sources.slice().sort(bySpectrum).map((s) => sourceCard(s, opts)).join("");
  }

  // A horizontal left/right balance bar + a plain-language summary.
  function balanceBar(sources) {
    const counts = {};
    LEANS.forEach((l) => (counts[l.id] = 0));
    sources.forEach((s) => {
      if (counts[s.lean] === undefined) counts[s.lean] = 0;
      counts[s.lean]++;
    });

    const spectrum = LEANS.filter((l) => l.spectrum);
    const spectrumTotal = spectrum.reduce((n, l) => n + counts[l.id], 0);
    const nonpartisan = counts["nonpartisan"] || 0;
    const official = counts["official"] || 0;

    // If there's nothing on the left/right spectrum, this is an
    // official/nonpartisan category — say so instead of drawing an empty bar.
    if (spectrumTotal === 0) {
      const bits = [];
      if (official) bits.push(`${official} official government`);
      if (nonpartisan) bits.push(`${nonpartisan} nonpartisan`);
      return `<div class="balance">
        <div class="balance-note">${bits.join(" and ")} source${
        official + nonpartisan === 1 ? "" : "s"
      } — no left/right balance to weigh here.</div>
        <a class="balance-method" href="#/about">Viewpoint methodology</a>
      </div>`;
    }

    const segments = spectrum
      .filter((l) => counts[l.id] > 0)
      .map((l) => {
        const pct = ((counts[l.id] / spectrumTotal) * 100).toFixed(1);
        return `<span class="seg lean--${l.id}" style="width:${pct}%"
          title="${esc(l.label)}: ${counts[l.id]}"></span>`;
      })
      .join("");

    const left = counts["left"] + counts["lean-left"];
    const center = counts["center"];
    const right = counts["right"] + counts["lean-right"];
    const extra = [];
    if (nonpartisan) extra.push(`${nonpartisan} nonpartisan`);
    if (official) extra.push(`${official} official`);

    return `<div class="balance">
      <div class="balance-label">Viewpoint balance</div>
      <div class="balance-track">${segments}</div>
      <div class="balance-legend">
        <span><b>${left}</b> left-leaning</span>
        <span><b>${center}</b> center</span>
        <span><b>${right}</b> right-leaning</span>
        ${extra.length ? `<span class="balance-extra">${extra.join(" · ")}</span>` : ""}
      </div>
      <a class="balance-method" href="#/about">Viewpoint methodology</a>
    </div>`;
  }

  // Discloses which outlets actually feed the live News page (those with an
  // `rss` URL) and the viewpoint balance of THAT set — which can differ from
  // the full directory, since several major outlets don't offer open feeds.
  function feedDisclosure(newsSources) {
    const feeds = newsSources.filter((s) => s.rss).slice().sort(bySpectrum);
    const noFeed = newsSources.filter((s) => !s.rss);
    if (!feeds.length) return "";

    const g = { left: 0, center: 0, right: 0 };
    feeds.forEach((s) => {
      const grp = leanGroup(s.lean);
      if (g[grp] !== undefined) g[grp]++;
    });

    const chips = feeds
      .map(
        (s) =>
          `<a class="feed-chip" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(
            s.name
          )} ${leanBadge(s.lean)}</a>`
      )
      .join("");

    const excluded = noFeed
      .slice()
      .sort(bySpectrum)
      .map((s) => s.name)
      .slice(0, 6)
      .join(", ");

    return `
      <section class="feed-disclosure" aria-label="Where the live stories come from">
        <h2>Where the live stories come from</h2>
        <p class="feed-balance">Trending and story links are pulled only from the
          <strong>${feeds.length}</strong> outlets below with open feeds —
          <strong>${g.left}</strong> left-leaning, <strong>${g.center}</strong> center,
          <strong>${g.right}</strong> right-leaning.</p>
        <div class="feed-chips">${chips}</div>
        ${
          excluded
            ? `<p class="feed-caveat">Major outlets without an open feed we can pull
               (e.g. ${esc(excluded)}) <strong>can't appear in the live columns</strong>,
               so the trending mix may lean more center/right than the full
               directory at right. Use the directory for deliberate balance.</p>`
            : ""
        }
      </section>`;
  }

  // Reading-level / lean filter chips driven by what's actually present.
  function leanFilterChips(sources) {
    const groupsPresent = [];
    ["left", "center", "right", "nonpartisan", "official"].forEach((g) => {
      if (sources.some((s) => leanGroup(s.lean) === g)) groupsPresent.push(g);
    });
    if (groupsPresent.length <= 1) return ""; // nothing to filter
    const labels = {
      left: "Left-leaning",
      center: "Center",
      right: "Right-leaning",
      nonpartisan: "Nonpartisan",
      official: "Official",
    };
    const chips = groupsPresent
      .map((g) => `<button class="chip" data-group="${g}">${labels[g]}</button>`)
      .join("");
    return `<div class="filters" id="lean-filters">
      <button class="chip active" data-group="all">All viewpoints</button>
      ${chips}
    </div>`;
  }

  /* ---- article (feed item) rendering, for the Latest feed ---- */

  function articleCard(item) {
    const areas = (item.areas || [])
      .map((a) => `<span class="tag">${esc(areaLabel(a))}</span>`)
      .join(" ");
    const level = item.level || "general";
    const isLink = item.url && item.url !== "#";
    const titleHtml = isLink
      ? `<a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(
          item.title
        )}</a>`
      : esc(item.title);
    return `
      <article class="article">
        <div class="article-meta">
          <span class="tag">${esc(typeLabel(item.type))}</span>
          <span class="tag level-${esc(level)}">${esc(levelLabel(level))}</span>
          ${areas}
          <span>${esc(fmtDate(item.date))}</span>
        </div>
        <h3>${titleHtml}</h3>
        <p>${esc(item.summary || "")}</p>
        <div class="article-source">${esc(item.source || "—")}</div>
      </article>`;
  }

  function articleList(items) {
    if (!items.length) return "";
    return items.slice().sort(newestFirst).map(articleCard).join("");
  }

  /* ---- guide (research how-to) rendering ---- */

  function guideTile(g) {
    return `
      <a class="tile guide-tile" href="#/guide/${g.id}">
        <span class="tile-icon">📘</span>
        <h3>${esc(g.title)}</h3>
        <p>${esc(g.summary)}</p>
        <span class="tile-count">${esc(levelLabel(g.level))} · ${g.minutes} min read</span>
      </a>`;
  }

  function viewGuides() {
    app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Home</a> &rsaquo; Research Guide</div>
      <h1 class="page-title">Research Guide</h1>
      <p class="page-lede">Short, plain-language how-tos for doing policy
        research — the kind of guidance policy-school librarians give their
        students, distilled for everyone.</p>
      <div class="card-grid">${GUIDES.map(guideTile).join("")}</div>
    `;
  }

  function viewGuide(id) {
    const g = byId(GUIDES, id);
    if (!g) return viewNotFound();
    const body = g.sections
      .map((sec) => {
        const ps = (sec.p || []).map((p) => `<p>${esc(p)}</p>`).join("");
        const ul =
          sec.ul && sec.ul.length
            ? `<ul>${sec.ul.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>`
            : "";
        return `<section class="guide-section"><h2>${esc(sec.h)}</h2>${ps}${ul}</section>`;
      })
      .join("");
    const others = GUIDES.filter((x) => x.id !== g.id)
      .slice(0, 3)
      .map((x) => `<li><a href="#/guide/${x.id}">${esc(x.title)}</a></li>`)
      .join("");

    app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Home</a> &rsaquo;
        <a href="#/guides">Research Guide</a> &rsaquo; ${esc(g.title)}</div>
      <h1 class="page-title">${esc(g.title)}</h1>
      <p class="page-lede">${esc(g.summary)}</p>
      <div class="guide-meta">
        <span class="tag level-${esc(g.level)}">${esc(levelLabel(g.level))}</span>
        <span>${g.minutes} min read</span>
      </div>
      <article class="guide-body">${body}</article>
      <div class="section-head"><h2>Keep reading</h2></div>
      <ul class="guide-more">${others}</ul>
    `;
  }

  function viewAbout() {
    const newsFeeds = SOURCES.filter((s) => s.type === "news" && s.rss)
      .slice()
      .sort(bySpectrum);
    const feedList = newsFeeds
      .map((s) => `<li>${esc(s.name)} ${leanBadge(s.lean)}</li>`)
      .join("");

    app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Home</a> &rsaquo; About</div>
      <h1 class="page-title">About &amp; methodology</h1>
      <p class="page-lede">What Currentry is, how the viewpoint labels work, and
        where the live news comes from — stated plainly so you can judge it.</p>
      <article class="guide-body">
        <section class="guide-section">
          <h2>What this is</h2>
          <p>Currentry is a free, self-contained guide to public policy — part
            library research guide, part newsstand. It runs as static files with
            no account, no tracking, and no AI engine. The code is open source
            (MIT).</p>
        </section>
        <section class="guide-section">
          <h2>How the viewpoint labels work</h2>
          <p>Each opinionated source carries a lean — Left, Lean Left, Center,
            Lean Right, or Right — plus Nonpartisan and Official/Govt for sources
            that don't sit on that spectrum. The labels are <strong>editorial
            approximations</strong> informed by independent media-bias and
            think-tank classifications (such as AllSides, Ad Fontes Media, and
            academic surveys of think-tank ideology).</p>
          <p>They exist to help you <strong>build a balanced media diet on
            purpose</strong> — not to endorse, dismiss, or rate the accuracy of
            any outlet. Reasonable people disagree on individual calls; the labels
            are easy to change in <code>js/data.js</code>, and you can suggest a
            correction by opening an issue on the project's GitHub repository.</p>
        </section>
        <section class="guide-section">
          <h2>Reading the balance bar</h2>
          <p>On each category and policy-area page, a balance bar sums the leans
            of the sources shown so you can see, at a glance, whether the set
            skews one way. Government and academic pages carry no left/right bar,
            because their sources are labeled Official or Nonpartisan.</p>
        </section>
        <section class="guide-section">
          <h2>Where the live news comes from (and its bias)</h2>
          <p>The News page updates from public RSS feeds. <strong>Only outlets
            that publish an open feed can appear</strong> in the trending and
            story-link columns. Several major outlets — including The New York
            Times, The Washington Post, Politico, Reuters, and the Associated
            Press — don't offer feeds we can reliably pull, so the live mix can
            lean more center/right than the full directory. We disclose this on
            the News page itself. The outlets currently feeding the live page:</p>
          <ul class="feed-list">${feedList}</ul>
          <p>For deliberately balanced reading, use the full source directory
            rather than the live feed alone.</p>
        </section>
        <section class="guide-section">
          <h2>Sources &amp; how-to content</h2>
          <p>The source directory and the research guides are curated, drawing on
            the public-policy research guides that major policy schools publish
            for their students. Links go to the original publishers; their content
            remains theirs.</p>
        </section>
      </article>
    `;
  }

  /* ---- views ---- */

  function viewHome() {
    const typeTiles = CONTENT_TYPES.map((t) => {
      const n = countSourcesForType(t.id);
      return `
      <a class="tile" href="#/type/${t.id}">
        <span class="tile-icon">${t.icon || "•"}</span>
        <h3>${esc(t.label)}</h3>
        <p>${esc(t.blurb)}</p>
        <span class="tile-count">${n} source${n === 1 ? "" : "s"}</span>
      </a>`;
    }).join("");

    const areaTiles = POLICY_AREAS.map((a) => {
      const n = countSourcesForArea(a.id);
      return `
      <a class="tile" href="#/area/${a.id}">
        <span class="tile-icon">${a.icon || "•"}</span>
        <h3>${esc(a.label)}</h3>
        <p>${esc(a.blurb)}</p>
        <span class="tile-count">${n} source${n === 1 ? "" : "s"}</span>
      </a>`;
    }).join("");

    app.innerHTML = `
      <section class="hero">
        <h1>Answers for public policy, all in one place.</h1>
        <p>Follow the news, read the analysis, and find the research.
          Made accessible for everyone.</p>
      </section>

      <div class="section-head">
        <h2>Explore by category</h2>
        <span class="hint">How the information is packaged</span>
      </div>
      <div class="card-grid">${typeTiles}</div>

      <div class="section-head">
        <h2>Explore by policy area</h2>
        <span class="hint">What the information is about</span>
      </div>
      <div class="card-grid">${areaTiles}</div>

      <p class="balance-blurb">Every opinionated category is stocked with
        sources from across the spectrum, each labeled left, center, or
        right so you can build a balanced media diet on purpose.</p>

      <div class="section-head">
        <h2>Research guides</h2>
        <a class="hint" href="#/guides">All guides &rsaquo;</a>
      </div>
      <div class="card-grid">${GUIDES.slice(0, 3).map(guideTile).join("")}</div>
    `;
  }

  // Shared list view for a content type or a policy area.
  function viewSources({ crumb, title, lede, sources, showType, items }) {
    app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Home</a> &rsaquo; ${esc(crumb)}</div>
      <h1 class="page-title">${esc(title)}</h1>
      <p class="page-lede">${esc(lede)}</p>
      ${balanceBar(sources)}
      ${leanFilterChips(sources)}
      <div id="source-target">${sourceList(sources, { showType })}</div>
      ${
        items && items.length
          ? `<div class="section-head"><h2>Latest entries</h2>
             <span class="hint">Sample feed — populated later</span></div>
             ${articleList(items)}`
          : ""
      }
    `;

    wireLeanFilter(sources, showType);
  }

  // Attaches click behavior to the #lean-filters chips, filtering the
  // #source-target list by viewpoint group. Safe to call when neither exists.
  function wireLeanFilter(sources, showType) {
    const filters = document.getElementById("lean-filters");
    const target = document.getElementById("source-target");
    if (!filters || !target) return;
    filters.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      filters.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const g = btn.dataset.group;
      const filtered =
        g === "all" ? sources : sources.filter((s) => leanGroup(s.lean) === g);
      target.innerHTML = sourceList(filtered, { showType });
    });
  }

  /* ---- live news feed (fetched from data/news.json) ----
   * newsData starts as the offline fallback baked into data.js, then the
   * app fetches the live file and re-renders. While the News page is open a
   * poll timer refetches and updates the view when the feed has changed. */
  let newsData = NEWS_FEED || { trending: [] };
  let newsPollTimer = null;
  const NEWS_POLL_MS = 5 * 60 * 1000; // 5 minutes

  const onNewsPage = () =>
    (window.location.hash || "#/").indexOf("type/news") !== -1;

  function fetchNews() {
    // Cache-busting query so an open tab sees each new deploy, not a cached copy.
    return fetch("data/news.json?t=" + Date.now(), { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .catch(() => null); // fall back to whatever newsData already holds
  }

  function startNewsPolling() {
    stopNewsPolling();
    newsPollTimer = setInterval(() => {
      fetchNews().then((d) => {
        if (d && d.lastRefreshed !== newsData.lastRefreshed) {
          newsData = d;
          if (onNewsPage()) renderNews();
        }
      });
    }, NEWS_POLL_MS);
  }

  function stopNewsPolling() {
    if (newsPollTimer) {
      clearInterval(newsPollTimer);
      newsPollTimer = null;
    }
  }

  // Special split layout for the News page: trending + links on the left,
  // the source directory + balance bar on the right.
  function viewNews() {
    renderNews(); // paint immediately from current (possibly fallback) data
    fetchNews().then((d) => {
      if (d) {
        newsData = d;
        if (onNewsPage()) renderNews();
      }
    });
    startNewsPolling();
  }

  function renderNews() {
    const t = byId(CONTENT_TYPES, "news");
    const sources = SOURCES.filter((s) => s.type === "news");
    const feed = newsData || { trending: [] };
    const trending = feed.trending || [];

    const trendingHtml = trending.length
      ? trending
          .map(
            (st) => `
        <article class="trend">
          <div class="trend-areas">${(st.areas || [])
            .map((a) => `<span class="tag">${esc(areaLabel(a))}</span>`)
            .join(" ")}</div>
          <h3>${esc(st.headline)}</h3>
          <p>${esc(st.summary)}</p>
        </article>`
          )
          .join("")
      : `<div class="empty">No trending stories yet — they'll appear after the next refresh.</div>`;

    const links = trending.reduce(
      (acc, st) => acc.concat(st.links || []),
      []
    );
    const linksHtml = links.length
      ? links
          .map(
            (l) => `
        <a class="newslink" href="${esc(l.url)}" target="_blank" rel="noopener">
          <span class="newslink-top">${leanBadge(l.lean)}<span class="newslink-outlet">${esc(
              l.outlet
            )}</span></span>
          <span class="newslink-title">${esc(l.title)}</span>
        </a>`
          )
          .join("")
      : `<div class="empty">No links yet.</div>`;

    const refreshed = feed.lastRefreshed
      ? `Updated ${fmtWhen(feed.lastRefreshed)}`
      : "";

    app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Home</a> &rsaquo; News</div>
      <h1 class="page-title">News</h1>
      <p class="page-lede">${esc(t.blurb)}</p>
      ${feedDisclosure(sources)}
      <div class="news-layout">
        <div class="news-left">
          <section class="news-pane">
            <div class="pane-head">
              <h2>Trending now</h2>
              <span class="pane-sub">${esc(refreshed)}</span>
            </div>
            <div class="pane-body">${trendingHtml}</div>
          </section>
          <section class="news-pane">
            <div class="pane-head">
              <h2>Story links</h2>
              <span class="pane-sub">${links.length} article${
      links.length === 1 ? "" : "s"
    }</span>
            </div>
            <div class="pane-body">
              <div class="newslink-list">${linksHtml}</div>
            </div>
          </section>
        </div>
        <div class="news-right">
          ${balanceBar(sources)}
          ${leanFilterChips(sources)}
          <div id="source-target">${sourceList(sources, { showType: false })}</div>
        </div>
      </div>
    `;

    wireLeanFilter(sources, false);
  }

  function viewType(typeId) {
    if (typeId === "news") return viewNews();
    const t = byId(CONTENT_TYPES, typeId);
    if (!t) return viewNotFound();
    viewSources({
      crumb: t.label,
      title: t.label,
      lede: t.blurb,
      sources: SOURCES.filter((s) => s.type === typeId),
      showType: false,
      items: ITEMS.filter((i) => i.type === typeId),
    });
  }

  function viewArea(areaId) {
    const a = byId(POLICY_AREAS, areaId);
    if (!a) return viewNotFound();
    viewSources({
      crumb: a.label,
      title: a.label,
      lede: a.blurb,
      sources: SOURCES.filter((s) => (s.areas || []).includes(areaId)),
      showType: true, // sources here span multiple formats
      items: ITEMS.filter((i) => (i.areas || []).includes(areaId)),
    });
  }

  function viewSearch(query) {
    const q = (query || "").trim().toLowerCase();
    const matchSource = (s) =>
      [s.name, s.blurb, typeLabel(s.type), leanMeta(s.lean).label]
        .concat((s.areas || []).map(areaLabel))
        .join(" ")
        .toLowerCase()
        .includes(q);
    const matchItem = (i) =>
      [i.title, i.source, i.summary, typeLabel(i.type)]
        .concat((i.areas || []).map(areaLabel))
        .join(" ")
        .toLowerCase()
        .includes(q);

    const matchGuide = (g) => {
      const sectionText = (g.sections || [])
        .map((s) => [s.h].concat(s.p || []).concat(s.ul || []).join(" "))
        .join(" ");
      return [g.title, g.summary, sectionText].join(" ").toLowerCase().includes(q);
    };

    const guideHits = q ? GUIDES.filter(matchGuide) : [];
    const srcHits = q ? SOURCES.filter(matchSource) : [];
    const itemHits = q ? ITEMS.filter(matchItem) : [];

    app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Home</a> &rsaquo; Search</div>
      <h1 class="page-title">Search results</h1>
      <p class="page-lede">${
        (function () {
          const total = guideHits.length + srcHits.length + itemHits.length;
          return q
            ? `${total} result${total === 1 ? "" : "s"} for “${esc(query)}”.`
            : "Type in the search box above to find guides, sources, and entries.";
        })()
      }</p>
      ${
        guideHits.length
          ? `<div class="section-head"><h2>Research guides</h2></div>
             <div class="card-grid">${guideHits.map(guideTile).join("")}</div>`
          : ""
      }
      ${
        srcHits.length
          ? `<div class="section-head"><h2>Sources</h2></div>${sourceList(
              srcHits,
              { showType: true }
            )}`
          : ""
      }
      ${
        itemHits.length
          ? `<div class="section-head"><h2>Entries</h2></div>${articleList(
              itemHits
            )}`
          : ""
      }
      ${
        q && !guideHits.length && !srcHits.length && !itemHits.length
          ? `<div class="empty">No matches. Try a broader term.</div>`
          : ""
      }
    `;
  }

  function viewNotFound() {
    app.innerHTML = `
      <h1 class="page-title">Page not found</h1>
      <p class="page-lede">That category doesn’t exist (yet).
        <a href="#/">Return to the dashboard</a>.</p>`;
  }

  /* ---- router ---- */

  function router() {
    const hash = window.location.hash || "#/";
    const [path, queryStr] = hash.slice(1).split("?");
    const parts = path.split("/").filter(Boolean); // e.g. ["type","news"]

    window.scrollTo(0, 0);
    stopNewsPolling(); // viewNews() restarts it if we're landing on the News page

    if (parts.length === 0) return viewHome();

    switch (parts[0]) {
      case "type":
        return viewType(parts[1]);
      case "area":
        return viewArea(parts[1]);
      case "guides":
        return viewGuides();
      case "guide":
        return viewGuide(parts[1]);
      case "about":
        return viewAbout();
      case "search": {
        const params = new URLSearchParams(queryStr || "");
        return viewSearch(params.get("q") || "");
      }
      default:
        return viewNotFound();
    }
  }

  /* ---- search box wiring ---- */

  let searchTimer = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const q = searchInput.value.trim();
      window.location.hash = q ? "#/search?q=" + encodeURIComponent(q) : "#/";
    }, 200);
  });

  // On in-app navigation, move keyboard/screen-reader focus to the main
  // region so the new page is announced and Tab starts from the top.
  window.addEventListener("hashchange", () => {
    router();
    if (app && typeof app.focus === "function") app.focus();
  });
  window.addEventListener("DOMContentLoaded", router);
  if (document.readyState !== "loading") router();
})();
