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
