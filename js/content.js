/* ==========================================================================
   CONTENT — every word on the portfolio comes from this object.
   --------------------------------------------------------------------------
   Edit freely; the layout adapts to any number of entries. Plain strings
   only (no HTML); they are escaped. Blog posts live in posts/*.md instead.

   Remember: the <title> / description / og:title tags in index.html are read
   by link-preview scrapers that don't run JavaScript. Keep them in sync.
   ========================================================================== */

window.PORTFOLIO = {

  /* ---- <head> / SEO ---------------------------------------------------- */
  meta: {
    title: "Phan Binh Nguyen Lam — Engineer & Competitive Programmer",
    description: "Codeforces Master, ICPC medalist and researcher; backend & SDK developer at Pendle Finance. Portfolio and Field Notes.",
    year: 2026 // footer ©; defaults to current year if removed
  },

  /* ---- You ------------------------------------------------------------- */
  person: {
    name: "Phan Binh Nguyen Lam",
    nameLines: ["Phan Binh", "Nguyen Lam"],   // optional: how the hero breaks the name
    role: "Engineer & Competitive Programmer",
    // Hero line reads: "<rolePrefix> <rotating word>"
    rolePrefix: "Building",
    rotatingWords: ["strategies", "algorithms", "DeFi infrastructure", "online judges", "contest problems"],
    tagline: "I play games of perfect and imperfect information: chess, poker, ICPC, research. In between, I ship DeFi infrastructure at Pendle.",
    location: {
      label: "Ho Chi Minh City, Vietnam",
      lat: 10.7769,                  // used for the live map coordinates
      lng: 106.7009,
      timeZone: "Asia/Ho_Chi_Minh"   // IANA name, drives the header clock (UTC+7)
    },
    available: true,
    availability: "Open to research collaborations & hard problems",
    email: "lamtercqh@gmail.com",
    resume: "",                      // link to a PDF, or "" to hide (don't publish one with your phone number)
    photo: ""                        // optional: "assets/portrait.jpg"
  },

  /* ---- Section labels (index, map-name, plain-name) --------------------- */
  sections: {
    about:   { index: "01", title: "Legend",       kicker: "About" },
    work:    { index: "02", title: "Expeditions",  kicker: "Selected work",
               intro: "Things I've built, run and published: a DeFi protocol's backend, an online judge, tools for problem setters, and papers." },
    route:   { index: "03", title: "The Route",    kicker: "Experience",
               intro: "Contests, classrooms and production. The route so far." },
    terrain: { index: "04", title: "Terrain",      kicker: "Skills",
               intro: "The ground I cover. Peaks are where I'm strongest." },
    notes:   { index: "05", title: "Field Notes",  kicker: "Writing & lab",
               intro: "Stories from the work, algorithms worth explaining, and the occasional flex.",
               archiveUrl: "notes/" },       // the blog archive; "" hides the closing card
    contact: { index: "06", title: "Signal",       kicker: "Contact" }
  },

  /* ---- The scrolling band under the hero ------------------------------- */
  marquee: [
    "Competitive Programming", "Codeforces Master", "ICPC Asia Regional Medalist",
    "DeFi Backends", "Graph Neural Networks", "Problem Setting",
    "Chess", "Poker", "League of Legends"
  ],

  /* ---- 01 · About ------------------------------------------------------ */
  about: {
    lead: "Chess taught me to calculate. Poker taught me what to do when I can't.",
    paragraphs: [
      "I study Computer Science in the Advanced Program at VNU-HCM University of Science, and I'm a backend & SDK developer at Pendle Finance. There I build the services and TypeScript SDK that integrators use to trade yield on Ethereum, Arbitrum and other EVM chains.",
      "Most of what I know about engineering, I learned from competitive programming: a Codeforces Master rating, medals at ICPC Vietnam and the Asia Hanoi Regional, and second place out of 8,793 teams at IEEEXtreme 18.0. These days I also set problems for olympiads with thousands of students, and coach the next generation.",
      "In research I work on graphs and uncertainty, from conformal prediction for graph neural networks to ant-colony heuristics for Steiner trees. Away from the keyboard: chess, semi-pro poker and League of Legends."
    ],
    facts: [
      { label: "Based in",   value: "Ho Chi Minh City, Vietnam" },
      { label: "Studying",   value: "B.Sc. Computer Science, VNU-HCM University of Science" },
      { label: "Currently",  value: "Backend & SDK Developer @ Pendle Finance" },
      { label: "Off-grid",   value: "Chess, poker (200+ NLH tournaments), League of Legends" }
    ],
    stats: [
      { value: "2165", label: "Codeforces rating · Master" },
      { value: "#2",   label: "of 8,793 teams · IEEEXtreme 18.0" },
      { value: "04",   label: "Research papers" }
    ]
  },

  /* ---- 02 · Work --------------------------------------------------------
     hue:   0–360, tints the generated map artwork for this project
     image: optional path/URL; replaces the generated artwork when set     */
  projects: [
    {
      id: "pendle",
      title: "Pendle Finance",
      year: "2025–now",
      category: "DeFi",
      summary: "Backend microservices and a TypeScript SDK for a DeFi yield-tokenization protocol on multiple EVM chains.",
      role: "Backend & SDK Developer",
      duration: "Jul 2025 — present",
      team: "Pendle engineering (remote)",
      stack: ["TypeScript", "Node.js", "PostgreSQL", "Redis", "Ethereum", "Arbitrum"],
      description: [
        "Pendle lets people split yield-bearing assets into principal and yield and trade them. I work on the backend and the SDK that other teams build on.",
        "I build and maintain backend microservices and TypeScript SDK modules across Ethereum, Arbitrum and other EVM chains.",
        "I implemented the hosted swap and trade-simulation API used by external integrators, covering route selection, slippage estimation and transaction construction. I also built analytics and integration endpoints for third-party protocols building on Pendle."
      ],
      outcomes: [],
      links: [{ label: "pendle.finance", url: "https://www.pendle.finance" }],
      hue: 172,
      image: ""
    },
    {
      id: "qhhoj",
      title: "QHHOJ",
      year: "2024",
      category: "Platform",
      summary: "Quoc Hoc Hue Online Judge: a production fork of VNOI/DMOJ with ICPC, IOI and AtCoder-style contests and live rankings.",
      role: "Full-stack Engineer & Administrator",
      duration: "Since 2024",
      team: "Quoc Hoc Hue informatics",
      stack: ["Django", "Python", "Docker", "Nginx"],
      description: [
        "My high school needed a judge it controlled: its own problem sets, its own contests, its own rules.",
        "I forked and extended VNOI/DMOJ with custom problem sets, scoring systems and anti-cheating measures, and support for ICPC-, IOI- and AtCoder-style contests with live rankings.",
        "I deployed it myself with Docker behind Nginx and kept it stable through live contests. It now serves more than 500 active users."
      ],
      outcomes: [
        { value: "500+", label: "Active users" },
        { value: "3",    label: "Contest formats: ICPC, IOI, AtCoder" }
      ],
      links: [{ label: "github.com/qhhoj", url: "https://github.com/qhhoj" }],
      hue: 48,
      image: ""
    },
    {
      id: "cp-plugin",
      title: "Competitive Programming for Claude Code",
      year: "2026",
      category: "Tooling",
      summary: "Ten Claude Code skills that solve problems (or whole contests, submitting until accepted) and set problems end to end, down to Polygon upload.",
      role: "Author",
      duration: "2026",
      team: "Solo",
      stack: ["Claude Code", "MCP", "Python", "C++", "Codeforces API", "Polygon"],
      description: [
        "Contest work has two sides: solving problems under a clock, and setting them so they're airtight. This plugin covers both.",
        "Ten skills cover single problems or whole contests (submitting until accepted), plus problem setting end to end: constraints, tests, statements, package review and Polygon upload.",
        "Two bundled MCP servers talk to Codeforces (statements, submissions, verdicts) and Polygon (full package upload). Every package is validated against deliberately wrong solutions and brute-force stress tests under isolate."
      ],
      outcomes: [
        { value: "10", label: "Skills" },
        { value: "2",  label: "Bundled MCP servers" }
      ],
      links: [{ label: "Source", url: "https://github.com/LLaammTTeerr/competitive-programming" }],
      hue: 14,
      image: ""
    },
    {
      id: "hcmus-courses",
      title: "HCMUS Courses",
      year: "2026",
      category: "Product",
      summary: "Plan your HCMUS degree without the spreadsheet: track courses, check graduation requirements, plan semesters.",
      role: "Author",
      duration: "2026",
      team: "Solo",
      stack: ["TypeScript", "JavaScript", "HTML", "CSS"],
      description: [
        "Every HCMUS student keeps a spreadsheet of credits and requirements, and every spreadsheet is slightly wrong.",
        "HCMUS Courses tracks every attempt and grade and shows progress against each requirement group of the official curriculum. It includes a semester planner that warns about credit limits and prerequisites, and can fill the remaining semesters in one click.",
        "It also ranks what you can take next and checks graduation conditions straight from the university regulation."
      ],
      outcomes: [],
      links: [
        { label: "Live site", url: "https://hcmus-courses.lamter.cc" },
        { label: "Source", url: "https://github.com/LLaammTTeerr/HCMUS_Courses" }
      ],
      hue: 210,
      image: ""
    },
    {
      id: "polygon-latex",
      title: "Vietnamese Polygon Statements",
      year: "2024",
      category: "Tooling",
      summary: "A XeLaTeX template for Vietnamese competitive programming statements prepared on Codeforces Polygon.",
      role: "Author",
      duration: "2024",
      team: "Solo",
      stack: ["XeLaTeX", "Polygon"],
      description: [
        "Polygon's statement templates assume English. This template gives Vietnamese problem statements proper typesetting when they're built on Codeforces Polygon."
      ],
      outcomes: [],
      links: [{ label: "Source", url: "https://github.com/LLaammTTeerr/vietnamese-polygon-statement-latex" }],
      hue: 330,
      image: ""
    },
    {
      id: "head-cp",
      title: "HeAD-CP",
      year: "2026",
      category: "Research",
      summary: "Heterophily-aware diffused conformal prediction sets for graph neural networks. Accepted at MAPR 2026.",
      role: "First author (with N. T. Anh)",
      duration: "2026",
      team: "P. B. N. Lam, N. T. Anh",
      stack: ["Graph neural networks", "Conformal prediction"],
      description: [
        "Conformal prediction gives a model's predictions a coverage guarantee: prediction sets that contain the true label at a chosen rate. HeAD-CP brings heterophily-aware diffusion to conformal prediction sets for graph neural networks.",
        "Accepted at the 2026 International Conference on Multimedia Analysis and Pattern Recognition (MAPR)."
      ],
      outcomes: [],
      links: [{ label: "arXiv:2607.25273", url: "https://arxiv.org/abs/2607.25273" }],
      hue: 265,
      image: ""
    },
    {
      id: "fusion-aco",
      title: "Fusion Ant Optimization",
      year: "2025",
      category: "Research",
      summary: "A multi-heuristic ant colony optimization for the Steiner tree problem in social network analysis. Springer, 2025.",
      role: "First author (with N. T. Anh)",
      duration: "2025",
      team: "P. B. N. Lam, N. T. Anh",
      stack: ["Metaheuristics", "Steiner trees", "Graphs"],
      description: [
        "Published in the International Conference on Soft Computing and its Engineering Applications (Springer), pp. 84–98, 2025."
      ],
      outcomes: [],
      links: [{ label: "Springer", url: "https://link.springer.com/chapter/10.1007/978-3-032-22059-2_7" }],
      hue: 96,
      image: ""
    },
    {
      id: "wifi-handover",
      title: "Deterministic WiFi Handover",
      year: "2025",
      category: "Research",
      summary: "An effective deterministic WiFi handover mechanism with fuzzy-inspired stability checks. IEEE, 2025.",
      role: "First author (with N. T. Anh, N. H. Tu)",
      duration: "2025",
      team: "P. B. N. Lam, N. T. Anh, N. H. Tu",
      stack: ["Networking", "Fuzzy logic"],
      description: [
        "Published in the 2025 RIVF International Conference on Computing and Communication Technologies (IEEE), pp. 42–47."
      ],
      outcomes: [],
      links: [{ label: "IEEE Xplore", url: "https://ieeexplore.ieee.org/abstract/document/11365259/" }],
      hue: 190,
      image: ""
    },
    {
      id: "plant-disease",
      title: "From Laboratory to Field",
      year: "2026",
      category: "Research",
      summary: "Frozen foundation-model features toward robust plant disease recognition. Smart Agricultural Technology (Elsevier), 2026.",
      role: "Co-author",
      duration: "2026",
      team: "T. A. Nguyen, D. S. Nguyen, Q. M. Dang, P. B. N. Lam, H. L. Nguyen",
      stack: ["Computer vision", "Foundation models"],
      description: [
        "Published in Smart Agricultural Technology (Elsevier), 102531, 2026."
      ],
      outcomes: [],
      links: [{ label: "ScienceDirect", url: "https://www.sciencedirect.com/science/article/pii/S2772375526007562" }],
      hue: 120,
      image: ""
    }
  ],

  /* ---- 03 · Experience (newest first; `end` is optional) ----------------- */
  experience: [
    {
      role: "Backend & SDK Developer",
      org: "Pendle Finance",
      place: "Remote",
      start: "Jul 2025", end: "Now",
      summary: "Backend microservices and TypeScript SDK modules for a DeFi yield-tokenization protocol on Ethereum, Arbitrum and other EVM chains.",
      highlights: [
        "Implemented the hosted swap and trade-simulation API for external integrators: route selection, slippage estimation, transaction construction",
        "Built analytics and integration endpoints for third-party protocols building on Pendle"
      ]
    },
    {
      role: "Judge & Problem Setter",
      org: "The Central · HueICT Challenge",
      place: "Vietnam",
      start: "Mar 2025", end: "",
      summary: "Set and validated problems for two regional informatics finals.",
      highlights: [
        "The Central, Central Highlands Informatics Olympiad Grand Final 2025: nearly 3,000 students across 4 divisions",
        "HueICT Challenge 2025 Final Round: more than 1,500 high school students across 3 divisions"
      ]
    },
    {
      role: "Informatics Olympiad Coach",
      org: "Remote coaching",
      place: "Remote",
      start: "Sep 2024", end: "Now",
      summary: "Coaching students in graph theory, dynamic programming, data structures and contest strategy.",
      highlights: [
        "Design problem sets and mock contests",
        "Review students' code one-on-one"
      ]
    },
    {
      role: "B.Sc. Computer Science (Advanced Program)",
      org: "VNU-HCM University of Science",
      place: "Ho Chi Minh City",
      start: "2024", end: "2028",
      summary: "Expected 2028. Competing in ICPC for the university.",
      highlights: [
        "Runner-up, 2nd of 8,793 teams, IEEEXtreme 18.0 (Oct 2024)",
        "Gold Medal, ICPC Vietnam Southern Provincial Contest (Oct 2024)",
        "Silver Medal, ICPC Vietnam National Contest (Nov 2024)",
        "Bronze Medal, ICPC Asia Hanoi Regional Contest (Dec 2024)"
      ]
    },
    {
      role: "Specialized Informatics",
      org: "Quoc Hoc Hue High School for the Gifted",
      place: "Hue",
      start: "2021", end: "2024",
      summary: "GPA 3.8/4. Built and ran the school's online judge, QHHOJ.",
      highlights: [
        "Second Prize, Vietnam National Olympiad in Informatics (Jan 2024)",
        "Top 16, Vietnam Team Selection Test: national shortlist for IOI and APIO (Mar 2024)",
        "Third Prize, Vietnam National Olympiad in Artificial Intelligence (Aug 2024)"
      ]
    }
  ],

  /* ---- 04 · Skills (level 1–5 = peak height) --------------------------- */
  skills: [
    {
      group: "Algorithms",
      items: [
        { name: "Graphs", level: 5 },
        { name: "Dynamic programming", level: 5 },
        { name: "Data structures", level: 5 },
        { name: "Game theory", level: 4 },
        { name: "Heuristics", level: 4 },
        { name: "Problem setting", level: 5 }
      ]
    },
    {
      group: "Engineering",
      items: [
        { name: "C++", level: 5 },
        { name: "TypeScript", level: 4 },
        { name: "Node.js", level: 4 },
        { name: "Python", level: 4 },
        { name: "SQL", level: 4 },
        { name: "Docker & Linux", level: 4 }
      ]
    },
    {
      group: "Research & teaching",
      items: [
        { name: "Graph ML", level: 4 },
        { name: "Conformal prediction", level: 4 },
        { name: "Metaheuristics", level: 4 },
        { name: "DeFi protocols", level: 4 },
        { name: "Coaching", level: 5 }
      ]
    }
  ],
  tools: ["C++", "TypeScript", "Python", "Node.js", "Django", "PostgreSQL", "Redis", "Docker", "Nginx", "Linux", "Git", "CI/CD", "Polygon", "LaTeX"],

  /* ---- 05 · Writing ------------------------------------------------------
     Cards come from real posts in posts/*.md (build.py inlines the latest
     five). These are only used if there are none; empty = "coming soon".  */
  notes: [],

  /* ---- 06 · Contact ---------------------------------------------------- */
  contact: {
    heading: "Your move.",   // last word gets the italic accent
    text: "Research collaborations, problem setting, backend work, or a game of chess: my inbox is open."
  },
  socials: [
    { label: "GitHub",         handle: "@LLaammTTeerr",      url: "https://github.com/LLaammTTeerr" },
    { label: "Codeforces",     handle: "i_love_derivative · Master", url: "https://codeforces.com/profile/i_love_derivative" },
    { label: "Google Scholar", handle: "4 publications",     url: "https://scholar.google.com/citations?user=wQwlpwIAAAAJ" },
    { label: "ICPC",           handle: "ICPC record",        url: "https://icpc.global/ICPCID/KMUOIYYG1MZU" },
    { label: "Email",          handle: "lamtercqh@gmail.com", url: "mailto:lamtercqh@gmail.com" }
  ]
};
