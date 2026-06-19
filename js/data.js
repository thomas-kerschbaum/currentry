/*
 * data.js — the content + configuration layer for Currentry.
 *
 * This is the ONLY file you normally need to touch to add information sources.
 * Nothing here depends on an AI engine. Everything is plain data.
 *
 * What lives here:
 *   1. CONTENT_TYPES  — the formats a reader can browse (news, op-eds, etc.)
 *   2. POLICY_AREAS   — the subject domains (social, environmental, etc.)
 *   3. READING_LEVELS — accessibility tiers (Start here / General / In depth)
 *   4. LEANS          — viewpoint labels used for balance (left … right)
 *   5. SOURCES        — the curated, viewpoint-balanced source directory
 *   6. ITEMS          — individual entries for the "Latest" feed (placeholder
 *                       until a feed pipeline populates them)
 *
 * Viewpoint ratings note: the `lean` on each source is informed by
 * independent media-bias and think-tank classifications (e.g. AllSides,
 * Ad Fontes Media, and academic surveys of think-tank ideology). They are
 * editorial approximations, not precise scores, and are meant to help
 * readers assemble a balanced media diet — not to endorse or dismiss any
 * outlet. Adjust freely.
 */

/* ----------------------------------------------------------------------
 * 1. CONTENT TYPES — how the information is packaged
 * -------------------------------------------------------------------- */
const CONTENT_TYPES = [
  {
    id: "news",
    label: "News",
    blurb: "Day-to-day reporting on policy developments and events.",
    icon: "📰",
  },
  {
    id: "op-eds",
    label: "Op-Eds & Commentary",
    blurb: "Argument and analysis — where experts and editors make a case.",
    icon: "🖋️",
  },
  {
    id: "policy-briefs",
    label: "Policy Briefs",
    blurb: "Short, decision-focused analysis from think tanks and institutes.",
    icon: "📑",
  },
  {
    id: "press-releases",
    label: "U.S. Government Press Releases",
    blurb: "Official statements straight from federal agencies and offices.",
    icon: "🏛️",
  },
  {
    id: "academic",
    label: "Academic Research",
    blurb: "Peer-reviewed studies, working papers, and scholarly journals.",
    icon: "🎓",
  },
  {
    id: "research-tools",
    label: "Research Tools & Data",
    blurb: "Databases, aggregators, and data portals to find the material — the toolkit policy-school librarians point students to.",
    icon: "🧭",
  },
];

/* ----------------------------------------------------------------------
 * 2. POLICY AREAS — the subject domains
 * -------------------------------------------------------------------- */
const POLICY_AREAS = [
  {
    id: "social",
    label: "Social Policy",
    blurb: "Welfare, housing, labor, immigration, and the social safety net.",
    icon: "🤝",
  },
  {
    id: "environmental",
    label: "Environmental & Energy",
    blurb: "Climate, conservation, energy, and natural resources.",
    icon: "🌍",
  },
  {
    id: "international",
    label: "International & Foreign Affairs",
    blurb: "Diplomacy, trade, development, and global governance.",
    icon: "🌐",
  },
  {
    id: "sci-tech",
    label: "Science & Technology",
    blurb: "Research policy, AI, biotech, data, and innovation.",
    icon: "🔬",
  },
  {
    id: "economic",
    label: "Economic & Fiscal",
    blurb: "Taxes, budgets, trade, monetary policy, and markets.",
    icon: "📈",
  },
  {
    id: "health",
    label: "Health & Public Health",
    blurb: "Healthcare, public health, drugs, and biomedical policy.",
    icon: "🩺",
  },
  {
    id: "education",
    label: "Education",
    blurb: "K-12, higher education, workforce, and research funding.",
    icon: "🎒",
  },
  {
    id: "justice",
    label: "Justice & Civil Rights",
    blurb: "Criminal justice, courts, voting, and civil liberties.",
    icon: "⚖️",
  },
  {
    id: "security",
    label: "National Security & Defense",
    blurb: "Defense, intelligence, cybersecurity, and homeland security.",
    icon: "🛡️",
  },
];

/* ----------------------------------------------------------------------
 * 3. READING LEVELS — so a newbie undergrad and a senior manager can
 *    both find something pitched at their level.
 * -------------------------------------------------------------------- */
const READING_LEVELS = [
  { id: "intro", label: "Start here", blurb: "Accessible explainers, no jargon." },
  { id: "general", label: "General", blurb: "For an informed general reader." },
  { id: "advanced", label: "In depth", blurb: "Technical detail for specialists." },
];

/* ----------------------------------------------------------------------
 * 4. LEANS — viewpoint labels, ordered left → right for the balance bar.
 *    `spectrum: true` entries appear on the left/right balance bar;
 *    the others (nonpartisan, official) are counted separately.
 * -------------------------------------------------------------------- */
const LEANS = [
  { id: "left", label: "Left", short: "L", spectrum: true },
  { id: "lean-left", label: "Lean Left", short: "LL", spectrum: true },
  { id: "center", label: "Center", short: "C", spectrum: true },
  { id: "lean-right", label: "Lean Right", short: "LR", spectrum: true },
  { id: "right", label: "Right", short: "R", spectrum: true },
  { id: "nonpartisan", label: "Nonpartisan", short: "NP", spectrum: false },
  { id: "official", label: "Official / Govt", short: "GOV", spectrum: false },
];

/* ----------------------------------------------------------------------
 * 5. SOURCES — the curated directory.
 *
 *    Each source:
 *      id      unique string
 *      name    outlet / institution name
 *      type    one CONTENT_TYPES id
 *      areas   array of POLICY_AREAS ids it regularly covers
 *      lean    one LEANS id
 *      url     homepage / section landing page
 *      rss     (optional) feed URL — used later by an offline refresh job
 *      blurb   one-line description
 *
 *    Sources are deliberately spread across the viewpoint spectrum within
 *    each opinionated category (news, op-eds, policy briefs) so the
 *    dashboard can show — and readers can balance — competing perspectives.
 * -------------------------------------------------------------------- */
