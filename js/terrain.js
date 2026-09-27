/* ==========================================================================
   TERRAIN — generative topographic contours.
   Seeded Perlin noise → height field → marching squares → canvas paths.
   Used by the animated hero and by the per-project "map tile" artwork.
   ========================================================================== */
(function () {
  "use strict";

  /* ---- Seeded randomness ------------------------------------------------ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /* ---- Improved Perlin noise (3D) --------------------------------------- */
  function Noise(seed) {
    var rand = mulberry32(seed || 1);
    var p = new Uint8Array(256), i;
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = p[i]; p[i] = p[j]; p[j] = t; }
    this.perm = new Uint8Array(512);
    for (i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(t, a, b) { return a + t * (b - a); }
  function grad(h, x, y, z) {
    h &= 15;
    var u = h < 8 ? x : y, v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  Noise.prototype.noise3 = function (x, y, z) {
    var P = this.perm;
    var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    x -= X; y -= Y; z -= Z; X &= 255; Y &= 255; Z &= 255;
    var u = fade(x), v = fade(y), w = fade(z);
    var A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z;
    var B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z;
    return lerp(w,
      lerp(v, lerp(u, grad(P[AA], x, y, z), grad(P[BA], x - 1, y, z)),
              lerp(u, grad(P[AB], x, y - 1, z), grad(P[BB], x - 1, y - 1, z))),
      lerp(v, lerp(u, grad(P[AA + 1], x, y, z - 1), grad(P[BA + 1], x - 1, y, z - 1)),
              lerp(u, grad(P[AB + 1], x, y - 1, z - 1), grad(P[BB + 1], x - 1, y - 1, z - 1))));
  };
  Noise.prototype.fbm = function (x, y, z) {
    return this.noise3(x, y, z) * 0.62 +
           this.noise3(x * 2.03 + 11.3, y * 2.03 - 4.1, z * 1.3) * 0.27 +
           this.noise3(x * 4.11 - 7.7, y * 4.11 + 2.9, z * 1.7) * 0.11;
  };

  /* ---- Marching squares -------------------------------------------------
     Corner bits: tl=8 tr=4 br=2 bl=1. Edges: 0 top, 1 right, 2 bottom, 3 left.
     Each case lists pairs of edges to join with a segment.                  */
  var CASES = [[], [3, 2], [2, 1], [3, 1], [0, 1], [3, 0, 2, 1], [0, 2], [3, 0],
               [3, 0], [0, 2], [0, 1, 3, 2], [0, 1], [3, 1], [2, 1], [3, 2], []];

  /**
   * Trace iso-lines of `field` (size (cols+1)*(rows+1)) into Path2D objects.
   * paths.minor / paths.major / paths.hi (optional highlighted level `hiK`).
   */
  function trace(field, cols, rows, cell, base, step, majorEvery, paths, hiK) {
    var W = cols + 1, px = 0, py = 0;
    var tl, tr, br, bl, x0, y0, l;
    function edge(e) {
      var t;
      if (e === 0) { t = (l - tl) / (tr - tl); px = x0 + t * cell; py = y0; }
      else if (e === 1) { t = (l - tr) / (br - tr); px = x0 + cell; py = y0 + t * cell; }
      else if (e === 2) { t = (l - bl) / (br - bl); px = x0 + t * cell; py = y0 + cell; }
      else { t = (l - tl) / (bl - tl); px = x0; py = y0 + t * cell; }
    }
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var o = j * W + i;
        tl = field[o]; tr = field[o + 1]; br = field[o + W + 1]; bl = field[o + W];
        var mn = Math.min(tl, tr, br, bl), mx = Math.max(tl, tr, br, bl);
        var k0 = Math.ceil((mn - base) / step), k1 = Math.floor((mx - base) / step);
        if (k1 < k0) continue;
        x0 = i * cell; y0 = j * cell;
        for (var k = k0; k <= k1; k++) {
          l = base + k * step;
          var idx = (tl >= l ? 8 : 0) | (tr >= l ? 4 : 0) | (br >= l ? 2 : 0) | (bl >= l ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          var path = (k === hiK && paths.hi) ? paths.hi
                   : ((((k % majorEvery) + majorEvery) % majorEvery) === 0 ? paths.major : paths.minor);
          var segs = CASES[idx];
          for (var s = 0; s < segs.length; s += 2) {
            edge(segs[s]); path.moveTo(px, py);
            edge(segs[s + 1]); path.lineTo(px, py);
          }
        }
      }
    }
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /* ======================================================================
     HERO — full-bleed animated contour map that reacts to the pointer.
     ====================================================================== */
  function Hero(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.noise = new Noise(opts.seed || 20260927);
    this.reduced = !!opts.reduced;
    this.t = opts.startTime || 3.7;
    this.base = 0; this.step = 0.052; this.majorEvery = 5;
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0, s: 0, ts: 0, inside: false };
    this.visible = true;
    this.hiK = null;
    this._last = 0;
    this._raf = 0;
    this._loop = this._loop.bind(this);
    this.readColors();
    this.resize();
  }

  Hero.prototype.readColors = function () {
    this.colors = {
      minor: cssVar("--contour") || "rgba(0,0,0,.2)",
      major: cssVar("--contour-strong") || "rgba(0,0,0,.4)",
      hi: cssVar("--accent") || "#e0512b"
    };
  };

  Hero.prototype.resize = function () {
    var c = this.canvas;
    var w = c.clientWidth || window.innerWidth, h = c.clientHeight || window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = w; this.h = h; this.dpr = dpr;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    this.cell = w < 700 ? 13 : 10;
    this.cols = Math.ceil(w / this.cell) + 1;
    this.rows = Math.ceil(h / this.cell) + 1;
    this.scale = (w < 700 ? 2.6 : 2.1) / Math.max(700, Math.min(w, 1600));
    this.field = new Float32Array((this.cols + 1) * (this.rows + 1));
    this.draw();
  };

  /** Height at pixel (x, y) — also used for the live "elevation" readout. */
  Hero.prototype.height = function (x, y) {
    var s = this.scale, w = this.w, h = this.h;
    var v = this.noise.fbm(x * s, y * s, this.t);
    // A broad massif on the right keeps the left calm for the headline.
    var dx = x - w * 0.74, dy = y - h * 0.46, R = Math.min(w, h) * 0.5;
    v += 0.42 * Math.exp(-(dx * dx + dy * dy) / (2 * R * R));
    var m = this.mouse;
    if (m.s > 0.001) {
      var mx = x - m.x, my = y - m.y, r = 150;
      v += m.s * 0.34 * Math.exp(-(mx * mx + my * my) / (2 * r * r));
    }
    return v;
  };

  Hero.prototype.draw = function () {
    var ctx = this.ctx, cols = this.cols, rows = this.rows, cell = this.cell, f = this.field;
    for (var j = 0; j <= rows; j++)
      for (var i = 0; i <= cols; i++)
        f[j * (cols + 1) + i] = this.height(i * cell, j * cell);

    var m = this.mouse;
    this.hiK = m.inside && !this.reduced
      ? Math.round((this.height(m.x, m.y) - this.base) / this.step) : null;

    var paths = { minor: new Path2D(), major: new Path2D(), hi: this.hiK !== null ? new Path2D() : null };
    trace(f, cols, rows, cell, this.base, this.step, this.majorEvery, paths, this.hiK);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.lineJoin = ctx.lineCap = "round";
    ctx.strokeStyle = this.colors.minor; ctx.lineWidth = 0.8; ctx.stroke(paths.minor);
    ctx.strokeStyle = this.colors.major; ctx.lineWidth = 1.35; ctx.stroke(paths.major);
    if (paths.hi) { ctx.strokeStyle = this.colors.hi; ctx.lineWidth = 1.8; ctx.stroke(paths.hi); }
  };

  Hero.prototype.pointer = function (x, y, inside) {
    var m = this.mouse;
    if (!m.inside && inside) { m.x = x; m.y = y; }
    m.tx = x; m.ty = y; m.inside = inside; m.ts = inside ? 1 : 0;
    if (this.reduced) { m.x = x; m.y = y; }
  };

  Hero.prototype.start = function () {
    if (this.reduced || this._raf) return;
    this._last = performance.now();
    this._raf = requestAnimationFrame(this._loop);
  };
  Hero.prototype.stop = function () {
    cancelAnimationFrame(this._raf); this._raf = 0;
  };
  Hero.prototype._loop = function (now) {
    this._raf = requestAnimationFrame(this._loop);
    var dt = now - this._last;
    if (dt < 28 || !this.visible) return;          // ~35fps is plenty for drifting terrain
    this._last = now;
    dt = Math.min(dt, 64);
    var m = this.mouse;
    m.x += (m.tx - m.x) * 0.14; m.y += (m.ty - m.y) * 0.14; m.s += (m.ts - m.s) * 0.05;
    this.t += dt * 0.000045;
    this.draw();
  };

  /* ======================================================================
     TILE — deterministic map artwork for a project (seed = project id).
     ====================================================================== */
  function drawTile(canvas, o) {
    var w = o.width || canvas.clientWidth || 320, h = o.height || canvas.clientHeight || 200;
    if (w < 2 || h < 2) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var seed = hashString(String(o.seed || "tile"));
    var rand = mulberry32(seed), noise = new Noise(seed);
    var hue = o.hue == null ? 20 : o.hue, dark = !!o.dark;

    // paper
    ctx.fillStyle = dark ? "hsl(" + hue + " 22% 12%)" : "hsl(" + hue + " 34% 87%)";
    ctx.fillRect(0, 0, w, h);
    var g = ctx.createRadialGradient(w * 0.7, h * 0.3, 0, w * 0.7, h * 0.3, Math.max(w, h));
    g.addColorStop(0, dark ? "hsla(" + hue + ",40%,30%,.45)" : "hsla(" + hue + ",60%,96%,.7)");
    g.addColorStop(1, "hsla(" + hue + ",30%,50%,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // graticule
    ctx.strokeStyle = dark ? "hsla(" + hue + ",30%,80%,.08)" : "hsla(" + hue + ",40%,20%,.08)";
    ctx.lineWidth = 1;
    for (var gx = 1; gx < 4; gx++) { ctx.beginPath(); ctx.moveTo(w * gx / 4 + 0.5, 0); ctx.lineTo(w * gx / 4 + 0.5, h); ctx.stroke(); }
    for (var gy = 1; gy < 3; gy++) { ctx.beginPath(); ctx.moveTo(0, h * gy / 3 + 0.5); ctx.lineTo(w, h * gy / 3 + 0.5); ctx.stroke(); }

    // height field with a few seeded peaks
    var peaks = [];
    for (var p = 0; p < 3; p++) peaks.push({ x: (0.15 + rand() * 0.7) * w, y: (0.15 + rand() * 0.7) * h, r: (0.12 + rand() * 0.18) * Math.max(w, h), a: 0.25 + rand() * 0.4 });
    var cell = Math.max(5, Math.round(w / 64));
    var cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1;
    var f = new Float32Array((cols + 1) * (rows + 1)), s = 2.6 / w, z = rand() * 10;
    for (var j = 0; j <= rows; j++) for (var i = 0; i <= cols; i++) {
      var x = i * cell, y = j * cell, v = noise.fbm(x * s, y * s, z);
      for (var q = 0; q < peaks.length; q++) {
        var dx = x - peaks[q].x, dy = y - peaks[q].y;
        v += peaks[q].a * Math.exp(-(dx * dx + dy * dy) / (2 * peaks[q].r * peaks[q].r));
      }
      f[j * (cols + 1) + i] = v;
    }
    var paths = { minor: new Path2D(), major: new Path2D() };
    trace(f, cols, rows, cell, 0, 0.06, 5, paths, null);
    ctx.lineJoin = ctx.lineCap = "round";
    ctx.strokeStyle = dark ? "hsla(" + hue + ",35%,75%,.22)" : "hsla(" + hue + ",45%,22%,.22)";
    ctx.lineWidth = 0.8; ctx.stroke(paths.minor);
    ctx.strokeStyle = dark ? "hsla(" + hue + ",40%,80%,.5)" : "hsla(" + hue + ",50%,20%,.5)";
    ctx.lineWidth = 1.3; ctx.stroke(paths.major);

    // expedition route: seeded wander from lower-left to upper-right
    var pts = [], n = 7;
    for (var k = 0; k <= n; k++) {
      var tt = k / n;
      pts.push([w * (0.12 + tt * 0.76) + (rand() - 0.5) * w * 0.08,
                h * (0.8 - tt * 0.6) + (rand() - 0.5) * h * 0.22]);
    }
    var acc = dark ? "hsl(" + hue + " 85% 64%)" : "hsl(" + hue + " 78% 42%)";
    ctx.strokeStyle = acc; ctx.lineWidth = 1.8; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (k = 1; k < pts.length - 1; k++) {
      var mx = (pts[k][0] + pts[k + 1][0]) / 2, my = (pts[k][1] + pts[k + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[k][0], pts[k][1], mx, my);
    }
    ctx.lineTo(pts[n][0], pts[n][1]); ctx.stroke(); ctx.setLineDash([]);

    // start ring + summit triangle
    ctx.fillStyle = dark ? "hsl(" + hue + " 22% 12%)" : "hsl(" + hue + " 34% 92%)";
    ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], 5, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2; ctx.stroke();
    var ex = pts[n][0], ey = pts[n][1];
    ctx.fillStyle = acc;
    ctx.beginPath(); ctx.moveTo(ex, ey - 8); ctx.lineTo(ex + 7, ey + 5); ctx.lineTo(ex - 7, ey + 5); ctx.closePath(); ctx.fill();
  }

  window.Terrain = { Noise: Noise, Hero: Hero, drawTile: drawTile, hash: hashString, rand: mulberry32 };
})();
