/* ToolkitPrint.print(title) opens the browser print window; the title becomes the suggested file name when saving as PDF. */
(function (root) {
  'use strict';
  function print(title) {
    var d = root.document, old = d.title; if (title) d.title = title;
    try { root.print(); } finally { d.title = old; }
  }
  root.ToolkitPrint = { print: print };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ToolkitPrint;
})(typeof window !== 'undefined' ? window : globalThis);
