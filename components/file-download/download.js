/* Saves text as a file in the browser's Downloads folder (no server). ToolkitDownload.save(filename, text, mimeType). */
(function (root) {
  'use strict';
  function save(name, text, type) {
    var d = root.document, a = d.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })); a.download = name; d.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  root.ToolkitDownload = { save: save };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ToolkitDownload;
})(typeof window !== 'undefined' ? window : globalThis);
