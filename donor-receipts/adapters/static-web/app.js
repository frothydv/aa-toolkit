/* Donor gifts and receipt letters UI. Plain JS; talks to Donors (core) and DonorStorage (adapter). */
(function () {
  'use strict';
  var C = window.Donors, S = window.DonorStorage, SAMPLE = window.DonorSample, IM = window.DonorImport, Dt = window.ToolkitDates;
  var settings = S.loadSettings(), data = S.load(), screen = 'log', toastTimer = null, storageOk = true;
  var imp = null, form = null, giftYear = null, letterYear = null, $app = document.getElementById('app');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fresh() { return { q: '', donorId: null, address: '', date: Dt.today(), kind: 'cash', amount: '', desc: '', returned: '', source: '', editId: null, err: '' }; }
  function seed() {
    data = SAMPLE.build(); settings.org = SAMPLE.orgName; settings.letterhead = SAMPLE.letterhead; settings.signer = SAMPLE.signer; settings.signerTitle = SAMPLE.signerTitle; settings.ein = SAMPLE.ein; settings.sample = true;
    save();
  }
  if (!data) { seed(); settings.welcome = true; save(); }
  form = fresh(); ToolkitTheme.apply(settings.theme);
  function save() { storageOk = S.save(data); S.saveSettings(settings); }
  function snapshot() { return JSON.stringify(data); }
  function toast(msg, undoSnap) {
    var old = document.getElementById('toast'); if (old) old.remove(); clearTimeout(toastTimer);
    var t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (undoSnap ? '<button type="button">Undo</button>' : '');
    document.body.appendChild(t);
    if (undoSnap) t.querySelector('button').onclick = function () { data = C.sanitize(JSON.parse(undoSnap)); save(); t.remove(); render(); };
    toastTimer = setTimeout(function () { t.remove(); }, 8000);
  }
  function go(s) { screen = s; render(); window.scrollTo(0, 0); }
  function donor(id) { return data.donors.filter(function (x) { return x.id === id; })[0]; }
  function lastYear() { var ys = C.years(data), cur = new Date().getFullYear() - 1; return ys.indexOf(cur) >= 0 ? cur : (ys[0] || cur); }
  function yearSelect(id, val) {
    var ys = C.years(data); if (ys.indexOf(val) < 0) ys.unshift(val);
    return '<select id="' + id + '" aria-label="Which year">' + ys.map(function (y) { return '<option' + (y === val ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select>';
  }

  function header() {
    return '<header class="top noprint"><h1>' + esc(settings.org || 'Donor gifts') + '</h1><span class="muted small" id="net">Saved on this device only</span>' + ToolkitTheme.button(settings.theme) + '</header>' +
      (settings.sample ? '<div class="sample noprint">Practice mode: every donor here is made up. Go to More → “Start fresh” when you are ready for real gifts.</div>' : '') +
      (storageOk ? '' : '<div class="alert noprint"><b>This browser is not saving.</b> Your gifts will be lost if you close this page. Open the page in a normal (not private) window.</div>');
  }
  function tabs() {
    var t = [['log', '➕ Log a gift'], ['import', '📥 Import Venmo / PayPal'], ['gifts', '📒 All gifts'], ['letters', '✉ Year-end letters'], ['more', '⋯ More']];
    return '<nav class="tabs noprint" aria-label="Main">' + t.map(function (x) { return '<button type="button" data-act="tab" data-v="' + x[0] + '"' + (screen === x[0] ? ' aria-current="page"' : '') + '>' + x[1] + '</button>'; }).join('') + '</nav>';
  }
  function welcome() {
    if (!settings.welcome) return '';
    return ToolkitWelcome.html({ title: 'Welcome! Three things to try', steps: [
      'Type <b>“gra”</b> in the donor box below, tap <b>Grace Bellamy</b>, type an amount and tap <b>Save this gift</b>.',
      'Open <b>Year-end letters</b> to see last year’s letters, already written for every donor. Tap <b>Print all letters</b>.',
      'Open <b>More</b> to put in your own letterhead, then <b>Start fresh</b> to clear the practice donors. Nothing ever leaves this device.'] });
  }

  function logScreen() {
    var f = form, picked = f.donorId ? donor(f.donorId) : null;
    return welcome() + '<h2>' + (f.editId ? 'Change this gift' : 'Log a gift') + '</h2><div class="card">' +
      '<label for="q">Who gave it? Start typing a name</label>' +
      (picked ? '<div class="res here"><div class="who"><b>' + esc(picked.name) + '</b></div><button class="small" type="button" data-act="unpick">Change donor</button></div>'
        : '<input id="q" class="search" type="search" autocomplete="off" autocapitalize="words" spellcheck="false" value="' + esc(f.q) + '" placeholder="Donor name"><div id="sugg" class="sugg" aria-live="polite"></div>') +
      '<div id="newdonor"></div>' +
      '<div class="chips" role="group" aria-label="Kind of gift" style="margin-top:12px"><button type="button" data-act="kind" data-v="cash" aria-pressed="' + (f.kind === 'cash') + '">💵 Cash or check</button><button type="button" data-act="kind" data-v="goods" aria-pressed="' + (f.kind === 'goods') + '">🥫 Food or goods</button></div>' +
      '<div class="row2"><div><label for="gd">Date of the gift</label><input id="gd" value="' + esc(f.date) + '" placeholder="12/15/2026"></div>' +
      (f.kind === 'cash' ? '<div><label for="ga">Amount</label><input id="ga" inputmode="decimal" value="' + esc(f.amount) + '" placeholder="$50"></div>' : '') + '</div>' +
      (f.kind === 'goods' ? '<label for="gx">What was given? (describe it, no dollar value)</label><input id="gx" value="' + esc(f.desc) + '" placeholder="12 cans of soup and 2 bags of rice">'
        : '') +
      '<details' + (f.returned || f.source || (f.kind === 'cash' && f.desc) ? ' open' : '') + '><summary>More options</summary>' +
      (f.kind === 'cash' ? '<label for="gx">Note (like “memorial gift for …”, optional)</label><input id="gx" value="' + esc(f.desc) + '">' : '') +
      '<label for="gs">How did it come in?</label><select id="gs">' + ['', 'Check', 'Cash', 'Venmo', 'PayPal', 'Other'].map(function (o) { return '<option value="' + o + '"' + (f.source === o ? ' selected' : '') + '>' + (o || 'Not sure / do not say') + '</option>'; }).join('') + '</select>' +
      '<label for="gr">Did they get something in return? (like a dinner ticket. Say what and its estimated value.)</label><input id="gr" value="' + esc(f.returned) + '" placeholder="Leave empty if nothing"></details>' +
      '<div id="ferr" class="err" role="alert">' + esc(f.err) + '</div>' +
      '<div class="actions"><button class="primary" type="button" data-act="saveGift">' + (f.editId ? 'Save changes' : 'Save this gift') + '</button>' + (f.editId ? '<button type="button" data-act="cancelEdit">Cancel</button>' : '') + '</div></div>' +
      (f.editId ? '' : recent());
  }
  function recent() {
    var gs = data.gifts.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 5);
    return gs.length ? '<h2>Latest gifts</h2>' + gs.map(giftRow).join('') : '';
  }
  function paintSugg() {
    var box = document.getElementById('sugg'), nd = document.getElementById('newdonor'); if (!box) return;
    var q = form.q.trim(), res = q ? C.search(data, q, 6) : [], exact = q && C.findDonor(data, q);
    box.innerHTML = res.map(function (x) { return '<button type="button" data-act="pick" data-id="' + x.id + '">' + esc(x.name) + '<span class="muted small"> ' + esc(x.address.split('\n')[0] || '') + '</span></button>'; }).join('') +
      (q && !exact ? '<p class="muted">No exact match. Keep going and we will add “' + esc(C.tidyName(q)) + '” as a new donor.</p>' : '');
    nd.innerHTML = q && !exact ? '<label for="addr">Mailing address for the letter (optional, add it any time)</label><textarea id="addr" placeholder="12 Maple Lane&#10;Springfield, XX 00000">' + esc(form.address) + '</textarea>' : '';
  }
  function giftRow(g) {
    var dn = donor(g.donorId);
    return '<div class="res"><div class="who"><b>' + esc(dn ? dn.name : '?') + '</b><div class="muted small">' + esc(C.fmtDate(g.date)) + ' · ' + (g.kind === 'cash' ? '<b>' + C.money(g.cents) + '</b>' + (g.desc ? ' · ' + esc(g.desc) : '') : '🥫 ' + esc(g.desc)) + (g.source ? ' · ' + esc(g.source) : '') + (g.returned ? ' · gave back: ' + esc(g.returned) : '') + '</div></div>' +
      '<div class="btns"><button class="small" type="button" data-act="editGift" data-id="' + g.id + '" aria-label="Change gift from ' + esc(dn ? dn.name : '') + '">Change</button><button class="small danger" type="button" data-act="delGift" data-id="' + g.id + '" aria-label="Delete gift from ' + esc(dn ? dn.name : '') + '">Delete</button></div></div>';
  }
  function giftsScreen() {
    var y = giftYear || lastYear(), gs = data.gifts.filter(function (g) { return C.yearOf(g) === y; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var cash = gs.reduce(function (s, g) { return s + (g.kind === 'cash' ? g.cents : 0); }, 0);
    return '<h2>All gifts</h2><div class="card"><label for="gy">Year</label>' + yearSelect('gy', y) + '<p><b>' + gs.length + '</b> gifts · cash total <b>' + C.money(cash) + '</b></p>' +
      '<div class="actions" style="margin-top:0"><button type="button" data-act="csv">Download for spreadsheet</button></div></div>' + (gs.length ? gs.map(giftRow).join('') : '<p class="muted">No gifts in ' + y + ' yet.</p>');
  }

  function importScreen() {
    var intro = '<h2>Import gifts from Venmo or PayPal</h2><div class="card"><p>Download your list of transactions from Venmo or PayPal, then choose that file here. Donors are matched by name, so nobody gets retyped. Nothing is uploaded: the file is read on this device.</p>' +
      '<div class="actions"><button class="primary" type="button" data-act="impPick">Choose the file…</button></div>' + '<input id="impfile" type="file" accept=".csv,text/csv,text/plain" class="sr" tabindex="-1" aria-label="Choose the Venmo or PayPal file">' +
      (imp && imp.err ? '<div class="err" role="alert">' + esc(imp.err) + '</div>' : '') +
      '<details><summary>How do I get the file?</summary><p><b>Venmo:</b> on venmo.com choose <b>Statements</b>, pick the dates, then <b>Download CSV</b>.</p><p><b>PayPal:</b> log in, choose <b>Activity</b> → <b>Statements</b> → <b>Activity download</b>, pick the dates, format <b>CSV</b>, then <b>Create report</b> and download it.</p><p>A plain spreadsheet saved as CSV also works if it has columns headed Date, Name and Amount.</p><p class="muted small">Only money coming in is read. Refunds, fees, transfers to your bank and unfinished payments are skipped. Each gift is for the full amount the donor sent, before Venmo or PayPal took their fee.</p></details></div>';
    if (!imp || !imp.rows) return intro;
    var rows = imp.rows, n = rows.filter(function (r) { return r.on; }).length, skipped = imp.skipped.map(function (s) { return s.n + ' skipped (' + s.why + ')'; }).join(', ');
    return intro + '<h2>Check, then add</h2><div class="card"><p><b>' + rows.length + '</b> ' + esc(imp.source) + ' gifts found in “' + esc(imp.fileName) + '”.' + (skipped ? ' <span class="muted">' + esc(skipped) + '.</span>' : '') + ' Untick any that are not donations, and fix names that are shortened or misspelled.</p>' +
      (rows.length ? rows.map(function (r, i) {
        return '<div class="res"><label class="who" style="font-weight:400"><input type="checkbox" data-imp="on" data-i="' + i + '" style="width:auto;min-height:0"' + (r.on ? ' checked' : '') + ' aria-label="Add this gift"> ' + esc(C.fmtDate(r.date)) + ' · <b>' + C.money(r.cents) + '</b>' +
          (r.dup ? ' <span class="muted small">(already in your log)</span>' : '') + '</label><div><input data-imp="name" data-i="' + i + '" value="' + esc(r.name) + '" aria-label="Donor name" style="margin:0"><div class="muted small">' + (r.isNew ? 'New donor' : 'Known donor') + '</div></div></div>';
      }).join('') : '<p class="muted">Nothing in that file looked like a donation.</p>') +
      '<div class="actions"><button class="primary" type="button" data-act="impAdd"' + (n ? '' : ' disabled') + '>Add ' + n + ' gift' + (n === 1 ? '' : 's') + '</button><button type="button" data-act="impCancel">Cancel</button></div></div>';
  }

  function letterHtml(L) {
    return '<section class="paper" aria-label="Letter for ' + esc(L.donor.name) + '"><div class="lh">' + esc(L.letterhead) + '</div>' + (L.date ? '<div>' + esc(L.date) + '</div>' : '') +
      '<div class="addr">' + esc(L.addressee.join('\n')) + '</div><p>' + esc(L.greeting) + '</p>' + L.paragraphs.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      '<table><thead><tr><th>Date</th><th>What we received</th><th class="amt">Amount</th></tr></thead><tbody>' + L.rows.map(function (r) { return '<tr><td>' + esc(r.date) + '</td><td>' + esc(r.what) + '</td><td class="amt">' + esc(r.amount) + '</td></tr>'; }).join('') + '</tbody></table>' +
      L.notes.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '<p>' + esc(L.taxLine) + '</p><p>' + esc(L.closing) + '</p><p style="margin-top:2.2em">' + L.signer.map(esc).join('<br>') + '</p></section>';
  }
  function lettersScreen() {
    var y = letterYear || lastYear(), list = C.yearSummary(data, y, settings.onlyNeeded), all = C.yearSummary(data, y, false);
    var noAddr = list.filter(function (r) { return !r.donor.address; }).length;
    var ctl = '<div class="noprint"><h2>Year-end letters</h2><div class="card"><label for="ly">Letters for the year</label>' + yearSelect('ly', y) +
      '<p style="margin-bottom:0"><b>' + list.length + '</b> letter' + (list.length === 1 ? '' : 's') + ' ready' + (all.length !== list.length ? ' (' + (all.length - list.length) + ' smaller donors skipped, see More options below)' : '') + '. One page each, in A–Z order.' + (noAddr ? ' <span class="muted">' + noAddr + ' have no mailing address yet.</span>' : '') + '</p>' +
      '<div class="actions"><button class="primary" type="button" data-act="printLetters"' + (list.length ? '' : ' disabled') + '>🖨 Print all ' + list.length + ' letters</button></div>' +
      '<details><summary>More options</summary><label style="font-weight:400"><input type="checkbox" id="only" style="width:auto;min-height:0" ' + (settings.onlyNeeded ? 'checked' : '') + '> Only print for donors who need one for taxes (a single cash gift of $250 or more, or any goods). Smaller donors still get a thank-you if you leave this unticked.</label>' +
      '<label for="ldate">Date shown on the letters (optional; empty prints no date)</label><input id="ldate" value="' + esc(settings.letterDate ? C.fmtDate(settings.letterDate) : '') + '" placeholder="January 15, ' + (y + 1) + '"></details>' +
      '<p class="muted small">Tip: in the print window choose “Save as PDF” to email letters instead. Check the wording in More → Letter wording once before the first print.</p></div></div>';
    if (!list.length) return ctl + '<p class="muted noprint">No gifts in ' + y + ' yet.</p>';
    return ctl + '<div id="letters">' + list.map(function (r) { return letterHtml(C.letter(data, settings, r.donor.id, y)); }).join('') + '</div>';
  }

  function moreScreen() {
    var D = C.DEFAULTS, w = function (k, label) { return '<label for="w_' + k + '">' + label + '</label><textarea id="w_' + k + '" data-wk="' + k + '">' + esc(settings[k] != null ? settings[k] : D[k]) + '</textarea>'; };
    return '<h2>Your letterhead</h2><div class="card"><label for="org">Organization name</label><input id="org" data-set="org" value="' + esc(settings.org || '') + '" placeholder="Your pantry or church">' +
      '<label for="lh">Letterhead text (name, address, phone, website: shown at the top of each letter)</label><textarea id="lh" data-set="letterhead">' + esc(settings.letterhead || '') + '</textarea>' +
      '<div class="row2"><div><label for="sg">Signed by</label><input id="sg" data-set="signer" value="' + esc(settings.signer || '') + '" placeholder="Pat Sample"></div><div><label for="st">Their title</label><input id="st" data-set="signerTitle" value="' + esc(settings.signerTitle || '') + '" placeholder="Treasurer"></div></div>' +
      '<label for="ein">Tax ID number (EIN), optional</label><input id="ein" data-set="ein" value="' + esc(settings.ein || '') + '" placeholder="00-0000000"><p class="muted small">Saved as you type.</p>' +
      '<details><summary>Letter wording (advanced)</summary><div class="alert">Check this wording against the IRS rules (Publication 1771) or with your accountant. A letter for a gift of $250 or more should say who it is from, the cash amount or a description (not a value) of goods, and whether anything was given in return. <b>{org} {year} {total} {ein} {these}</b> are filled in for you.</div>' +
      w('intro', 'Opening') + w('cashNote', 'Cash total line') + w('goodsNote', 'Donated goods (we describe, we do not put a value)') + w('nothingReturned', 'Nothing given in return') + w('taxLine', 'Tax-exempt line') + w('closing', 'Closing') +
      '<div class="actions"><button type="button" data-act="wordsReset">Put the standard wording back</button></div></details></div>' +
      '<h2>Donors</h2><div class="card"><p>' + data.donors.length + ' donors. Fix a name or address, or remove someone:</p><label for="pq">Find a donor</label><input id="pq" type="search" autocomplete="off"><div id="plist"></div></div>' +
      '<h2>Keep your records safe</h2><div class="card"><div class="actions" style="margin-top:0"><button class="primary" type="button" data-act="backup">Save a backup file</button><button type="button" data-act="restore">Restore from a backup</button></div>' + ToolkitBackup.fileInput('file') +
      '<p class="muted small">Names and gift amounts are private. They are stored only in this browser on this device and are never uploaded. The backup is a small file for a USB stick; keep it somewhere private. Your letterhead is included.</p></div>' +
      '<h2>More options</h2><div class="card"><div class="actions" style="margin-top:0"><button type="button" data-act="csvAll">Download every gift for a spreadsheet</button><button type="button" data-act="welcomeOn">Show the welcome again</button><button type="button" data-act="sampleReset">Start over with practice data</button><button class="danger" type="button" data-act="fresh">Start fresh (clear everything)</button></div><p class="muted small">Both “start” buttons ask first and offer undo.</p></div>';
  }
  function paintPeople() {
    var box = document.getElementById('plist'), q = document.getElementById('pq'); if (!box) return;
    box.innerHTML = C.search(data, q.value, 8).map(function (x) {
      return '<div class="res"><div class="who"><b>' + esc(x.name) + '</b><div class="muted small">' + esc((x.address || 'no address yet').replace(/\n/g, ', ')) + '</div></div><div class="btns"><button class="small" type="button" data-act="editDonor" data-id="' + x.id + '" aria-label="Edit ' + esc(x.name) + '">Edit</button><button class="small danger" type="button" data-act="delDonor" data-id="' + x.id + '" aria-label="Remove ' + esc(x.name) + '">Remove</button></div></div>';
    }).join('');
  }

  function render() {
    var body = screen === 'log' ? logScreen() : screen === 'gifts' ? giftsScreen() : screen === 'import' ? importScreen() : screen === 'letters' ? lettersScreen() : moreScreen();
    $app.innerHTML = header() + '<main>' + body + '</main>' + tabs();
    paintSugg(); paintPeople();
    var q = document.getElementById('q'); if (q && !settings.welcome) { try { q.focus({ preventScroll: true }); var n = q.value.length; q.setSelectionRange(n, n); } catch (e) {} }
  }
  function readForm() {
    var g = function (id) { var e = document.getElementById(id); return e ? e.value : null; };
    if (g('gd') != null) form.date = g('gd'); if (g('ga') != null) form.amount = g('ga'); if (g('gx') != null) form.desc = g('gx'); if (g('gr') != null) form.returned = g('gr'); if (g('gs') != null) form.source = g('gs'); if (g('addr') != null) form.address = g('addr');
  }
  function saveGift() {
    readForm();
    var snap = snapshot(), id = form.donorId, date = Dt.parse(form.date);
    if (!id) {
      if (!form.q.trim()) { form.err = 'Please type who gave the gift.'; return render(); }
      var r = C.addDonor(data, form.q, form.address); if (r.error) { form.err = r.error; return render(); } id = r.donor.id;
      if (r.existed && form.address.trim() && !r.donor.address) r.donor.address = form.address.trim();
    }
    var o = { donorId: id, date: date, kind: form.kind, amount: form.amount, desc: form.desc, returned: form.returned, source: form.source };
    var res = form.editId ? C.updateGift(data, form.editId, o) : C.addGift(data, o);
    if (res.error) { data = C.sanitize(JSON.parse(snap)); form.err = res.error; return render(); }
    var who = donor(id).name, editing = form.editId; save(); form = fresh(); form.date = date;
    toast((editing ? 'Changed: ' : 'Saved: ') + who + ' · ' + (res.gift.kind === 'cash' ? C.money(res.gift.cents) : 'goods'), snap); screen = editing ? 'gifts' : 'log'; render();
  }

  $app.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'q') { form.q = t.value; paintSugg(); }
    else if (t.id === 'pq') paintPeople();
    else if (t.getAttribute('data-set')) { settings[t.getAttribute('data-set')] = t.value; if (t.getAttribute('data-set') === 'org') document.querySelector('header.top h1').textContent = t.value || 'Donor gifts'; save(); }
    else if (t.getAttribute('data-wk')) { settings[t.getAttribute('data-wk')] = t.value; save(); }
    else if (['gd', 'ga', 'gx', 'gr', 'addr', 'gs'].indexOf(t.id) >= 0) readForm();
    else if (t.id === 'ldate') { var iso = Dt.parse(t.value); settings.letterDate = iso || ''; save(); }
  });
  $app.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'impfile' && t.files[0]) {
      var file = t.files[0], fr = new FileReader();
      fr.onload = function () {
        var r = IM.read(String(fr.result)); t.value = '';
        if (r.error) { imp = { err: r.error }; return render(); }
        imp = { source: r.source, fileName: file.name, skipped: r.skipped, rows: IM.plan(data, r.source, r.rows) }; imp.rows.forEach(function (x) { x.on = !x.dup; }); render();
      };
      fr.onerror = function () { imp = { err: 'We could not open that file. Try downloading it again.' }; render(); }; fr.readAsText(file); return;
    }
    if (t.getAttribute('data-imp')) {
      var row = imp.rows[+t.getAttribute('data-i')];
      if (t.getAttribute('data-imp') === 'on') row.on = t.checked;
      else { row.name = C.tidyName(t.value) || row.name; var p = IM.plan(data, imp.source, [row])[0]; row.dup = p.dup; row.isNew = p.isNew; if (row.dup) row.on = false; }
      return render();
    }
    if (t.id === 'gy') { giftYear = +t.value; render(); } else if (t.id === 'ly') { letterYear = +t.value; render(); }
    else if (t.id === 'only') { settings.onlyNeeded = t.checked; save(); render(); }
    else if (t.id === 'ldate') render();
    else if (t.id === 'file' && t.files[0]) {
      ToolkitBackup.read(t.files[0], function (err, r) {
        t.value = ''; var nd = err ? null : C.sanitize(r.data);
        if (!nd || (!nd.donors.length && !nd.gifts.length)) return toast('That file does not look like a backup from this app.');
        if (!confirm('Replace everything here with ' + nd.donors.length + ' donors and ' + nd.gifts.length + ' gifts from the backup?')) return;
        var snap = snapshot(); data = nd; if (r.settings) for (var k in r.settings) settings[k] = r.settings[k]; settings.sample = false; save(); toast('Backup restored.', snap); render();
      });
    }
  });
  $app.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'q') { e.preventDefault(); var r = form.q.trim() && C.search(data, form.q, 1); if (r && r.length === 1 && C.findDonor(data, form.q)) { form.donorId = r[0].id; render(); } else if (form.q.trim()) { var gd = document.getElementById('gd'); if (gd) gd.focus(); } }
  });
  $app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return; var act = b.getAttribute('data-act'), id = b.getAttribute('data-id'), snap;
    if (act === 'theme') { ToolkitTheme.toggle(settings); save(); render(); }
    else if (act === 'tab') { if (b.getAttribute('data-v') !== 'log') form = form.editId ? fresh() : form; go(b.getAttribute('data-v')); }
    else if (act === 'welcomeOff') { settings.welcome = false; save(); render(); }
    else if (act === 'welcomeOn') { settings.welcome = true; save(); go('log'); }
    else if (act === 'pick') { readForm(); form.donorId = id; render(); document.getElementById(form.kind === 'cash' ? 'ga' : 'gx').focus(); }
    else if (act === 'unpick') { readForm(); form.donorId = null; render(); }
    else if (act === 'kind') { readForm(); form.kind = b.getAttribute('data-v'); render(); }
    else if (act === 'saveGift') saveGift();
    else if (act === 'impPick') document.getElementById('impfile').click();
    else if (act === 'impCancel') { imp = null; render(); }
    else if (act === 'impAdd') {
      var pick = imp.rows.filter(function (r) { return r.on; }); snap = snapshot(); var res = IM.apply(data, imp.source, pick); save();
      toast('Added ' + res.gifts + ' gift' + (res.gifts === 1 ? '' : 's') + (res.donors ? ' and ' + res.donors + ' new donor' + (res.donors === 1 ? '' : 's') : '') + '.', snap); giftYear = pick.length ? +pick[pick.length - 1].date.slice(0, 4) : null; imp = null; go('gifts');
    }
    else if (act === 'cancelEdit') { form = fresh(); go('gifts'); }
    else if (act === 'editGift') { var g = data.gifts.filter(function (x) { return x.id === id; })[0]; form = { q: '', donorId: g.donorId, address: '', date: g.date, kind: g.kind, amount: g.kind === 'cash' ? (g.cents / 100).toFixed(2) : '', desc: g.desc, returned: g.returned, source: g.source || '', editId: g.id, err: '' }; go('log'); }
    else if (act === 'delGift') { var gg = data.gifts.filter(function (x) { return x.id === id; })[0], dn = donor(gg.donorId); if (!confirm('Delete the gift from ' + dn.name + ' on ' + C.fmtDate(gg.date) + '?')) return; snap = snapshot(); C.removeGift(data, id); save(); toast('Gift deleted.', snap); render(); }
    else if (act === 'printLetters') ToolkitPrint.print((settings.org || 'Donor') + ' year-end letters ' + (letterYear || lastYear()));
    else if (act === 'csv') ToolkitCsv.download('gifts-' + (giftYear || lastYear()) + '.csv', C.csvRows(data, giftYear || lastYear()));
    else if (act === 'csvAll') ToolkitCsv.download('all-gifts.csv', C.csvRows(data, null));
    else if (act === 'backup') { ToolkitBackup.save({ app: 'donor-receipts', filename: 'donor-gifts-backup-' + Dt.today() + '.json', data: data, settings: { org: settings.org, letterhead: settings.letterhead, signer: settings.signer, signerTitle: settings.signerTitle, ein: settings.ein, letterDate: settings.letterDate, onlyNeeded: settings.onlyNeeded, theme: settings.theme } }); toast('Backup saved to your Downloads folder.'); }
    else if (act === 'restore') ToolkitBackup.pick('file');
    else if (act === 'wordsReset') { ['intro', 'cashNote', 'goodsNote', 'nothingReturned', 'taxLine', 'closing'].forEach(function (k) { delete settings[k]; }); save(); render(); toast('Standard wording is back.'); }
    else if (act === 'editDonor') { var x = donor(id), nm = prompt('Name:', x.name); if (nm == null) return; var ad = prompt('Mailing address (use a comma between lines, leave empty for none):', (x.address || '').replace(/\n/g, ', ')); if (ad == null) return; snap = snapshot(); var r = C.renameDonor(data, id, nm, ad.split(/\s*,\s*/).join('\n')); if (r.error) return toast(r.error); save(); toast('Saved.', snap); render(); }
    else if (act === 'delDonor') { var y = donor(id), n = data.gifts.filter(function (z) { return z.donorId === id; }).length; if (!confirm('Remove ' + y.name + (n ? ' and their ' + n + ' gift' + (n === 1 ? '' : 's') : '') + '?')) return; snap = snapshot(); C.removeDonor(data, id); save(); toast(y.name + ' removed.', snap); render(); }
    else if (act === 'sampleReset') { if (!confirm('Replace everything with made-up practice donors?')) return; snap = snapshot(); seed(); toast('Practice data is back.', snap); form = fresh(); go('log'); }
    else if (act === 'fresh') { if (!confirm('Clear all donors and gifts so you can start with real ones? (Your backup files are not touched. You can undo right after.)')) return; snap = snapshot(); data = C.emptyData(); settings.sample = false; settings.welcome = false; save(); toast('Cleared. Ready for real gifts.', snap); form = fresh(); go('log'); }
  });
  render();
})();
