/* ==========================================================================
   THE ATLAS — rendering + interactions
   Reads window.PORTFOLIO (js/content.js) and builds every section.
   No dependencies, no build step. Works from file:// and any static host.
   ========================================================================== */
(() => {
  "use strict";

  const D = window.PORTFOLIO || {};
  const P = D.person || {};
  const S = D.sections || {};
  const LOC = P.location || { lat: 0, lng: 0 };
  const root = document.documentElement;
  const mqReduced = matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = mqReduced.matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------------- utils */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ESC[c]);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const isDark = () => root.getAttribute("data-theme") === "dark";
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const list = (a) => (Array.isArray(a) ? a : []);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };
  const ssn = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  const debounce = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const fmtLat = (v) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? "N" : "S"}`;
  const fmtLng = (v) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? "E" : "W"}`;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtDate = (s) => { const m = /^(\d{4})-(\d{2})/.exec(s || ""); return m ? `${MONTHS[+m[2] - 1]} ${m[1]}` : esc(s); };

  /** Wrap each word for the masked reveal; optionally italicise the last word. */
  function splitWords(text, emLast) {
    const words = String(text || "").trim().split(/\s+/);
    return words.map((w, i) => {
      const inner = `<span style="--i:${i}">${esc(w)}</span>`;
      const wrapped = `<span class="w">${inner}</span>`;
      return emLast && words.length > 1 && i === words.length - 1 ? `<em>${wrapped}</em>` : wrapped;
    }).join(" ");
  }

  const ICON = {
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    arrowUR: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
  };

  const ORDER = ["about", "work", "route", "terrain", "notes", "contact"];
  /** A stable, plausible-looking coordinate for each section's header. */
  const coordFor = (key) => {
    const i = Math.max(0, ORDER.indexOf(key)) + 1;
    return `${fmtLat(LOC.lat + i * 0.0137)} · ${fmtLng(LOC.lng - i * 0.0211)}`;
  };

  function secHead(key, opts = {}) {
    const s = S[key] || {};
    const intro = s.intro && !opts.noIntro;
    return `
      <header class="sec-head">
        <div class="sec-meta mono">
          <span class="sec-idx">${esc(s.index)}</span><span>${esc(s.kicker)}</span>
          <span class="sec-rule" aria-hidden="true"></span>
          <span class="sec-coord" aria-hidden="true">${coordFor(key)}</span>
        </div>
        ${opts.noTitle ? "" : `
        <div class="sec-head-row${intro ? " has-intro" : ""}">
          <h2 class="sec-title split" id="${key}-title">${splitWords(s.title, true)}</h2>
          ${intro ? `<p class="sec-intro reveal">${esc(s.intro)}</p>` : ""}
        </div>`}
      </header>`;
  }

  /* =====================================================================
     RENDER
     ===================================================================== */
  function renderMeta() {
    const m = D.meta || {};
    if (m.title) document.title = m.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && m.description) desc.setAttribute("content", m.description);
    const og = document.querySelector('meta[property="og:title"]');
    if (og && m.title) og.setAttribute("content", m.title);
    $$('[data-bind="name"]').forEach((el) => (el.textContent = P.name || ""));
  }

  function renderNav() {
    const items = ORDER.filter((k) => S[k]).map((k, i) => ({ key: k, ...S[k], i }));
    $("#nav-list").innerHTML = items.map((s) => `
      <li><a class="nav-link" href="#${s.key}" data-nav="${s.key}">
        <span class="mono">${esc(s.index)}</span><span>${esc(s.kicker)}</span>
      </a></li>`).join("");
    $("#mobile-menu-list").innerHTML = items.map((s) => `
      <li><a href="#${s.key}" style="--i:${s.i}"><span class="mono">${esc(s.index)}</span>${esc(s.title)}</a></li>`).join("");
    $("#mobile-menu-foot").innerHTML = `<a href="mailto:${esc(P.email)}">${esc(P.email)}</a><span>${esc(LOC.label || "")}</span>`;
  }

  function renderHero() {
    const words = String(P.name || "Your Name").trim().split(/\s+/);
    const lines = list(P.nameLines).length ? P.nameLines : words.length > 1 ? [words[0], words.slice(1).join(" ")] : [words[0]];
    const rot = list(P.rotatingWords);
    $("#hero-inner").innerHTML = `
      <div class="hero-top mono reveal">
        <span><span class="accent">Sheet 01</span> — Portfolio of ${esc(P.name)}</span>
        <span>${esc(LOC.label || "")} · ${fmtLat(LOC.lat)}, ${fmtLng(LOC.lng)}</span>
      </div>
      <div class="hero-main">
        <h1 class="hero-name split" id="hero-name">
          ${lines.map((l, i) => `<span class="line">${splitWords(l).replace(/--i:(\d+)/g, (_, n) => `--i:${+n + i * 2}`)}</span>`).join("")}
        </h1>
        <p class="hero-role reveal" style="--d:250ms">
          <span>${esc(P.role)} —</span> <span>${esc(P.rolePrefix || "")}</span>
          ${rot.length ? `<span class="rotator" aria-hidden="true">${rot.map((w, i) => `<span class="${i === 0 ? "on" : ""}">${esc(w)}</span>`).join("")}</span>
          <span class="sr-only">${esc(rot.join(", "))}</span>` : ""}
        </p>
        <p class="hero-tagline reveal" style="--d:350ms">${esc(P.tagline)}</p>
        <div class="hero-cta reveal" style="--d:450ms">
          <a class="btn btn-primary magnetic" href="#work">View ${esc((S.work && S.work.title) || "work").toLowerCase()} <span class="arrow" aria-hidden="true">→</span></a>
          <a class="btn btn-ghost magnetic" href="#contact">Get in touch</a>
        </div>
      </div>
      <div class="hero-bottom">
        <div class="status reveal${P.available ? "" : " off"}" style="--d:550ms"><span class="pulse" aria-hidden="true"></span>${esc(P.availability || (P.available ? "Available for work" : "Not taking new work"))}</div>
        <a class="scroll-cue mono" href="#about"><span class="line" aria-hidden="true"></span>Scroll to survey</a>
        <div class="legend mono reveal" style="--d:650ms" aria-hidden="true">
          <div class="legend-title"><b>Legend</b><span id="lg-state">Idle</span></div>
          <dl>
            <dt>Lat</dt><dd id="lg-lat">${fmtLat(LOC.lat)}</dd>
            <dt>Lng</dt><dd id="lg-lng">${fmtLng(LOC.lng)}</dd>
            <dt>Elev</dt><dd id="lg-elev">— m</dd>
          </dl>
          <div class="scale"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="scale-l"><span>0</span><span>500</span><span>1000 m · C.I. 20 m</span></div>
        </div>
      </div>`;
  }

  function renderMarquee() {
    const items = list(D.marquee);
    const one = (clone) => items.map((t) => `<span class="marquee-item"${clone ? " data-clone" : ""}>${esc(t)}${ICON.star}</span>`).join("");
    $("#marquee-track").innerHTML = one(false) + one(true);
  }

  function renderAbout() {
    const a = D.about || {};
    $("#about").innerHTML = `
      <div class="container">
        ${secHead("about")}
        <div class="about-grid">
          <figure class="portrait reveal" id="portrait">
            <span class="portrait-corner tl" aria-hidden="true"></span><span class="portrait-corner tr" aria-hidden="true"></span>
            <figcaption class="portrait-label mono"><span>Fig. 1 — ${esc(P.name)}</span><span>${P.photo ? esc(LOC.label || "") : "[Your photo]"}</span></figcaption>
          </figure>
          <div>
            <p class="about-lead reveal">${esc(a.lead)}</p>
            <div class="about-body">${list(a.paragraphs).map((p, i) => `<p class="reveal" style="--d:${i * 80}ms">${esc(p)}</p>`).join("")}</div>
            <dl class="facts">${list(a.facts).map((f, i) => `
              <div class="fact reveal" style="--d:${i * 70}ms"><dt class="mono">${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join("")}
            </dl>
            <div class="stats">${list(a.stats).map((s, i) => `
              <div class="stat reveal" style="--d:${i * 90}ms"><div class="stat-value" data-count="${esc(s.value)}">${esc(s.value)}</div><div class="stat-label mono">${esc(s.label)}</div></div>`).join("")}
            </div>
          </div>
        </div>
      </div>`;
    const fig = $("#portrait");
    if (P.photo) fig.insertAdjacentHTML("afterbegin", `<img src="${esc(P.photo)}" alt="Portrait of ${esc(P.name)}" loading="lazy">`);
    else mountTile(fig, { seed: `${P.name}-portrait`, hue: 18 }, true);
  }

  const projects = list(D.projects);
  function renderWork() {
    const cats = [...new Set(projects.map((p) => p.category).filter(Boolean))];
    const count = (c) => projects.filter((p) => p.category === c).length;
    $("#work").innerHTML = `
      <div class="container">
        ${secHead("work")}
        ${cats.length > 1 ? `
        <div class="filters reveal" role="group" aria-label="Filter projects by category">
          <button class="filter" type="button" data-filter="*" aria-pressed="true">All<sup>${pad(projects.length)}</sup></button>
          ${cats.map((c) => `<button class="filter" type="button" data-filter="${esc(c)}" aria-pressed="false">${esc(c)}<sup>${pad(count(c))}</sup></button>`).join("")}
        </div>` : ""}
        <ol class="work-list" id="work-list">
          ${projects.map((p, i) => `
          <li class="work-item reveal" data-cat="${esc(p.category)}" style="--d:${i * 60}ms">
            <button class="work-row" type="button" data-project="${i}" aria-haspopup="dialog">
              <span class="work-thumb" data-thumb="${i}" aria-hidden="true"></span>
              <span class="work-idx mono">E—${pad(i + 1)}</span>
              <span class="work-title">${esc(p.title)}</span>
              <span class="work-summary">${esc(p.summary)}</span>
              <span class="work-meta">
                <span class="chip">${esc(p.category)}</span>
                <span class="mono">${esc(p.year)}</span>
                <span class="work-arrow" aria-hidden="true">${ICON.arrow}</span>
              </span>
            </button>
          </li>`).join("")}
        </ol>
      </div>`;
  }

  function renderRoute() {
    const ex = list(D.experience);
    $("#route").innerHTML = `
      <div class="container">
        ${secHead("route")}
        <div class="route-wrap" id="route-wrap">
          <svg class="route-svg" id="route-svg" aria-hidden="true"><path class="planned"/><path class="walked"/></svg>
          <ol class="route-list">
            ${ex.map((e, i) => `
            <li class="stop" data-stop="${i}">
              <span class="waypoint" aria-hidden="true"></span>
              <div class="stop-when mono reveal"><b>${esc(e.start)}${e.end ? ` — ${esc(e.end)}` : ""}</b>WP-${pad(i + 1)} · ${esc(e.place)}</div>
              <div class="reveal" style="--d:80ms">
                <h3 class="stop-role">${esc(e.role)}</h3>
                <p class="stop-org"><span class="at">at</span> ${esc(e.org)}</p>
                ${e.summary ? `<p class="stop-summary">${esc(e.summary)}</p>` : ""}
                ${list(e.highlights).length ? `<ul class="stop-hl">${e.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
              </div>
            </li>`).join("")}
          </ol>
        </div>
      </div>`;
  }

  const skills = list(D.skills);
  function renderTerrain() {
    $("#terrain").innerHTML = `
      <div class="container">
        ${secHead("terrain")}
        ${skills.length > 1 ? `<div class="tabs reveal" role="tablist" aria-label="Skill groups">
          ${skills.map((g, i) => `<button class="tab" role="tab" type="button" id="tab-${i}" aria-controls="terrain-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-group="${i}">${esc(g.group)}</button>`).join("")}
        </div>` : ""}
        <div id="terrain-panel" role="tabpanel" aria-labelledby="tab-0">
          <figure class="profile reveal">
            <figcaption class="profile-head mono"><span>Elevation profile — <span id="profile-name"></span></span><span>Vertical exaggeration ×5</span></figcaption>
            <svg viewBox="0 0 1000 400" id="profile-svg" role="img" aria-labelledby="profile-desc">
              <desc id="profile-desc">Skill levels drawn as mountain peaks; the list below has the same data.</desc>
              <defs>
                <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="7" style="stroke:var(--contour-strong);stroke-width:1"/>
                </pattern>
              </defs>
              <g class="axis" id="profile-axis"></g>
              <path class="ridge-fill" id="ridge-fill"/>
              <path class="ridge-echo" id="ridge-e1"/><path class="ridge-echo" id="ridge-e2"/><path class="ridge-echo" id="ridge-e3"/>
              <path class="ridge" id="ridge"/>
              <g id="profile-peaks"></g>
            </svg>
          </figure>
          <ul class="skill-list" id="skill-list"></ul>
        </div>
        ${list(D.tools).length ? `<div class="tools reveal"><span class="tools-label mono">Field kit</span>${D.tools.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}
      </div>`;
  }

  function renderNotes() {
    // Real posts (inlined by build.py) win over the placeholder cards in content.js.
    const built = Array.isArray(window.PORTFOLIO_NOTES) && window.PORTFOLIO_NOTES.length ? window.PORTFOLIO_NOTES : null;
    const notes = built || list(D.notes);
    if (!notes.length) {        // nothing published yet: one quiet "coming soon" card
      $("#notes").innerHTML = `
        <div class="container">
          ${secHead("notes")}
          <div class="notes-grid">
            <a class="note note-archive note-soon reveal" href="${esc((S.notes && S.notes.archiveUrl) || "#")}" style="--span:3">
              <div class="note-top mono"><span class="note-kind">Logbook</span><span>Entry 001</span></div>
              <h3 class="note-title">The first entry is being written.</h3>
              <div class="note-foot mono"><span>Follow along via RSS</span>${ICON.arrowUR}</div>
            </a>
          </div>
        </div>`;
      return;
    }
    // An "archive" card closes the bento grid: it spans whatever columns the last row has left.
    const archive = S.notes && S.notes.archiveUrl;
    const used = notes.length ? 4 + (notes.length - 1) : 0;
    const span = 3 - (used % 3);
    $("#notes").innerHTML = `
      <div class="container">
        ${secHead("notes")}
        <div class="notes-grid">
          ${notes.map((n, i) => `
          <a class="note reveal" href="${esc(n.url || "#")}" style="--d:${(i % 3) * 80}ms">
            <div class="note-top mono"><span class="note-kind">${esc(n.kind)}${n.lang ? ` · ${esc(n.lang)}` : ""}${n.draft ? " · Draft" : ""}</span><span>${fmtDate(n.date)}</span></div>
            <h3 class="note-title">${esc(n.title)}</h3>
            ${n.excerpt ? `<p class="note-excerpt">${esc(n.excerpt)}</p>` : ""}
            <div class="note-foot mono"><span>${n.minutes ? `${esc(n.minutes)} min ${n.kind === "Talk" ? "watch" : "read"}` : ""}</span>${ICON.arrowUR}</div>
          </a>`).join("")}
          ${archive ? `<a class="note note-archive reveal" href="${esc(archive)}" style="--span:${span}">
            <div class="note-top mono"><span class="note-kind">Archive</span><span>${pad(notes.length)}+ entries</span></div>
            <h3 class="note-title">All field notes</h3>
            <div class="note-foot mono"><span>Browse the logbook</span>${ICON.arrowUR}</div>
          </a>` : ""}
        </div>
      </div>`;
  }

  function renderContact() {
    const c = D.contact || {};
    const ticks = [];
    for (let d = 0; d < 360; d += 5) {
      const long = d % 30 === 0, a = (d * Math.PI) / 180, r1 = long ? 172 : 180, r2 = 190;
      ticks.push(`<line class="tick" x1="${200 + r1 * Math.sin(a)}" y1="${200 - r1 * Math.cos(a)}" x2="${200 + r2 * Math.sin(a)}" y2="${200 - r2 * Math.cos(a)}" stroke-width="${long ? 1.4 : .8}"/>`);
      if (long && d % 90) ticks.push(`<text class="deg" x="${200 + 160 * Math.sin(a)}" y="${200 - 160 * Math.cos(a)}">${pad(d, 3)}</text>`);
    }
    const cards = [["N", 0], ["E", 90], ["S", 180], ["W", 270]].map(([l, d]) => {
      const a = (d * Math.PI) / 180;
      return `<text class="card${l === "N" ? " n" : ""}" x="${200 + 150 * Math.sin(a)}" y="${200 - 150 * Math.cos(a)}">${l}</text>`;
    }).join("");
    $("#contact").innerHTML = `
      <div class="container">
        ${secHead("contact", { noTitle: true })}
        <div class="contact-grid">
          <div>
            <h2 class="contact-title split" id="contact-title">${splitWords(c.heading || "Say hello.", true)}</h2>
            ${c.text ? `<p class="contact-text reveal">${esc(c.text)}</p>` : ""}
            <div class="contact-actions reveal" style="--d:120ms">
              <a class="btn btn-primary btn-lg magnetic" href="mailto:${esc(P.email)}">Send a signal <span class="arrow" aria-hidden="true">→</span></a>
              <button class="btn btn-ghost btn-lg magnetic" type="button" data-copy-email>Copy email</button>
              ${P.resume ? `<a class="btn btn-ghost btn-lg magnetic" href="${esc(P.resume)}">Résumé</a>` : ""}
            </div>
            <ul class="socials">
              ${list(D.socials).map((s, i) => `
              <li class="reveal" style="--d:${i * 60}ms"><a class="social" href="${esc(s.url)}" ${/^https?:/.test(s.url || "") ? 'target="_blank" rel="noopener"' : ""}>
                <span>${esc(s.label)}</span><span class="handle mono">${esc(s.handle)}</span>${ICON.arrowUR}
              </a></li>`).join("")}
            </ul>
          </div>
          <figure class="compass reveal" aria-hidden="true">
            <svg viewBox="0 0 400 400">
              <circle class="ring" cx="200" cy="200" r="190" stroke-width="1.5"/>
              <circle class="ring-soft" cx="200" cy="200" r="172"/>
              <circle class="ring-soft" cx="200" cy="200" r="120" stroke-dasharray="2 6"/>
              <circle class="ring-soft" cx="200" cy="200" r="70"/>
              <g class="sweep"><path d="M200 200 L200 30 A170 170 0 0 1 309.3 69.8 Z"/></g>
              <g class="ping"><circle cx="200" cy="200" r="170"/><circle cx="200" cy="200" r="170"/><circle cx="200" cy="200" r="170"/></g>
              ${ticks.join("")}${cards}
              <g class="needle" id="needle">
                <path class="needle-n" d="M200 58 L213 200 L187 200 Z"/>
                <path class="needle-s" d="M200 342 L213 200 L187 200 Z"/>
              </g>
              <circle class="hub" cx="200" cy="200" r="9"/>
            </svg>
            <figcaption class="compass-caption mono">Bearing <span id="bearing">000</span>° · Signal clear</figcaption>
          </figure>
        </div>
      </div>`;
  }

  function renderFooter() {
    const words = String(P.name || "").trim().split(/\s+/);
    const name = list(P.nameLines).length ? P.nameLines : [words[0] || "", words.slice(1).join(" ")];
    const chars = name.join(" ").length;
    const year = (D.meta && D.meta.year) || new Date().getFullYear();
    $("#site-footer").innerHTML = `
      <div class="container footer-grid mono">
        <div><b>Sheet 01 of 01</b>Surveyed &amp; drawn by ${esc(P.name)}<br>© ${esc(year)} — all rights reserved</div>
        <div><b>Colophon</b>Instrument Serif, Geist &amp; Geist Mono.<br>Hand-built. No frameworks.</div>
        <div><b>Local time</b><span id="footer-clock">--:--:--</span><br>${esc(LOC.label || "")}</div>
        <div><b>Navigate</b><a class="to-top" href="#top">Back to top ↑</a><br><a href="#" data-open-palette>Command palette</a></div>
      </div>
      <div class="footer-mark" aria-hidden="true" style="--chars:${chars}">${esc(name[0] || "")}${name[1] ? ` <em>${esc(name[1])}</em>` : ""}</div>`;
  }

  /* =====================================================================
     MAP TILES (generated artwork; lazily painted, repainted on theme change)
     ===================================================================== */
  const tiles = [];
  const tileIO = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting && paintTile(e.target.__tile)) tileIO.unobserve(e.target); });
  }, { rootMargin: "200px" }) : null;

  function mountTile(host, spec, prepend) {
    const c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    prepend ? host.prepend(c) : host.appendChild(c);
    const t = { canvas: c, host, seed: spec.seed, hue: spec.hue, painted: false };
    host.__tile = t;
    tiles.push(t);
    if (tileIO) tileIO.observe(host); else paintTile(t);
    return t;
  }
  function paintTile(t) {
    if (!t) return;
    const r = t.host.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;   // hidden right now; stays observed
    Terrain.drawTile(t.canvas, { width: r.width, height: r.height, seed: t.seed, hue: t.hue, dark: isDark() });
    t.painted = true;
    return true;
  }
  const repaintTiles = () => tiles.forEach((t) => { if (t.painted && t.host.isConnected) paintTile(t); });

  /** Media for a project: their image if provided, otherwise a generated tile. */
  function projectMedia(host, p) {
    if (p.image) host.innerHTML = `<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">`;
    else mountTile(host, { seed: p.id || p.title, hue: p.hue });
  }

  /* =====================================================================
     BEHAVIOUR
     ===================================================================== */

  /* ---- Theme ---------------------------------------------------------- */
  let hero = null;
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    const btn = $("#theme-btn");
    btn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    if (hero) { hero.readColors(); hero.draw(); }
    repaintTiles();
    previewCache.clear();
  }
  function toggleTheme(origin) {
    const next = isDark() ? "light" : "dark";
    store.set("atlas-theme", next);
    if (!document.startViewTransition || reduced) return applyTheme(next);
    const x = origin ? origin.x : innerWidth - 60, y = origin ? origin.y : 34;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(next));
    vt.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(.65,0,.35,1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(() => {});
  }
  function initTheme() {
    applyTheme(root.getAttribute("data-theme") || "light");
    $("#theme-btn").addEventListener("click", (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const follow = (e) => { if (!store.get("atlas-theme")) applyTheme(e.matches ? "dark" : "light"); };
    mq.addEventListener ? mq.addEventListener("change", follow) : mq.addListener(follow);
  }

  /* ---- Preloader ------------------------------------------------------ */
  function preloader(done) {
    if (reduced || ssn.get("atlas-seen")) return done();
    ssn.set("atlas-seen", "1");
    const el = document.createElement("div");
    el.className = "loader";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `<div class="loader-inner">
      <div class="loader-row mono"><span>Surveying terrain</span><span>${fmtLat(LOC.lat)}</span></div>
      <div class="loader-count">000</div>
      <div class="loader-bar"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="loader-row mono"><span>Sheet 01</span><span>${esc(P.name)}</span></div></div>`;
    document.body.appendChild(el);
    const count = $(".loader-count", el), t0 = performance.now(), dur = 1100;
    (function tick(now) {
      const k = clamp((now - t0) / dur, 0, 1), v = Math.round((1 - Math.pow(1 - k, 3)) * 100);
      count.textContent = pad(v, 3);
      if (k < 1) return requestAnimationFrame(tick);
      el.classList.add("out");
      setTimeout(done, 250);
      setTimeout(() => el.remove(), 1100);
    })(t0);
  }

  /* ---- Reveal on scroll ----------------------------------------------- */
  function initReveal() {
    // The hero is on screen at load: reveal it right away (its bottom row sits inside the observer's margin).
    $$("#top .reveal, #top .split").forEach((e) => e.classList.add("in"));
    const els = $$(".reveal, .split").filter((e) => !e.closest("#top"));
    if (!("IntersectionObserver" in window) || reduced) return els.forEach((e) => e.classList.add("in"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach((e) => io.observe(e));

    // Count-up stats
    const nums = $$("[data-count]");
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const m = /^(\D*)(\d+)(.*)$/.exec(e.target.dataset.count);
        if (!m) return;
        const [, pre, digits, post] = m, target = +digits, t0 = performance.now();
        (function step(now) {
          const k = clamp((now - t0) / 1400, 0, 1), v = Math.round((1 - Math.pow(1 - k, 4)) * target);
          e.target.textContent = pre + String(v).padStart(digits.length, "0") + post;
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    nums.forEach((n) => cio.observe(n));
  }

  /* ---- Header: condense, hide on scroll down, active section ---------- */
  function initHeader() {
    const header = $("#site-header");
    let lastY = scrollY, ticking = false;
    const onScroll = () => {
      const y = scrollY;
      header.classList.toggle("scrolled", y > 24);
      const menuOpen = !$("#mobile-menu").hidden;
      header.classList.toggle("hidden", !menuOpen && y > 480 && y > lastY + 2);
      if (y < lastY - 2 || y < 480) header.classList.remove("hidden");
      lastY = y;
      updateSheetIndex();
      updateRoute();
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
    header.addEventListener("focusin", () => header.classList.remove("hidden"));

    const links = $$("[data-nav]");
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => {
          const on = l.dataset.nav === e.target.id;
          l.classList.toggle("active", on);
          on ? l.setAttribute("aria-current", "true") : l.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ORDER.forEach((k) => { const s = document.getElementById(k); if (s) io.observe(s); });
    const heroIO = new IntersectionObserver(([e]) => { if (e.isIntersecting) links.forEach((l) => { l.classList.remove("active"); l.removeAttribute("aria-current"); }); }, { rootMargin: "-45% 0px -50% 0px" });
    heroIO.observe($("#top"));
  }

  /* ---- Mobile menu ---------------------------------------------------- */
  function initMobileMenu() {
    const btn = $("#menu-btn"), menu = $("#mobile-menu");
    const set = (open) => {
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      root.style.overflow = open ? "hidden" : "";
      if (open) $("a", menu).focus();
    };
    btn.addEventListener("click", () => set(menu.hidden));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { set(false); btn.focus(); } });
    matchMedia("(min-width: 961px)").addEventListener("change", (e) => { if (e.matches) set(false); });
  }

  /* ---- Scroll "sheet index" on the right edge ------------------------- */
  let sheet = null;
  function initSheetIndex() {
    const ruler = $("#sheet-ruler");
    sheet = { el: $(".sheet-index"), ruler, marker: $("#sheet-marker"), pct: $("#sheet-pct") };
    const place = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      ruler.innerHTML = ORDER.map((k) => {
        const s = document.getElementById(k);
        return s ? `<i style="top:${clamp(s.offsetTop / (max || 1), 0, 1) * 100}%"></i>` : "";
      }).join("");
    };
    place();
    addEventListener("resize", debounce(place, 200));
    addEventListener("load", place);
  }
  function updateSheetIndex() {
    if (!sheet) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = clamp(scrollY / (max || 1), 0, 1);
    sheet.el.classList.toggle("on", scrollY > innerHeight * 0.5);
    sheet.marker.style.setProperty("--p", `${p * sheet.el.clientHeight}px`);
    sheet.pct.textContent = pad(Math.round(p * 100), 3);
  }

  /* ---- Hero: live terrain + legend readout ---------------------------- */
  function initHero() {
    const canvas = $("#hero-canvas"), section = $("#top");
    if (!window.Terrain || !canvas.getContext) return;
    hero = new Terrain.Hero(canvas, { reduced });
    hero.start();
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { hero.visible = e.isIntersecting; }).observe(section);
    document.addEventListener("visibilitychange", () => (document.hidden ? hero.stop() : hero.start()));
    let lastW = innerWidth;
    addEventListener("resize", debounce(() => {
      // Mobile browsers fire resize when the URL bar collapses; only rebuild on width changes.
      if (innerWidth !== lastW || !fine) { lastW = innerWidth; hero.resize(); }
    }, 180));

    const lat = $("#lg-lat"), lng = $("#lg-lng"), elev = $("#lg-elev"), state = $("#lg-state");
    const label = $(".cursor-label");
    section.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      hero.pointer(x, y, true);
      const la = LOC.lat + (0.5 - y / r.height) * 0.18, lo = LOC.lng + (x / r.width - 0.5) * 0.3;
      const m = Math.max(0, Math.round(820 + hero.height(x, y) * 1500));
      if (lat) { lat.textContent = fmtLat(la); lng.textContent = fmtLng(lo); elev.textContent = `${m.toLocaleString("en-US")} m`; state.textContent = "Live"; }
      if (label) label.textContent = `${la.toFixed(3)}, ${lo.toFixed(3)} · ${m} m`;
      if (reduced) hero.draw();
    });
    section.addEventListener("pointerleave", (e) => {
      hero.pointer(e.clientX, e.clientY, false);
      if (state) state.textContent = "Idle";
    });
  }

  function initRotator() {
    const spans = $$(".rotator span");
    if (spans.length < 2 || reduced) return;
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      const cur = spans[i], nxt = spans[(i + 1) % spans.length];
      cur.classList.remove("on"); cur.classList.add("off");
      nxt.classList.add("on");
      setTimeout(() => { // snap the old word back below without animating through view
        cur.style.transition = "none"; cur.classList.remove("off");
        void cur.offsetWidth; cur.style.transition = "";
      }, 850);
      i = (i + 1) % spans.length;
    }, 2600);
  }

  /* ---- Cursor --------------------------------------------------------- */
  function initCursor() {
    if (!fine) return;
    root.classList.add("has-cursor");
    const cur = $(".cursor"), dot = $(".cursor-dot"), ring = $(".cursor-ring"), label = $(".cursor-label");
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0;
    const k = reduced ? 1 : 0.2;
    const loop = () => {
      rx += (x - rx) * k; ry += (y - ry) * k;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      label.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 ? requestAnimationFrame(loop) : 0;
    };
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX; y = e.clientY;
      if (!document.querySelector("dialog[open]")) cur.classList.remove("hidden");
      if (!raf) raf = requestAnimationFrame(loop);
      const t = e.target;
      cur.classList.toggle("on-link", !!(t.closest && t.closest("a, button, [role=tab], .palette-item, label")));
      cur.classList.toggle("on-map", !!(t.closest && t.closest("#top")) && !cur.classList.contains("on-link"));
    }, { passive: true });
    document.addEventListener("pointerleave", () => cur.classList.add("hidden"));
    // Dialogs sit in the top layer above the cursor; hide it there (they get the native pointer).
    const anyOpen = () => !!document.querySelector("dialog[open]");
    $$("dialog").forEach((d) => d.addEventListener("close", () => cur.classList.toggle("hidden", anyOpen())));
    new MutationObserver(() => { if (anyOpen()) cur.classList.add("hidden"); })
      .observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
    addEventListener("blur", () => cur.classList.add("hidden"));
  }

  /* ---- Magnetic buttons ----------------------------------------------- */
  function initMagnetic() {
    if (!fine || reduced) return;
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest(".magnetic");
      $$(".magnetic.pulling").forEach((m) => { if (m !== el) { m.classList.remove("pulling"); m.style.setProperty("--bx", "0px"); m.style.setProperty("--by", "0px"); } });
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.classList.add("pulling");
      el.style.setProperty("--bx", `${(e.clientX - (r.left + r.width / 2)) * 0.22}px`);
      el.style.setProperty("--by", `${(e.clientY - (r.top + r.height / 2)) * 0.35}px`);
    }, { passive: true });
  }

  /* ---- Work: filters, hover preview, inline thumbs -------------------- */
  const previewCache = new Map();
  function initWork() {
    // inline thumbnails (only visible on small screens; painted lazily)
    $$("[data-thumb]").forEach((h) => projectMedia(h, projects[+h.dataset.thumb]));
    addEventListener("resize", debounce(repaintTiles, 250));

    // filters
    const filters = $$(".filter");
    filters.forEach((f) => f.addEventListener("click", () => {
      const v = f.dataset.filter;
      filters.forEach((b) => b.setAttribute("aria-pressed", String(b === f)));
      let k = 0;
      $$(".work-item").forEach((it) => {
        const show = v === "*" || it.dataset.cat === v;
        it.classList.toggle("is-hidden", !show);
        if (show && !reduced) {
          it.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }],
            { duration: 600, delay: k++ * 60, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
        }
      });
      requestAnimationFrame(() => { repaintTiles(); updateSheetIndex(); });
    }));

    // open dialog
    $("#work-list").addEventListener("click", (e) => {
      const row = e.target.closest("[data-project]");
      if (row) openProject(+row.dataset.project, row);
    });

    // floating preview
    if (!fine) return;
    const pv = $("#work-preview"), media = $("#work-preview-media"), lab = $("#work-preview-label");
    let tx = 0, ty = 0, px = 0, py = 0, vx = 0, active = false, raf = 0;
    const W = 340, H = 212;
    const canvasFor = (i) => {
      const p = projects[i], key = `${i}:${isDark()}`;
      if (previewCache.has(key)) return previewCache.get(key);
      let node;
      if (p.image) { node = new Image(); node.src = p.image; node.alt = ""; }
      else { node = document.createElement("canvas"); Terrain.drawTile(node, { width: W, height: H, seed: p.id || p.title, hue: p.hue, dark: isDark() }); }
      previewCache.set(key, node);
      return node;
    };
    const loop = () => {
      const nx = px + (tx - px) * 0.16;
      vx = vx * 0.8 + (nx - px) * 0.2;
      px = nx; py += (ty - py) * 0.16;
      pv.style.transform = `translate3d(${px + 28}px, ${py - H / 2}px, 0) rotate(${clamp(vx * 0.6, -10, 10)}deg)`;
      raf = active || Math.abs(tx - px) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    const list_ = $("#work-list");
    list_.addEventListener("pointerover", (e) => {
      const row = e.target.closest("[data-project]");
      if (!row) return;
      const i = +row.dataset.project;
      media.replaceChildren(canvasFor(i));
      lab.textContent = `${projects[i].category} · ${projects[i].year}`;
      if (!active) { px = tx = e.clientX; py = ty = e.clientY; }
      active = true; pv.classList.add("on");
      if (!raf) raf = requestAnimationFrame(loop);
    });
    list_.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; });
    list_.addEventListener("pointerleave", () => { active = false; pv.classList.remove("on"); });
    addEventListener("scroll", () => { if (active) { active = false; pv.classList.remove("on"); } }, { passive: true });
  }

  /* ---- Project dialog -------------------------------------------------- */
  let current = -1, lastTrigger = null;
  function projectHTML(p, i) {
    const meta = [["Role", p.role], ["Year", p.year], ["Duration", p.duration], ["Team", p.team]].filter(([, v]) => v);
    return `
      <div class="pd-sheet" role="document">
        <div class="pd-bar">
          <span class="mono">Expedition ${pad(i + 1)} / ${pad(projects.length)} — ${esc(p.category)}</span>
          <div class="pd-nav">
            <button class="tool-btn" type="button" data-pd="prev" aria-label="Previous project">${ICON.prev}</button>
            <button class="tool-btn" type="button" data-pd="next" aria-label="Next project">${ICON.next}</button>
            <button class="tool-btn" type="button" data-pd="close" aria-label="Close project">${ICON.close}</button>
          </div>
        </div>
        <div class="pd-cover" id="pd-cover"><span class="coords mono">${coordFor("work")} · E—${pad(i + 1)}</span></div>
        <div class="pd-body">
          <div>
            <h2 class="pd-title" id="pd-title">${esc(p.title)}</h2>
            <p class="pd-summary">${esc(p.summary)}</p>
            <div class="pd-desc">${list(p.description).map((d) => `<p>${esc(d)}</p>`).join("")}</div>
            ${list(p.outcomes).length ? `<div class="pd-outcomes">${p.outcomes.map((o) => `<div><div class="v">${esc(o.value)}</div><div class="l mono">${esc(o.label)}</div></div>`).join("")}</div>` : ""}
          </div>
          <aside class="pd-side">
            <dl class="pd-meta">${meta.map(([k, v]) => `<div><dt class="mono">${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
            ${list(p.stack).length ? `<div><p class="mono muted" style="margin-bottom:10px">Field kit</p><div class="pd-tags">${p.stack.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div></div>` : ""}
            ${list(p.links).length ? `<div class="pd-links">${p.links.map((l, k) => `<a class="btn ${k ? "btn-ghost" : "btn-primary"}" href="${esc(l.url)}" ${/^https?:/.test(l.url || "") ? 'target="_blank" rel="noopener"' : ""}>${esc(l.label)} <span class="arrow" aria-hidden="true">↗</span></a>`).join("")}</div>` : ""}
          </aside>
        </div>
      </div>`;
  }
  function openProject(i, trigger) {
    const dlg = $("#project-dialog");
    if (!projects.length) return;
    i = (i + projects.length) % projects.length;
    current = i;
    if (trigger) lastTrigger = trigger;
    const p = projects[i];
    dlg.innerHTML = projectHTML(p, i);
    if (!dlg.open) { dlg.showModal(); root.style.overflow = "hidden"; }
    projectMedia($("#pd-cover", dlg), p);
    $(".pd-sheet", dlg).scrollTop = 0;
    $('[data-pd="close"]', dlg).focus({ preventScroll: true });
    try { history.replaceState(null, "", `#work/${p.id || i}`); } catch (e) { /* file:// in some browsers */ }
  }
  function initDialog() {
    const dlg = $("#project-dialog");
    dlg.addEventListener("click", (e) => {
      const b = e.target.closest("[data-pd]");
      if (b) {
        const a = b.dataset.pd;
        if (a === "close") dlg.close();
        else openProject(current + (a === "next" ? 1 : -1));
      } else if (e.target === dlg) dlg.close();   // backdrop
    });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") openProject(current + 1);
      if (e.key === "ArrowLeft") openProject(current - 1);
    });
    dlg.addEventListener("close", () => {
      root.style.overflow = "";
      try { history.replaceState(null, "", "#work"); } catch (e) { /* ignore */ }
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    });
    // deep link: #work/<id>
    const m = /^#work\/(.+)$/.exec(location.hash);
    if (m) {
      const i = projects.findIndex((p, k) => (p.id || String(k)) === decodeURIComponent(m[1]));
      if (i > -1) setTimeout(() => openProject(i, $(`[data-project="${i}"]`)), 400);
    }
  }

  /* ---- Route: trail that draws itself as you scroll ------------------- */
  let route = null;
  function layoutRoute() {
    const wrap = $("#route-wrap");
    if (!wrap) return;
    const svg = $("#route-svg"), planned = $(".planned", svg), walked = $(".walked", svg);
    const stops = $$(".stop", wrap);
    if (!stops.length) return;
    const X = 36, ys = stops.map((s) => s.offsetTop + $(".waypoint", s).offsetTop + 9);
    const h = wrap.offsetHeight;
    svg.setAttribute("viewBox", `0 0 72 ${h}`);
    svg.style.height = `${h}px`;
    let d = `M${X} ${ys[0]}`;
    for (let i = 1; i < ys.length; i++) {
      const y0 = ys[i - 1], y1 = ys[i], a = i % 2 ? 26 : -22;
      d += ` C${X + a} ${y0 + (y1 - y0) * 0.33} ${X - a} ${y0 + (y1 - y0) * 0.66} ${X} ${y1}`;
    }
    planned.setAttribute("d", d); walked.setAttribute("d", d);
    const len = walked.getTotalLength();
    walked.style.strokeDasharray = `${len}`;
    route = { wrap, walked, len, ys, stops };
    updateRoute();
  }
  function updateRoute() {
    if (!route) return;
    const r = route.wrap.getBoundingClientRect();
    const first = route.ys[0], last = route.ys[route.ys.length - 1];
    const head = reduced ? Infinity : innerHeight * 0.62 - r.top;       // "you are here", in wrap coords
    const p = clamp((head - first) / ((last - first) || 1), 0, 1);
    route.walked.style.strokeDashoffset = `${route.len * (1 - p)}`;
    route.stops.forEach((s, i) => s.classList.toggle("reached", head >= route.ys[i] - 2));
  }
  function initRoute() {
    layoutRoute();
    const re = debounce(layoutRoute, 150);
    addEventListener("resize", re);
    addEventListener("load", layoutRoute);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutRoute);
    if ("ResizeObserver" in window && $("#route-wrap")) new ResizeObserver(re).observe($("#route-wrap"));
  }

  /* ---- Terrain: skills as an elevation profile ------------------------ */
  const PV = { w: 1000, h: 400, base: 370, top: 132, n: 181 };
  function ridgeSamples(items) {
    const n = items.length || 1, x0 = 90, x1 = 910;
    const xs = items.map((_, i) => (n === 1 ? 500 : x0 + (i * (x1 - x0)) / (n - 1)));
    const sig = (x1 - x0) / Math.max(n, 2) / 1.35;
    const out = new Float32Array(PV.n);
    for (let k = 0; k < PV.n; k++) {
      const x = (k / (PV.n - 1)) * PV.w;
      let v = 0;
      items.forEach((it, i) => {
        const hgt = (clamp(+it.level || 0, 0, 5) / 5) * (PV.base - PV.top);
        const g = Math.exp(-Math.pow((x - xs[i]) / sig, 2));
        v = Math.max(v, hgt * g);
      });
      v += 5 * Math.sin(x * 0.045) + 3 * Math.sin(x * 0.13 + 1);   // rocky texture
      out[k] = PV.base - Math.max(0, v);
    }
    return { ys: out, xs };
  }
  const toPath = (ys, lift = 0, squash = 1) => {
    let d = "";
    for (let k = 0; k < ys.length; k++) {
      const x = (k / (ys.length - 1)) * PV.w, y = PV.base - (PV.base - ys[k]) * squash + lift;
      d += `${k ? "L" : "M"}${x.toFixed(1)} ${Math.min(PV.base, y).toFixed(1)}`;
    }
    return d;
  };
  let ridgeNow = null, ridgeAnim = 0;
  function drawRidge(ys) {
    const line = toPath(ys);
    $("#ridge").setAttribute("d", line);
    $("#ridge-fill").setAttribute("d", `${line} L${PV.w} ${PV.base} L0 ${PV.base} Z`);
    $("#ridge-e1").setAttribute("d", toPath(ys, 0, 0.78));
    $("#ridge-e2").setAttribute("d", toPath(ys, 0, 0.56));
    $("#ridge-e3").setAttribute("d", toPath(ys, 0, 0.34));
  }
  function showGroup(gi) {
    const g = skills[gi];
    if (!g) return;
    const items = list(g.items);
    const { ys, xs } = ridgeSamples(items);
    $("#profile-name").textContent = g.group;
    $("#terrain-panel").setAttribute("aria-labelledby", `tab-${gi}`);

    // axis
    let ax = "";
    for (let l = 1; l <= 5; l++) {
      const y = PV.base - (l / 5) * (PV.base - PV.top);
      ax += `<line x1="40" x2="${PV.w}" y1="${y}" y2="${y}" stroke-dasharray="2 6"/><text x="0" y="${y + 4}">L${l}</text>`;
    }
    ax += `<line x1="0" x2="${PV.w}" y1="${PV.base}" y2="${PV.base}"/>`;
    $("#profile-axis").innerHTML = ax;

    // peaks
    $("#profile-peaks").innerHTML = items.map((it, i) => {
      const x = xs[i], k = Math.round((x / PV.w) * (PV.n - 1)), y = ys[k];
      return `<g class="peak" style="opacity:0;animation:peakIn .7s ${reduced ? 0 : 250 + i * 70}ms var(--ease-out) forwards">
        <line class="peak-stem" x1="${x}" x2="${x}" y1="${y - 8}" y2="${y - 44}"/>
        <path class="peak-mark" d="M${x} ${y - 16} l7 11 h-14z"/>
        <text class="peak-num" x="${x}" y="${y - 52}" text-anchor="middle">${pad(i + 1)}</text>
        <text class="peak-name" x="${x}" y="${y - 70}" text-anchor="middle">${esc(it.name)}</text>
      </g>`;
    }).join("");

    // list (same data, accessible)
    $("#skill-list").innerHTML = items.map((it, i) => `
      <li class="skill-row"><span class="n mono">${pad(i + 1)}</span><span class="name">${esc(it.name)}</span><span class="dots" aria-hidden="true"></span>
        <span class="lvl" role="img" aria-label="Level ${esc(it.level)} of 5">${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= it.level ? "on" : ""}"></i>`).join("")}</span></li>`).join("");

    // morph ridge
    cancelAnimationFrame(ridgeAnim);
    const from = ridgeNow || new Float32Array(PV.n).fill(PV.base);
    if (reduced) { ridgeNow = ys; return drawRidge(ys); }
    const t0 = performance.now(), cur = new Float32Array(PV.n);
    const step = (now) => {
      const t = clamp((now - t0) / 900, 0, 1), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      for (let k = 0; k < PV.n; k++) cur[k] = from[k] + (ys[k] - from[k]) * e;
      drawRidge(cur);
      ridgeNow = cur.slice();
      if (t < 1) ridgeAnim = requestAnimationFrame(step);
    };
    ridgeAnim = requestAnimationFrame(step);
  }
  function initTerrain() {
    if (!skills.length) return;
    const style = document.createElement("style");
    style.textContent = "@keyframes peakIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}";
    document.head.appendChild(style);

    const tabs = $$(".tab");
    const select = (tab, focus) => {
      tabs.forEach((t) => { const on = t === tab; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; });
      if (focus) tab.focus();
      showGroup(+tab.dataset.group);
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
    // draw first group when it scrolls into view so the morph is seen
    const fig = $(".profile");
    if ("IntersectionObserver" in window && !reduced) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); showGroup(0); } }, { threshold: 0.35 });
      io.observe(fig);
      $("#profile-name").textContent = skills[0].group;
    } else showGroup(0);
  }

  /* ---- Compass needle follows the pointer ------------------------------ */
  function initCompass() {
    const needle = $("#needle"), bearing = $("#bearing"), fig = $(".compass");
    if (!needle) return;
    let angle = 0, inView = false, raf = 0, ex = 0, ey = 0;
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(fig);
    const update = () => {
      raf = 0;
      const r = fig.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const target = (Math.atan2(ey - cy, ex - cx) * 180) / Math.PI + 90;
      let delta = ((target - angle) % 360 + 540) % 360 - 180;   // shortest turn
      angle += delta;
      needle.style.transform = `rotate(${angle}deg)`;
      bearing.textContent = pad(Math.round(((angle % 360) + 360) % 360), 3);
    };
    addEventListener("pointermove", (e) => {
      if (!inView) return;
      ex = e.clientX; ey = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
  }

  /* ---- Clock ----------------------------------------------------------- */
  function initClock() {
    const tz = LOC.timeZone;
    let fShort, fLong;
    try {
      fShort = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz, timeZoneName: "short" });
      fLong = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: tz, hour12: false });
    } catch (e) {
      fShort = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
      fLong = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    }
    const a = $("#clock"), b = $("#footer-clock");
    const tick = () => { const d = new Date(); if (a) a.textContent = fShort.format(d); if (b) b.textContent = fLong.format(d); };
    tick(); setInterval(tick, 1000);
  }

  /* ---- Toast + copy email ---------------------------------------------- */
  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2400);
  }
  function copyEmail() {
    const done = () => toast(`Copied ${P.email} ✦ talk soon`);
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(P.email).then(done, fallback);
    fallback();
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = P.email; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { toast(P.email); }
      ta.remove();
    }
  }

  /* ---- Command palette ------------------------------------------------- */
  function initPalette() {
    const dlg = $("#palette"), input = $("#palette-input"), ul = $("#palette-list");
    const go = (id) => () => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); };
    const cmds = [
      { g: "Navigate", ico: "↑", label: "Top of the map", run: go("top"), kw: "home hero start" },
      ...ORDER.filter((k) => S[k]).map((k) => ({ g: "Navigate", ico: S[k].index, label: `${S[k].title}`, hint: S[k].kicker, run: go(k), kw: k })),
      ...projects.map((p, i) => ({ g: "Expeditions", ico: `E${i + 1}`, label: p.title, hint: `${p.category} · ${p.year}`, run: () => openProject(i, $(`[data-project="${i}"]`)), kw: `project work ${p.category}` })),
      ...(S.notes && S.notes.archiveUrl ? [{ g: "Navigate", ico: "✎", label: "Open the logbook", hint: "All field notes", run: () => (location.href = S.notes.archiveUrl), kw: "blog posts writing archive notes" }] : []),
      { g: "Actions", ico: "◐", label: "Toggle light / dark", hint: "T", run: () => toggleTheme(), kw: "theme dark light mode night day" },
      { g: "Actions", ico: "@", label: "Copy email address", run: copyEmail, kw: "contact mail" },
      { g: "Actions", ico: "✉", label: "Write an email", run: () => (location.href = `mailto:${P.email}`), kw: "contact mail send" },
      ...(P.resume ? [{ g: "Actions", ico: "CV", label: "Open résumé", run: () => window.open(P.resume, "_blank", "noopener"), kw: "cv resume pdf" }] : []),
      ...list(D.socials).filter((s) => !/^mailto:/.test(s.url || "")).map((s) => ({ g: "Elsewhere", ico: "↗", label: s.label, hint: s.handle, run: () => window.open(s.url, "_blank", "noopener"), kw: "social link" })),
    ];
    let shown = [], sel = 0;
    const matches = (c, q) => {
      if (!q) return true;
      const hay = `${c.label} ${c.hint || ""} ${c.g} ${c.kw || ""}`.toLowerCase();
      return q.toLowerCase().split(/\s+/).every((t) => hay.includes(t));
    };
    const render = () => {
      const q = input.value.trim();
      shown = cmds.filter((c) => matches(c, q));
      sel = clamp(sel, 0, Math.max(0, shown.length - 1));
      if (!shown.length) { ul.innerHTML = `<li class="palette-empty">Nothing charted for “${esc(q)}”.</li>`; input.removeAttribute("aria-activedescendant"); return; }
      let g = "", html = "";
      shown.forEach((c, i) => {
        if (c.g !== g) { g = c.g; html += `<li class="palette-group mono" role="presentation">${esc(g)}</li>`; }
        html += `<li class="palette-item" role="option" id="pc-${i}" data-i="${i}" aria-selected="${i === sel}">
          <span class="ico">${esc(c.ico)}</span><span>${esc(c.label)}</span>${c.hint ? `<span class="hint mono">${esc(c.hint)}</span>` : ""}</li>`;
      });
      ul.innerHTML = html;
      input.setAttribute("aria-activedescendant", `pc-${sel}`);
    };
    const move = (d) => {
      if (!shown.length) return;
      sel = (sel + d + shown.length) % shown.length;
      $$(".palette-item", ul).forEach((li) => li.setAttribute("aria-selected", String(+li.dataset.i === sel)));
      input.setAttribute("aria-activedescendant", `pc-${sel}`);
      const el = $(`#pc-${sel}`, ul); if (el) el.scrollIntoView({ block: "nearest" });
    };
    const run = (i) => { const c = shown[i]; if (!c) return; dlg.close(); setTimeout(c.run, 60); };
    const open = () => {
      if (dlg.open) return;
      if ($("#project-dialog").open) $("#project-dialog").close();
      input.value = ""; sel = 0; render();
      dlg.showModal(); input.focus();
    };

    input.addEventListener("input", () => { sel = 0; render(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); run(sel); }
    });
    ul.addEventListener("pointermove", (e) => {
      const li = e.target.closest(".palette-item");
      if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; move(0); }
    });
    ul.addEventListener("click", (e) => { const li = e.target.closest(".palette-item"); if (li) run(+li.dataset.i); });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

    $("#palette-btn").addEventListener("click", open);
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-open-palette]")) { e.preventDefault(); open(); }
      if (e.target.closest("[data-copy-email]")) copyEmail();
    });
    addEventListener("keydown", (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); dlg.open ? dlg.close() : open(); return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") { e.preventDefault(); open(); }
      else if ((e.key === "t" || e.key === "T") && !document.querySelector("dialog[open]")) toggleTheme();
    });
  }

  function hello() {
    const a = "font:italic 28px 'Instrument Serif',serif;color:#D9481F", b = "font:12px 'Geist Mono',monospace;color:#6F695E";
    console.log(`%c${P.name || "Hello"}%c\n\nYou found the survey notes. Press / or ⌘K to jump anywhere.\nBuilt by hand — ${location.host || "local sheet"}.`, a, b);
  }

  /* =====================================================================
     BOOT
     ===================================================================== */
  renderMeta();
  renderNav();
  renderHero();
  renderMarquee();
  renderAbout();
  renderWork();
  renderRoute();
  renderTerrain();
  renderNotes();
  renderContact();
  renderFooter();

  initTheme();
  initHero();
  initRotator();
  initHeader();
  initMobileMenu();
  initSheetIndex();
  initCursor();
  initMagnetic();
  initWork();
  initDialog();
  initRoute();
  initTerrain();
  initCompass();
  initClock();
  initPalette();
  preloader(initReveal);
  hello();
})();
