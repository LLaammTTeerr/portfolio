/* ==========================================================================
   CONTENT — the only file you need to edit.
   --------------------------------------------------------------------------
   Every word on the site comes from this object. Replace the [bracketed]
   placeholders, delete entries you don't need, add as many as you like —
   the layout adapts. Plain strings only (no HTML); they are escaped.

   Optional fields are marked "optional". Leave them "" or remove them.
   ========================================================================== */

window.PORTFOLIO = {

  /* ---- <head> / SEO ---------------------------------------------------- */
  meta: {
    title: "Your Name — Designer & Engineer",
    description: "[One-sentence description of you, shown in search results and link previews.]",
    year: 2026 // footer ©; defaults to current year if removed
  },

  /* ---- You ------------------------------------------------------------- */
  person: {
    name: "Your Name",               // hero splits it into two lines on the space
    role: "Designer & Engineer",
    // Hero line reads: "<rolePrefix> <rotating word>"
    rolePrefix: "Building",
    rotatingWords: ["interfaces", "systems", "tools", "worlds", "stories"],
    tagline: "[A one or two sentence statement about what you do, who you do it for, and why it matters. Keep it under ~30 words.]",
    location: {
      label: "City, Country",
      lat: 21.0285,                  // used for the live map coordinates
      lng: 105.8542,
      timeZone: "Asia/Ho_Chi_Minh"   // IANA name, drives the header clock
    },
    available: true,
    availability: "Open to new expeditions — [Month Year]",
    email: "hello@yourdomain.com",
    resume: "#",                     // link to a PDF, or "" to hide
    photo: ""                        // optional: "assets/portrait.jpg"
  },

  /* ---- Section labels (index, map-name, plain-name) --------------------- */
  sections: {
    about:   { index: "01", title: "Legend",       kicker: "About" },
    work:    { index: "02", title: "Expeditions",  kicker: "Selected work",
               intro: "[A short line introducing your selected work — e.g. a few projects I'm proud of, from the last few years.]" },
    route:   { index: "03", title: "The Route",    kicker: "Experience",
               intro: "[Where you've been and what you did there.]" },
    terrain: { index: "04", title: "Terrain",      kicker: "Skills",
               intro: "[The ground you cover. Peaks are where you're strongest.]" },
    notes:   { index: "05", title: "Field Notes",  kicker: "Writing & lab",
               intro: "Stories from the work, algorithms worth explaining, and the occasional flex.",
               archiveUrl: "notes/" },       // the blog archive; "" hides the closing card
    contact: { index: "06", title: "Signal",       kicker: "Contact" }
  },

  /* ---- The scrolling band under the hero ------------------------------- */
  marquee: [
    "Product Design", "Front-end Engineering", "Creative Coding",
    "Design Systems", "Data Visualisation", "Prototyping", "[Your Discipline]"
  ],

  /* ---- 01 · About ------------------------------------------------------ */
  about: {
    lead: "[A big, confident pull-quote sentence about how you think or work — the one line you'd want someone to remember.]",
    paragraphs: [
      "[Paragraph one: who you are, what you focus on, and the kind of problems you love. Two or three sentences.]",
      "[Paragraph two: your background, how you got here, what makes your perspective unusual.]",
      "[Paragraph three (optional): what you're doing when you're not working.]"
    ],
    facts: [
      { label: "Based in",   value: "[City, Country]" },
      { label: "Focus",      value: "[Your focus area]" },
      { label: "Currently",  value: "[Role @ Company]" },
      { label: "Off-grid",   value: "[A hobby or two]" }
    ],
    stats: [
      { value: "07",  label: "Years in the field" },
      { value: "40+", label: "Projects shipped" },
      { value: "12",  label: "Talks & articles" }
    ]
  },

  /* ---- 02 · Work --------------------------------------------------------
     hue:   0–360, tints the generated map artwork for this project
     image: optional path/URL; replaces the generated artwork when set     */
  projects: [
    {
      id: "meridian",
      title: "Project Meridian",
      year: "2026",
      category: "Product",
      summary: "[One-line summary: what it is and the problem it solved.]",
      role: "[Your role]",
      duration: "[N months]",
      team: "[Team size / collaborators]",
      stack: ["[Tool]", "[Framework]", "[Language]"],
      description: [
        "[The challenge — what was broken, missing or possible.]",
        "[The approach — what you did, the key decisions and trade-offs.]",
        "[The result — what changed because of your work.]"
      ],
      outcomes: [
        { value: "+00%", label: "[Metric that moved]" },
        { value: "0.0×", label: "[Another metric]" },
        { value: "00k",  label: "[Users / reach]" }
      ],
      links: [
        { label: "Live site", url: "#" },
        { label: "Case study", url: "#" }
      ],
      hue: 14,
      image: ""
    },
    {
      id: "tessera",
      title: "Tessera",
      year: "2025",
      category: "Design System",
      summary: "[One-line summary: what it is and the problem it solved.]",
      role: "[Your role]", duration: "[N months]", team: "[Team]",
      stack: ["[Tool]", "[Tool]"],
      description: ["[The challenge.]", "[The approach.]", "[The result.]"],
      outcomes: [{ value: "00", label: "[Components]" }, { value: "-00%", label: "[Time saved]" }],
      links: [{ label: "Case study", url: "#" }],
      hue: 172, image: ""
    },
    {
      id: "lodestar",
      title: "Lodestar",
      year: "2025",
      category: "Creative Code",
      summary: "[One-line summary: what it is and the problem it solved.]",
      role: "[Your role]", duration: "[N weeks]", team: "[Solo]",
      stack: ["[WebGL]", "[Shader]"],
      description: ["[The challenge.]", "[The approach.]", "[The result.]"],
      outcomes: [{ value: "00k", label: "[Visitors]" }],
      links: [{ label: "Experience it", url: "#" }, { label: "Source", url: "#" }],
      hue: 48, image: ""
    },
    {
      id: "cartograph",
      title: "Cartograph",
      year: "2024",
      category: "Data",
      summary: "[One-line summary: what it is and the problem it solved.]",
      role: "[Your role]", duration: "[N months]", team: "[Team]",
      stack: ["[D3]", "[Framework]"],
      description: ["[The challenge.]", "[The approach.]", "[The result.]"],
      outcomes: [{ value: "0M", label: "[Rows visualised]" }, { value: "+00%", label: "[Engagement]" }],
      links: [{ label: "Case study", url: "#" }],
      hue: 210, image: ""
    },
    {
      id: "halcyon",
      title: "Halcyon",
      year: "2023",
      category: "Product",
      summary: "[One-line summary: what it is and the problem it solved.]",
      role: "[Your role]", duration: "[N months]", team: "[Team]",
      stack: ["[Tool]", "[Tool]", "[Tool]"],
      description: ["[The challenge.]", "[The approach.]", "[The result.]"],
      outcomes: [{ value: "0.0★", label: "[App store rating]" }],
      links: [{ label: "App", url: "#" }],
      hue: 330, image: ""
    },
    {
      id: "undertow",
      title: "Undertow",
      year: "2022",
      category: "Creative Code",
      summary: "[One-line summary: what it is and the problem it solved.]",
      role: "[Your role]", duration: "[N weeks]", team: "[Collaborators]",
      stack: ["[Tool]"],
      description: ["[The challenge.]", "[The approach.]", "[The result.]"],
      outcomes: [{ value: "[Award]", label: "[Recognition]" }],
      links: [{ label: "Watch", url: "#" }],
      hue: 265, image: ""
    }
  ],

  /* ---- 03 · Experience (newest first) ---------------------------------- */
  experience: [
    {
      role: "[Job Title]",
      org: "[Company]",
      place: "[City / Remote]",
      start: "2024", end: "Now",
      summary: "[One or two sentences on the scope of the role.]",
      highlights: ["[A concrete achievement]", "[Another one, with a number if possible]"]
    },
    {
      role: "[Job Title]", org: "[Company]", place: "[City]",
      start: "2021", end: "2024",
      summary: "[One or two sentences on the scope of the role.]",
      highlights: ["[A concrete achievement]", "[Another one]"]
    },
    {
      role: "[Job Title]", org: "[Company]", place: "[City]",
      start: "2019", end: "2021",
      summary: "[One or two sentences on the scope of the role.]",
      highlights: ["[A concrete achievement]"]
    },
    {
      role: "[Degree / Programme]", org: "[University / School]", place: "[City]",
      start: "2015", end: "2019",
      summary: "[What you studied and anything notable.]",
      highlights: []
    }
  ],

  /* ---- 04 · Skills (level 1–5 = peak height) --------------------------- */
  skills: [
    {
      group: "Design",
      items: [
        { name: "Interaction", level: 5 },
        { name: "Visual", level: 4 },
        { name: "Prototyping", level: 5 },
        { name: "Research", level: 3 },
        { name: "Motion", level: 4 },
        { name: "Type", level: 3 }
      ]
    },
    {
      group: "Engineering",
      items: [
        { name: "TypeScript", level: 5 },
        { name: "React", level: 4 },
        { name: "CSS", level: 5 },
        { name: "Node", level: 3 },
        { name: "WebGL", level: 3 },
        { name: "Testing", level: 4 }
      ]
    },
    {
      group: "Leadership",
      items: [
        { name: "Mentoring", level: 4 },
        { name: "Strategy", level: 3 },
        { name: "Writing", level: 4 },
        { name: "Facilitation", level: 3 },
        { name: "Hiring", level: 2 }
      ]
    }
  ],
  tools: ["[Figma]", "[VS Code]", "[Git]", "[Blender]", "[Notion]", "[Linear]", "[Framer]", "[Tool]"],

  /* ---- 05 · Writing & experiments --------------------------------------
     Placeholder cards, shown only until you publish real posts: once
     posts/*.md exist, build.py puts the latest five here automatically.   */
  notes: [
    { kind: "Essay",      date: "2026-08", minutes: 8, title: "[Title of your best or most recent essay]", excerpt: "[A two-line teaser that makes someone want to click.]", url: "#" },
    { kind: "Experiment", date: "2026-05", minutes: 3, title: "[A small experiment]", excerpt: "[What you tried.]", url: "#" },
    { kind: "Talk",       date: "2026-02", minutes: 25, title: "[Conference talk title]", excerpt: "[Where and what about.]", url: "#" },
    { kind: "Essay",      date: "2025-11", minutes: 6, title: "[Another essay]", excerpt: "[Teaser.]", url: "#" },
    { kind: "Experiment", date: "2025-07", minutes: 2, title: "[Another experiment]", excerpt: "[Teaser.]", url: "#" }
  ],

  /* ---- 06 · Contact ---------------------------------------------------- */
  contact: {
    heading: "Let's chart something new.",   // last word gets the italic accent
    text: "[An inviting line — what kind of work or conversations you're open to, and how fast you usually reply.]"
  },
  socials: [
    { label: "GitHub",   handle: "@yourhandle", url: "https://github.com/" },
    { label: "LinkedIn", handle: "in/yourname", url: "https://www.linkedin.com/" },
    { label: "Read.cv",  handle: "yourname",    url: "#" },
    { label: "Email",    handle: "hello@yourdomain.com", url: "mailto:hello@yourdomain.com" }
  ]
};
