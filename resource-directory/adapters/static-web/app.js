/* Local-help directory UI. Plain JS; talks to Directory (core), DirectoryStorage (adapter) and the shared Toolkit* components. */
(function () {
  'use strict';
  var D = window.Directory, S = window.DirectoryStorage, SAMPLE = window.DirectorySample, M = window.ToolkitMap;
  var settings = S.loadSettings(), data = S.load(), screen = 'list', query = '', selId = null, form = null, toastTimer = null, storageOk = true;
  var $app = document.getElementById('app');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function today() { return ToolkitDates.today(); }
  function fmt(iso) { if (!iso) return ''; var d = new Date(iso + 'T12:00:00'); return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }

  function startSample() {
    var b = SAMPLE.build(); data = D.sanitize(b); settings.org = SAMPLE.orgName; settings.deskNote = SAMPLE.deskNote; settings.center = SAMPLE.center; settings.sample = true;
  }
  if (!data) { startSample(); settings.welcome = true; S.saveSettings(settings); S.save(data); }
  if (settings.tiles == null) settings.tiles = true;
  ToolkitTheme.apply(settings.theme);
  function save() { storageOk = S.save(data); S.saveSettings(settings); }
  function snapshot() { return JSON.stringify(data); }
  function toast(msg, undoSnap) {
    var old = document.getElementById('toast'); if (old) old.remove(); clearTimeout(toastTimer);
    var t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (undoSnap ? '<button type="button">Undo</button>' : '');
    document.body.appendChild(t);
    if (undoSnap) t.querySelector('button').onclick = function () { data = D.sanitize(JSON.parse(undoSnap)); save(); t.remove(); render(); };
    toastTimer = setTimeout(function () { t.remove(); }, 8000);
  }
  function go(s) { screen = s; if (s === 'list' || s === 'map') form = null; render(); window.scrollTo(0, 0); }
  function place(id) { return data.places.filter(function (p) { return p.id === id; })[0]; }
  function cat(id) { return D.categories(data).filter(function (c) { return c.id === id; })[0] || { label: '', color: '#46505b' }; }
  function matches() { return D.search(data, query, today()); }

  function header() {
    return '<header class="top"><h1>' + esc(settings.org || 'Local help list') + '</h1><span class="muted small" id="net" aria-live="polite"></span>' + ToolkitTheme.button(settings.theme) + '</header>' +
      (settings.sample ? '<div class="sample">Practice mode: every place and phone number here is made up. Go to More → “Start fresh” when you are ready for the real list.</div>' : '') +
      (storageOk ? '' : '<div class="alert"><b>This browser is not saving.</b> Changes will be lost when you close this page. Open the page in a normal (not private) window.</div>');
  }
  function tabs() {
    var t = [['list', '📋 List'], ['map', '🗺 Map'], ['more', '⋯ More']];
    return '<nav class="tabs" aria-label="Main">' + t.map(function (x) { return '<button type="button" data-act="tab" data-v="' + x[0] + '"' + (screen === x[0] || (screen === 'pick' && x[0] === 'map') ? ' aria-current="page"' : '') + '>' + x[1] + '</button>'; }).join('') + '</nav>';
  }
  function welcome() {
    if (!settings.welcome) return '';
    return ToolkitWelcome.html({ title: 'Welcome! Four things to try', steps: [
      'Type <b>food tuesday</b> in the search box. The list narrows to places serving food on a Tuesday.',
      'Tap <b>Map</b> at the bottom to see the same places as pins. Tap a pin for details.',
      'Tap <b>Edit</b> on any place to change its hours, or <b>✔ Checked today</b> after you confirm them by phone.',
      'Tap <b>Print the one-page list</b> to hand a copy to a visitor.'] });
  }

  function agoText(p) {
    var n = D.daysSince(p, today()); if (n == null) return 'Never checked';
    if (n <= 0) return 'Checked today'; if (n === 1) return 'Checked yesterday'; if (n < 60) return 'Checked ' + n + ' days ago'; return 'Checked ' + Math.round(n / 30) + ' months ago';
  }
  function placeCard(p, n) {
    var c = cat(p.category), stale = D.isStale(p, today(), settings.staleDays);
    return '<div class="place' + (p.id === selId ? ' sel' : '') + '" data-id="' + esc(p.id) + '"><h3>' + (n ? '<span class="num" style="background:' + esc(c.color) + '">' + n + '</span>' : '') + esc(p.name) + '</h3>' +
      '<div class="muted small">' + esc(c.label) + '</div>' +
      (p.address ? '<div class="line">📍 ' + esc(p.address) + '</div>' : '') +
      (p.phone ? '<div class="line">📞 <a href="tel:' + esc(p.phone.replace(/[^\d+]/g, '')) + '">' + esc(p.phone) + '</a></div>' : '') +
      '<div class="line">🕒 <b>' + esc(D.hoursText(p)) + '</b></div>' + (p.notes ? '<div class="line muted">' + esc(p.notes) + '</div>' : '') +
      '<div class="line small">' + (stale ? '<span class="pill warn">Call to confirm hours</span> ' : '') + esc(agoText(p)) + (p.checked ? ' (' + esc(fmt(p.checked)) + ')' : '') + '</div>' +
      '<div class="btns"><button class="small" type="button" data-act="edit" data-id="' + esc(p.id) + '">✎ Edit</button><button class="small" type="button" data-act="checked" data-id="' + esc(p.id) + '">✔ Checked today</button></div></div>';
  }
  function searchBox() {
    return '<label for="q">What do you need? Start typing</label><input id="q" class="search" type="search" autocomplete="off" spellcheck="false" value="' + esc(query) + '" placeholder="e.g. food tuesday, ride, shelter">' +
      '<div class="muted small">Try a kind of help and a day: “meals sunday”, “pantry today”, “electric”.</div>';
  }

  function listScreen() {
    var many = data.places.length > 22 && !settings.printSize;
    return welcome() + '<div class="actions"><button class="primary" type="button" data-act="print">🖨 Print the one-page list</button><button type="button" data-act="add">＋ Add a place</button></div>' +
      (many ? '<div class="muted small">Tip: with this many places, if the printout spills onto a second page, choose smaller print under More.</div>' : '') +
      searchBox() + '<div id="results" aria-live="polite"></div>' + printArea();
  }
  function paintList() {
    var list = matches(), groups = D.group(data, list), h = '';
    h += '<p class="muted" id="count">' + (query.trim() ? list.length + (list.length === 1 ? ' place matches' : ' places match') + ' “' + esc(query.trim()) + '”. ' : list.length + ' places. ') + (query.trim() ? '<button class="link" type="button" data-act="clear">Show everything</button>' : '') + '</p>';
    if (!list.length) h += '<div class="card">Nothing matches that. Try fewer words, or <button class="link" type="button" data-act="clear">show everything</button>. If a place is missing, tap <b>Add a place</b>.</div>';
    groups.forEach(function (g) { h += '<h2>' + esc(g.cat.label) + ' <span class="muted small">(' + g.places.length + ')</span></h2>' + g.places.map(function (p) { return placeCard(p); }).join(''); });
    document.getElementById('results').innerHTML = h;
  }

  function numbered() { // matching places in list order, each with its pin number
    var n = 0, out = [];
    D.group(data, matches()).forEach(function (g) { g.places.forEach(function (p) { out.push({ p: p, n: ++n }); }); });
    return out;
  }
  function pinsFor(items) { return items.map(function (x) { return { id: x.p.id, n: x.n, lat: x.p.lat, lon: x.p.lon, color: cat(x.p.category).color, label: x.n + ' ' + x.p.name, selected: x.p.id === selId }; }); }
  function mapView(pins) { return M.view(pins, { w: 900, h: 520, center: settings.center }); }
  function mapScreen() {
    return '<div class="actions"><button class="primary" type="button" data-act="print">🖨 Print the one-page list</button></div>' + searchBox() + '<div id="results" aria-live="polite"></div>';
  }
  function paintMap() {
    var items = numbered(), pins = pinsFor(items), onMap = pins.filter(function (p) { return M.valid(p.lat, p.lon); }), v = mapView(onMap), off = items.filter(function (x) { return !M.valid(x.p.lat, x.p.lon); });
    var online = navigator.onLine !== false, h = '';
    h += '<p class="muted">' + (query.trim() ? items.length + ' on this map for “' + esc(query.trim()) + '”. ' : '') + (settings.tiles && online ? 'Street map shown.' : 'Showing pins only' + (online ? '.' : ' (no internet, so no street map).')) + '</p>';
    h += onMap.length ? M.svg(v, onMap, { tiles: settings.tiles && online, label: 'Map of local help places' }) : '<div class="card">No places to show on the map. ' + (items.length ? 'None of the matches have a location yet.' : 'Try a different search.') + '</div>';
    var sel = selId && place(selId); if (sel && items.some(function (x) { return x.p.id === selId; })) h += '<h2>Selected</h2>' + placeCard(sel, (items.filter(function (x) { return x.p.id === selId; })[0] || {}).n);
    h += '<h2>All on this map</h2><div class="legend">' + items.filter(function (x) { return M.valid(x.p.lat, x.p.lon); }).map(function (x) { return '<button type="button" class="small" data-act="select" data-id="' + esc(x.p.id) + '"><span class="num" style="background:' + esc(cat(x.p.category).color) + '">' + x.n + '</span>' + esc(x.p.name) + '</button>'; }).join('') + '</div>';
    if (off.length) h += '<div class="card"><b>Not on the map yet</b> (still in the list and on the printout):' + off.map(function (x) { return '<div class="line">' + esc(x.p.name) + ' <button class="small" type="button" data-act="edit" data-id="' + esc(x.p.id) + '">Add location</button></div>'; }).join('') + '</div>';
    document.getElementById('results').innerHTML = h;
  }
  function pickScreen() {
    var p = form, pins = data.places.filter(function (x) { return x.id !== form.id; }).map(function (x) { return { id: x.id, n: '•', lat: x.lat, lon: x.lon, color: '#6b7683', label: x.name }; }).filter(function (x) { return M.valid(x.lat, x.lon); });
    var mine = M.valid(form.lat, form.lon) ? [{ id: 'me', n: '★', lat: form.lat, lon: form.lon, color: '#b3261e', label: 'This place', selected: true }] : [];
    var v = mapView(pins.concat(mine));
    return '<div class="pick"><b>Tap the map where “' + esc(form.name || 'this place') + '” is.</b><div class="muted small">Zoomed out too far? Tap the nearest pin’s area; you can move it again later.</div></div>' +
      '<div id="pickmap">' + M.svg(v, pins.concat(mine), { tiles: settings.tiles && navigator.onLine !== false, label: 'Tap to place the pin' }) + '</div>' +
      '<div class="actions"><button type="button" data-act="pickCancel">Back to the form</button></div>';
  }

  /* ---- add / edit form ---- */
  function readForm() {
    if (!form) return;
    ['name', 'address', 'phone', 'times', 'hoursNote', 'notes'].forEach(function (k) { var el = document.getElementById('f_' + k); if (el) form[k] = el.value; });
    var c = document.getElementById('f_category'); if (c) form.category = c.value;
    var k = document.getElementById('f_checked'); if (k) form.checkedText = k.value;
  }
  function openForm(p) {
    form = JSON.parse(JSON.stringify(p || D.blank('pantry', today()))); form.isNew = !p; form.origAddress = p ? p.address : null; form.checkedText = form.checked ? fmt(form.checked) : '';
    screen = 'edit'; render(); window.scrollTo(0, 0); setTimeout(function () { var n = document.getElementById('f_name'); if (n && form.isNew) n.focus(); }, 0);
  }
  function editScreen() {
    var f = form, opts = D.categories(data).map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === f.category ? ' selected' : '') + '>' + esc(c.label) + '</option>'; }).join('');
    var hasLoc = M.valid(f.lat, f.lon);
    return '<div class="card"><h2 style="margin-top:0">' + (f.isNew ? 'Add a place' : 'Edit this place') + '</h2>' +
      '<label for="f_category">Kind of help</label><select id="f_category">' + opts + '</select>' +
      '<label for="f_name">Name</label><input id="f_name" value="' + esc(f.name) + '" autocomplete="off">' +
      '<label for="f_address">Address</label><input id="f_address" value="' + esc(f.address) + '" autocomplete="off" placeholder="Street, town">' +
      '<label for="f_phone">Phone</label><input id="f_phone" type="tel" value="' + esc(f.phone) + '" placeholder="301 555 0100">' +
      '<label id="daylab">Open on these days</label><div class="days" role="group" aria-labelledby="daylab">' + D.SHORT.map(function (n, i) { return '<button type="button" data-act="day" data-v="' + i + '" aria-pressed="' + (f.days.indexOf(i) >= 0) + '">' + n + '</button>'; }).join('') + '</div>' +
      '<div class="chips" style="margin-top:8px"><button class="small" type="button" data-act="daysSet" data-v="1,2,3,4,5">Mon–Fri</button><button class="small" type="button" data-act="daysSet" data-v="0,1,2,3,4,5,6">Every day</button><button class="small" type="button" data-act="daysSet" data-v="">Clear</button></div>' +
      '<label for="f_times">Times</label><input id="f_times" value="' + esc(f.times) + '" placeholder="e.g. 10am–1pm" autocomplete="off">' +
      '<label for="f_hoursNote">Hours note (optional)</label><input id="f_hoursNote" value="' + esc(f.hoursNote) + '" placeholder="e.g. first and third Saturday only" autocomplete="off">' +
      '<label for="f_notes">Other notes (optional)</label><textarea id="f_notes" placeholder="Who it is for, what to bring">' + esc(f.notes) + '</textarea>' +
      '<label for="f_checked">Hours last checked</label><input id="f_checked" value="' + esc(f.checkedText) + '" placeholder="e.g. today, or 10/9/26" autocomplete="off">' +
      '<div class="muted small">Tidy this up by calling or checking the place’s own page, then put today’s date.</div>' +
      '<details class="more"' + (hasLoc || f.isNew ? '' : ' open') + '><summary>Map location ' + (hasLoc ? '(set ✓)' : '(not set)') + '</summary>' +
      '<p class="muted small">Saving a place looks up its address once when you have internet. You can also tap the map by hand.</p><div class="actions"><button type="button" data-act="lookup">Look up from address</button><button type="button" data-act="pickStart">Tap the map to place it</button>' + (hasLoc ? '<button type="button" data-act="locClear">Remove location</button>' : '') + '</div><div id="locmsg" class="small" aria-live="polite"></div></details>' +
      '<div id="ferr" class="err" role="alert"></div>' +
      '<div class="actions"><button class="primary" type="button" data-act="formSave">Save</button><button type="button" data-act="formCancel">Cancel</button>' + (f.isNew ? '' : '<button class="danger" type="button" data-act="formDelete">Delete this place</button>') + '</div></div>';
  }
  function formSave() {
    readForm(); var f = form, err = document.getElementById('ferr');
    if (!f.name.trim()) { err.textContent = 'Please type the name of the place.'; document.getElementById('f_name').focus(); return; }
    var ct = (f.checkedText || '').trim(), iso = '';
    if (ct) { iso = /^(today|now)$/i.test(ct) ? today() : ToolkitDates.parse(ct); if (!iso) { err.textContent = 'I could not read that date. Try “today”, 10/9/26 or Oct 9.'; document.getElementById('f_checked').focus(); return; } }
    var snap = snapshot(), clean = D.sanitize({ categories: data.categories, places: [Object.assign({}, f, { checked: iso })] }).places[0];
    if (!clean) return;
    var i = data.places.map(function (p) { return p.id; }).indexOf(clean.id);
    if (i >= 0) data.places[i] = clean; else data.places.push(clean);
    if (settings.sample && f.isNew) { /* keep practice banner until Start fresh */ }
    var needLookup = clean.address && (!M.valid(clean.lat, clean.lon) || clean.address !== f.origAddress) && !(f.pinnedByHand && M.valid(clean.lat, clean.lon));
    selId = clean.id; save(); form = null; screen = 'list'; render(); toast('Saved “' + clean.name + '”.', snap);
    if (needLookup) lookup(clean.id);
  }
  /* One free lookup of an address (OpenStreetMap Nominatim) -> Promise of {lat, lon}, or null. Never blocks saving; if it fails the place just has no pin yet. */
  function geocode(address) {
    if (!address || navigator.onLine === false || !window.fetch) return Promise.resolve(null);
    var ctl = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 8000);
    return fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=' + encodeURIComponent(address), { signal: ctl ? ctl.signal : undefined, headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); }).then(function (j) { clearTimeout(to); return j && j[0] && isFinite(+j[0].lat) && isFinite(+j[0].lon) ? { lat: +j[0].lat, lon: +j[0].lon } : null; })
      .catch(function () { clearTimeout(to); return null; });
  }
  function lookup(id) {
    var p = place(id); if (!p) return;
    geocode(p.address).then(function (ll) {
      var q = place(id); if (!q || !ll) return; q.lat = ll.lat; q.lon = ll.lon; settings.center = settings.center || [ll.lat, ll.lon]; save();
      toast('Pinned “' + q.name + '” on the map.'); if (screen === 'list' || screen === 'map') render();
    });
  }
  function setMsg(t) { var m = document.getElementById('locmsg'); if (m) m.textContent = t; }

  /* ---- more ---- */
  function moreScreen() {
    var sizes = [['', 'Normal'], ['small-print', 'Smaller'], ['tiny-print', 'Smallest']];
    return '<div class="card"><h2 style="margin-top:0">Keep a copy safe</h2><p>Save everything to one small file, so nothing is lost if the tablet is wiped.</p><div class="actions"><button class="primary" type="button" data-act="backup">💾 Save a backup file</button><button type="button" data-act="restore">Open a backup file</button><button type="button" data-act="csv">Download for a spreadsheet</button></div>' + ToolkitBackup.fileInput('restoreFile') + '<div id="moreerr" class="err" role="alert"></div></div>' +
      '<div class="card"><h2 style="margin-top:0">Names and printing</h2>' +
      '<label for="s_org">Name shown at the top and on the printout</label><input id="s_org" data-set="org" value="' + esc(settings.org || '') + '">' +
      '<label for="s_note">Note at the bottom of the printout</label><textarea id="s_note" data-set="deskNote">' + esc(settings.deskNote || '') + '</textarea>' +
      '<label for="s_size">Print size</label><select id="s_size" data-set="printSize">' + sizes.map(function (s) { return '<option value="' + s[0] + '"' + ((settings.printSize || '') === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select>' +
      '<label for="s_stale">Ask people to call first when hours were last checked more than</label><select id="s_stale" data-set="staleDays">' + [30, 60, 90, 180].map(function (n) { return '<option value="' + n + '"' + ((settings.staleDays || 90) === n ? ' selected' : '') + '>' + n + ' days ago</option>'; }).join('') + '</select>' +
      '<label><input type="checkbox" data-set="tiles" id="s_tiles"' + (settings.tiles ? ' checked' : '') + ' style="width:auto;min-height:0"> Show street map behind the pins when there is internet</label></div>' +
      '<details class="more"><summary>More options</summary><div class="actions"><button type="button" data-act="welcomeOn">Show the welcome again</button><button type="button" data-act="sample">Start over with practice data</button><button class="danger" type="button" data-act="fresh">Start fresh (empty list)</button></div>' +
      '<p class="muted small">Everything is saved only on this device, in this browser. Only public place details are stored: never names or needs of the people you help.</p></details>';
  }

  /* ---- one-page printout (hidden on screen) ---- */
  function printArea() {
    var groups = D.group(data, data.places), latest = data.places.map(function (p) { return p.checked; }).sort().pop() || today();
    return '<div class="print-only print-section ' + esc(settings.printSize || '') + '" id="printArea"><h1>' + esc(settings.org || 'Local help') + ': Local help</h1><div class="pl-sub">Free help nearby, grouped by kind. Printed ' + esc(fmt(today())) + '. Most recent check: ' + esc(fmt(latest)) + '.</div><div class="pl-cols">' +
      groups.map(function (g) { return '<section><h2>' + esc(g.cat.label) + '</h2>' + g.places.map(function (p) { var st = D.isStale(p, today(), settings.staleDays); return '<div class="pl-item"><b>' + esc(p.name) + '</b><br>' + (p.address ? esc(p.address) + '<br>' : '') + (p.phone ? esc(p.phone) + ' · ' : '') + esc(D.hoursText(p)) + (p.notes ? '<br>' + esc(p.notes) : '') + '<br><i>' + (p.checked ? 'Checked ' + esc(fmt(p.checked)) : 'Not checked recently') + (st ? ' — please call first' : '') + '</i></div>'; }).join('') + '</section>'; }).join('') +
      '</div>' + (settings.deskNote ? '<div class="pl-foot">' + esc(settings.deskNote) + '</div>' : '') + '</div>';
  }
  function doPrint() { var el = document.getElementById('printArea'); if (!el) { var d = document.createElement('div'); d.innerHTML = printArea(); document.body.appendChild(d.firstChild); } ToolkitPrint.print((settings.org || 'Local help') + ' - local help list'); }

  /* ---- render ---- */
  function render() {
    var body = screen === 'list' ? listScreen() : screen === 'map' ? mapScreen() : screen === 'edit' ? editScreen() : screen === 'pick' ? pickScreen() : moreScreen();
    $app.innerHTML = header() + '<div class="noprint">' + body.replace(/<div class="print-only[\s\S]*$/, '') + '</div>' + (screen === 'list' ? body.match(/<div class="print-only[\s\S]*$/)[0] : '') + (screen === 'edit' || screen === 'pick' ? '' : tabs());
    if (screen === 'list') paintList(); else if (screen === 'map') paintMap();
    netStatus();
  }
  function netStatus() { var n = document.getElementById('net'); if (n) n.textContent = navigator.onLine === false ? '● Offline: map shows pins only' : ''; }
  window.addEventListener('online', function () { netStatus(); if (screen === 'map') paintMap(); });
  window.addEventListener('offline', function () { netStatus(); if (screen === 'map') paintMap(); });

  /* ---- events ---- */
  $app.addEventListener('input', function (e) {
    if (e.target.id === 'q') { query = e.target.value; if (screen === 'list') paintList(); else if (screen === 'map') paintMap(); }
  });
  $app.addEventListener('change', function (e) {
    var k = e.target.getAttribute('data-set'); if (e.target.id === 'restoreFile') { return restoreFile(e.target); }
    if (!k) return; settings[k] = e.target.type === 'checkbox' ? e.target.checked : (k === 'staleDays' ? +e.target.value : e.target.value); save();
  });
  $app.addEventListener('keydown', function (e) {
    var g = e.target.closest && e.target.closest('.pin');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selId = g.getAttribute('data-id'); paintMap(); }
  });
  function restoreFile(input) {
    var f = input.files && input.files[0]; if (!f) return; var err = document.getElementById('moreerr');
    ToolkitBackup.read(f, function (e, r) {
      input.value = '';
      if (e) { err.textContent = 'That file does not look like a backup from this list. Pick a file ending in .json that you saved earlier.'; return; }
      var nd = D.sanitize(r.data);
      if (!window.confirm('Replace the current list (' + data.places.length + ' places) with the backup (' + nd.places.length + ' places)? You can undo this right after.')) return;
      var snap = snapshot(); data = nd; if (r.settings && r.settings.org) settings.org = r.settings.org; if (r.settings && r.settings.deskNote != null) settings.deskNote = r.settings.deskNote; settings.sample = false; save(); render(); toast('Backup restored: ' + nd.places.length + ' places.', snap);
    });
  }
  $app.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-act],.pin,svg.tmap') : null; if (!t) return;
    var act = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (!act && screen !== 'pick' && t.classList.contains('pin')) { selId = t.getAttribute('data-id'); if (screen === 'map') paintMap(); return; }
    if (!act && screen === 'pick') { var ll = M.fromEvent(t, e, mapView(pickPins())); if (ll) { form.lat = ll.lat; form.lon = ll.lon; form.pinnedByHand = true; settings.center = settings.center || [ll.lat, ll.lon]; screen = 'edit'; render(); setMsg('Location set ✓'); } return; }
    if (!act) return;
    if (act === 'tab') return go(t.getAttribute('data-v'));
    if (act === 'theme') { ToolkitTheme.toggle(settings); save(); return render(); }
    if (act === 'welcomeOff') { settings.welcome = false; save(); return render(); }
    if (act === 'welcomeOn') { settings.welcome = true; save(); return go('list'); }
    if (act === 'clear') { query = ''; render(); var q = document.getElementById('q'); if (q) q.focus(); return; }
    if (act === 'print') return doPrint();
    if (act === 'add') return openForm(null);
    if (act === 'edit') return openForm(place(id));
    if (act === 'select') { selId = id; return paintMap(); }
    if (act === 'checked') { var p = place(id), snap = snapshot(); p.checked = today(); save(); render(); return toast('Marked “' + p.name + '” as checked today.', snap); }
    if (act === 'day') { var d = +t.getAttribute('data-v'), i = form.days.indexOf(d); if (i >= 0) form.days.splice(i, 1); else form.days.push(d); form.days.sort(function (a, b) { return a - b; }); t.setAttribute('aria-pressed', i < 0); return; }
    if (act === 'daysSet') { readForm(); var v = t.getAttribute('data-v'); form.days = v ? v.split(',').map(Number) : []; return render(); }
    if (act === 'formCancel') return go('list');
    if (act === 'formSave') return formSave();
    if (act === 'formDelete') { var pp = place(form.id); if (!window.confirm('Delete “' + pp.name + '” from the list?')) return; var sn = snapshot(); data.places = data.places.filter(function (x) { return x.id !== pp.id; }); save(); form = null; screen = 'list'; render(); return toast('Deleted “' + pp.name + '”.', sn); }
    if (act === 'lookup') { readForm(); if (!form.address.trim()) return setMsg('Type the address first.'); if (navigator.onLine === false) return setMsg('No internet right now. Tap the map to place it instead.'); setMsg('Looking…'); var f0 = form; return geocode(f0.address).then(function (ll) { if (ll) { f0.lat = ll.lat; f0.lon = ll.lon; f0.pinnedByHand = true; setMsg('Found it. Location set ✓'); } else setMsg('I could not find that address (or the lookup failed). Check the spelling, or tap the map to place it.'); }); }
    if (act === 'pickStart') { readForm(); screen = 'pick'; render(); return window.scrollTo(0, 0); }
    if (act === 'pickCancel') { screen = 'edit'; return render(); }
    if (act === 'locClear') { readForm(); form.lat = null; form.lon = null; return render(); }
    if (act === 'backup') return ToolkitBackup.save({ app: 'resource-directory', filename: 'local-help-backup-' + today() + '.json', data: data, settings: { org: settings.org, deskNote: settings.deskNote } });
    if (act === 'restore') return ToolkitBackup.pick('restoreFile');
    if (act === 'csv') return ToolkitCsv.download('local-help-list-' + today() + '.csv', D.csvRows(data));
    if (act === 'sample') { if (!window.confirm('Replace the list with made-up practice places? You can undo this right after.')) return; var s1 = snapshot(); startSample(); save(); go('list'); return toast('Practice data loaded.', s1); }
    if (act === 'fresh') { if (!window.confirm('Remove all ' + data.places.length + ' places and start with an empty list? You can undo this right after.')) return; var s2 = snapshot(); data = D.sanitize({ places: [] }); settings.sample = false; settings.welcome = false; save(); go('list'); return toast('Started fresh. Tap “Add a place” to begin.', s2); }
  });
  function pickPins() { return data.places.filter(function (x) { return x.id !== form.id; }).map(function (x) { return { id: x.id, n: '•', lat: x.lat, lon: x.lon }; }).filter(function (x) { return M.valid(x.lat, x.lon); }).concat(M.valid(form.lat, form.lon) ? [{ id: 'me', n: '★', lat: form.lat, lon: form.lon }] : []); }
  render();
})();
