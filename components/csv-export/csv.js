/* CSV export for spreadsheets. Works in the browser and in Node (core logic can require it).
   cell(v)  - one safe cell: quotes when needed, and defuses leading = + - @ so spreadsheets never run it as a formula
   fromRows(rows) - array of arrays -> CSV text with Windows line breaks
   download(filename, rows) - saves the file with a byte-order mark so Excel shows accents correctly (needs file-download) */
(function (root) {
  'use strict';
  function cell(v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function fromRows(rows) { return rows.map(function (r) { return r.map(cell).join(','); }).join('\r\n'); }
  function download(name, rows) { root.ToolkitDownload.save(name, '﻿' + fromRows(rows), 'text/csv'); }
  var api = { cell: cell, fromRows: fromRows, download: download };
  root.ToolkitCsv = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
