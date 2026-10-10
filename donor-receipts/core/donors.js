/* Donor gift log + year-end receipt letters. Pure logic, no page access; works in the browser (global Donors) and in Node.
   Data: {schemaVersion:2, donors:[{id,name,address}], gifts:[{id,donorId,date,kind:'cash'|'goods',cents,desc,returned,source,ref}]}
   source = how it arrived (Venmo, PayPal, Check, Cash...), ref = the service's transaction id (used to spot duplicates on re-import). Both optional; version 1 data had neither.
   Money is kept in whole cents. `returned` is an optional note of anything the donor got back (a dinner ticket), with its estimated value. */
(function (root) {
  'use strict';
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DEFAULTS = {
    org: '', letterhead: '', signer: '', signerTitle: '', ein: '', letterDate: '', onlyNeeded: false,
    intro: 'Thank you for your generous support of {org} in {year}. This letter is your record of what we received from you between January 1 and December 31, {year}.',
    cashNote: 'Cash gifts total {total}.',
    goodsNote: 'Donated goods are described above. {org} does not put a dollar value on donated goods; if you itemize, you are responsible for deciding their fair market value.',
    nothingReturned: 'No goods or services were provided to you in exchange for {these}.',
    taxLine: '{org} is a tax-exempt organization under section 501(c)(3) of the Internal Revenue Code{ein}. Please keep this letter with your tax records.',
    closing: 'With gratitude,'
  };
  var uid = 0;
  function newId(p) { uid++; return p + Date.now().toString(36) + uid.toString(36) + Math.random().toString(36).slice(2, 5); }
  var SCHEMA = 2;
  function emptyData() { return { schemaVersion: SCHEMA, donors: [], gifts: [] }; }
  function tidyName(s) {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    var m = s.match(/^([^,]+),\s*([^,]+)$/); if (m && !/\b(inc|llc|co|corp|ltd)\b\.?$/i.test(s)) s = m[2] + ' ' + m[1];
    return s.replace(/(^|[\s\-'(])([a-zà-ÿ])/g, function (_, a, b) { return a + b.toUpperCase(); }).replace(/\bMc([a-z])/g, function (_, c) { return 'Mc' + c.toUpperCase(); });
  }
  function key(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  /* "$1,250", "25.5", "1 250" -> cents, or null if not an amount above zero */
  function parseMoney(s) {
    if (typeof s === 'number') return s > 0 && isFinite(s) ? Math.round(s * 100) : null;
    var t = String(s == null ? '' : s).replace(/[$\s]/g, ''); if (!t) return null;
    if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
    t = t.replace(/,(?=\d{3}(\D|$))/g, '').replace(',', '.');
    if (!/^\d*\.?\d+$|^\d+\.$/.test(t)) return null;
    var c = Math.round(parseFloat(t) * 100); return c > 0 && c < 1e12 ? c : null;
  }
  function money(c) { var n = c / 100, neg = n < 0; n = Math.abs(n); var s = n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); return (neg ? '-' : '') + '$' + s; }
  function fmtDate(iso) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ''); return m ? MONTHS[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1] : String(iso || ''); }
  function yearOf(g) { return +String(g.date).slice(0, 4); }

  function findDonor(d, name) { var k = key(name); for (var i = 0; i < d.donors.length; i++) if (key(d.donors[i].name) === k) return d.donors[i]; return null; }
  function addDonor(d, name, address) {
    name = tidyName(name); if (!name) return { error: 'Please type the donor’s name.' };
    var ex = findDonor(d, name); if (ex) return { donor: ex, existed: true };
    var dn = { id: newId('d'), name: name, address: String(address || '').replace(/\r/g, '').trim() }; d.donors.push(dn); return { donor: dn };
  }
  /* o: {donorId, date(iso), kind, amount (text or cents-number via cents), desc, returned} */
  function addGift(d, o) {
    var donor = d.donors.filter(function (x) { return x.id === o.donorId; })[0]; if (!donor) return { error: 'Choose who gave the gift.' };
    if (!/^\d{4}-\d\d-\d\d$/.test(o.date || '')) return { error: 'Please type the date of the gift, like 12/15/2026.' };
    var g = { id: newId('g'), donorId: donor.id, date: o.date, kind: o.kind === 'goods' ? 'goods' : 'cash', cents: 0, desc: String(o.desc || '').trim(), returned: String(o.returned || '').trim(), source: String(o.source || '').trim(), ref: String(o.ref || '').trim() };
    if (g.kind === 'cash') { g.cents = parseMoney(o.amount); if (!g.cents) return { error: 'Please type the amount, like 50 or 25.50.' }; }
    else if (!g.desc) return { error: 'Please describe the goods, like “12 cans of soup”.' };
    d.gifts.push(g); return { gift: g };
  }
  function updateGift(d, id, o) {
    var g = d.gifts.filter(function (x) { return x.id === id; })[0]; if (!g) return { error: 'Gift not found.' };
    var tmp = { donors: d.donors, gifts: [] }, r = addGift(tmp, { donorId: o.donorId || g.donorId, date: o.date, kind: o.kind, amount: o.amount, desc: o.desc, returned: o.returned, source: o.source != null ? o.source : g.source, ref: g.ref });
    if (r.error) return r; var n = r.gift; n.id = g.id; d.gifts[d.gifts.indexOf(g)] = n; return { gift: n };
  }
  function removeGift(d, id) { var n = d.gifts.length; d.gifts = d.gifts.filter(function (g) { return g.id !== id; }); return d.gifts.length < n; }
  function removeDonor(d, id) { d.donors = d.donors.filter(function (x) { return x.id !== id; }); d.gifts = d.gifts.filter(function (g) { return g.donorId !== id; }); }
  function renameDonor(d, id, name, address) {
    var x = d.donors.filter(function (z) { return z.id === id; })[0]; if (!x) return { error: 'Not found.' };
    name = tidyName(name); if (!name) return { error: 'Please type the donor’s name.' };
    var ex = findDonor(d, name); if (ex && ex.id !== id) return { error: 'Someone else already has that name. Use Merge instead.' };
    x.name = name; if (address != null) x.address = String(address).replace(/\r/g, '').trim(); return { donor: x };
  }
  /* Type-ahead: every typed word must start a word of the name. Needs ToolkitSearch if present, else a simple fallback. */
  function search(d, q, limit) {
    var S = root.ToolkitSearch || (typeof require === 'function' ? require('../../components/typeahead-search/search.js') : null);
    var toks = S.tokens(q, ''); if (!toks.length) return [];
    return d.donors.filter(function (x) { return S.matchAll(toks, x.name); }).sort(function (a, b) { return a.name.localeCompare(b.name); }).slice(0, limit || 8);
  }
  function giftsFor(d, donorId, year) {
    return d.gifts.filter(function (g) { return g.donorId === donorId && (year == null || yearOf(g) === year); }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  }
  function years(d) { var s = {}; d.gifts.forEach(function (g) { s[yearOf(g)] = 1; }); return Object.keys(s).map(Number).sort(function (a, b) { return b - a; }); }
  function needsLetter(gifts) { return gifts.some(function (g) { return g.kind === 'goods' || g.cents >= 25000; }); }
  /* One entry per donor who gave in that year, A-Z. */
  function yearSummary(d, year, onlyNeeded) {
    var out = [];
    d.donors.forEach(function (dn) {
      var gs = giftsFor(d, dn.id, year); if (!gs.length) return;
      var cash = gs.reduce(function (s, g) { return s + (g.kind === 'cash' ? g.cents : 0); }, 0), goods = gs.filter(function (g) { return g.kind === 'goods'; }).length;
      var need = needsLetter(gs); if (onlyNeeded && !need) return;
      out.push({ donor: dn, gifts: gs, cash: cash, goods: goods, needed: need });
    });
    return out.sort(function (a, b) { return a.donor.name.localeCompare(b.donor.name); });
  }
  function fill(t, v) { return String(t).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); }
  /* The letter as plain data so any screen/printer can lay it out:
     {letterhead, date, addressee:[lines], greeting, paragraphs:[], rows:[{date,what,amount}], notes:[], taxLine, closing, signer:[lines]} */
  function letter(d, s, donorId, year) {
    s = Object.assign({}, DEFAULTS, s || {});
    var dn = d.donors.filter(function (x) { return x.id === donorId; })[0], gs = giftsFor(d, donorId, year); if (!dn || !gs.length) return null;
    var org = s.org || 'our organization', cash = gs.reduce(function (t, g) { return t + (g.kind === 'cash' ? g.cents : 0); }, 0);
    var hasCash = gs.some(function (g) { return g.kind === 'cash'; }), hasGoods = gs.some(function (g) { return g.kind === 'goods'; });
    var v = { org: org, year: year, total: money(cash), ein: s.ein ? ' (EIN ' + s.ein + ')' : '', these: gs.length > 1 ? 'these gifts' : 'this gift' };
    var rows = gs.map(function (g) { return { date: fmtDate(g.date), what: g.kind === 'cash' ? 'Cash gift' + (g.desc ? ' (' + g.desc + ')' : '') : 'Donated goods: ' + g.desc, amount: g.kind === 'cash' ? money(g.cents) : 'Goods' }; });
    var notes = [];
    if (hasCash && gs.length > 1) notes.push(fill(s.cashNote, v));
    if (hasGoods) notes.push(fill(s.goodsNote, v));
    var ret = gs.filter(function (g) { return g.returned; });
    if (ret.length) {
      ret.forEach(function (g) { notes.push('In exchange for the gift on ' + fmtDate(g.date) + ', we provided: ' + g.returned + '.'); });
      if (ret.length < gs.length) notes.push(fill(s.nothingReturned, { these: 'the other gifts' }));
    } else notes.push(fill(s.nothingReturned, v));
    var ld = s.letterDate && /^\d{4}-\d\d-\d\d$/.test(s.letterDate) ? s.letterDate : null;
    return {
      donor: dn, year: year, letterhead: s.letterhead || org, date: ld ? fmtDate(ld) : '', addressee: [dn.name].concat(dn.address ? dn.address.split('\n') : []),
      greeting: 'Dear ' + dn.name + ',', paragraphs: [fill(s.intro, v)], rows: rows, notes: notes, taxLine: fill(s.taxLine, v), closing: s.closing,
      signer: [s.signer, s.signerTitle].filter(Boolean)
    };
  }
  function csvRows(d, year) {
    var rows = [['Date', 'Donor', 'Cash or goods', 'Amount', 'Description', 'Given in return', 'How it came in']];
    d.gifts.filter(function (g) { return year == null || yearOf(g) === year; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (g) {
      var dn = d.donors.filter(function (x) { return x.id === g.donorId; })[0];
      rows.push([g.date, dn ? dn.name : '', g.kind === 'cash' ? 'Cash' : 'Goods', g.kind === 'cash' ? (g.cents / 100).toFixed(2) : '', g.desc, g.returned, g.source || '']);
    });
    return rows;
  }
  function sanitize(x) {
    var d = emptyData(); if (!x || typeof x !== 'object') return d; var ids = {};
    (Array.isArray(x.donors) ? x.donors : []).forEach(function (o) { if (o && o.id != null && String(o.name || '').trim()) { var id = String(o.id); ids[id] = 1; d.donors.push({ id: id, name: String(o.name).trim(), address: String(o.address || '') }); } });
    (Array.isArray(x.gifts) ? x.gifts : []).forEach(function (g) {
      if (!g || !ids[String(g.donorId)] || !/^\d{4}-\d\d-\d\d$/.test(g.date || '')) return;
      var kind = g.kind === 'goods' ? 'goods' : 'cash', c = Math.round(+g.cents || 0); if (kind === 'cash' && !(c > 0)) return;
      d.gifts.push({ id: String(g.id || newId('g')), donorId: String(g.donorId), date: g.date, kind: kind, cents: kind === 'cash' ? c : 0, desc: String(g.desc || ''), returned: String(g.returned || ''), source: String(g.source || ''), ref: String(g.ref || '') });
    });
    return d;
  }
  var api = { SCHEMA: SCHEMA, DEFAULTS: DEFAULTS, emptyData: emptyData, tidyName: tidyName, parseMoney: parseMoney, money: money, fmtDate: fmtDate, yearOf: yearOf, findDonor: findDonor, addDonor: addDonor, addGift: addGift,
    updateGift: updateGift, removeGift: removeGift, removeDonor: removeDonor, renameDonor: renameDonor, search: search, giftsFor: giftsFor, years: years, needsLetter: needsLetter,
    yearSummary: yearSummary, letter: letter, csvRows: csvRows, sanitize: sanitize };
  root.Donors = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
