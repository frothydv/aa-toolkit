/* Pantry core: pure logic, no DOM, no storage. Works in browser and Node.
   Data: {version, items:[{id,name,category,unit,lbPer,low}], moves:[{id,type,itemId,qty,date,donor,household,size,note,createdAt}]}
   A donation ('in') may carry bestBy (ISO date or ''); a count correction ('adj') may carry lotId (the donation it pulled from the shelf).
   unit: 'lb' (qty is pounds) or 'each' (qty is a count; lbPer = pounds in one). type: 'in' (donation) | 'out' (distribution) | 'adj' (count correction, qty may be negative; never counted as donated or served). */
(function (root) {
  'use strict';
  var Csv = root.ToolkitCsv || require(require('path').join(__dirname, '..', '..', 'components', 'csv-export', 'csv.js')); // shared component (browser: loaded first)
  var Dates = root.ToolkitDates || require(require('path').join(__dirname, '..', '..', 'components', 'date-parse', 'dates.js')); // shared component
  var CATEGORIES = ['Canned vegetables', 'Canned protein', 'Fruit', 'Grains and pasta', 'Breakfast', 'Soup and sauce', 'Dairy and eggs', 'Fresh produce', 'Frozen', 'Baby and kids', 'Household and hygiene', 'Other'];

  function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : 0; }
  function round(n) { return Math.round(n * 100) / 100; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return iso(new Date()); }
  function addDays(s, n) { var d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); }
  function clean(s, max) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max || 80); }

  /* Accepts 2026-10-09, 10/9/2026, 10/9/26, 10-9. Returns ISO or ''. */
  function parseDate(s) {
    s = clean(s); if (!s) return '';
    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/), y, mo, d;
    if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else if ((m = s.match(/^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?$/))) {
      mo = +m[1]; d = +m[2]; y = m[3] ? +m[3] : new Date().getFullYear(); if (y < 100) y += 2000;
    } else return '';
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return '';
    return iso(dt);
  }

  /* Household IDs are tidied to upper case: " h-014 " -> "H-014"; initials "j.s." -> "JS". */
  function cleanHousehold(s) {
    s = clean(s, 20).toUpperCase();
    if (/^([A-Z]\.?){1,4}$/.test(s)) s = s.replace(/\./g, '');
    return s;
  }

  function empty() { return { version: 1, items: [], moves: [] }; }

  function sanitize(d) {
    var out = empty();
    if (!d || typeof d !== 'object') return out;
    (Array.isArray(d.items) ? d.items : []).forEach(function (i) {
      if (!i || !clean(i.name)) return;
      out.items.push({ id: String(i.id || uid('i')), name: clean(i.name, 60), category: clean(i.category, 40) || 'Other',
        unit: i.unit === 'lb' ? 'lb' : 'each', lbPer: i.unit === 'lb' ? 1 : (num(i.lbPer) > 0 ? num(i.lbPer) : 1), low: Math.max(0, num(i.low)) });
    });
    var ids = {}; out.items.forEach(function (i) { ids[i.id] = 1; });
    (Array.isArray(d.moves) ? d.moves : []).forEach(function (m) {
      if (!m || !ids[m.itemId] || (m.type !== 'in' && m.type !== 'out' && m.type !== 'adj') || (m.type === 'adj' ? num(m.qty) === 0 : !(num(m.qty) > 0))) return;
      out.moves.push({ id: String(m.id || uid('m')), type: m.type, itemId: String(m.itemId), qty: num(m.qty), date: parseDate(m.date) || today(),
        donor: clean(m.donor, 60), household: cleanHousehold(m.household), size: Math.max(0, Math.round(num(m.size))),
        note: clean(m.note, 120), createdAt: m.createdAt || new Date().toISOString() });
      var last = out.moves[out.moves.length - 1];
      if (m.type === 'in') last.bestBy = Dates.parse(m.bestBy);
      if (m.type === 'adj' && m.lotId) last.lotId = String(m.lotId);
    });
    return out;
  }

  function findItem(data, id) { for (var i = 0; i < data.items.length; i++) if (data.items[i].id === id) return data.items[i]; return null; }
  function unitLabel(item, qty) { return item.unit === 'lb' ? 'lb' : (qty === 1 ? 'item' : 'items'); }
  function pounds(item, qty) { return round(item.unit === 'lb' ? qty : qty * item.lbPer); }

  function addItem(data, f) {
    var name = clean(f.name, 60); if (!name) return { error: 'Please type what the item is called.' };
    var dup = data.items.filter(function (i) { return i.name.toLowerCase() === name.toLowerCase(); })[0];
    if (dup) return { error: '"' + dup.name + '" is already on the list. Choose it from the list instead.' };
    var item = { id: uid('i'), name: name, category: clean(f.category, 40) || 'Other', unit: f.unit === 'lb' ? 'lb' : 'each',
      lbPer: f.unit === 'lb' ? 1 : (num(f.lbPer) > 0 ? num(f.lbPer) : 1), low: Math.max(0, num(f.low)) };
    data.items.push(item); return { item: item };
  }

  /* f: {type,itemId,qty,date,donor,household,size,note} */
  function addMove(data, f) {
    var item = findItem(data, f.itemId);
    if (!item) return { error: 'Please choose an item.' };
    var qty = num(f.qty);
    if (!(qty > 0)) return { error: 'Please enter how many (a number bigger than zero).' };
    var date = f.date ? parseDate(f.date) : today();
    if (!date) return { error: 'That date does not look right. Try something like 10/9/2026.' };
    var bestBy = '';
    if (f.type !== 'out' && clean(f.bestBy)) {
      bestBy = Dates.parse(f.bestBy);
      if (!bestBy) return { error: 'The best-by date does not look right. Try something like 10/2027 or 3/15/2027, or leave it empty.' };
    }
    var warn = '';
    if (f.type === 'out' && qty > stockOf(data, item.id)) warn = 'Only ' + round(stockOf(data, item.id)) + ' ' + unitLabel(item, 2) + ' of ' + item.name + ' on the shelf by our records. Saved anyway; check the count when you can.';
    var m = { id: uid('m'), type: f.type === 'out' ? 'out' : 'in', itemId: item.id, qty: qty, date: date, donor: clean(f.donor, 60),
      household: cleanHousehold(f.household), size: Math.max(0, Math.round(num(f.size))), note: clean(f.note, 120), createdAt: new Date().toISOString() };
    if (m.type === 'in') {
      m.bestBy = bestBy;
      if (bestBy && bestBy < today()) warn = 'That best-by date has already passed, so this will show on the "pull these" list.';
    }
    data.moves.push(m); return { move: m, warning: warn };
  }

  /* Count correction: the volunteer says how many are really on the shelf; we record the difference. */
  function adjustStock(data, itemId, actual) {
    var item = findItem(data, itemId); if (!item) return { error: 'Please choose an item.' };
    if (String(actual == null ? '' : actual).trim() === '' || !isFinite(parseFloat(String(actual).replace(',', '.'))) || num(actual) < 0) return { error: 'Please type how many are on the shelf now (0 or more).' };
    var diff = round(num(actual) - stockOf(data, itemId));
    if (diff === 0) return { unchanged: true };
    var m = { id: uid('m'), type: 'adj', itemId: itemId, qty: diff, date: today(), donor: '', household: '', size: 0, note: 'Count correction', createdAt: new Date().toISOString() };
    data.moves.push(m); return { move: m };
  }

  /* f: {name, category, low, lbPer}. Changes the item's details; stock history is untouched. */
  function updateItem(data, id, f) {
    var item = findItem(data, id); if (!item) return { error: 'That item was not found.' };
    var name = clean(f.name, 60); if (!name) return { error: 'Please type what the item is called.' };
    var dup = data.items.filter(function (i) { return i.id !== id && i.name.toLowerCase() === name.toLowerCase(); })[0];
    if (dup) return { error: '"' + dup.name + '" is already on the list.' };
    item.name = name; item.category = clean(f.category, 40) || 'Other'; item.low = Math.max(0, num(f.low));
    if (item.unit !== 'lb') item.lbPer = num(f.lbPer) > 0 ? num(f.lbPer) : item.lbPer;
    return { item: item };
  }

  function removeMove(data, id) {
    for (var i = 0; i < data.moves.length; i++) if (data.moves[i].id === id) return data.moves.splice(i, 1)[0];
    return null;
  }
  function restoreMove(data, m) { if (m) data.moves.push(m); }

  function stockOf(data, itemId) {
    var s = 0; data.moves.forEach(function (m) { if (m.itemId === itemId) s += m.type === 'out' ? -m.qty : m.qty; });
    return round(s);
  }

  /* One row per item: {item, stock, lbs, status:'out'|'low'|'ok'} sorted with the most urgent first. */
  function stockList(data) {
    var rows = data.items.map(function (item) {
      var st = stockOf(data, item.id);
      var status = st <= 0 ? 'out' : (item.low > 0 && st <= item.low ? 'low' : 'ok');
      return { item: item, stock: Math.max(st, 0), lbs: pounds(item, Math.max(st, 0)), status: status };
    });
    var rank = { out: 0, low: 1, ok: 2 };
    rows.sort(function (a, b) { return rank[a.status] - rank[b.status] || a.item.name.localeCompare(b.item.name); });
    return rows;
  }

  function totals(data) {
    var lbs = 0, flagged = 0;
    stockList(data).forEach(function (r) { lbs += r.lbs; if (r.status !== 'ok') flagged++; });
    return { lbs: round(lbs), flagged: flagged, items: data.items.length };
  }

  /* Most recent first. Each row gets item and lbs for display. */
  function activity(data, limit) {
    var rows = data.moves.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (a.createdAt < b.createdAt ? 1 : -1); });
    rows = rows.map(function (m) { var item = findItem(data, m.itemId); return { move: m, item: item, lbs: pounds(item, m.qty) }; });
    return limit ? rows.slice(0, limit) : rows;
  }

  function knownHouseholds(data) {
    var seen = {}, list = [];
    data.moves.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).forEach(function (m) {
      if (m.household && !seen[m.household]) { seen[m.household] = 1; list.push(m.household); }
    });
    return list;
  }
  function knownDonors(data) {
    var seen = {}, list = [];
    data.moves.forEach(function (m) { if (m.donor && !seen[m.donor.toLowerCase()]) { seen[m.donor.toLowerCase()] = 1; list.push(m.donor); } });
    return list.sort();
  }
  /* Household size last used for this ID, so volunteers need not retype it. */
  function lastSize(data, household) {
    var h = cleanHousehold(household), best = null;
    data.moves.forEach(function (m) { if (m.type === 'out' && m.household === h && m.size && (!best || m.date >= best.date)) best = m; });
    return best ? best.size : 0;
  }

  function stockRows(data) {
    var rows = [['Item', 'Category', 'On shelf', 'Unit', 'Pounds', 'Low-stock level', 'Status']];
    stockList(data).forEach(function (r) { rows.push([r.item.name, r.item.category, r.stock, r.item.unit === 'lb' ? 'lb' : 'items', r.lbs, r.item.low, r.status === 'ok' ? 'OK' : r.status === 'low' ? 'Low' : 'Out']); });
    return rows;
  }
  function activityRows(data) {
    var rows = [['Date', 'Type', 'Item', 'Category', 'Quantity', 'Unit', 'Pounds', 'Donor', 'Household', 'Household size', 'Best-by date', 'Note']];
    activity(data).forEach(function (r) {
      var m = r.move; rows.push([m.date, m.type === 'in' ? 'Donation' : m.type === 'adj' ? 'Count correction' : 'Distribution', r.item.name, r.item.category, m.qty, r.item.unit === 'lb' ? 'lb' : 'items', r.lbs, m.donor, m.household, m.size || '', m.bestBy || '', m.note]);
    });
    return rows;
  }

  /* ---------- Best-by dates ----------
     Each donation with a date is a "lot". Food given out is taken from the soonest date that has not yet passed
     (undated next, past-date last), replayed in date order. A volunteer can also "pull" a lot (a count correction tied to it). */
  var DEFAULT_RULES = { soonDays: 30, graceDays: 0 };
  function rules(r) {
    r = r || {};
    return { soonDays: Math.max(0, Math.round(num(r.soonDays == null || r.soonDays === '' ? DEFAULT_RULES.soonDays : r.soonDays))),
      graceDays: Math.max(0, Math.round(num(r.graceDays))) };
  }
  function byTime(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0); }

  /* Everything still on the shelf, by donation: [{id,itemId,item,bestBy,left,lbs,received,donor}] */
  function lots(data) {
    var all = [], byItem = {};
    data.moves.slice().sort(byTime).forEach(function (m) {
      var item = findItem(data, m.itemId); if (!item) return;
      var list = byItem[m.itemId] = byItem[m.itemId] || [], lot;
      if (m.type === 'in' || (m.type === 'adj' && m.qty > 0 && !m.lotId)) {
        lot = { id: m.id, itemId: m.itemId, item: item, bestBy: m.type === 'in' ? (m.bestBy || '') : '', left: m.qty, received: m.date, donor: m.donor || '' };
        list.push(lot); all.push(lot);
      } else if (m.type === 'adj' && m.lotId) {
        list.forEach(function (l) { if (l.id === m.lotId) l.left = Math.max(0, round(l.left + m.qty)); });
      } else { // given out, or a negative count correction
        var need = Math.abs(m.qty);
        var order = list.filter(function (l) { return l.left > 0; }).sort(function (a, b) {
          function rank(l) { return l.bestBy && l.bestBy < m.date ? 2 : l.bestBy ? 0 : 1; }
          return rank(a) - rank(b) || (a.bestBy < b.bestBy ? -1 : a.bestBy > b.bestBy ? 1 : 0);
        });
        order.forEach(function (l) { if (need <= 0) return; var t = Math.min(l.left, need); l.left = round(l.left - t); need = round(need - t); });
      }
    });
    return all.filter(function (l) { return l.left > 0; }).map(function (l) { l.lbs = pounds(l.item, l.left); return l; });
  }

  /* {expired:[], soon:[], later:[], undated:[]}; each row is a lot plus days (to best-by; negative = past).
     expired: more than graceDays past the date. soon: within soonDays (soonest first). */
  function expiryReport(data, r, onDate) {
    r = rules(r); var t = onDate || today();
    var out = { expired: [], soon: [], later: [], undated: [], rules: r, date: t };
    lots(data).forEach(function (l) {
      if (!l.bestBy) { out.undated.push(l); return; }
      l.days = Dates.daysBetween(t, l.bestBy);
      (l.days < -r.graceDays ? out.expired : l.days <= r.soonDays ? out.soon : out.later).push(l);
    });
    function asc(a, b) { return a.bestBy < b.bestBy ? -1 : a.bestBy > b.bestBy ? 1 : a.item.name.localeCompare(b.item.name); }
    out.expired.sort(asc); out.soon.sort(asc); out.later.sort(asc);
    out.undated.sort(function (a, b) { return a.item.name.localeCompare(b.item.name); });
    return out;
  }

  /* Take a whole lot off the shelf (past its date, damaged...). Returns {move} so the caller can undo with removeMove. */
  function pullLot(data, lotId, why) {
    var lot = lots(data).filter(function (l) { return l.id === lotId; })[0];
    if (!lot) return { error: 'That item is no longer on the shelf list.' };
    var m = { id: uid('m'), type: 'adj', itemId: lot.itemId, qty: -lot.left, date: today(), donor: '', household: '', size: 0, note: clean(why, 120) || 'Pulled from the shelf', createdAt: new Date().toISOString(), lotId: lotId };
    data.moves.push(m); return { move: m, lot: lot };
  }

  function expiryRows(data, r, onDate) {
    var rep = expiryReport(data, r, onDate), rows = [['Status', 'Item', 'Category', 'Quantity', 'Unit', 'Best-by date', 'Days left (negative = past)', 'Received', 'Donor']];
    function add(label, list) { list.forEach(function (l) { rows.push([label, l.item.name, l.item.category, l.left, l.item.unit === 'lb' ? 'lb' : 'items', l.bestBy, l.days == null ? '' : l.days, l.received, l.donor]); }); }
    add('Past its date', rep.expired); add('Use first', rep.soon); add('Later', rep.later); add('No date', rep.undated);
    return rows;
  }

  root.Pantry = { CATEGORIES: CATEGORIES, uid: uid, num: num, round: round, today: today, iso: iso, addDays: addDays, parseDate: parseDate,
    cleanHousehold: cleanHousehold, empty: empty, sanitize: sanitize, findItem: findItem, unitLabel: unitLabel, pounds: pounds, addItem: addItem,
    addMove: addMove, DEFAULT_RULES: DEFAULT_RULES, rules: rules, lots: lots, expiryReport: expiryReport, pullLot: pullLot, expiryRows: expiryRows, expiryCsv: function (d, r) { return Csv.fromRows(expiryRows(d, r)); }, adjustStock: adjustStock, updateItem: updateItem, removeMove: removeMove, restoreMove: restoreMove, stockOf: stockOf, stockList: stockList, totals: totals, activity: activity,
    knownHouseholds: knownHouseholds, knownDonors: knownDonors, lastSize: lastSize, stockRows: stockRows, activityRows: activityRows, stockCsv: function (d) { return Csv.fromRows(stockRows(d)); }, activityCsv: function (d) { return Csv.fromRows(activityRows(d)); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Pantry;
})(typeof window !== 'undefined' ? window : globalThis);
