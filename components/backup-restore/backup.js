/* One-click backup and restore as a small .json file (needs file-download).
   save({app, filename, data, settings}) - downloads {app, savedAt, settings, data}
   read(file, cb) - cb(null, {data, settings, app}) or cb(error). Also accepts older backups (bare data, or {data, org}).
   The app then validates `data` with its own sanitize(), asks "Replace what you have?" and offers undo.
   fileInput(id) - html for the hidden file chooser; pick(id) opens it. */
(function (root) {
  'use strict';
  function save(o) {
    root.ToolkitDownload.save(o.filename, JSON.stringify({ app: o.app || '', savedAt: new Date().toISOString(), settings: o.settings || {}, data: o.data }, null, 1), 'application/json');
  }
  function parse(text) {
    var j = JSON.parse(text); if (!j || typeof j !== 'object') throw new Error('not a backup');
    var settings = j.settings && typeof j.settings === 'object' ? j.settings : (j.org ? { org: j.org } : {});
    return { data: j.data || j, settings: settings, app: j.app || '' };
  }
  function read(file, cb) {
    var fr = new FileReader();
    fr.onload = function () { var r; try { r = parse(fr.result); } catch (e) { return cb(e); } cb(null, r); };
    fr.onerror = function () { cb(new Error('could not read file')); };
    fr.readAsText(file);
  }
  function fileInput(id) { return '<input id="' + id + '" type="file" accept=".json,application/json" class="sr" tabindex="-1" aria-label="Choose backup file">'; }
  function pick(id) { root.document.getElementById(id).click(); }
  var api = { save: save, parse: parse, read: read, fileInput: fileInput, pick: pick };
  root.ToolkitBackup = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
