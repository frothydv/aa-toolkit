/* Practice data helper: remembers which settings a tool filled with made-up values, and clears them on "start fresh".
   Plain script (global ToolkitPracticeData) or require(). No storage of its own: it works on the tool's settings object.
   Settings are cleared only when they still hold the practice value, so a name the charity typed is never touched. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.ToolkitPracticeData = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var MARK = 'practiceSet'; // settings.practiceSet = { key: practiceValue } for every setting seed() filled
  var DEFAULT_FLAGS = { sample: { key: 'sample', practice: true, fresh: false }, welcome: { key: 'welcome', practice: true, fresh: false } };

  function flags(opts) {
    var f = (opts && opts.flags) || {}, o = {};
    ['sample', 'welcome'].forEach(function (n) { o[n] = f[n] === null ? null : Object.assign({}, DEFAULT_FLAGS[n], f[n] || {}); });
    return o;
  }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  /* Fill settings with practice values and remember them. values: {org: 'Example Pantry', ...}. Sets the practice banner and welcome flags. */
  function seed(settings, values, opts) {
    var f = flags(opts), rec = {};
    Object.keys(values || {}).forEach(function (k) { settings[k] = values[k]; rec[k] = values[k]; });
    settings[MARK] = Object.assign(settings[MARK] || {}, rec);
    if (f.sample) settings[f.sample.key] = f.sample.practice;
    if (f.welcome) settings[f.welcome.key] = f.welcome.practice;
    return settings;
  }

  /* Which setting keys still hold a practice value? Checks what seed() recorded, plus opts.legacy ({key: [values]}) for data saved
     before this component existed. */
  function practiceKeys(settings, opts) {
    var rec = settings[MARK] || {}, legacy = (opts && opts.legacy) || {}, out = [];
    Object.keys(rec).concat(Object.keys(legacy)).forEach(function (k) {
      if (out.indexOf(k) >= 0 || settings[k] === undefined) return;
      var cands = [rec[k]].concat(legacy[k] || []).filter(function (v) { return v !== undefined; });
      if (cands.some(function (v) { return same(v, settings[k]); })) out.push(k);
    });
    return out;
  }

  /* Clear every still-practice setting (to opts.blank, default ''), the banner and welcome flags, and the record of what was seeded.
     Returns {cleared: [keys], kept: [keys the charity changed]}. */
  function clearSettings(settings, opts) {
    var f = flags(opts), blank = opts && 'blank' in opts ? opts.blank : '', rec = settings[MARK] || {}, legacy = (opts && opts.legacy) || {};
    var cleared = practiceKeys(settings, opts), kept = Object.keys(rec).concat(Object.keys(legacy)).filter(function (k, i, a) {
      return a.indexOf(k) === i && cleared.indexOf(k) < 0 && settings[k] !== undefined && settings[k] !== blank;
    });
    cleared.forEach(function (k) { settings[k] = blank; });
    delete settings[MARK];
    if (f.sample) settings[f.sample.key] = f.sample.fresh;
    if (f.welcome) settings[f.welcome.key] = f.welcome.fresh;
    return { cleared: cleared, kept: kept };
  }

  /* One undoable step. state = {data, settings}; opts.empty = function returning empty data (or the empty data itself);
     opts.onSettings(settings) may reset other things such as a current-event id. Mutates settings in place; returns
     {data, cleared, kept, undo} where undo is a string for restore(). */
  function startFresh(state, opts) {
    var undo = snapshot(state), r = clearSettings(state.settings, opts), empty = opts && opts.empty;
    if (opts && opts.onSettings) opts.onSettings(state.settings);
    return { data: typeof empty === 'function' ? empty() : empty, cleared: r.cleared, kept: r.kept, undo: undo };
  }

  /* Snapshot of data AND settings, so one Undo brings back both. */
  function snapshot(state) { return JSON.stringify({ practiceData: 1, data: state.data, settings: state.settings }); }
  /* Put settings back in place (same object) and return the data to re-sanitize. Also accepts an old data-only snapshot. */
  function restore(str, settings) {
    var o = JSON.parse(str);
    if (!o || o.practiceData !== 1) return { data: o };
    Object.keys(settings).forEach(function (k) { delete settings[k]; });
    Object.assign(settings, o.settings);
    return { data: o.data };
  }

  /* True if any text field of the tool's settings still equals a known practice value (used by tests). */
  function leftovers(settings, practiceValues) {
    var vals = Array.isArray(practiceValues) ? practiceValues : Object.keys(practiceValues).map(function (k) { return practiceValues[k]; });
    return Object.keys(settings).filter(function (k) { return k !== MARK && vals.some(function (v) { return same(v, settings[k]); }); });
  }

  return { MARK: MARK, seed: seed, practiceKeys: practiceKeys, clearSettings: clearSettings, startFresh: startFresh, snapshot: snapshot, restore: restore, leftovers: leftovers };
});