const SOURCES = [
  /* ---------------------------- NEWS ---------------------------- */
  { id: "reuters", name: "Reuters", type: "news", lean: "center",
    areas: ["international", "economic", "social", "sci-tech"],
    url: "https://www.reuters.com",
    blurb: "Global wire service; spare, just-the-facts reporting." },
  { id: "ap", name: "Associated Press", type: "news", lean: "center",
    areas: ["international", "economic", "social", "justice"],
    url: "https://apnews.com",
    blurb: "Nonprofit wire cooperative widely rated among the least biased." },
  { id: "npr", name: "NPR", type: "news", lean: "lean-left",
    areas: ["social", "health", "international", "sci-tech", "environmental", "education"],
    url: "https://www.npr.org", rss: "https://feeds.npr.org/1001/rss.xml",
    blurb: "Public radio newsroom with deep explanatory segments." },
  { id: "bbc", name: "BBC News", type: "news", lean: "center",
    areas: ["international", "economic", "sci-tech"],
    url: "https://www.bbc.com/news",
    rss: "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml",
    blurb: "UK public broadcaster with strong global coverage." },
  { id: "guardian", name: "The Guardian (US)", type: "news", lean: "lean-left",
    areas: ["international", "social", "environmental", "justice"],
    url: "https://www.theguardian.com/us-news",
    rss: "https://www.theguardian.com/us-news/rss",
    blurb: "UK-based outlet with a large, progressive U.S. operation." },
  { id: "pbs", name: "PBS NewsHour", type: "news", lean: "center",
    areas: ["social", "international", "health", "education"],
    url: "https://www.pbs.org/newshour",
    rss: "https://www.pbs.org/newshour/feeds/rss/politics",
    blurb: "Public-television news known for long-form policy interviews." },
  { id: "politico", name: "Politico", type: "news", lean: "lean-left",
    areas: ["social", "economic", "health", "international", "justice"],
    url: "https://www.politico.com",
    blurb: "Insider coverage of Washington policymaking and Congress." },
  { id: "thehill", name: "The Hill", type: "news", lean: "center",
    areas: ["social", "economic", "health", "justice"],
    url: "https://thehill.com",
    rss: "https://thehill.com/news/feed/",
    blurb: "Capitol Hill–focused reporting on legislation and politics." },
  { id: "axios", name: "Axios", type: "news", lean: "center",
    areas: ["economic", "sci-tech", "health", "social"],
    url: "https://www.axios.com",
    blurb: "Brisk, bulleted briefings on policy and business." },
  { id: "wsj-news", name: "The Wall Street Journal (News)", type: "news", lean: "center",
    areas: ["economic", "international", "sci-tech"],
    url: "https://www.wsj.com/news",
    blurb: "Business-focused newsroom; its news desk rates near center." },
  { id: "nyt", name: "The New York Times", type: "news", lean: "lean-left",
    areas: ["social", "international", "health", "sci-tech", "justice", "environmental", "education"],
    url: "https://www.nytimes.com",
    blurb: "Large national newsroom with broad policy coverage." },
  { id: "wapo", name: "The Washington Post", type: "news", lean: "lean-left",
    areas: ["social", "economic", "international", "justice", "environmental", "security"],
    url: "https://www.washingtonpost.com",
    blurb: "Washington-centered reporting on government and politics." },
  { id: "bloomberg", name: "Bloomberg", type: "news", lean: "center",
    areas: ["economic", "international", "environmental"],
    url: "https://www.bloomberg.com",
    blurb: "Markets, economics, and business-policy reporting." },
  { id: "csmonitor", name: "The Christian Science Monitor", type: "news", lean: "center",
    areas: ["international", "social", "justice"],
    url: "https://www.csmonitor.com",
    rss: "https://rss.csmonitor.com/feeds/usa",
    blurb: "Measured, solutions-oriented national and world coverage." },
  { id: "foxnews", name: "Fox News", type: "news", lean: "lean-right",
    areas: ["social", "justice", "security", "international"],
    url: "https://www.foxnews.com",
    rss: "https://moxie.foxnews.com/google-publisher/politics.xml",
    blurb: "Largest conservative-leaning cable newsroom." },
  { id: "washexaminer", name: "Washington Examiner", type: "news", lean: "lean-right",
    areas: ["economic", "social", "justice"],
    url: "https://www.washingtonexaminer.com",
    rss: "https://www.washingtonexaminer.com/feed",
    blurb: "Conservative-leaning coverage of Washington and policy." },
  { id: "washtimes", name: "The Washington Times", type: "news", lean: "right",
    areas: ["security", "social", "justice"],
    url: "https://www.washingtontimes.com",
    blurb: "Conservative national newspaper based in D.C." },
  { id: "realclear", name: "RealClearPolitics", type: "news", lean: "lean-right",
    areas: ["economic", "social", "justice"],
    url: "https://www.realclearpolitics.com",
    blurb: "Aggregator and polling hub spanning the spectrum." },

  /* ------------------------- OP-EDS & COMMENTARY ------------------------- */
  { id: "theatlantic", name: "The Atlantic (Ideas)", type: "op-eds", lean: "lean-left",
    areas: ["social", "international", "sci-tech", "justice", "security", "environmental"],
    url: "https://www.theatlantic.com/ideas",
    blurb: "Long-form essays and argument on culture and policy." },
  { id: "newyorker", name: "The New Yorker (Comment)", type: "op-eds", lean: "left",
    areas: ["social", "justice", "international"],
    url: "https://www.newyorker.com/news",
    blurb: "Literary reporting and progressive commentary." },
  { id: "vox", name: "Vox", type: "op-eds", lean: "left",
    areas: ["social", "economic", "health", "sci-tech", "environmental"],
    url: "https://www.vox.com",
    blurb: "Explanatory journalism with a progressive frame." },
  { id: "thenation", name: "The Nation", type: "op-eds", lean: "left",
    areas: ["social", "economic", "justice"],
    url: "https://www.thenation.com",
    blurb: "Flagship of the American progressive left." },
  { id: "nytopinion", name: "New York Times Opinion", type: "op-eds", lean: "lean-left",
    areas: ["social", "economic", "international"],
    url: "https://www.nytimes.com/section/opinion",
    blurb: "Columnists and guest essays across the center-left." },
  { id: "thebulwark", name: "The Bulwark", type: "op-eds", lean: "center",
    areas: ["justice", "security", "social"],
    url: "https://www.thebulwark.com",
    blurb: "Center-right writers, often pro-democracy and anti-populist." },
  { id: "persuasion", name: "Persuasion", type: "op-eds", lean: "center",
    areas: ["social", "justice", "education"],
    url: "https://www.persuasion.community",
    blurb: "Heterodox, liberal-democratic essays across divides." },
  { id: "thedispatch", name: "The Dispatch", type: "op-eds", lean: "lean-right",
    areas: ["security", "justice", "economic"],
    url: "https://thedispatch.com",
    blurb: "Fact-driven center-right reporting and commentary." },
  { id: "reason", name: "Reason", type: "op-eds", lean: "lean-right",
    areas: ["economic", "justice", "social"],
    url: "https://reason.com",
    blurb: "Libertarian take: free markets and free minds." },
  { id: "wsjopinion", name: "Wall Street Journal Opinion", type: "op-eds", lean: "lean-right",
    areas: ["economic", "international", "social"],
    url: "https://www.wsj.com/opinion",
    blurb: "Influential business-conservative editorial page." },
  { id: "nationalreview", name: "National Review", type: "op-eds", lean: "right",
    areas: ["social", "economic", "security"],
    url: "https://www.nationalreview.com",
    blurb: "Flagship of mainstream American conservatism." },
  { id: "americanconservative", name: "The American Conservative", type: "op-eds", lean: "right",
    areas: ["international", "social", "economic"],
    url: "https://www.theamericanconservative.com",
    blurb: "Traditionalist, restraint-minded conservative commentary." },
  { id: "cityjournal", name: "City Journal", type: "op-eds", lean: "lean-right",
    areas: ["social", "justice", "education"],
    url: "https://www.city-journal.org",
    blurb: "Manhattan Institute's magazine on cities and policy." },
  { id: "commentary", name: "Commentary", type: "op-eds", lean: "right",
    areas: ["international", "security", "social"],
    url: "https://www.commentary.org",
    blurb: "Conservative essays on politics, culture, and foreign affairs." },

  /* --------------------------- POLICY BRIEFS --------------------------- */
  /* Left-leaning */
  { id: "cap", name: "Center for American Progress", type: "policy-briefs", lean: "left",
    areas: ["social", "economic", "health", "environmental", "education", "security"],
    url: "https://www.americanprogress.org",
    blurb: "Progressive policy shop close to Democratic priorities." },
  { id: "cbpp", name: "Center on Budget and Policy Priorities", type: "policy-briefs", lean: "lean-left",
    areas: ["economic", "social", "health"],
    url: "https://www.cbpp.org",
    blurb: "Rigorous analysis of budgets and programs for low-income people." },
  { id: "epi", name: "Economic Policy Institute", type: "policy-briefs", lean: "left",
    areas: ["economic", "social"],
    url: "https://www.epi.org",
    blurb: "Labor-aligned research on wages, jobs, and inequality." },
  { id: "cepr", name: "Center for Economic and Policy Research", type: "policy-briefs", lean: "left",
    areas: ["economic", "international", "social"],
    url: "https://cepr.net",
    blurb: "Progressive economics with a global lens." },
  { id: "urban", name: "Urban Institute", type: "policy-briefs", lean: "center",
    areas: ["social", "economic", "health", "education"],
    url: "https://www.urban.org",
    blurb: "Nonpartisan, data-heavy research, center-left in emphasis." },
  /* Center / nonpartisan */
  { id: "brookings", name: "Brookings Institution", type: "policy-briefs", lean: "center",
    areas: ["economic", "international", "social", "sci-tech", "security", "health"],
    url: "https://www.brookings.edu",
    blurb: "Broad, prestigious think tank usually described as centrist." },
  { id: "rand", name: "RAND Corporation", type: "policy-briefs", lean: "nonpartisan",
    areas: ["security", "health", "sci-tech", "education", "social"],
    url: "https://www.rand.org",
    blurb: "Nonpartisan research institute with deep defense and health work." },
  { id: "bpc", name: "Bipartisan Policy Center", type: "policy-briefs", lean: "center",
    areas: ["health", "economic", "environmental", "social"],
    url: "https://bipartisanpolicy.org",
    blurb: "Explicitly cross-partisan, deal-making policy analysis." },
  { id: "cfr", name: "Council on Foreign Relations", type: "policy-briefs", lean: "center",
    areas: ["international", "security", "economic"],
    url: "https://www.cfr.org",
    blurb: "The establishment hub for foreign-policy analysis." },
  { id: "csis", name: "Center for Strategic & International Studies", type: "policy-briefs", lean: "center",
    areas: ["international", "security", "economic"],
    url: "https://www.csis.org",
    blurb: "Bipartisan research on security and international affairs." },
  { id: "carnegie", name: "Carnegie Endowment for International Peace", type: "policy-briefs", lean: "center",
    areas: ["international", "security"],
    url: "https://carnegieendowment.org",
    blurb: "Global network focused on diplomacy and statecraft." },
  { id: "atlanticcouncil", name: "Atlantic Council", type: "policy-briefs", lean: "center",
    areas: ["international", "security", "environmental"],
    url: "https://www.atlanticcouncil.org",
    blurb: "Transatlantic security and geopolitics think tank." },
  { id: "niskanen", name: "Niskanen Center", type: "policy-briefs", lean: "center",
    areas: ["economic", "environmental", "social", "international"],
    url: "https://www.niskanencenter.org",
    blurb: "Moderate, cross-ideological 'neoliberal' policy center." },
  { id: "pew", name: "Pew Research Center", type: "policy-briefs", lean: "nonpartisan",
    areas: ["social", "international", "sci-tech", "health"],
    url: "https://www.pewresearch.org",
    blurb: "Nonpartisan polling and demographic fact tank — no positions." },
  { id: "rff", name: "Resources for the Future", type: "policy-briefs", lean: "nonpartisan",
    areas: ["environmental", "economic"],
    url: "https://www.rff.org",
    blurb: "Nonpartisan environmental and energy economics." },
  { id: "aspen", name: "Aspen Institute", type: "policy-briefs", lean: "center",
    areas: ["education", "social", "international", "health"],
    url: "https://www.aspeninstitute.org",
    blurb: "Values-based leadership and cross-sector policy programs." },
  /* Right-leaning */
  { id: "heritage", name: "The Heritage Foundation", type: "policy-briefs", lean: "right",
    areas: ["economic", "social", "security", "justice", "education", "environmental", "health"],
    url: "https://www.heritage.org",
    blurb: "Leading conservative think tank; publisher of Project 2025." },
  { id: "aei", name: "American Enterprise Institute", type: "policy-briefs", lean: "lean-right",
    areas: ["economic", "social", "international", "health", "environmental", "sci-tech"],
    url: "https://www.aei.org",
    blurb: "Center-right research on markets and free enterprise." },
  { id: "cato", name: "Cato Institute", type: "policy-briefs", lean: "lean-right",
    areas: ["economic", "justice", "international", "social", "environmental", "sci-tech", "health"],
    url: "https://www.cato.org",
    blurb: "Libertarian institute: limited government, free markets." },
  { id: "manhattan", name: "Manhattan Institute", type: "policy-briefs", lean: "right",
    areas: ["social", "justice", "economic", "education", "health"],
    url: "https://manhattan.institute",
    blurb: "Conservative urban-policy and public-order research." },
  { id: "hoover", name: "Hoover Institution", type: "policy-briefs", lean: "right",
    areas: ["economic", "international", "security", "education", "sci-tech"],
    url: "https://www.hoover.org",
    blurb: "Stanford-based conservative/free-market think tank." },
  { id: "mercatus", name: "Mercatus Center", type: "policy-briefs", lean: "lean-right",
    areas: ["economic", "sci-tech", "environmental"],
    url: "https://www.mercatus.org",
    blurb: "Market-oriented economics centered on regulation." },
  { id: "hudson", name: "Hudson Institute", type: "policy-briefs", lean: "right",
    areas: ["international", "security", "economic"],
    url: "https://www.hudson.org",
    blurb: "Conservative think tank focused on security and geopolitics." },
  { id: "taxfoundation", name: "Tax Foundation", type: "policy-briefs", lean: "lean-right",
    areas: ["economic"],
    url: "https://taxfoundation.org",
    blurb: "Widely cited, business-friendly tax-policy modeling." },
  /* Official nonpartisan analysis */
  { id: "cbo", name: "Congressional Budget Office", type: "policy-briefs", lean: "official",
    areas: ["economic", "health", "social"],
    url: "https://www.cbo.gov",
    blurb: "Congress's nonpartisan scorekeeper for budgets and bills." },
  { id: "crs", name: "Congressional Research Service", type: "policy-briefs", lean: "official",
    areas: ["economic", "international", "justice", "social", "security"],
    url: "https://crsreports.congress.gov",
    blurb: "Congress's in-house nonpartisan analysts (public reports)." },
  { id: "gao", name: "Government Accountability Office", type: "policy-briefs", lean: "official",
    areas: ["economic", "health", "security", "social"],
    url: "https://www.gao.gov",
    blurb: "The federal watchdog auditing how programs actually perform." },

  /* --------------------- U.S. GOVERNMENT PRESS RELEASES --------------------- */
  { id: "whitehouse", name: "The White House", type: "press-releases", lean: "official",
    areas: ["social", "economic", "international", "security"],
    url: "https://www.whitehouse.gov/news",
    blurb: "Statements, proclamations, and fact sheets from the President." },
  { id: "state", name: "U.S. Department of State", type: "press-releases", lean: "official",
    areas: ["international", "security"],
    url: "https://www.state.gov/press-releases",
    blurb: "Diplomacy, treaties, and foreign-policy announcements." },
  { id: "defense", name: "U.S. Department of Defense", type: "press-releases", lean: "official",
    areas: ["security", "international"],
    url: "https://www.defense.gov/News/Releases",
    blurb: "Military operations, contracts, and Pentagon statements." },
  { id: "hhs", name: "Health & Human Services", type: "press-releases", lean: "official",
    areas: ["health", "social"],
    url: "https://www.hhs.gov/about/news",
    blurb: "Public-health, Medicare/Medicaid, and FDA/CDC parent agency." },
  { id: "treasury", name: "U.S. Department of the Treasury", type: "press-releases", lean: "official",
    areas: ["economic"],
    url: "https://home.treasury.gov/news/press-releases",
    blurb: "Sanctions, debt, taxation, and economic-policy actions." },
  { id: "doj", name: "U.S. Department of Justice", type: "press-releases", lean: "official",
    areas: ["justice", "security"],
    url: "https://www.justice.gov/news",
    blurb: "Prosecutions, civil-rights enforcement, and legal actions." },
  { id: "dol", name: "U.S. Department of Labor", type: "press-releases", lean: "official",
    areas: ["social", "economic"],
    url: "https://www.dol.gov/newsroom/releases",
    blurb: "Jobs data, workplace rules, and labor enforcement." },
  { id: "epa", name: "Environmental Protection Agency", type: "press-releases", lean: "official",
    areas: ["environmental", "health"],
    url: "https://www.epa.gov/newsreleases",
    blurb: "Environmental rules, enforcement, and grants." },
  { id: "ed", name: "U.S. Department of Education", type: "press-releases", lean: "official",
    areas: ["education"],
    url: "https://www.ed.gov/news",
    blurb: "K-12, higher-ed, and student-aid announcements." },
  { id: "dhs", name: "Department of Homeland Security", type: "press-releases", lean: "official",
    areas: ["security", "social"],
    url: "https://www.dhs.gov/news-releases",
    blurb: "Immigration, borders, cybersecurity, and disaster response." },
  { id: "doe", name: "U.S. Department of Energy", type: "press-releases", lean: "official",
    areas: ["environmental", "sci-tech"],
    url: "https://www.energy.gov/listings/energy-newsroom",
    blurb: "Energy, grid, nuclear, and clean-tech funding." },
  { id: "interior", name: "U.S. Department of the Interior", type: "press-releases", lean: "official",
    areas: ["environmental"],
    url: "https://www.doi.gov/news",
    blurb: "Public lands, wildlife, and natural-resource management." },
  { id: "federalregister", name: "Federal Register", type: "press-releases", lean: "official",
    areas: ["economic", "environmental", "health", "justice"],
    url: "https://www.federalregister.gov",
    blurb: "The daily journal of rules and notices (has an open API)." },
  { id: "govinfo", name: "GovInfo (GPO)", type: "press-releases", lean: "official",
    areas: ["economic", "justice", "international"],
    url: "https://www.govinfo.gov",
    blurb: "Authenticated federal documents — bills, laws, reports (API)." },

  /* --------------------------- ACADEMIC RESEARCH --------------------------- */
  { id: "nber", name: "National Bureau of Economic Research", type: "academic", lean: "nonpartisan",
    areas: ["economic", "health", "education", "social"],
    url: "https://www.nber.org",
    blurb: "The premier source of economics working papers." },
  { id: "ssrn", name: "SSRN", type: "academic", lean: "nonpartisan",
    areas: ["economic", "justice", "social", "international"],
    url: "https://www.ssrn.com",
    blurb: "Huge open repository of social-science preprints." },
  { id: "repec", name: "RePEc / IDEAS", type: "academic", lean: "nonpartisan",
    areas: ["economic"],
    url: "https://ideas.repec.org",
    blurb: "Open bibliographic database for economics research." },
  { id: "jpam", name: "Journal of Policy Analysis & Management", type: "academic", lean: "nonpartisan",
    areas: ["social", "economic", "health", "education"],
    url: "https://onlinelibrary.wiley.com/journal/15206688",
    blurb: "The flagship peer-reviewed public-policy journal (APPAM)." },
  { id: "jpp", name: "Journal of Public Policy", type: "academic", lean: "nonpartisan",
    areas: ["economic", "social", "international"],
    url: "https://www.cambridge.org/core/journals/journal-of-public-policy",
    blurb: "Cambridge journal applying social science to policymaking." },
  { id: "ajps", name: "American Journal of Political Science", type: "academic", lean: "nonpartisan",
    areas: ["social", "justice", "international"],
    url: "https://onlinelibrary.wiley.com/journal/15405907",
    blurb: "Top-ranked political-science research journal." },
  { id: "aer", name: "American Economic Review", type: "academic", lean: "nonpartisan",
    areas: ["economic"],
    url: "https://www.aeaweb.org/journals/aer",
    blurb: "The leading general-interest economics journal." },
  { id: "healthaffairs", name: "Health Affairs", type: "academic", lean: "nonpartisan",
    areas: ["health"],
    url: "https://www.healthaffairs.org",
    blurb: "The leading peer-reviewed health-policy journal." },
  { id: "lancet", name: "The Lancet", type: "academic", lean: "nonpartisan",
    areas: ["health"],
    url: "https://www.thelancet.com",
    blurb: "Premier medical journal with global-health policy work." },
  { id: "science", name: "Science (AAAS)", type: "academic", lean: "nonpartisan",
    areas: ["sci-tech", "health", "environmental"],
    url: "https://www.science.org",
    blurb: "Top multidisciplinary journal; strong science-policy section." },
  { id: "nature", name: "Nature", type: "academic", lean: "nonpartisan",
    areas: ["sci-tech", "environmental", "health"],
    url: "https://www.nature.com",
    blurb: "Leading science journal covering research and its policy." },
  { id: "foreignaffairs", name: "Foreign Affairs", type: "academic", lean: "center",
    areas: ["international", "security", "economic"],
    url: "https://www.foreignaffairs.com",
    blurb: "Scholarly-but-readable journal of record on world affairs." },
  { id: "arxiv", name: "arXiv", type: "academic", lean: "nonpartisan",
    areas: ["sci-tech"],
    url: "https://arxiv.org",
    blurb: "Open preprint server for physics, CS/AI, and more." },
  { id: "scholar", name: "Google Scholar", type: "academic", lean: "nonpartisan",
    areas: ["social", "economic", "health", "sci-tech", "education", "justice"],
    url: "https://scholar.google.com",
    blurb: "Search across nearly all scholarly literature at once." },

  /* ----------------------- RESEARCH TOOLS & DATA -----------------------
     Finders, aggregators, and data portals. `access` is "open" (free to
     anyone) or "subscription" (usually reached through a library login). */
  { id: "policycommons", name: "Policy Commons", type: "research-tools", lean: "nonpartisan",
    access: "open",
    areas: ["social", "economic", "international", "health", "environmental"],
    url: "https://policycommons.net",
    blurb: "Searches millions of reports and briefs from 20,000+ organizations." },
  { id: "findpolicy", name: "FindPolicy", type: "research-tools", lean: "nonpartisan",
    access: "open",
    areas: ["social", "economic", "international", "health"],
    url: "https://www.findpolicy.org",
    blurb: "Searches across many think-tank sites at once." },
  { id: "hkstts", name: "HKS Think Tank Search", type: "research-tools", lean: "nonpartisan",
    access: "open",
    areas: ["social", "economic", "international", "security"],
    url: "https://guides.library.harvard.edu/hks/think_tank_search",
    blurb: "Harvard's custom Google search across 250+ think tanks." },
  { id: "onthinktanks", name: "On Think Tanks Directory", type: "research-tools", lean: "nonpartisan",
    access: "open",
    areas: ["international", "social", "economic"],
    url: "https://www.onthinktanks.org/open-think-tank-directory/",
    blurb: "Open directory of 2,700+ think tanks worldwide." },
  { id: "congressgov", name: "Congress.gov", type: "research-tools", lean: "official",
    access: "open",
    areas: ["justice", "economic", "social", "security"],
    url: "https://www.congress.gov",
    blurb: "The official source for bills, laws, and the legislative record." },
  { id: "govtrack", name: "GovTrack", type: "research-tools", lean: "nonpartisan",
    access: "open",
    areas: ["justice", "social", "economic"],
    url: "https://www.govtrack.us",
    blurb: "Tracks bills, votes, and members of Congress in plain English." },
  { id: "regulations", name: "Regulations.gov", type: "research-tools", lean: "official",
    access: "open",
    areas: ["environmental", "health", "economic", "justice"],
    url: "https://www.regulations.gov",
    blurb: "Federal rules in progress, with public comment dockets." },
  { id: "datagov", name: "Data.gov", type: "research-tools", lean: "official",
    access: "open",
    areas: ["economic", "environmental", "health", "social", "education"],
    url: "https://data.gov",
    blurb: "The U.S. government's open-data catalog (300,000+ datasets)." },
  { id: "census", name: "U.S. Census Bureau", type: "research-tools", lean: "official",
    access: "open",
    areas: ["social", "economic", "education"],
    url: "https://www.census.gov",
    blurb: "Population, housing, and economic statistics for the nation." },
  { id: "bls", name: "Bureau of Labor Statistics", type: "research-tools", lean: "official",
    access: "open",
    areas: ["economic", "social"],
    url: "https://www.bls.gov",
    blurb: "Jobs, wages, inflation (CPI), and productivity data." },
  { id: "bea", name: "Bureau of Economic Analysis", type: "research-tools", lean: "official",
    access: "open",
    areas: ["economic"],
    url: "https://www.bea.gov",
    blurb: "GDP, trade, and national/regional economic accounts." },
  { id: "usafacts", name: "USAFacts", type: "research-tools", lean: "nonpartisan",
    access: "open",
    areas: ["social", "economic", "health", "education", "justice"],
    url: "https://usafacts.org",
    blurb: "Nonpartisan portal turning government data into plain charts." },
  { id: "ourworldindata", name: "Our World in Data", type: "research-tools", lean: "nonpartisan",
    access: "open",
    areas: ["health", "environmental", "international", "social"],
    url: "https://ourworldindata.org",
    blurb: "Research-grade charts on big global trends, free to reuse." },
  { id: "worldbank", name: "World Bank Open Data", type: "research-tools", lean: "nonpartisan",
    access: "open",
    areas: ["international", "economic", "health"],
    url: "https://data.worldbank.org",
    blurb: "Development indicators for nearly every country." },
  { id: "oecd", name: "OECD Data", type: "research-tools", lean: "nonpartisan",
    access: "open",
    areas: ["international", "economic", "education"],
    url: "https://data.oecd.org",
    blurb: "Comparable statistics across wealthy democracies." },
  { id: "ballotpedia", name: "Ballotpedia", type: "research-tools", lean: "nonpartisan",
    access: "open",
    areas: ["justice", "social"],
    url: "https://ballotpedia.org",
    blurb: "Nonpartisan encyclopedia of elections, officials, and ballot measures." },
  { id: "cqresearcher", name: "CQ Researcher", type: "research-tools", lean: "nonpartisan",
    access: "subscription",
    areas: ["social", "economic", "health", "justice", "environmental"],
    url: "https://library.cqpress.com/cqresearcher/",
    blurb: "Balanced background reports on hot policy issues (via a library)." },
  { id: "pais", name: "PAIS Index", type: "research-tools", lean: "nonpartisan",
    access: "subscription",
    areas: ["social", "economic", "international"],
    url: "https://about.proquest.com/en/products-services/pais-index/",
    blurb: "Long-running index of public-affairs literature (via a library)." },
  { id: "policyfile", name: "Policy File Index", type: "research-tools", lean: "nonpartisan",
    access: "subscription",
    areas: ["social", "economic", "international", "security"],
    url: "https://about.proquest.com/en/products-services/Policy-File-Index/",
    blurb: "Indexes think-tank and government policy papers (via a library)." },
  { id: "overton", name: "Overton", type: "research-tools", lean: "nonpartisan",
    access: "subscription",
    areas: ["social", "economic", "international", "health"],
    url: "https://www.overton.io",
    blurb: "Tracks policy documents and what research they cite (via a library)." },
  { id: "policymap", name: "PolicyMap", type: "research-tools", lean: "nonpartisan",
    access: "subscription",
    areas: ["social", "health", "education", "economic"],
    url: "https://www.policymap.com",
    blurb: "Maps demographic, health, and education data by place (via a library)." },
  { id: "roper", name: "Roper Center iPoll", type: "research-tools", lean: "nonpartisan",
    access: "subscription",
    areas: ["social", "justice"],
    url: "https://ropercenter.cornell.edu",
    blurb: "U.S. public-opinion polling back to 1935 (via a library)." },
];

