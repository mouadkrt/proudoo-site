/*
  Home pages: "On iPhone?" link under the bottom Google Play badge.
  Opens a small dialog with the Add to Home Screen steps for web.proudoo.app.
  Without JS, or where <dialog> is missing, the link goes to the FAQ answer.
*/
(function () {
  "use strict";
  var link = document.querySelector(".iphone-open");
  var dlg = document.querySelector(".iphone-dialog");
  if (!link || !dlg || typeof dlg.showModal !== "function") return;
  link.addEventListener("click", function (e) { e.preventDefault(); dlg.showModal(); });
  dlg.querySelector(".iphone-close").addEventListener("click", function () { dlg.close(); });
  // Close when tapping outside the box.
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
})();
