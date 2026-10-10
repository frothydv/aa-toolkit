(function () {
  'use strict';
  var P = window.Pantry, S = window.PantryStorage, SAMPLE = window.PantrySample;
  var settings = S.loadSettings(), data = S.load(), view = 'home', form = null, toast = null, toastTimer = null, filter = '', editId = null, editForm = null, cutoffOpen = false, stockFilter = 'all', sortKey = 'status', sortDir = 1, msg = '';
  if (!data) { data = SAMPLE.make(); settings.org = settings.org || SAMPLE.org; settings.sample = true; S.save(data); S.saveSettings(settings); }
  var $app = document.getElementById('app');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function qty(n) { return String(P.round(n)); }
  function niceDate(s) { var d = new Date(s + 'T12:00:00'); return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }
  function save() { var ok = S.save(data); if (!ok) msg = 'This browser would not save your entries. Use Back up now (under More) before closing.'; }
  function applyTheme() { ToolkitTheme.apply(settings.theme); }
  function showToast(text, undo) {
    clearTimeout(toastTimer); toast = { text: text, undo: undo }; toastTimer = setTimeout(function () { toast = null; render(); }, 8000);
  }
  function go(v) { view = v; msg = ''; window.scrollTo(0, 0); render(); }
  function newForm(type) { return { type: type, itemId: '', qty: '', date: '', donor: '', household: '', size: '', note: '', bestBy: '', newItem: false, ni: { name: '', category: 'Other', unit: 'each', lbPer: '1', low: '' }, err: '', saved: [] }; }

  function header() {
    return '<header class="top"><h1>' + esc(settings.org || 'Pantry tracker') + '</h1>' +
      '' + ToolkitTheme.button(settings.theme) + '</header>' +
      (msg ? '<div class="alert bad" role="alert">' + esc(msg) + '</div>' : '');
  }
  function nav() {
    var t = [['home', 'Home'], ['dates', 'Dates'], ['stock', 'Stock'], ['activity', 'Activity'], ['more', 'More']];
    return '<nav class="tabs noprint" aria-label="Main">' + t.map(function (x) { return '<button data-go="' + x[0] + '"' + ((view === x[0] || (view === 'log' && x[0] === 'home') || (view === 'edit' && x[0] === 'stock')) ? ' aria-current="page"' : '') + '>' + x[1] + '</button>'; }).join('') + '</nav>';
  }
  function statusPill(s) { return '<span class="pill ' + s + '">' + (s === 'out' ? 'Out' : s === 'low' ? 'Low' : 'OK') + '</span>'; }
  function stockText(r) { return qty(r.stock) + ' ' + (r.item.unit === 'lb' ? 'lb' : 'items'); }

  function homeView() {
    var t = P.totals(data), rep = P.expiryReport(data, rules()), list = P.stockList(data).filter(function (r) { return r.status !== 'ok'; });
    var h = '';
    if (!settings.welcomed) {
      h += ToolkitWelcome.html({ title: 'Welcome!', intro: 'This has made-up practice data so you can try everything safely.', doneAct: 'welcomed', doneLabel: 'Got it', steps: [
        'Tap <b>Log donation</b>, pick an item and type the <b>best-by date</b> from the can or box.', 'Tap <b>Dates</b> to see what to use first, print the Saturday list, and pull anything past its date.', 'When you are ready, go to <b>More</b> and choose <b>Start with an empty pantry</b>.'] });
    }
    h += '<div class="big"><button class="in" data-log="in">+ Log donation<br><small>Food coming in</small></button><button class="out" data-log="out">Log distribution<br><small>Food going out</small></button></div>';
    h += '<div class="alert' + (rep.expired.length ? ' bad' : ' ok') + '"><b>' + (rep.expired.length ? rep.expired.length + ' ' + (rep.expired.length === 1 ? 'kind of food is' : 'kinds of food are') + ' past the best-by date: pull ' + (rep.expired.length === 1 ? 'it' : 'them') + ' from the shelf.' : 'Nothing on the shelf is past its best-by date.') + '</b> ' + rep.soon.length + ' ' + (rep.soon.length === 1 ? 'is' : 'are') + ' due in the next ' + rep.rules.soonDays + ' days.<br><button class="small" data-go="dates" style="margin-top:8px">See dates and print the list</button></div>';
    h += '<div class="stats"><div class="stat"><b>' + Math.round(t.lbs).toLocaleString() + '</b>lb on shelf</div><div class="stat"><b>' + t.items + '</b>kinds of item</div><div class="stat"><b' + (t.flagged ? ' style="color:var(--warn)"' : '') + '>' + t.flagged + '</b>need restocking</div></div>';
    if (list.length) {
      h += '<h2>Running low</h2><div class="card">' + list.slice(0, 8).map(function (r) { return '<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0">' + '<span>' + esc(r.item.name) + '</span><span>' + stockText(r) + ' ' + statusPill(r.status) + '</span></div>'; }).join('') +
        (list.length > 8 ? '<p class="muted">and ' + (list.length - 8) + ' more on the Stock page.</p>' : '') + '<button class="small" data-go="stock">See all stock</button></div>';
    } else h += '<div class="alert ok">Everything is stocked above its low level.</div>';
    h += '<h2>Latest entries</h2>' + activityTable(P.activity(data, 5), false);
    return h;
  }

  function activityTable(rows, withUndo) {
    if (!rows.length) return '<p class="muted">Nothing logged yet.</p>';
    return '<div class="card" style="padding:4px 8px;overflow-x:auto"><table><thead><tr><th>Date</th><th>What</th><th class="n">Amount</th><th>Who</th>' + (withUndo ? '<th></th>' : '') + '</tr></thead><tbody>' + rows.map(function (r) {
      var m = r.move, who = m.type === 'adj' ? 'Count correction' : m.type === 'in' ? (m.donor || '') : (m.household ? m.household + (m.size ? ' (' + m.size + ' people)' : '') : '');
      return '<tr><td>' + niceDate(m.date) + '</td><td>' + (m.type === 'in' ? '<b style="color:var(--accent)">In</b> ' : m.type === 'adj' ? '<b style="color:var(--warn)">Fixed</b> ' : '<b style="color:#6fa3ff">Out</b> ') + esc(r.item.name) + '</td><td class="n">' + qty(m.qty) + ' ' + (r.item.unit === 'lb' ? 'lb' : '') + '</td><td>' + esc(who) + '</td>' +
        (withUndo ? '<td><button class="small danger" data-del="' + esc(m.id) + '" aria-label="Delete this entry">Delete</button></td>' : '') + '</tr>';
    }).join('') + '</tbody></table></div>';
  }

  function logView() {
    var f = form, isIn = f.type === 'in', h = '<h2>' + (isIn ? 'Log a donation' : 'Log a distribution') + '</h2>';
    if (f.saved.length) h += '<div class="alert ok" role="status">Saved: ' + f.saved.map(esc).join(', ') + '</div>';
    h += '<div class="card">';
    if (!isIn) {
      h += '<label for="f-household">Household ID or initials</label><input id="f-household" list="hh" value="' + esc(f.household) + '" placeholder="e.g. H-014 or JS" autocomplete="off" autocapitalize="characters"><datalist id="hh">' + P.knownHouseholds(data).map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>';
      h += '<p class="muted" style="margin:4px 0 0">Please do not type full names. An ID or initials is enough.</p>';
      h += '<label for="f-size">People in the household</label><input id="f-size" inputmode="numeric" value="' + esc(f.size) + '" placeholder="e.g. 4">';
    }
    h += '<label for="f-item">Item</label>';
    var sl = P.stockList(data).slice().sort(function (a, b) { return a.item.category.localeCompare(b.item.category) || a.item.name.localeCompare(b.item.name); });
    var cats = {}; sl.forEach(function (r) { (cats[r.item.category] = cats[r.item.category] || []).push(r); });
    h += '<select id="f-item"><option value="">Choose an item…</option>' + Object.keys(cats).map(function (c) {
      return '<optgroup label="' + esc(c) + '">' + cats[c].map(function (r) { return '<option value="' + esc(r.item.id) + '"' + (f.itemId === r.item.id ? ' selected' : '') + '>' + esc(r.item.name) + ' (' + stockText(r) + ' on shelf)</option>'; }).join('') + '</optgroup>';
    }).join('') + '</select>';
    h += '<p><button class="small" data-act="toggleNew">' + (f.newItem ? 'Cancel new item' : 'Not on the list? Add a new item') + '</button></p>';
    if (f.newItem) {
      var n = f.ni;
      h += '<div class="card"><label for="n-name">New item name</label><input id="n-name" value="' + esc(n.name) + '">' +
        '<div class="row2"><div><label for="n-cat">Group</label><select id="n-cat">' + P.CATEGORIES.map(function (c) { return '<option' + (n.category === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></div>' +
        '<div><label for="n-unit">Counted in</label><select id="n-unit"><option value="each"' + (n.unit === 'each' ? ' selected' : '') + '>Items (cans, boxes, packs)</option><option value="lb"' + (n.unit === 'lb' ? ' selected' : '') + '>Pounds (loose or bulk)</option></select></div></div>' +
        '<div class="row2">' + (n.unit === 'each' ? '<div><label for="n-lb">Pounds in one item</label><input id="n-lb" inputmode="decimal" value="' + esc(n.lbPer) + '"></div>' : '') +
        '<div><label for="n-low">Flag as low at or below</label><input id="n-low" inputmode="decimal" value="' + esc(n.low) + '" placeholder="e.g. 12"></div></div></div>';
    }
    h += '<div class="row2"><div><label for="f-qty">' + (isIn ? 'How many (or pounds)' : 'How many (or pounds) given') + '</label><input id="f-qty" inputmode="decimal" value="' + esc(f.qty) + '"></div>' +
      '<div><label for="f-date">Date</label><input id="f-date" value="' + esc(f.date) + '" placeholder="Today (or type 10/9/2026)"></div></div>';
    if (isIn) h += '<label for="f-best">Best-by date on the package (optional but helpful)</label><input id="f-best" value="' + esc(f.bestBy) + '" placeholder="e.g. 10/2027 or 3/15/2027" autocomplete="off"><p class="muted" style="margin:4px 0 0">Month and year is fine: we use the last day of that month. Leave it empty if there is no date.</p>';
    if (isIn) h += '<label for="f-donor">Donor, if known (optional)</label><input id="f-donor" list="dn" value="' + esc(f.donor) + '"><datalist id="dn">' + P.knownDonors(data).map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>';
    h += '<label for="f-note">Note (optional)</label><input id="f-note" value="' + esc(f.note) + '">';
    if (f.err) h += '<div class="err" role="alert">' + esc(f.err) + '</div>';
    h += '<div class="actions"><button class="primary" data-act="saveLog">Save</button>' + '<button data-act="saveMore">Save and add another' + (isIn ? '' : ' item for this household') + '</button><button data-go="home">Cancel</button></div></div>';
    return h;
  }

  function rules() { return P.rules(settings); }
  function lotQty(l) { return qty(l.left) + (l.item.unit === 'lb' ? ' lb' : ''); }
  function niceFull(s) { var d = new Date(s + 'T12:00:00'); return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
  function lotRows(list, past) {
    return list.map(function (l) {
      return '<tr><td style="width:2.2em" aria-hidden="true">&#9744;</td><td>' + esc(l.item.name) + '<br><span class="muted" style="font-size:.85rem">' + esc(l.item.category) + '</span></td><td class="n">' + lotQty(l) + '</td><td>' + niceFull(l.bestBy) + '</td>' +
        '<td><span class="pill ' + (past ? 'out' : l.days <= 7 ? 'low' : 'ok') + '">' + ToolkitDates.describe(l.days) + '</span></td>' +
        (past ? '<td class="noprint"><button class="small" data-pull="' + esc(l.id) + '" aria-label="Mark ' + esc(l.item.name) + ' as pulled from the shelf">Pulled it</button></td>' : '') + '</tr>';
    }).join('');
  }
  function lotTable(list, past) {
    return '<div class="card" style="padding:4px 8px;overflow-x:auto"><table><thead><tr><th><span class="sr">Done</span></th><th>Item</th><th class="n">How many</th><th>Best-by</th><th>' + (past ? 'Past by' : 'Time left') + '</th>' + (past ? '<th class="noprint"><span class="sr">Action</span></th>' : '') + '</tr></thead><tbody>' + lotRows(list, past) + '</tbody></table></div>';
  }
  function datesView() {
    var rep = P.expiryReport(data, rules()), r = rep.rules, h = '<h2>Best-by dates</h2>';
    h += '<div class="stats noprint"><div class="stat"><b' + (rep.expired.length ? ' style="color:var(--bad)"' : '') + '>' + rep.expired.length + '</b>past their date</div><div class="stat"><b' + (rep.soon.length ? ' style="color:var(--warn)"' : '') + '>' + rep.soon.length + '</b>use first</div><div class="stat"><b>' + rep.undated.length + '</b>no date</div></div>';
    h += '<div class="actions noprint"><button class="primary" data-act="printUse">Print the &ldquo;use these first&rdquo; list</button></div>';
    h += '<p class="muted noprint">Dates are a guide. Volunteers decide what to keep or throw away.</p>';
    h += '<div class="print-section" data-section="expired"><div class="print-only"><h1>' + esc(settings.org || 'Pantry') + ': pull these from the shelf</h1><p>Past their best-by date as of ' + niceFull(rep.date) + '. Volunteers decide what to discard.</p></div>';
    h += '<h2 class="noprint">Past their date: pull these</h2>' + (rep.expired.length ? lotTable(rep.expired, true) + '<div class="actions noprint"><button data-act="printExpired">Print this pull list</button></div>' : '<div class="alert ok">Nothing is past its best-by date.</div>') + '</div>';
    h += '<div class="print-section" data-section="use"><div class="print-only"><h1>' + esc(settings.org || 'Pantry') + ': use these first</h1><p>Due within ' + r.soonDays + ' days, soonest first. Printed ' + niceFull(rep.date) + '. Put these at the front of the tables. Dates are a guide; volunteers decide.</p></div>';
    h += '<h2 class="noprint">Use these first (next ' + r.soonDays + ' days)</h2>' + (rep.soon.length ? lotTable(rep.soon, false) : '<div class="alert ok">Nothing is due in the next ' + r.soonDays + ' days.</div>') + '</div>';
    if (rep.undated.length) h += '<details class="noprint"><summary style="min-height:44px;padding:10px 0;cursor:pointer">No date entered (' + rep.undated.length + ')</summary><div class="card"><p class="muted" style="margin-top:0">Check these cans and boxes and log the date next time.</p>' + rep.undated.map(function (l) { return '<div>' + esc(l.item.name) + ': ' + lotQty(l) + '</div>'; }).join('') + '</div></details>';
    h += '<details class="noprint"' + (cutoffOpen ? ' open' : '') + ' id="cutoffs"><summary style="min-height:44px;padding:10px 0;cursor:pointer">More options: change the cutoffs</summary><div class="card">' +
      '<label for="d-soon">&ldquo;Use first&rdquo; list shows food due within this many days</label><input id="d-soon" inputmode="numeric" value="' + r.soonDays + '">' +
      '<label for="d-grace">Extra days after the date before it counts as past (0 = the day after)</label><input id="d-grace" inputmode="numeric" value="' + r.graceDays + '">' +
      '<p class="muted">Many best-by dates are about quality, not safety. Set whatever rule your pantry follows.</p><div class="actions"><button data-act="datesCsv">Download for spreadsheet</button></div></div></details>';
    return h;
  }

  function stockView() {
    var rows = P.stockList(data), q = filter.toLowerCase(), rank = { out: 0, low: 1, ok: 2 };
    rows = rows.filter(function (r) { return (stockFilter === 'all' || r.status !== 'ok') && (!q || (r.item.name + ' ' + r.item.category).toLowerCase().indexOf(q) >= 0); });
    var keyOf = { item: function (r) { return r.item.name.toLowerCase(); }, stock: function (r) { return r.stock; }, low: function (r) { return r.item.low; }, status: function (r) { return rank[r.status]; } }[sortKey];
    rows.sort(function (a, b) { var x = keyOf(a), y = keyOf(b); return (x < y ? -1 : x > y ? 1 : a.item.name.localeCompare(b.item.name)) * (x === y ? 1 : sortDir); });
    function th(key, label, cls) {
      var on = sortKey === key;
      return '<th class="' + cls + '" aria-sort="' + (on ? (sortDir > 0 ? 'ascending' : 'descending') : 'none') + '"><button class="small sortbtn" data-sort="' + key + '" aria-label="Sort by ' + label + '">' + label + (on ? (sortDir > 0 ? ' ▲' : ' ▼') : ' ↕') + '</button></th>';
    }
    var h = '<h2>Stock on the shelf</h2><div class="chips noprint"><button data-sf="all" aria-pressed="' + (stockFilter === 'all') + '">All items</button><button data-sf="low" aria-pressed="' + (stockFilter === 'low') + '">Low or out only</button></div>' +
      '<input class="search" id="search" type="search" placeholder="Search stock" aria-label="Search stock" value="' + esc(filter) + '">';
    h += '<div class="card" style="padding:4px 8px;overflow-x:auto"><table><thead><tr>' + th('item', 'Item', '') + th('stock', 'On shelf', 'n') + th('low', 'Low at', 'n') + th('status', 'Status', '') + '<th><span class="sr">Change</span></th></tr></thead><tbody>' +
      (rows.map(function (r) { return '<tr><td>' + esc(r.item.name) + '<br><span class="muted" style="font-size:.85rem">' + esc(r.item.category) + '</span></td><td class="n">' + stockText(r) + '</td><td class="n">' + (r.item.low || '–') + '</td><td>' + statusPill(r.status) + '</td><td class="noprint"><button class="small" data-edit="' + esc(r.item.id) + '" aria-label="Fix count or change low level for ' + esc(r.item.name) + '">Fix / edit</button></td></tr>'; }).join('') || '<tr><td colspan="5" class="muted">Nothing to show.</td></tr>') + '</tbody></table></div>';
    h += '<div class="actions noprint"><button data-act="printPage">Print this list</button><button data-act="stockCsv">Download for spreadsheet</button></div>';
    return h;
  }

  function activityView() {
    return '<h2>All entries</h2><p class="muted">Made a mistake? Delete the entry, then log it again. You get a few seconds to undo a delete.</p>' + activityTable(P.activity(data, 200), true) +
      '<div class="actions noprint"><button data-act="activityCsv">Download for spreadsheet</button></div>';
  }

  function editView() {
    var item = P.findItem(data, editId), e = editForm;
    if (!item) { view = 'stock'; return stockView(); }
    var unit = item.unit === 'lb' ? 'pounds' : 'items';
    var h = '<h2>Fix or edit: ' + esc(item.name) + '</h2><div class="card">' +
      '<h3 style="margin-top:0">Is the count wrong?</h3><p class="muted">Count what is really on the shelf and type it here. We keep a note of the correction. It does not count as a donation or as food given out.</p>' +
      '<label for="e-count">On the shelf now (' + unit + ')</label><input id="e-count" inputmode="decimal" value="' + esc(e.count) + '">' +
      '<h3>How many counts as low?</h3><label for="e-low">Flag as low at or below (' + unit + '; 0 means never flag)</label><input id="e-low" inputmode="decimal" value="' + esc(e.low) + '">' +
      '<details' + (e.more ? ' open' : '') + '><summary style="min-height:44px;padding:10px 0;cursor:pointer">More options (name, group, weight)</summary>' +
      '<label for="e-name">Name</label><input id="e-name" value="' + esc(e.name) + '"><label for="e-cat">Group</label><select id="e-cat">' + P.CATEGORIES.map(function (c) { return '<option' + (e.category === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>' +
      (item.unit === 'lb' ? '' : '<label for="e-lb">Pounds in one item</label><input id="e-lb" inputmode="decimal" value="' + esc(e.lbPer) + '">') + '</details>';
    if (e.err) h += '<div class="err" role="alert">' + esc(e.err) + '</div>';
    return h + '<div class="actions"><button class="primary" data-act="saveEdit">Save</button><button data-go="stock">Cancel</button></div></div>';
  }

  function moreView() {
    return '<h2>Back up and share</h2><div class="card"><p>Save a copy of everything to a file. Keep a copy somewhere other than this tablet.</p><div class="actions"><button class="primary" data-act="backup">Back up now</button><button data-act="restoreBtn">Restore from a backup file</button></div>' + ToolkitBackup.fileInput('restoreFile') + '</div>' +
      '<h2>Spreadsheets</h2><div class="card"><div class="actions"><button data-act="stockCsv">Stock list</button><button data-act="activityCsv">All donations and distributions</button></div></div>' +
      '<h2>Settings</h2><div class="card"><label for="org">Pantry name</label><input id="org" value="' + esc(settings.org || '') + '"></div>' +
      '<h2>More options</h2><div class="card"><div class="actions" style="margin-top:0"><button data-act="sample">Start over with practice data</button><button class="danger" data-act="empty">Start with an empty pantry</button></div><p class="muted">Both ask you to confirm first, and neither can be undone, so back up first if you have real entries.</p></div>' +
      '<p class="muted">Saved in this browser on this device. Free to use and share (MIT license).</p>';
  }

  function render() {
    applyTheme();
    var h = header() + ({ home: homeView, dates: datesView, log: logView, stock: stockView, activity: activityView, more: moreView, edit: editView }[view])();
    if (toast) h += '<div class="toast" role="status"><span>' + esc(toast.text) + '</span>' + (toast.undo ? '<button data-act="undo">Undo</button>' : '') + '</div>';
    var focusId = document.activeElement && document.activeElement.id, pos = document.activeElement && document.activeElement.selectionStart;
    $app.innerHTML = h + nav();
    if (focusId === 'search') { var s = document.getElementById('search'); s.focus(); try { s.setSelectionRange(pos, pos); } catch (e) {} }
  }

  function readForm() {
    if (!form) return;
    var g = function (id) { var e = document.getElementById(id); return e ? e.value : null; };
    var v;
    if ((v = g('f-household')) !== null) form.household = v;
    if ((v = g('f-size')) !== null) form.size = v;
    if ((v = g('f-item')) !== null) form.itemId = v;
    if ((v = g('f-qty')) !== null) form.qty = v;
    if ((v = g('f-date')) !== null) form.date = v;
    if ((v = g('f-donor')) !== null) form.donor = v;
    if ((v = g('f-best')) !== null) form.bestBy = v;
    if ((v = g('f-note')) !== null) form.note = v;
    if (form.newItem) { form.ni.name = g('n-name') || ''; form.ni.category = g('n-cat') || 'Other'; form.ni.unit = g('n-unit') || 'each'; form.ni.low = g('n-low') || ''; if (g('n-lb') !== null) form.ni.lbPer = g('n-lb'); }
  }

  function doSave(again) {
    readForm(); var f = form; f.err = '';
    if (f.type === 'out' && !P.cleanHousehold(f.household)) { f.err = 'Please enter the household ID or initials.'; return render(); }
    if (f.newItem) {
      var r0 = P.addItem(data, f.ni); if (r0.error) { f.err = r0.error; return render(); }
      f.itemId = r0.item.id; f.newItem = false;
    }
    var r = P.addMove(data, f);
    if (r.error) { f.err = r.error; return render(); }
    save();
    var item = P.findItem(data, r.move.itemId), line = qty(r.move.qty) + (item.unit === 'lb' ? ' lb ' : ' × ') + item.name;
    var id = r.move.id;
    if (again) {
      f.saved.push(line); f.itemId = ''; f.qty = ''; f.note = ''; f.bestBy = '';
      if (r.warning) f.err = r.warning;
      render(); var e = document.getElementById('f-item'); if (e) e.focus(); return;
    }
    var all = f.saved.concat([line]);
    form = null; view = 'home'; msg = r.warning || '';
    showToast('Saved: ' + all.join(', '), function () { P.removeMove(data, id); save(); });
    render();
  }

  $app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-pull],[data-go],[data-act],[data-log],[data-sf],[data-del],[data-sort],[data-edit]'); if (!t) return;
    if (t.dataset.pull) {
      var pr = P.pullLot(data, t.dataset.pull, 'Pulled: past its best-by date'); if (pr.error) { msg = pr.error; return render(); }
      save(); var pm = pr.move; showToast(pr.lot.item.name + ' marked as pulled.', function () { P.removeMove(data, pm.id); save(); }); return render();
    }
    if (t.dataset.go) { form = null; return go(t.dataset.go); }
    if (t.dataset.log) { form = newForm(t.dataset.log); view = 'log'; msg = ''; window.scrollTo(0, 0); render(); var el = document.getElementById(form.type === 'out' ? 'f-household' : 'f-item'); if (el) el.focus(); return; }
    if (t.dataset.edit) {
      var it = P.findItem(data, t.dataset.edit); editId = it.id;
      editForm = { count: qty(P.stockOf(data, it.id)), low: String(it.low), name: it.name, category: it.category, lbPer: String(it.lbPer), err: '', more: false };
      return go('edit');
    }
    if (t.dataset.sort) { if (sortKey === t.dataset.sort) sortDir = -sortDir; else { sortKey = t.dataset.sort; sortDir = 1; } return render(); }
    if (t.dataset.sf) { stockFilter = t.dataset.sf; return render(); }
    if (t.dataset.del) {
      var m = P.removeMove(data, t.dataset.del); save(); showToast('Entry deleted.', function () { P.restoreMove(data, m); save(); }); return render();
    }
    var a = t.dataset.act;
    if (a === 'theme') { ToolkitTheme.toggle(settings); S.saveSettings(settings); readForm(); return render(); }
    if (a === 'welcomed') { settings.welcomed = true; S.saveSettings(settings); return render(); }
    if (a === 'saveEdit') {
      var g = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
      editForm.count = g('e-count'); editForm.low = g('e-low'); editForm.name = g('e-name'); editForm.category = g('e-cat'); if (document.getElementById('e-lb')) editForm.lbPer = g('e-lb');
      editForm.more = !!document.querySelector('details[open]');
      var u1 = P.updateItem(data, editId, editForm); if (u1.error) { editForm.err = u1.error; return render(); }
      var u2 = P.adjustStock(data, editId, editForm.count); if (u2.error) { editForm.err = u2.error; return render(); }
      save(); var mv = u2.move, nm = editForm.name;
      msg = ''; view = 'stock'; showToast(mv ? nm + ' saved. Count corrected.' : nm + ' saved.', mv ? function () { P.removeMove(data, mv.id); save(); } : null); return render();
    }
    if (a === 'saveLog') return doSave(false);
    if (a === 'saveMore') return doSave(true);
    if (a === 'toggleNew') { readForm(); form.newItem = !form.newItem; return render(); }
    if (a === 'undo') { var u = toast && toast.undo; toast = null; if (u) u(); return render(); }
    if (a === 'printPage') return ToolkitPrint.print('Pantry stock ' + P.today());
    if (a === 'printUse') return ToolkitPrint.printSection('Use these first ' + P.today(), 'use');
    if (a === 'printExpired') return ToolkitPrint.printSection('Pull these ' + P.today(), 'expired');
    if (a === 'datesCsv') return ToolkitCsv.download('pantry-dates-' + P.today() + '.csv', P.expiryRows(data, rules()));
    if (a === 'stockCsv') return ToolkitCsv.download('pantry-stock-' + P.today() + '.csv', P.stockRows(data));
    if (a === 'activityCsv') return ToolkitCsv.download('pantry-entries-' + P.today() + '.csv', P.activityRows(data));
    if (a === 'backup') { ToolkitBackup.save({ app: 'pantry-tracker', filename: 'pantry-backup-' + P.today() + '.json', data: data, settings: { org: settings.org || '', soonDays: rules().soonDays, graceDays: rules().graceDays } }); settings.lastBackup = P.today(); S.saveSettings(settings); msg = 'Backup file saved to your Downloads. Put a copy in your shared folder or on a USB stick.'; return render(); }
    if (a === 'restoreBtn') return ToolkitBackup.pick('restoreFile');
    if (a === 'sample') { if (confirm('Replace everything with made-up practice data?')) { data = SAMPLE.make(); settings.org = SAMPLE.org; save(); S.saveSettings(settings); msg = 'Practice data loaded.'; go('home'); } return; }
    if (a === 'empty') { if (confirm('Delete ALL entries and items and start with an empty pantry? This cannot be undone.')) { data = P.empty(); save(); msg = 'Empty pantry ready. Use "Log donation" and "Not on the list? Add a new item" to begin.'; go('home'); } return; }
  });
  $app.addEventListener('change', function (e) {
    if (e.target.id === 'restoreFile') {
      var file = e.target.files[0]; if (!file) return;
      ToolkitBackup.read(file, function (err, bk) {
        try {
          if (err) throw err;
          var d = P.sanitize(bk.data);
          if (!d.items.length) throw new Error('empty');
          if (!confirm('Replace what is on this tablet with the backup (' + d.items.length + ' items, ' + d.moves.length + ' entries)?')) return;
          data = d; if (bk.settings.org) settings.org = bk.settings.org; if (bk.settings.soonDays != null) { settings.soonDays = bk.settings.soonDays; settings.graceDays = bk.settings.graceDays; } save(); S.saveSettings(settings); msg = 'Backup restored.'; go('home');
        } catch (x) { msg = 'That file does not look like a pantry backup. Choose a file named pantry-backup-….json.'; render(); }
      });
      return;
    }
    if (e.target.id === 'd-soon' || e.target.id === 'd-grace') {
      settings.soonDays = document.getElementById('d-soon').value; settings.graceDays = document.getElementById('d-grace').value;
      var nr = rules(); settings.soonDays = nr.soonDays; settings.graceDays = nr.graceDays; S.saveSettings(settings); cutoffOpen = true; return render();
    }
    if (e.target.id === 'org') { settings.org = e.target.value.trim(); S.saveSettings(settings); return; }
    if (view !== 'log' || !form) return;
    var id = e.target.id; readForm();
    if (id === 'f-household' && form.type === 'out') { var s = P.lastSize(data, form.household); if (s && !form.size) { form.size = String(s); document.getElementById('f-size').value = form.size; } }
    if (id === 'n-unit') render();
  });
  $app.addEventListener('input', function (e) { if (e.target.id === 'search') { filter = e.target.value; render(); } });
  $app.addEventListener('keydown', function (e) { if (e.key === 'Enter' && view === 'log' && e.target.tagName === 'INPUT') { e.preventDefault(); doSave(false); } });
  render();
})();
