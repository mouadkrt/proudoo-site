/*
  Proudoo — "Where does the direction come from?" section on the home pages.

  Four stages of motivation (self-determination theory: external, introjected,
  identified, integrated), drawn in the same language as the drift
  simulation (assets/drift.js): a dotted axis from "outside" to "inside",
  thin muted marks, and one element in the brand colour, the source of the
  motivation. It travels from the coins, to the parent's eyes, to meaning,
  and finally merges into the child, who lights up.

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
  var HOLD = 3.2, MOVE = 0.9;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

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
  var W = 0, H = 0, dpr = 1, X = [0, 0, 0, 0], AY = 0;
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    if (!W || !H) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var c = canvas.getBoundingClientRect();
    X = steps.map(function (b) { var r = b.getBoundingClientRect(); return r.left + r.width / 2 - c.left; });
    AY = Math.round(H * 0.66);
    draw();
  }

  /* ---------- state ---------- */
  var from = 3, to = 3, tp = 1;          // light moves from station `from` to `to`, progress tp
  function lightX() { return X[from] + (X[to] - X[from]) * ease(tp); }
  function glow() { return to === 3 ? ease(tp) : 0; }

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
    var lx = lightX(), g = glow(), stage = tp > 0.5 ? to : from;

    // axis
    ctx.save();
    ctx.setLineDash([2, 6]); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(" + C.muted + ",.5)";
    ctx.beginPath(); ctx.moveTo(8, AY); ctx.lineTo(W - 8, AY); ctx.stroke();
    ctx.restore();
    ctx.textAlign = "left"; plate(ENDS[0], 8, 12, "rgba(" + C.muted + ",1)");
    ctx.textAlign = "right"; plate(ENDS[1], W - 8, 12, "rgba(" + C.muted + ",1)");

    // coins around station 1: present at stage 1, fade after
    var coinA = stage === 0 ? 1 : Math.max(0, 1 - (from === 0 ? ease(tp) : 1));
    if (coinA > 0) {
      var offs = [[-22, -20], [16, -26], [26, -6], [-30, -4], [-6, -34]];
      ctx.fillStyle = "rgba(" + C.muted + "," + (0.6 * coinA) + ")";
      offs.forEach(function (o, k) {
        var bob = reduce ? 0 : Math.sin(clock * 1.6 + k) * 2;
        ctx.beginPath(); ctx.arc(X[0] + o[0], AY + o[1] + bob, 3, 0, Math.PI * 2); ctx.fill();
      });
    }

    // stations 1-3: small hollow marks
    ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(" + C.muted + ",.7)";
    for (var k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(X[k], AY, 4, 0, Math.PI * 2); ctx.stroke(); }

    // trail behind the light
    ctx.save();
    ctx.lineWidth = 2.5; ctx.lineCap = "round";
    var grad = ctx.createLinearGradient(X[0], 0, Math.max(lx, X[0] + 1), 0);
    grad.addColorStop(0, "rgba(" + C.hero + ",0)"); grad.addColorStop(1, "rgba(" + C.hero + ",.9)");
    ctx.strokeStyle = grad;
    ctx.beginPath(); ctx.moveTo(X[0], AY); ctx.lineTo(lx, AY); ctx.stroke();
    ctx.restore();

    // the push: dashed arc from the source to the child, shorter at each stage
    var dist = X[3] - lx;
    if (dist > 6) {
      var lift = Math.min(42, dist * 0.35);
      ctx.save();
      ctx.setLineDash([5, 6]); ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(" + C.hero + ",.7)";
      ctx.beginPath(); ctx.moveTo(lx, AY - 8);
      ctx.quadraticCurveTo((lx + X[3]) / 2, AY - 8 - lift, X[3] - 10, AY - 8); ctx.stroke();
      ctx.restore();
    }

    // the child: hollow until the light reaches them, then lit with rings
    if (g > 0) {
      [16, 26, 36].forEach(function (r, k) {
        ctx.strokeStyle = "rgba(" + C.hero + "," + (g * [0.6, 0.35, 0.18][k]) + ")";
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X[3], AY, r, 0, Math.PI * 2); ctx.stroke();
      });
    }
    ctx.lineWidth = 2; ctx.strokeStyle = g > 0 ? "rgb(" + C.hero + ")" : "rgba(" + C.muted + ",.9)";
    ctx.beginPath(); ctx.arc(X[3], AY, 9, 0, Math.PI * 2); ctx.stroke();

    // the source of motivation
    ctx.save();
    ctx.shadowColor = "rgba(" + C.hero + ",.8)"; ctx.shadowBlur = 16 + 10 * g;
    ctx.fillStyle = "rgb(" + C.hero + ")";
    ctx.beginPath(); ctx.arc(lx, AY, 6 + 3 * g, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* ---------- playback ---------- */
  var running = false, last = null, hold = 0, auto = false, visible = !("IntersectionObserver" in window);

  function setStage(n) {
    caption.textContent = quotes[n].textContent;
    root.setAttribute("data-stage", String(n + 1));
    steps.forEach(function (b, k) { b.setAttribute("aria-current", k === n ? "step" : "false"); });
  }
  function moveTo(n, instant) {
    from = to; to = n; tp = 0; hold = 0;
    setStage(n);
    if (instant || reduce) { from = to = n; tp = 1; draw(); return; }
    run();
  }
  function frame(now) {
    if (last === null) last = now;
    var dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
    if (tp < 1) tp = Math.min(1, tp + dt / MOVE);
    else if (auto && to < 3) { hold += dt; if (hold >= HOLD) moveTo(to + 1); }
    draw();
    var busy = tp < 1 || (auto && to < 3) || (to === 0);
    if (visible && busy) requestAnimationFrame(frame); else { running = false; }
  }
  function run() { if (!running && visible) { running = true; last = null; requestAnimationFrame(frame); } }

  function playFromStart() {
    if (reduce) { moveTo(3, true); return; }
    auto = true; from = 0; to = 0; tp = 1; hold = 0; setStage(0); run();
  }

  steps.forEach(function (b, k) { b.addEventListener("click", function () { auto = false; moveTo(k); }); });
  replay.addEventListener("click", function () { playFromStart(); });

  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var onScheme = function () { readColors(); draw(); };
  if (mq.addEventListener) mq.addEventListener("change", onScheme); else if (mq.addListener) mq.addListener(onScheme);

  readColors();
  setStage(3);
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