/* ----------------------------------------------------------------------
 * 6. ITEMS — individual entries for the "Latest" feed.
 *    These are PLACEHOLDERS until a feed-refresh job populates them.
 *    Schema: id, title, source, type, areas[], level, date, summary, url.
 * -------------------------------------------------------------------- */
const ITEMS = [
  {
    id: "sample-1",
    title: "What is a policy brief, and how do I read one?",
    source: "Currentry — Research Guide",
    type: "policy-briefs",
    areas: ["social"],
    level: "intro",
    date: "2026-06-15",
    summary:
      "A plain-language explainer of how policy briefs are structured, who writes them, and how to extract the recommendation in under five minutes.",
    url: "#",
  },
  {
    id: "sample-2",
    title: "Understanding the federal budget process in 10 minutes",
    source: "Currentry — Research Guide",
    type: "policy-briefs",
    areas: ["economic"],
    level: "intro",
    date: "2026-06-10",
    summary:
      "Placeholder beginner explainer aimed at undergraduates and newcomers to public policy.",
    url: "#",
  },
];

/* ----------------------------------------------------------------------
 * 7. GUIDES — evergreen "how to do policy research" content.
 *
 *    This is the library-research-guide half of the hub: short, durable
 *    explainers synthesized from the public-policy research guides that
 *    top policy schools (Harvard Kennedy, Yale, Princeton, Michigan,
 *    Georgetown, GWU, George Mason, and others) publish for their students.
 *    It needs no automation and never goes stale.
 *
 *    Each guide: id, title, level, minutes, summary, and a `sections`
 *    array of { h, p[], ul[] } blocks.
 * -------------------------------------------------------------------- */
