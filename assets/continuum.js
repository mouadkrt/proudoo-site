/*
  Proudoo — "Where does the direction come from?" section on the home pages.

  Four stages of motivation (self-determination theory: external, introjected,
  identified, integrated), drawn in the same language as the drift
  simulation (assets/drift.js): a dotted axis from "outside" to "inside" and
  one soft purple light, the source of the motivation. It moves from the
  coins, to the parent, to an idea, and finally reaches the child, who
  lights up. The four stations are emoji, so they look friendly on every
  phone without any image file.

  - The canvas is decorative (aria-hidden); every text is in the HTML.
  - Stations line up with the four step buttons under the canvas.
  - Starts once when scrolled into view, plays the four stages, stops on 4.
  - At rest, without JS, and with reduced motion: stage 4 is shown.
*/
(function () {
  "use strict";

  var root = document.getElementById("continuum");
  if (!root) return;

  var canvas = root.querySelector(".cont-canvas");
  var ctx = canvas.getContext("2d");
  var steps = Array.prototype.slice.call(root.querySelectorAll(".cont-step"));
  var quotes = Array.prototype.slice.call(root.querySelectorAll(".cont-quote"));
  var caption = root.querySelector(".cont-caption");
  var replay = root.querySelector(".cont-replay");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lang = (document.documentElement.lang || "en").slice(0, 2);
  var ENDS = lang === "fr" ? ["extérieur", "intérieur"] : ["outside", "inside"];

  var MONO = '12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  var EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  var HOLD = 3.2, MOVE = 0.9;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  // Coin (U+1FA99) is recent; older phones fall back to a star.
  function hasColorEmoji(ch) {
    try {
      var c = document.createElement("canvas"); c.width = c.height = 24;
      var x = c.getContext("2d"); x.font = "20px " + EMOJI_FONT; x.textBaseline = "top";
      x.fillText(ch, 0, 0);
      var d = x.getImageData(0, 0, 24, 24).data;
      for (var i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 0 && (Math.abs(d[i] - d[i + 1]) > 30 || Math.abs(d[i + 1] - d[i + 2]) > 30)) return true;
      }
    } catch (e) {}
    return false;
  }
  var ICONS = [hasColorEmoji("🪙") ? "🪙" : "⭐", "🧑", "💡", "🧒"];

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
    C.muted = rgb(cs.getPropertyValue("--muted") || "#5d5873");
    C.card = rgb(cs.getPropertyValue("--card") || "#ffffff");
  }

  /* ---------- layout: stations follow the step buttons ---------- */
  var W = 0, H = 0, dpr = 1, X = [0, 0, 0, 0], AY = 0, SZ = 30;
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    if (!W || !H) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var c = canvas.getBoundingClientRect();
    X = steps.map(function (b) { var r = b.getBoundingClientRect(); return r.left + r.width / 2 - c.left; });
    AY = Math.round(H * 0.58);
    SZ = W < 480 ? 26 : 32;
    draw();
  }

  /* ---------- state ---------- */
  var from = 3, to = 3, tp = 1;
  function lightX() { return X[from] + (X[to] - X[from]) * ease(tp); }
  function glow() { return to === 3 ? ease(tp) : 0; }
  function nearness(k) { return clamp(1 - Math.abs(lightX() - X[k]) / Math.max(1, (X[1] - X[0])), 0, 1); }

  function plate(text, x, y, color) {
    ctx.font = MONO; var w = ctx.measureText(text).width;
    var x0 = ctx.textAlign === "right" ? x - w : ctx.textAlign === "center" ? x - w / 2 : x;
    ctx.fillStyle = "rgba(" + C.card + ",.85)"; ctx.fillRect(x0 - 4, y - 8, w + 8, 16);
    ctx.fillStyle = color; ctx.textBaseline = "middle"; ctx.fillText(text, x, y);
  }

  var clock = 0;
  function draw() {
    if (!W) return;
    ctx.clearRect(0, 0, W, H);
    var lx = lightX(), g = glow();

    // axis
    ctx.save();
    ctx.setLineDash([2, 6]); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(" + C.muted + ",.5)";
    ctx.beginPath(); ctx.moveTo(8, AY); ctx.lineTo(W - 8, AY); ctx.stroke();
    ctx.restore();
    ctx.textAlign = "left"; plate(ENDS[0], 8, 10, "rgba(" + C.muted + ",1)");
    ctx.textAlign = "right"; plate(ENDS[1], W - 8, 10, "rgba(" + C.muted + ",1)");

    // trail along the axis, up to the light
    ctx.save();
    ctx.lineWidth = 3; ctx.lineCap = "round";
    var grad = ctx.createLinearGradient(X[0], 0, Math.max(lx, X[0] + 1), 0);
    grad.addColorStop(0, "rgba(" + C.hero + ",0)"); grad.addColorStop(1, "rgba(" + C.hero + ",.85)");
    ctx.strokeStyle = grad;
    ctx.beginPath(); ctx.moveTo(X[0], AY); ctx.lineTo(lx, AY); ctx.stroke();
    ctx.restore();

    // the push: dashed arc from the source to the child, shorter at each stage
    var dist = X[3] - lx;
    if (dist > 8) {
      var lift = Math.min(34, dist * 0.3), y0 = AY - SZ * 0.62;
      ctx.save();
      ctx.setLineDash([5, 6]); ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(" + C.hero + ",.7)";
      ctx.beginPath(); ctx.moveTo(lx + SZ * 0.3, y0);
      ctx.quadraticCurveTo((lx + X[3]) / 2, y0 - lift, X[3] - SZ * 0.35, y0); ctx.stroke();
      ctx.restore();
    }

    // the light: a soft purple halo that travels from station to station
    var r = SZ * (0.9 + 0.25 * g) + (reduce ? 0 : Math.sin(clock * 2.2) * 1.5);
    var halo = ctx.createRadialGradient(lx, AY, 0, lx, AY, r);
    halo.addColorStop(0, "rgba(" + C.hero + ",.38)");
    halo.addColorStop(0.65, "rgba(" + C.hero + ",.14)");
    halo.addColorStop(1, "rgba(" + C.hero + ",0)");
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(lx, AY, r, 0, Math.PI * 2); ctx.fill();

    // rings when the light reaches the child
    if (g > 0) {
      [SZ * 0.85, SZ * 1.15, SZ * 1.45].forEach(function (rr, k) {
        ctx.strokeStyle = "rgba(" + C.hero + "," + (g * [0.55, 0.3, 0.15][k]) + ")";
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X[3], AY, rr, 0, Math.PI * 2); ctx.stroke();
      });
    }

    // the four stations; the one the light is on is fully visible
    ctx.font = SZ + "px " + EMOJI_FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (var k = 0; k < 4; k++) {
      var n = nearness(k);
      var a = k === 3 ? 0.45 + 0.55 * Math.max(n, g) : 0.28 + 0.72 * n;
      var bob = (!reduce && n > 0.9) ? Math.sin(clock * 3 + k) * 1.5 : 0;
      var sc = 0.9 + 0.15 * (k === 3 ? Math.max(n, g) : n);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(X[k], AY + 2 + bob); ctx.scale(sc, sc);
      ctx.fillText(ICONS[k], 0, 0);
      ctx.restore();
    }
  }

  /* ---------- playback ---------- */
  var nav = root.querySelector(".anim-nav");
  var dots = nav ? Array.prototype.slice.call(nav.querySelectorAll(".anim-dot")) : [];
  var btnPrev = nav && nav.querySelector(".anim-prev"), btnNext = nav && nav.querySelector(".anim-next");
  var btnPause = nav && nav.querySelector(".anim-pause");
  var running = false, last = null, hold = 0, auto = false, visible = !("IntersectionObserver" in window);

  function sync() {
    var done = to === 3 && tp >= 1 && !auto;
    root.classList.toggle("is-done", done);
    dots.forEach(function (d, k) { d.setAttribute("aria-current", k === to ? "step" : "false"); });
    if (btnPause) {
      var playing = auto && to < 3;
      btnPause.setAttribute("aria-pressed", playing ? "false" : "true");
      btnPause.classList.toggle("is-paused", !playing);
    }
  }
  function setStage(n) {
    caption.textContent = quotes[n].textContent;
    root.setAttribute("data-stage", String(n + 1));
    steps.forEach(function (b, k) { b.setAttribute("aria-current", k === n ? "step" : "false"); });
  }
  function moveTo(n) {
    n = clamp(n, 0, 3);
    from = to; to = n; tp = 0; hold = 0;
    setStage(n);
    if (reduce) { from = to = n; tp = 1; draw(); sync(); return; }
    sync(); run();
  }
  function frame(now) {
    if (last === null) last = now;
    var dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
    if (tp < 1) tp = Math.min(1, tp + dt / MOVE);
    else if (auto && to < 3) { hold += dt; if (hold >= HOLD) moveTo(to + 1); }
    else if (auto && to === 3) auto = false;
    sync(); draw();
    // keep a gentle idle motion while visible
    if (visible) requestAnimationFrame(frame); else running = false;
  }
  function run() { if (!running && visible) { running = true; last = null; requestAnimationFrame(frame); } }

  function playFromStart() {
    if (reduce) { auto = false; from = to = 3; tp = 1; setStage(3); draw(); sync(); return; }
    auto = true; from = 0; to = 0; tp = 1; hold = 0; setStage(0); sync(); run();
  }
  function manual(n) { auto = false; moveTo(n); }

  steps.forEach(function (b, k) { b.addEventListener("click", function () { manual(k); }); });
  dots.forEach(function (d, k) { d.addEventListener("click", function () { manual(k); }); });
  if (btnPrev) btnPrev.addEventListener("click", function () { manual(to - 1); });
  if (btnNext) btnNext.addEventListener("click", function () { manual(to + 1); });
  if (btnPause) btnPause.addEventListener("click", function () {
    if (to === 3 && tp >= 1) { playFromStart(); return; }
    auto = !auto; hold = 0; sync(); run();
  });
  replay.addEventListener("click", function () { playFromStart(); });

  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var onScheme = function () { readColors(); draw(); };
  if (mq.addEventListener) mq.addEventListener("change", onScheme); else if (mq.addListener) mq.addListener(onScheme);
  document.addEventListener("proudoo:theme", onScheme);

  readColors();
  setStage(3); sync();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener("resize", resize);
  resize();

  if ("IntersectionObserver" in window && !reduce) {
    var started = false;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        visible = e.isIntersecting;
        if (visible && !started) { started = true; playFromStart(); }
        else if (visible) run();
      });
    }, { threshold: 0.5 }).observe(canvas);
  }
})();
