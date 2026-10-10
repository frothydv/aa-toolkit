/* ToolkitPrint.print(title) opens the browser print window; the title becomes the suggested file name when saving as PDF. */
(function (root) {
  'use strict';
  function print(title) {
    var d = root.document, old = d.title; if (title) d.title = title;
    try { root.print(); } finally { d.title = old; }
  }
  /* Print just one part of the page: mark each part class="print-section" and give the one to print data-section="name". */
  function printSection(title, name) {
    var d = root.document, els = d.querySelectorAll('.print-section'), i;
    for (i = 0; i < els.length; i++) if (els[i].getAttribute('data-section') === name) els[i].classList.add('print-this');
    d.body.classList.add('printing-section');
    try { print(title); } finally {
      d.body.classList.remove('printing-section');
      for (i = 0; i < els.length; i++) els[i].classList.remove('print-this');
    }
  }
  root.ToolkitPrint = { print: print, printSection: printSection };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ToolkitPrint;
})(typeof window !== 'undefined' ? window : globalThis);