const GUIDES = [
  {
    id: "research-a-question",
    title: "How to research a policy question",
    level: "intro",
    minutes: 6,
    summary:
      "The path policy-school librarians teach: sharpen the question, get oriented, find the analysis, get the data, check the scholarship, weigh the viewpoints.",
    sections: [
      {
        h: "1. Sharpen the question",
        p: [
          "Turn a broad topic into a question you can actually answer. “Housing” becomes “Does upzoning reduce rents in mid-sized U.S. cities?” Pin down the who, what, where, and time frame — it tells you which sources and data you'll need.",
        ],
      },
      {
        h: "2. Get oriented",
        p: [
          "Before the deep dive, map the landscape: the key terms, the major players, and the main arguments. Background explainers (like CQ Researcher) and even a careful read of Wikipedia's sources are fine here — you're orienting, not citing.",
        ],
      },
      {
        h: "3. Find the analysis (the “grey literature”)",
        p: [
          "Most policy thinking lives outside academic journals, in reports and briefs from think tanks and government analysts — what librarians call grey literature.",
        ],
        ul: [
          "Start with nonpartisan analysts: the Congressional Research Service (CRS), CBO, and GAO.",
          "Then read think tanks across the spectrum — and read more than one.",
          "Search many at once with aggregators like Policy Commons or FindPolicy.",
        ],
      },
      {
        h: "4. Get the data",
        p: [
          "Ground your argument in numbers from primary statistical sources rather than secondhand citations.",
        ],
        ul: [
          "Federal agencies: Census, BLS, BEA.",
          "Portals: Data.gov; friendly front-ends like USAFacts and Our World in Data.",
          "International comparisons: OECD and World Bank.",
        ],
      },
      {
        h: "5. Check the scholarship",
        p: [
          "For cause-and-effect evidence, turn to peer-reviewed journals and working papers (NBER, SSRN). Note the difference: a working paper is early research that has not yet been peer-reviewed, so weigh it accordingly.",
        ],
      },
      {
        h: "6. Weigh the viewpoints and cite",
        p: [
          "Deliberately read left, center, and right on the same question, and notice who funded each report. Keep a running list of what you used, and cite primary sources rather than the article that mentioned them.",
        ],
      },
    ],
  },
  {
    id: "source-types",
    title: "Source types, decoded",
    level: "intro",
    minutes: 5,
    summary:
      "News vs. opinion, briefs vs. press releases, peer-reviewed vs. working papers, primary vs. secondary — what each one is good for.",
    sections: [
      {
        h: "News vs. opinion",
        p: [
          "News reports what happened; op-eds and editorials argue what should happen. Both are useful, but only one is making a case. Many outlets do both under one banner — check the section label.",
        ],
      },
      {
        h: "Policy briefs and reports",
        p: [
          "Short, decision-focused documents from think tanks and institutes. Fast and readable, but most come from organizations with a point of view — read the recommendation and ask who's making it.",
        ],
      },
      {
        h: "Government press releases",
        p: [
          "Primary, official, and authoritative about what an agency is doing — but written to persuade. Treat them as the government's own account, not a neutral evaluation of it.",
        ],
      },
      {
        h: "Peer-reviewed articles vs. working papers",
        ul: [
          "Peer-reviewed: vetted by other experts before publication — the gold standard, but slow.",
          "Working papers: shared early, before review — current, but provisional.",
        ],
      },
      {
        h: "Primary vs. secondary",
        p: [
          "Primary sources are the original record (the law, the dataset, the agency statement). Secondary sources describe or interpret them (news, briefs, journal articles). Strong research leans on primary sources and uses secondary ones to find them.",
        ],
      },
    ],
  },
  {
    id: "reading-critically",
    title: "Reading critically & checking for bias",
    level: "general",
    minutes: 5,
    summary:
      "Every source has a lens. Here's how to triangulate viewpoints, follow the funding, and separate facts from values.",
    sections: [
      {
        h: "Everyone has a lens",
        p: [
          "Bias isn't the same as dishonesty. A reputable source can be accurate and still select which facts to emphasize. The goal isn't to find the one unbiased source — it's to read widely enough that the lenses cancel out.",
        ],
      },
      {
        h: "Triangulate across viewpoints",
        p: [
          "On any contested question, read a left-leaning, a center, and a right-leaning treatment. The lean labels throughout this site are there to make that easy and deliberate.",
        ],
      },
      {
        h: "Follow the money",
        p: [
          "Ask who funds a think tank or study and whether they benefit from the conclusion. Funding doesn't invalidate research, but it's context you should know.",
        ],
      },
      {
        h: "Separate facts from values",
        p: [
          "“The program cut poverty by 3%” is an empirical claim you can check. “The program is worth its cost” is a value judgment. Good analysis is clear about which is which — and so should you be.",
        ],
      },
      {
        h: "Tools that rate sources",
        ul: [
          "AllSides and Ad Fontes Media — media-bias ratings.",
          "Media Bias/Fact Check — bias plus factual-reliability notes.",
        ],
      },
    ],
  },
  {
    id: "policy-process",
    title: "How the U.S. policy process works",
    level: "general",
    minutes: 7,
    summary:
      "From bill to law to rule to oversight — the stages of federal policymaking and exactly where the documents live.",
    sections: [
      {
        h: "Laws: from bill to statute",
        p: [
          "Congress writes and passes bills; the President signs them into law. Track the whole process — text, sponsors, votes, committee reports — at Congress.gov, or in plain English at GovTrack.",
        ],
      },
      {
        h: "Rules: how agencies fill in the details",
        p: [
          "Laws are usually broad; agencies write the detailed rules that carry them out. Proposed and final rules — plus public comment dockets — appear in the Federal Register and at Regulations.gov.",
        ],
      },
      {
        h: "The money",
        p: [
          "Spending flows through the budget and appropriations process. The Congressional Budget Office (CBO) provides nonpartisan cost estimates (“scores”) of what bills would do to the deficit.",
        ],
      },
      {
        h: "Oversight and evaluation",
        ul: [
          "GAO — audits whether programs actually work.",
          "CRS — nonpartisan analysis written for Congress.",
          "Inspectors General — watchdogs inside each agency.",
        ],
      },
      {
        h: "The courts",
        p: [
          "Litigation can reshape or halt a policy. Court opinions are primary sources; news and law reviews help you interpret them.",
        ],
      },
    ],
  },
  {
    id: "finding-data",
    title: "Finding government data & statistics",
    level: "general",
    minutes: 5,
    summary:
      "Where the official numbers live, the friendly front-ends that make them usable, and how to cite data properly.",
    sections: [
      {
        h: "The big statistical agencies",
        ul: [
          "U.S. Census Bureau — population, housing, income.",
          "Bureau of Labor Statistics — jobs, wages, inflation (CPI).",
          "Bureau of Economic Analysis — GDP and trade.",
          "Specialized: NCES (education), BJS (justice), CDC/NCHS (health).",
        ],
      },
      {
        h: "One-stop portals",
        p: [
          "Data.gov catalogs hundreds of thousands of federal datasets in one search. FRED (St. Louis Fed) is the fastest way to chart economic time series.",
        ],
      },
      {
        h: "Friendly front-ends",
        p: [
          "When raw tables are daunting, USAFacts and Our World in Data repackage official statistics into clear, reusable charts.",
        ],
      },
      {
        h: "International comparisons",
        p: [
          "Use the OECD for wealthy democracies and the World Bank for nearly every country — both keep definitions consistent so cross-country numbers are comparable.",
        ],
      },
      {
        h: "Cite the data",
        p: [
          "Record the agency, dataset name, table or series ID, and the date you accessed it. Cite the original agency, not the chart that reused it.",
        ],
      },
    ],
  },
  {
    id: "read-a-brief",
    title: "Read a policy brief in 5 minutes",
    level: "intro",
    minutes: 3,
    summary:
      "Policy briefs follow a predictable shape. Learn the anatomy and you can extract the argument fast.",
    sections: [
      {
        h: "What a brief is for",
        p: [
          "A policy brief exists to move a busy decision-maker toward a specific action. That purpose shapes everything: it's short, it leads with the bottom line, and it ends with an ask.",
        ],
      },
      {
        h: "The anatomy",
        ul: [
          "Executive summary — the whole argument in a paragraph.",
          "Problem — what's wrong and why it matters now.",
          "Options — the alternatives considered.",
          "Recommendation — the action the authors want.",
        ],
      },
      {
        h: "Read it in the right order",
        p: [
          "Read the executive summary, jump to the recommendation, then skim the evidence in between only as far as you need to judge it. You don't have to read top to bottom.",
        ],
      },
      {
        h: "Four questions to ask",
        ul: [
          "Who wrote it, and what's their lean or interest?",
          "What exactly are they asking someone to do?",
          "What evidence backs the recommendation?",
          "Who would disagree, and what would they say?",
        ],
      },
    ],
  },
];

