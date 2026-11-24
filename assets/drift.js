/*
  Proudoo — "Direction" section on the home pages (/ and /fr/).

  A real simulation, drawn live on a canvas: one child (brand colour) has a
  slightly higher share of good days than 100 others (50 %). Over a week the
  difference is invisible; over a year the small drift wins over chance.

  - No dependency, no build step. Colours come from the CSS tokens in site.css,
    so the canvas follows light and dark mode.
  - Starts once when the section scrolls into view; stops drawing when it
    leaves the screen.
  - prefers-reduced-motion: shows the final year directly, no animation.
  - Draws are "typical" ones (final score close to the expected value), never
    the luckiest; see pickSeed().
*/
(function () {
  "use strict";

  var root = document.getElementById("drift");
  if (!root) return;

  var STRINGS = {
    en: {
      week: "Over one week, you can't tell whether it's working.",
      crowd: "Here are 100 children left to chance: every day is a coin toss, forward or back.",
      year: function (p) { return "Yours takes just a few more steps forward: " + p + " out of 100."; },
      end: "Steps back don't count. Direction does.",
      flat: "At 50 %, every day is a coin toss. Forward or back, it's pure chance.",
      unit: "steps",
      start: "start",
      direction: "direction",
      day: "day",
      aria: function (p, end) {
        return "Simulation over 365 days. A child taking " + p + " % steps forward ends at " + fmt(end) +
          " steps while 100 children left to chance stay around zero.";
      }
    },
    fr: {
      week: "Sur une semaine, impossible de dire si ça marche.",
      crowd: "Voici cent enfants livrés au hasard : chaque jour est un pile ou face, avancer ou reculer.",
      year: function (p) { return "Le vôtre fait juste un peu plus de pas en avant : " + p + " sur 100."; },
      end: "Les pas en arrière ne comptent pas. La direction, si.",
      flat: "À 50 %, chaque jour est un pile ou face. Avancer ou reculer, c'est le hasard.",
      unit: "pas",
      start: "départ",
      direction: "direction",
      day: "jour",
      aria: function (p, end) {
        return "Simulation sur 365 jours. Un enfant qui fait " + p + " % de pas en avant finit à " + fmt(end) +
          " pas, tandis que cent enfants livrés au hasard restent autour de zéro.";
      }
    }
  };
  var lang = (document.documentElement.lang || "en").slice(0, 2);
  var T = STRINGS[lang] || STRINGS.en;

  var DAYS = 365, N_CROWD = 100;
  var canvas = root.querySelector(".drift-canvas");
  var ctx = canvas.getContext("2d");
  var caption = root.querySelector(".drift-caption");
  var slider = root.querySelector("#drift-p");
  var sliderOut = root.querySelector(".drift-p-out");
  var replay = root.querySelector(".drift-replay");
  var cta = root.querySelector(".drift-cta");
  // The invitation is visible at rest (no JS, reduced motion); it waits while the year plays.
  function setCta(on) { if (cta) cta.classList.toggle("is-waiting", !on); }
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fmt(v) { return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function prog(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }

  /* ---------- simulation ---------- */

  function rng(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // One child's daily luck is stored as uniforms, so moving the slider keeps
  // the same days and changes only the share of good ones.
  var luck = new Float32Array(DAYS), crowd = [], hero = new Int16Array(DAYS + 1), p = 0.55;

  function buildHero() {
    for (var d = 1; d <= DAYS; d++) hero[d] = hero[d - 1] + (luck[d - 1] < p ? 1 : -1);
  }
  function generate(seed) {
    var r = rng(seed), d, i;
    for (d = 0; d < DAYS; d++) luck[d] = r();
    crowd = [];
    for (i = 0; i < N_CROWD; i++) {
      var w = new Int16Array(DAYS + 1);
      for (d = 1; d <= DAYS; d++) w[d] = w[d - 1] + (r() < 0.5 ? 1 : -1);
      crowd.push(w);
    }
    buildHero();
  }
  // Typical draw at 55 %: expected end +36.5, one standard deviation about 19.
  // Keep draws within [-0.5 sd, +0.7 sd] of the mean: honest, not cherry-picked.
  function pickSeed() {
    var s = (Math.random() * 1e9) | 0;
    for (var k = 0; k < 200; k++, s++) {
      var r = rng(s), v = 0;
      for (var d = 0; d < DAYS; d++) v += r() < 0.55 ? 1 : -1;
      if (v >= 27 && v <= 50) return s;
    }
    return s;
  }

  /* ---------- colours from site.css ---------- */

  var C = {};
  function rgb(hex) {
    hex = hex.trim().replace("#", "");
    if (hex.length === 3) hex = hex.replace(/./g, "$&$&");
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(",");
  }
  function readColors() {
    var cs = getComputedStyle(root);
    C.hero = rgb(cs.getPropertyValue("--drift-hero") || "#6c47ff");
    C.ink = rgb(cs.getPropertyValue("--ink") || "#1b1530");
    C.muted = rgb(cs.getPropertyValue("--muted") || "#5d5873");
    C.card = rgb(cs.getPropertyValue("--card") || "#ffffff");
    C.dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  /* ---------- layout ---------- */

  var W = 0, H = 0, dpr = 1, PAD = {};
  function resize() {
    var w = canvas.clientWidth;
    if (!w) return;
    W = w; H = Math.round(w >= 560 ? clamp(w * 0.36, 210, 270) : w * 0.68);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.height = H + "px";
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    PAD = { l: 12, r: 12, t: 18, b: 26 };
    draw();
  }

  /* ---------- timeline ---------- */

  var END = 13.8, t = 0;
  function state(t) {
    var day;
    if (t < 0.6) day = 0;
    else if (t < 3.6) day = 14 * ease(prog(t, 0.6, 3.6));
    else if (t < 5.6) day = 14;
    else day = 14 + (DAYS - 14) * ease(prog(t, 5.6, 12.6));
    return {
      t: t, day: day, xMax: Math.max(14, day),
      crowdA: ease(prog(t, 3.6, 4.6)),
      driftA: ease(prog(t, 12.6, 13.6))
    };
  }
  function captionFor(t) {
    var pc = Math.round(p * 100);
    if (t < 3.6) return T.week;
    if (t < 5.6) return T.crowd;
    if (t < 12.6) return T.year(pc);
    return pc === 50 ? T.flat : T.end;
  }

  var yr = { min: -10, max: 10 };
  function targetRange(s) {
    var n = Math.floor(s.day), lo = 0, hi = 0, d, i;
    function scan(w) { for (d = 0; d <= n; d++) { if (w[d] < lo) lo = w[d]; if (w[d] > hi) hi = w[d]; } }
    scan(hero);
    if (s.crowdA > 0.01) for (i = 0; i < crowd.length; i++) scan(crowd[i]);
    if (s.driftA > 0.01) { hi = Math.max(hi, (2 * p - 1) * s.day); lo = Math.min(lo, (2 * p - 1) * s.day); }
    var span = Math.max(12, hi - lo), pad = span * 0.1;
    return { min: lo - pad, max: hi + pad };
  }

  function X(d, s) { return PAD.l + (W - PAD.l - PAD.r) * d / s.xMax; }
  function Y(v) { return H - PAD.b - (H - PAD.t - PAD.b) * (v - yr.min) / (yr.max - yr.min); }

  function trace(w, s) {
    var n = Math.floor(s.day), f = s.day - n;
    ctx.beginPath(); ctx.moveTo(X(0, s), Y(w[0]));
    for (var d = 1; d <= n; d++) ctx.lineTo(X(d, s), Y(w[d]));
    var hx = X(n, s), hy = Y(w[n]);
    if (f > 0 && n < DAYS) { hx = X(n + f, s); hy = Y(w[n] + (w[n + 1] - w[n]) * f); ctx.lineTo(hx, hy); }
    return { x: hx, y: hy, v: w[n] };
  }

  // Text on a small card-coloured plate, so it stays readable over the lines.
  function label(text, x, y, color, alpha) {
    var w = ctx.measureText(text).width, h = 15, a = ctx.textAlign, b = ctx.textBaseline;
    var x0 = a === "center" ? x - w / 2 : a === "right" ? x - w : x;
    var y0 = b === "top" ? y : b === "bottom" ? y - h : y - h / 2;
    ctx.fillStyle = "rgba(" + C.card + "," + (0.85 * alpha) + ")";
    ctx.fillRect(x0 - 4, y0 - 1, w + 8, h + 2);
    ctx.fillStyle = color; ctx.fillText(text, x, y);
  }

  var MONO = '12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  function draw() {
    if (!W) return;
    var s = state(t);
    ctx.clearRect(0, 0, W, H);

    // zero line
    ctx.save();
    ctx.setLineDash([2, 6]); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(" + C.muted + ",.5)";
    ctx.beginPath(); ctx.moveTo(PAD.l, Y(0)); ctx.lineTo(W - PAD.r, Y(0)); ctx.stroke();
    ctx.restore();

    // the crowd at 50 %
    if (s.crowdA > 0) {
      ctx.lineWidth = 1; ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(" + C.muted + "," + ((C.dark ? 0.16 : 0.11) * s.crowdA) + ")";
      var heads = [];
      for (var i = 0; i < crowd.length; i++) { heads.push(trace(crowd[i], s)); ctx.stroke(); }
      ctx.fillStyle = "rgba(" + C.muted + "," + (0.55 * s.crowdA) + ")";
      heads.forEach(function (h) { ctx.beginPath(); ctx.arc(h.x, h.y, 2, 0, Math.PI * 2); ctx.fill(); });
    }

    // expected direction
    var slope = 2 * p - 1;
    if (s.driftA > 0 && slope > 0) {
      ctx.save();
      ctx.setLineDash([7, 6]); ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(" + C.hero + "," + (0.6 * s.driftA) + ")";
      ctx.beginPath(); ctx.moveTo(X(0, s), Y(0)); ctx.lineTo(X(s.day, s), Y(slope * s.day)); ctx.stroke();
      ctx.restore();
      var mx = X(s.day * 0.45, s), my = Y(slope * s.day * 0.45);
      ctx.font = MONO; ctx.textAlign = "center"; ctx.textBaseline = "top";
      label(T.direction, mx, my + 8, "rgba(" + C.hero + "," + s.driftA + ")", s.driftA);
    }

    // the child
    ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.strokeStyle = "rgb(" + C.hero + ")";
    var h = trace(hero, s); ctx.stroke();
    ctx.save();
    ctx.shadowColor = "rgba(" + C.hero + ",.75)"; ctx.shadowBlur = 18;
    ctx.fillStyle = "rgb(" + C.hero + ")";
    ctx.beginPath(); ctx.arc(h.x, h.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (s.driftA > 0) {
      ctx.font = "600 " + MONO; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      var ly = clamp(h.y + (h.y < Y(slope * s.day) ? -16 : 16), PAD.t, H - PAD.b - 6);
      label(fmt(h.v) + " " + T.unit, h.x - 12, ly, "rgba(" + C.hero + "," + s.driftA + ")", s.driftA);
    }

    ctx.font = MONO; ctx.textAlign = "left"; ctx.textBaseline = "bottom";
    label(T.start, PAD.l, Y(0) - 8, "rgba(" + C.muted + ",1)", 1);

    // day counter
    ctx.font = MONO; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(" + C.muted + ",1)";
    ctx.fillText(T.day + " " + Math.floor(s.day) + " / " + DAYS, PAD.l, H - 10);

    // y-range eases toward its target so the zoom-out feels like a camera
    var tg = targetRange(s);
    yr.min += (tg.min - yr.min) * 0.12; yr.max += (tg.max - yr.max) * 0.12;
    return s;
  }

  /* ---------- playback ---------- */

  var running = false, visible = !("IntersectionObserver" in window), started = false, last = null, lastCaption = "";

  function setCaption(text) {
    if (text !== lastCaption) { caption.textContent = text; lastCaption = text; }
  }
  function setAria() {
    canvas.setAttribute("aria-label", T.aria(Math.round(p * 100), hero[DAYS]));
  }
  function loop(now) {
    if (!running) return;
    if (last === null) last = now;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    t = Math.min(END, t + dt);
    draw();
    setCaption(captionFor(t));
    if (t >= END) setCta(true);
    if (t >= END && Math.abs(yr.max - targetRange(state(t)).max) < 0.05) { running = false; return; }
    if (visible) requestAnimationFrame(loop); else running = false;
  }
  function play() {
    if (running || !visible) return;
    running = true; last = null; requestAnimationFrame(loop);
  }
  function jumpToEnd() {
    t = END; yr = targetRange(state(t)); draw(); setCaption(captionFor(t)); setCta(true);
  }
  function start(fromZero) {
    if (fromZero) { t = 0; yr = targetRange(state(0)); setCta(false); }
    if (reduce) { jumpToEnd(); return; }
    play();
  }

  slider.addEventListener("input", function () {
    p = Number(slider.value) / 100;
    sliderOut.textContent = slider.value + " %";
    buildHero(); setAria();
    running = false; started = true;
    t = END; draw(); setCaption(captionFor(t)); setCta(true);
    // let the y-range settle smoothly
    if (!reduce) { running = true; last = null; requestAnimationFrame(loop); } else jumpToEnd();
  });
  replay.addEventListener("click", function () {
    generate(pickSeed()); setAria(); started = true; running = false; start(true);
  });

  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var onScheme = function () { readColors(); draw(); };
  if (mq.addEventListener) mq.addEventListener("change", onScheme); else if (mq.addListener) mq.addListener(onScheme);

  readColors();
  generate(pickSeed());
  p = Number(slider.value) / 100; buildHero(); setAria();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener("resize", resize);
  resize();

  // Complete at rest: until the section is seen, show the final year.
  jumpToEnd();

  if ("IntersectionObserver" in window && !reduce) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        visible = e.isIntersecting;
        if (visible && !started) { started = true; start(true); }
        else if (visible && t < END) play();
      });
    }, { threshold: 0.45 }).observe(canvas);
  }
})();
