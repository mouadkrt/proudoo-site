/*
  Floating theme + language switch, on every page.

  - The language part is plain links in the HTML (each page links to its
    other-language twin), so it works without JS.
  - The theme button needs JS, so it starts hidden. The visitor's choice is
    stored in localStorage ("theme": "light" | "dark") and applied before
    paint by the inline script in each page's <head>. With no stored choice
    the site follows the system setting.
  - Pages that draw with canvas listen for the "proudoo:theme" event to
    re-read their colours.
*/
(function () {
  "use strict";

  /* Back to top: shows after scrolling past one screen. */
  var up = document.querySelector(".to-top");
  if (up) {
    up.hidden = false;
    var onScroll = function () { up.classList.toggle("is-on", window.scrollY > window.innerHeight * 0.8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    up.addEventListener("click", function (e) {
      e.preventDefault();
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      var first = document.querySelector(".top a.brand");
      if (first) first.focus({ preventScroll: true });
    });
  }

  var btn = document.querySelector(".theme-toggle");
  if (!btn) return;

  var html = document.documentElement;
  var fr = (html.lang || "en").slice(0, 2) === "fr";
  var LABEL = fr
    ? { toDark: "Passer en mode sombre", toLight: "Passer en mode clair" }
    : { toDark: "Switch to dark mode", toLight: "Switch to light mode" };
  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  function isDark() {
    var t = html.getAttribute("data-theme");
    return t ? t === "dark" : mq.matches;
  }
  function render() {
    var dark = isDark();
    btn.classList.toggle("is-dark", dark);
    var label = dark ? LABEL.toLight : LABEL.toDark;
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
  }
  function announce() {
    var ev;
    try { ev = new CustomEvent("proudoo:theme"); }
    catch (e) { ev = document.createEvent("Event"); ev.initEvent("proudoo:theme", false, false); }
    document.dispatchEvent(ev);
  }

  btn.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    html.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    render(); announce();
  });

  var onSystem = function () { if (!html.getAttribute("data-theme")) { render(); announce(); } };
  if (mq.addEventListener) mq.addEventListener("change", onSystem); else if (mq.addListener) mq.addListener(onSystem);

  render();
  btn.hidden = false;
})();