/* ----------------------------------------------------------------------
 * 8. NEWS_FEED — OFFLINE FALLBACK for the News page.
 *
 *    The live News data lives in `data/news.json`, which the refresh job
 *    (.github/workflows/refresh.yml + scripts/refresh-news.mjs) regenerates
 *    each cycle. At runtime the app fetches that file and re-renders.
 *
 *    This inline copy is only used when the fetch fails — most importantly
 *    when the page is opened directly from disk (file://), where browsers
 *    block fetch of local JSON. Keep it as a sane mirror of news.json.
 *
 *    Shape: a flat `articles` list (newest first), each with outlet, lean,
 *    url, title, and date. The News page renders them as a single scrolling
 *    column of headlines linking straight to the stories.
 * -------------------------------------------------------------------- */
const NEWS_FEED = {
  lastRefreshed: "2026-06-19T13:00:00Z",
  articles: [
    { outlet: "NPR", lean: "lean-left", url: "https://www.npr.org",
      title: "Sample headline — live stories load from data/news.json",
      date: "2026-06-19T12:30:00Z" },
    { outlet: "BBC News", lean: "center", url: "https://www.bbc.com/news",
      title: "Sample headline — open the site over http(s) for the live feed",
      date: "2026-06-19T11:50:00Z" },
    { outlet: "Fox News", lean: "lean-right", url: "https://www.foxnews.com",
      title: "Sample headline — this offline list is only a fallback",
      date: "2026-06-19T10:05:00Z" },
  ],
};

/* Expose the config on a single global so app.js can read it without
 * ES-module imports (which browsers block on the file:// protocol). */
window.PolicyHubData = {
  CONTENT_TYPES,
  POLICY_AREAS,
  READING_LEVELS,
  LEANS,
  SOURCES,
  GUIDES,
  NEWS_FEED,
  ITEMS,
};
