(function () {
  'use strict';
  var P = window.Pantry, S = window.PantryStorage, SAMPLE = window.PantrySample;
  var settings = S.loadSettings(), data = S.load(), view = 'home', form = null, toast = null, toastTimer = null, filter = '', stockFilter = 'all', msg = '';
  if (!data) { data = SAMPLE.make(); settings.org = settings.org || SAMPLE.org; settings.sample = true; S.save(data); S.saveSettings(settings); }
  var $app = document.getElementById('app');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function qty(n) { return String(P.round(n)); }
  function niceDate(s) { var d = new Date(s + 'T12:00:00'); return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }
  function save() { var ok = S.save(data); if (!ok) msg = 'This browser would not save your entries. Use Back up now (under More) before closing.'; }
  function applyTheme() { document.documentElement.classList.toggle('light', settings.theme === 'light'); document.querySelector('meta[name=color-scheme]').content = settings.theme === 'light' ? 'light' : 'dark'; }
  function showToast(text, undo) {
    clearTimeout(toastTimer); toast = { text: text, undo: undo }; toastTimer = setTimeout(function () { toast = null; render(); }, 8000);
  }
  function go(v) { view = v; msg = ''; window.scrollTo(0, 0); render(); }
  function download(name, text, type) {
    var b = new Blob([text], { type: type || 'text/plain' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function newForm(type) { return { type: type, itemId: '', qty: '', date: '', donor: '', household: '', size: '', note: '', newItem: false, ni: { name: '', category: 'Other', unit: 'each', lbPer: '1', low: '' }, err: '', saved: [] }; }

  function header() {
    return '<header class="top"><h1>' + esc(settings.org || 'Pantry tracker') + '</h1>' +
      '<button class="small" data-act="theme" aria-label="Switch between dark and light mode">' + (settings.theme === 'light' ? 'Dark mode' : 'Light mode') + '</button></header>' +
      (msg ? '<div class="alert bad" role="alert">' + esc(msg) + '</div>' : '');
  }
  function nav() {
    var t = [['home', 'Home'], ['stock', 'Stock'], ['activity', 'Activity'], ['more', 'More']];
    return '<nav class="tabs noprint" aria-label="Main">' + t.map(function (x) { return '<button data-go="' + x[0] + '"' + ((view === x[0] || (view === 'log' && x[0] === 'home')) ? ' aria-current="page"' : '') + '>' + x[1] + '</button>'; }).join('') + '</nav>';
  }
  function statusPill(s) { return '<span class="pill ' + s + '">' + (s === 'out' ? 'Out' : s === 'low' ? 'Low' : 'OK') + '</span>'; }
  function stockText(r) { return qty(r.stock) + ' ' + (r.item.unit === 'lb' ? 'lb' : 'items'); }

  function homeView() {
    var t = P.totals(data), list = P.stockList(data).filter(function (r) { return r.status !== 'ok'; });
    var h = '';
    if (!settings.welcomed) {
      h += '<div class="card"><h2 style="margin-top:0">Welcome!</h2><p>This has made-up practice data so you can try everything safely.</p><ol><li>Tap <b>Log distribution</b> and save one for a household.</li><li>Tap <b>Stock</b> to see the shelf update and what is running low.</li><li>When you are ready, go to <b>More</b> and choose <b>Start with an empty pantry</b>.</li></ol><button class="primary" data-act="welcomed">Got it</button></div>';
    }
    h += '<div class="big"><button class="in" data-log="in">+ Log donation<br><small>Food coming in</small></button><button class="out" data-log="out">Log distribution<br><small>Food going out</small></button></div>';
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
      var m = r.move, who = m.type === 'in' ? (m.donor || '') : (m.household ? m.household + (m.size ? ' (' + m.size + ' people)' : '') : '');
      return '<tr><td>' + niceDate(m.date) + '</td><td>' + (m.type === 'in' ? '<b style="color:var(--accent)">In</b> ' : '<b style="color:#6fa3ff">Out</b> ') + esc(r.item.name) + '</td><td class="n">' + qty(m.qty) + ' ' + (r.item.unit === 'lb' ? 'lb' : '') + '</td><td>' + esc(who) + '</td>' +
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
    if (isIn) h += '<label for="f-donor">Donor, if known (optional)</label><input id="f-donor" list="dn" value="' + esc(f.donor) + '"><datalist id="dn">' + P.knownDonors(data).map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>';
    h += '<label for="f-note">Note (optional)</label><input id="f-note" value="' + esc(f.note) + '">';
    if (f.err) h += '<div class="err" role="alert">' + esc(f.err) + '</div>';
    h += '<div class="actions"><button class="primary" data-act="saveLog">Save</button>' + '<button data-act="saveMore">Save and add another' + (isIn ? '' : ' item for this household') + '</button><button data-go="home">Cancel</button></div></div>';
    return h;
  }

  function stockView() {
    var rows = P.stockList(data), q = filter.toLowerCase();
    rows = rows.filter(function (r) { return (stockFilter === 'all' || r.status !== 'ok') && (!q || (r.item.name + ' ' + r.item.category).toLowerCase().indexOf(q) >= 0); });
    var h = '<h2>Stock on the shelf</h2><div class="chips noprint"><button data-sf="all" aria-pressed="' + (stockFilter === 'all') + '">All items</button><button data-sf="low" aria-pressed="' + (stockFilter === 'low') + '">Low or out only</button></div>' +
      '<input class="search" id="search" type="search" placeholder="Search stock" aria-label="Search stock" value="' + esc(filter) + '">';
    h += '<div class="card" style="padding:4px 8px;overflow-x:auto"><table><thead><tr><th>Item</th><th class="n">On shelf</th><th class="n">Low at</th><th>Status</th></tr></thead><tbody>' +
      (rows.map(function (r) { return '<tr><td>' + esc(r.item.name) + '<br><span class="muted" style="font-size:.85rem">' + esc(r.item.category) + '</span></td><td class="n">' + stockText(r) + '</td><td class="n">' + (r.item.low || '–') + '</td><td>' + statusPill(r.status) + '</td></tr>'; }).join('') || '<tr><td colspan="4" class="muted">Nothing to show.</td></tr>') + '</tbody></table></div>';
    h += '<div class="actions noprint"><button data-act="printPage">Print this list</button><button data-act="stockCsv">Download for spreadsheet</button></div>';
    return h;
  }

  function activityView() {
    return '<h2>All entries</h2><p class="muted">Made a mistake? Delete the entry, then log it again. You get a few seconds to undo a delete.</p>' + activityTable(P.activity(data, 200), true) +
      '<div class="actions noprint"><button data-act="activityCsv">Download for spreadsheet</button></div>';
  }

  function moreView() {
    return '<h2>Back up and share</h2><div class="card"><p>Save a copy of everything to a file. Keep a copy somewhere other than this tablet.</p><div class="actions"><button class="primary" data-act="backup">Back up now</button><button data-act="restoreBtn">Restore from a backup file</button></div><input type="file" id="restoreFile" accept=".json,application/json" class="sr" tabindex="-1" aria-label="Choose backup file"></div>' +
      '<h2>Spreadsheets</h2><div class="card"><div class="actions"><button data-act="stockCsv">Stock list</button><button data-act="activityCsv">All donations and distributions</button></div></div>' +
      '<h2>Settings</h2><div class="card"><label for="org">Pantry name</label><input id="org" value="' + esc(settings.org || '') + '"></div>' +
      '<h2>More options</h2><div class="card"><div class="actions" style="margin-top:0"><button data-act="sample">Start over with practice data</button><button class="danger" data-act="empty">Start with an empty pantry</button></div><p class="muted">Both ask you to confirm first, and neither can be undone, so back up first if you have real entries.</p></div>' +
      '<p class="muted">Saved in this browser on this device. Free to use and share (MIT license).</p>';
  }

  function render() {
    applyTheme();
    var h = header() + ({ home: homeView, log: logView, stock: stockView, activity: activityView, more: moreView }[view])();
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
      f.saved.push(line); f.itemId = ''; f.qty = ''; f.note = '';
      if (r.warning) f.err = r.warning;
      render(); var e = document.getElementById('f-item'); if (e) e.focus(); return;
    }
    var all = f.saved.concat([line]);
    form = null; view = 'home'; msg = r.warning || '';
    showToast('Saved: ' + all.join(', '), function () { P.removeMove(data, id); save(); });
    render();
  }

  $app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go],[data-act],[data-log],[data-sf],[data-del]'); if (!t) return;
    if (t.dataset.go) { form = null; return go(t.dataset.go); }
    if (t.dataset.log) { form = newForm(t.dataset.log); view = 'log'; msg = ''; window.scrollTo(0, 0); render(); var el = document.getElementById(form.type === 'out' ? 'f-household' : 'f-item'); if (el) el.focus(); return; }
    if (t.dataset.sf) { stockFilter = t.dataset.sf; return render(); }
    if (t.dataset.del) {
      var m = P.removeMove(data, t.dataset.del); save(); showToast('Entry deleted.', function () { P.restoreMove(data, m); save(); }); return render();
    }
    var a = t.dataset.act;
    if (a === 'theme') { settings.theme = settings.theme === 'light' ? 'dark' : 'light'; S.saveSettings(settings); readForm(); return render(); }
    if (a === 'welcomed') { settings.welcomed = true; S.saveSettings(settings); return render(); }
    if (a === 'saveLog') return doSave(false);
    if (a === 'saveMore') return doSave(true);
    if (a === 'toggleNew') { readForm(); form.newItem = !form.newItem; return render(); }
    if (a === 'undo') { var u = toast && toast.undo; toast = null; if (u) u(); return render(); }
    if (a === 'printPage') return window.print();
    if (a === 'stockCsv') return download('pantry-stock-' + P.today() + '.csv', '﻿' + P.stockCsv(data), 'text/csv');
    if (a === 'activityCsv') return download('pantry-entries-' + P.today() + '.csv', '﻿' + P.activityCsv(data), 'text/csv');
    if (a === 'backup') { download('pantry-backup-' + P.today() + '.json', JSON.stringify({ app: 'pantry-tracker', org: settings.org || '', savedAt: new Date().toISOString(), data: data }, null, 1), 'application/json'); settings.lastBackup = P.today(); S.saveSettings(settings); msg = 'Backup file saved to your Downloads. Put a copy in your shared folder or on a USB stick.'; return render(); }
    if (a === 'restoreBtn') return document.getElementById('restoreFile').click();
    if (a === 'sample') { if (confirm('Replace everything with made-up practice data?')) { data = SAMPLE.make(); settings.org = SAMPLE.org; save(); S.saveSettings(settings); msg = 'Practice data loaded.'; go('home'); } return; }
    if (a === 'empty') { if (confirm('Delete ALL entries and items and start with an empty pantry? This cannot be undone.')) { data = P.empty(); save(); msg = 'Empty pantry ready. Use "Log donation" and "Not on the list? Add a new item" to begin.'; go('home'); } return; }
  });
  $app.addEventListener('change', function (e) {
    if (e.target.id === 'restoreFile') {
      var file = e.target.files[0]; if (!file) return; var rd = new FileReader();
      rd.onload = function () {
        try {
          var j = JSON.parse(rd.result), d = P.sanitize(j.data || j);
          if (!d.items.length) throw new Error('empty');
          if (!confirm('Replace what is on this tablet with the backup (' + d.items.length + ' items, ' + d.moves.length + ' entries)?')) return;
          data = d; if (j.org) settings.org = j.org; save(); S.saveSettings(settings); msg = 'Backup restored.'; go('home');
        } catch (err) { msg = 'That file does not look like a pantry backup. Choose a file named pantry-backup-….json.'; render(); }
      };
      rd.readAsText(file); return;
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
