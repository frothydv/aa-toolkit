/* CSV export for spreadsheets. Works in the browser and in Node (core logic can require it).
   cell(v)  - one safe cell: quotes when needed, and defuses leading = + - @ so spreadsheets never run it as a formula
   fromRows(rows) - array of arrays -> CSV text with Windows line breaks
   parse(text) - the reverse: CSV text -> array of arrays. Handles quotes, line breaks inside cells, a byte-order mark, and , ; or tab separators.
     Undoes the formula guard (a leading ' before = + - @) so a file this tool exported reads back unchanged.
   download(filename, rows) - saves the file with a byte-order mark so Excel shows accents correctly (needs file-download) */
(function (root) {
  'use strict';
  function cell(v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function fromRows(rows) { return rows.map(function (r) { return r.map(cell).join(','); }).join('\r\n'); }
  function download(name, rows) { root.ToolkitDownload.save(name, '﻿' + fromRows(rows), 'text/csv'); }
  function parse(text) {
    text = String(text == null ? '' : text).replace(/^\uFEFF/, '');
    var first = text.split(/\r?\n/, 1)[0], best = ',', bn = -1;
    [',', ';', '\t'].forEach(function (d) { var n = first.split(d).length; if (n > 1 && n > bn) { best = d; bn = n; } });
    var rows = [], row = [], c = '', q = false, i, ch;
    for (i = 0; i < text.length; i++) {
      ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
      else if (ch === '"' && c === '') q = true;
      else if (ch === best) { row.push(c); c = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(c); c = ''; rows.push(row); row = []; }
      else c += ch;
    }
    if (c !== '' || row.length) { row.push(c); rows.push(row); }
    return rows.map(function (r) { return r.map(function (v) { return /^'[=+\-@]/.test(v) ? v.slice(1) : v; }); })
      .filter(function (r) { return r.length > 1 || (r.length === 1 && r[0].trim() !== ''); });
  }
  var api = { cell: cell, fromRows: fromRows, parse: parse, download: download };
  root.ToolkitCsv = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
