/* Type-ahead search helpers. Works in the browser and in Node.
   ToolkitSearch.norm(s)            lower-case, accents removed, punctuation -> spaces
   ToolkitSearch.tokens(q, stop)    words typed by the person, minus filler words (default: on in the a for at and of open me i need)
   ToolkitSearch.wordPrefix(t, text) true when t starts one of the words in text ("pan" finds "Pantry")
   ToolkitSearch.matchAll(tokens, textOrFn) true when EVERY token starts a word of the text (or fn(token) is true)
   Meant for small lists (hundreds of rows): no index, just a fast scan on every keystroke. */
(function (root) {
  'use strict';
  var STOP = 'on in the a an for at and of open me i need to near some';
  function norm(s) {
    s = String(s == null ? '' : s).toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function tokens(q, stop) {
    var st = {}; (stop == null ? STOP : stop).split(' ').forEach(function (w) { if (w) st[w] = 1; });
    return norm(q).split(' ').filter(function (w) { return w && !st[w]; });
  }
  function wordPrefix(t, text) { return (' ' + norm(text)).indexOf(' ' + t) >= 0; }
  function matchAll(toks, test) {
    for (var i = 0; i < toks.length; i++) {
      var ok = typeof test === 'function' ? test(toks[i]) : wordPrefix(toks[i], test);
      if (!ok) return false;
    }
    return true;
  }
  var api = { norm: norm, tokens: tokens, wordPrefix: wordPrefix, matchAll: matchAll };
  root.ToolkitSearch = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
