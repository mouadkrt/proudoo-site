/*
  Proudoo — "Where does the direction come from?" section on the home pages.

  Four stages of motivation (self-determination theory: external, introjected,
  identified, integrated), drawn in the same language as the drift
  simulation: thin muted lines, and a single element in the brand colour,
  the one the light comes from. Stage 1 the coins, 2 the parent, 3 the
  understanding, 4 the child himself. Proudoo walks along stages 1 to 3 and
  steps aside at 4.

  - The SVG and every text are in the HTML; this script only switches stages.
  - Starts once when scrolled into view, plays the four stages, stops on 4.
  - At rest, without JS, and with reduced motion: stage 4 is shown.
*/
(function () {
  "use strict";

  var root = document.getElementById("continuum");
  if (!root) return;

  var stage = root.querySelector(".cont-stage");
  var steps = Array.prototype.slice.call(root.querySelectorAll(".cont-step"));
  var quotes = Array.prototype.slice.call(root.querySelectorAll(".cont-quote"));
  var caption = root.querySelector(".cont-caption");
  var replay = root.querySelector(".cont-replay");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var DELAY = 3400, timer = null, i = 3, started = false;

  function go(n) {
    i = n;
    stage.setAttribute("data-stage", String(n + 1));
    root.setAttribute("data-stage", String(n + 1));
    caption.textContent = quotes[n].textContent;
    steps.forEach(function (b, k) {
      b.setAttribute("aria-current", k === n ? "step" : "false");
    });
  }
  function stop() { if (timer) { clearTimeout(timer); timer = null; } }
  function playFrom(n) {
    stop(); go(n);
    if (reduce || n >= 3) return;
    timer = setTimeout(function () { playFrom(n + 1); }, DELAY);
  }

  steps.forEach(function (b, k) {
    b.addEventListener("click", function () { stop(); started = true; go(k); });
  });
  replay.addEventListener("click", function () { started = true; playFrom(reduce ? 3 : 0); });

  go(3);

  if ("IntersectionObserver" in window && !reduce) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !started) { started = true; playFrom(0); }
        else if (!e.isIntersecting && timer) { stop(); go(3); started = false; }
      });
    }, { threshold: 0.5 }).observe(stage);
  }
})();
