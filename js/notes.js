/* ==========================================================================
   FIELD NOTES — small behaviours for blog pages (posts, archive, 404).
   Theme toggle, reading-progress trail, TOC highlight, code copy,
   archive filters, generated map banner, KaTeX rendering.
   ========================================================================== */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDark = () => root.getAttribute("data-theme") === "dark";

  /* ---- Map banner (same generator as the portfolio's project tiles) ---- */
  const tiles = $$("canvas[data-tile]");
  const paintTiles = () => tiles.forEach((c) => {
    if (!window.Terrain) return;
    const r = c.getBoundingClientRect();
    if (r.width < 2) return;
    Terrain.drawTile(c, { width: r.width, height: r.height, seed: c.dataset.seed, hue: +c.dataset.hue, dark: isDark() });
  });

  /* ---- Theme ----------------------------------------------------------- */
  const themeBtn = $("#theme-btn");
  const applyTheme = (t) => {
    root.setAttribute("data-theme", t);
    if (themeBtn) themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    paintTiles();
  };
  const toggleTheme = (origin) => {
    const next = isDark() ? "light" : "dark";
    try { localStorage.setItem("atlas-theme", next); } catch (e) { /* storage blocked */ }
    if (!document.startViewTransition || reduced) return applyTheme(next);
    const x = origin ? origin.x : innerWidth - 40, y = origin ? origin.y : 34;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => applyTheme(next)).ready.then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 700, easing: "cubic-bezier(.65,0,.35,1)", pseudoElement: "::view-transition-new(root)" });
    }).catch(() => {});
  };
  if (themeBtn) {
    applyTheme(root.getAttribute("data-theme") || "light");
    themeBtn.addEventListener("click", (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
  }
  addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key === "t" || e.key === "T")) toggleTheme();
  });

  /* ---- Header + reading trail ---------------------------------------- */
  const header = $("#site-header"), trail = $("#trail"), article = $(".prose");
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    if (header) header.classList.toggle("scrolled", scrollY > 16);
    if (trail && article) {
      const r = article.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / (r.height || 1)));
      trail.style.setProperty("--read", p.toFixed(4));
    }
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---- TOC: highlight the section you're in -------------------------- */
  const tocLinks = $$(".toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    const byId = new Map(tocLinks.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const heads = $$(".prose h2[id], .prose h3[id]").filter((h) => byId.has(h.id));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        tocLinks.forEach((a) => a.classList.remove("active"));
        byId.get(e.target.id).classList.add("active");
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    heads.forEach((h) => io.observe(h));
  }

  /* ---- Code copy ------------------------------------------------------ */
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".code-copy");
    if (!btn) return;
    const code = btn.closest("figure").querySelector("code").textContent;
    try {
      await navigator.clipboard.writeText(code);
      btn.textContent = "Copied"; btn.classList.add("done");
    } catch (err) {
      btn.textContent = "Select ⌘C";
    }
    setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1600);
  });

  /* ---- Archive filters (kind × language) ----------------------------- */
  const entries = $$(".entry");
  if (entries.length) {
    const state = { kind: "*", lang: "*" };
    const apply = () => {
      let shown = 0;
      entries.forEach((li) => {
        const ok = (state.kind === "*" || li.dataset.kind === state.kind) && (state.lang === "*" || li.dataset.lang === state.lang);
        li.hidden = !ok; if (ok) shown++;
      });
      $$(".year").forEach((y) => { y.hidden = !$$(".entry", y).some((li) => !li.hidden); });
      const empty = $("#filter-empty"); if (empty) empty.hidden = shown > 0;
    };
    $$("[data-kind].filter, [data-lang].filter").forEach((b) => b.addEventListener("click", () => {
      const group = "kind" in b.dataset ? "kind" : "lang";
      state[group] = b.dataset[group];
      $$(`.filter[data-${group}]`).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      apply();
    }));
  }

  /* ---- Math ----------------------------------------------------------- */
  const renderMath = () => {
    if (!window.renderMathInElement || !article) return;
    renderMathInElement(article, {
      delimiters: [{ left: "\\[", right: "\\]", display: true }, { left: "\\(", right: "\\)", display: false }],
      throwOnError: false,
    });
  };

  // Deferred scripts run in order, so terrain.js and KaTeX are ready by now.
  renderMath();
  paintTiles();
  let w = innerWidth;
  addEventListener("resize", () => { if (innerWidth !== w) { w = innerWidth; paintTiles(); } });
})();
