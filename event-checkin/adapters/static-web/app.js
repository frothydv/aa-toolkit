/* Door check-in UI. Plain JS; talks to Checkin (core) and CheckinStorage (adapter). */
(function () {
  'use strict';
  var C = window.Checkin, S = window.CheckinStorage, SAMPLE = window.CheckinSample;
  var settings = S.loadSettings(), data = S.load(), screen = 'checkin', query = '', toastTimer = null, addForm = null, storageOk = true;
  var $app = document.getElementById('app');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  if (!data) { // first ever open: start with practice data so there is something to try
    var b = SAMPLE.build(); data = b.data; settings.currentEventId = b.currentEventId; settings.org = SAMPLE.orgName; settings.sample = true; settings.welcome = true;
    S.saveSettings(settings); S.save(data);
  }
  if (settings.theme === 'light') document.documentElement.classList.add('light');
  function currentEvent() {
    var e = C.event(data, settings.currentEventId);
    if (!e) { e = C.eventsSorted(data)[0] || null; settings.currentEventId = e ? e.id : null; }
    return e;
  }
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
  function go(s) { screen = s; if (s !== 'checkin') addForm = null; render(); window.scrollTo(0, 0); }

  function header() {
    return '<header class="top"><h1>' + esc(settings.org || 'Door check-in') + '</h1>' +
      '<span class="muted small" id="net" aria-live="polite"></span>' +
      '<button class="small" type="button" data-act="theme" aria-label="Switch between dark and light colors">' + (settings.theme === 'light' ? '🌙 Dark' : '☀️ Light') + '</button></header>' +
      (settings.sample ? '<div class="sample">Practice mode: all names here are made up. Go to More → “Start fresh” when you are ready for real use.</div>' : '') +
      (storageOk ? '' : '<div class="alert"><b>This browser is not saving.</b> Your check-ins will be lost if you close this page. Open the page in a normal (not private) window.</div>');
  }
  function tabs() {
    var t = [['checkin', '✔ Check in'], ['here', '👥 Who’s here'], ['events', '📅 Events'], ['more', '⋯ More']];
    return '<nav class="tabs" aria-label="Main">' + t.map(function (x) { return '<button type="button" data-act="tab" data-v="' + x[0] + '"' + (screen === x[0] ? ' aria-current="page"' : '') + '>' + x[1] + '</button>'; }).join('') + '</nav>';
  }
  function welcome() {
    if (!settings.welcome) return '';
    return '<div class="card" role="region" aria-label="Welcome"><h2 style="margin-top:0">Welcome! Three things to try</h2><ol class="steps">' +
      '<li>Type <b>“gra”</b> in the box below and tap <b>Check in</b> next to Grace Bellamy. Her whole family can go in with one tap.</li>' +
      '<li>Type a name that is not on the list, then tap <b>Add</b>. It takes a few seconds.</li>' +
      '<li>Watch the big <b>headcount</b> number go up. Everything is saved on this device, even with no Wi-Fi.</li></ol>' +
      '<button class="primary" type="button" data-act="welcomeOff">Got it, let’s start</button></div>';
  }

  function checkinScreen() {
    var ev = currentEvent();
    if (!ev) return '<div class="card"><h2 style="margin-top:0">No event yet</h2><p>Start an event for today, then you can check people in.</p><div class="actions"><button class="primary" type="button" data-act="tab" data-v="events">Start an event</button></div></div>';
    return welcome() + '<div class="card"><div class="evbar"><div><b>' + esc(ev.name) + '</b><div class="muted">' + esc(C.fmtDate(ev.date)) + '</div></div>' +
      '<button class="small" type="button" data-act="tab" data-v="events">Change event</button></div>' +
      '<div class="count" aria-live="polite"><span class="num" id="hc"></span><span>here now <span class="muted" id="hcnew"></span></span></div></div>' +
      '<label for="q">Who is here? Start typing a name</label><input id="q" class="search" type="search" autocomplete="off" autocapitalize="words" spellcheck="false" value="' + esc(query) + '" placeholder="e.g. gra bel">' +
      '<div id="results" aria-live="polite"></div>' +
      (addForm ? addFormHtml() : '');
  }
  function paintCount() {
    var ev = currentEvent(); if (!ev) return; var h = C.headcount(data, ev.id), el = document.getElementById('hc');
    if (el) { el.textContent = h.total; document.getElementById('hcnew').textContent = h.firstTime ? '(' + h.firstTime + ' first-time)' : ''; }
  }
  function paintResults() {
    var box = document.getElementById('results'), ev = currentEvent(); if (!box || !ev) return;
    if (addForm) { box.innerHTML = ''; return; }
    var q = query.trim();
    if (!q) { box.innerHTML = '<p class="muted">' + data.guests.length + ' people on the list. Type any part of a first or last name.</p><div class="actions"><button type="button" data-act="addOpen">+ Add a new person or family</button></div>'; return; }
    var res = C.search(data, q, ev.id, 20), seen = C.lastSeen(data), html = '';
    res.forEach(function (r) {
      var g = r.guest, fam = C.familyMembers(data, g), others = fam.filter(function (x) { return x.id !== g.id; }), notHere = fam.filter(function (x) { return !C.isHere(data, ev.id, x.id); });
      html += '<div class="res' + (r.here ? ' here' : '') + '"><div class="who"><b>' + esc(g.name) + '</b><div class="muted small">' +
        (others.length ? 'With ' + esc(others.map(function (o) { return o.name.split(' ')[0]; }).join(', ')) + '. ' : '') +
        (seen[g.id] ? 'Last here ' + esc(C.fmtDate(seen[g.id])) : 'New to us') + '</div></div><div class="btns">';
      if (r.here) html += '<span class="pill">✓ Here</span><button class="small" type="button" data-act="undo1" data-id="' + g.id + '" aria-label="Undo check-in for ' + esc(g.name) + '">Undo</button>';
      else html += '<button class="primary" type="button" data-act="in1" data-id="' + g.id + '" aria-label="Check in ' + esc(g.name) + '">Check in</button>';
      if (notHere.length > 1 || (fam.length > 1 && !r.here && notHere.length > 1)) html += '<button type="button" data-act="inFam" data-id="' + g.id + '">Whole family (' + notHere.length + ')</button>';
      html += '</div></div>';
    });
    if (!res.length) html = '<p class="muted">Nobody called “' + esc(q) + '” yet.</p>';
    html += '<div class="actions"><button class="primary" type="button" data-act="addOpen">+ Add “' + esc(C.tidyName(q)) + '” as new</button></div>';
    box.innerHTML = html;
  }
  function addFormHtml() {
    var rows = addForm.names.map(function (n, i) {
      return '<div class="namerow"><input aria-label="Name of person ' + (i + 1) + '" data-i="' + i + '" class="nm" autocomplete="off" autocapitalize="words" value="' + esc(n) + '" placeholder="First and last name">' +
        (addForm.names.length > 1 ? '<button class="small danger" type="button" data-act="rmName" data-i="' + i + '" aria-label="Remove person ' + (i + 1) + '">✕</button>' : '') + '</div>';
    }).join('');
    return '<div class="card" id="addcard"><h2 style="margin-top:0">Add new</h2><p class="muted">A name is all we need. Add more names to check in a family together.</p>' + rows +
      '<button type="button" data-act="moreName">+ Add another family member</button>' + (addForm.err ? '<div class="err" role="alert">' + esc(addForm.err) + '</div>' : '') +
      '<div class="actions"><button class="primary" type="button" data-act="addGo">Add and check in</button><button type="button" data-act="addCancel">Cancel</button></div></div>';
  }

  function hereScreen() {
    var ev = currentEvent(); if (!ev) return '<p>No event yet.</p>';
    var list = C.attendees(data, ev.id), h = C.headcount(data, ev.id);
    return '<h2>' + esc(ev.name) + ' · ' + esc(C.fmtDate(ev.date)) + '</h2><div class="card count"><span class="num">' + h.total + '</span><span>checked in' + (h.firstTime ? ' <span class="muted">(' + h.firstTime + ' first-time)</span>' : '') + '</span></div>' +
      (list.length ? list.map(function (a) {
        return '<div class="res here"><div class="who"><b>' + esc(a.guest.name) + '</b><div class="muted small">' + (a.at ? new Date(a.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '') + '</div></div>' +
          '<button class="small" type="button" data-act="undo1" data-id="' + a.guest.id + '" aria-label="Undo check-in for ' + esc(a.guest.name) + '">Undo</button></div>';
      }).join('') : '<p class="muted">Nobody yet. Go to Check in to start.</p>');
  }
  function eventsScreen() {
    var names = ['Sunday service', 'Community meal', 'Youth night', 'Class', 'Fundraiser'], nm = settings.draftName || '', cur = currentEvent();
    var evs = C.eventsSorted(data);
    return '<h2>Start an event</h2><div class="card"><div class="chips" role="group" aria-label="Kinds of event">' +
      names.map(function (n) { return '<button type="button" data-act="pickName" data-v="' + esc(n) + '" aria-pressed="' + (nm === n) + '">' + esc(n) + '</button>'; }).join('') + '</div>' +
      '<label for="evn">Event name</label><input id="evn" value="' + esc(nm) + '" placeholder="Or type your own">' +
      '<label for="evd">Date</label><input id="evd" value="' + C.today() + '"><div id="everr" class="err" role="alert"></div>' +
      '<div class="actions"><button class="primary" type="button" data-act="evGo">Start check-in</button></div></div>' +
      '<h2>Your events</h2>' + (evs.length ? evs.map(function (e) {
        var h = C.headcount(data, e.id).total, isCur = cur && cur.id === e.id;
        return '<div class="res' + (isCur ? ' here' : '') + '"><div class="who"><b>' + esc(e.name) + '</b><div class="muted small">' + esc(C.fmtDate(e.date)) + ' · ' + h + ' checked in</div></div><div class="btns">' +
          (isCur ? '<span class="pill">Open now</span>' : '<button class="small primary" type="button" data-act="evUse" data-id="' + e.id + '">Open</button>') +
          '<button class="small danger" type="button" data-act="evDel" data-id="' + e.id + '" aria-label="Delete ' + esc(e.name) + ' ' + esc(C.fmtDate(e.date)) + '">Delete</button></div></div>';
      }).join('') : '<p class="muted">No events yet.</p>');
  }
  function moreScreen() {
    return '<h2>Settings</h2><div class="card"><label for="org">Name shown at the top</label><input id="org" value="' + esc(settings.org || '') + '" placeholder="Your church or group">' +
      '<p class="muted small">Saved as you type.</p></div>' +
      '<h2>Keep your records safe</h2><div class="card"><div class="actions" style="margin-top:0"><button class="primary" type="button" data-act="backup">Save a backup file</button>' +
      '<button type="button" data-act="restore">Restore from a backup</button></div><input id="file" type="file" accept=".json,application/json" class="sr" tabindex="-1" aria-label="Choose backup file">' +
      '<p class="muted small">Everything is stored on this device only. A backup is a small file you can keep on a USB stick or email to yourself.</p></div>' +
      '<h2>People on your list</h2><div class="card"><p>' + data.guests.length + ' people. To fix a typo or remove someone:</p><label for="pq">Find a person</label><input id="pq" type="search" autocomplete="off" placeholder="Start typing a name"><div id="plist"></div></div>' +
      '<h2>More options</h2><div class="card"><div class="actions" style="margin-top:0"><button type="button" data-act="sampleReset">Start over with practice data</button><button class="danger" type="button" data-act="fresh">Start fresh (erase everything)</button></div>' +
      '<p class="muted small">Both ask you first, and offer a way to undo.</p></div>';
  }
  function paintPeople() {
    var box = document.getElementById('plist'), q = document.getElementById('pq'); if (!box) return;
    var res = C.search(data, q.value, null, 8);
    box.innerHTML = res.map(function (r) {
      return '<div class="res"><div class="who"><b>' + esc(r.guest.name) + '</b></div><div class="btns"><button class="small" type="button" data-act="rename" data-id="' + r.guest.id + '" aria-label="Rename ' + esc(r.guest.name) + '">Rename</button>' +
        '<button class="small danger" type="button" data-act="delGuest" data-id="' + r.guest.id + '" aria-label="Remove ' + esc(r.guest.name) + '">Remove</button></div></div>';
    }).join('');
  }

  function render() {
    var body = screen === 'checkin' ? checkinScreen() : screen === 'here' ? hereScreen() : screen === 'events' ? eventsScreen() : moreScreen();
    $app.innerHTML = header() + '<main>' + body + '</main>' + tabs();
    paintNet(); paintCount(); paintResults(); paintPeople();
    var q = document.getElementById('q'); if (q && !addForm && !settings.welcome) { try { q.focus({ preventScroll: true }); } catch (e) {} }
    if (addForm) { var f = document.querySelector('.nm[data-i="' + (addForm.focus || 0) + '"]'); if (f) f.focus(); }
  }
  function paintNet() { var n = document.getElementById('net'); if (n) n.textContent = (navigator.onLine === false ? 'Offline · ' : '') + 'Saved on this device'; }
  window.addEventListener('online', paintNet); window.addEventListener('offline', paintNet);

  function checkInIds(ids, label) {
    var ev = currentEvent(), snap = snapshot(), added = C.checkInMany(data, ev.id, ids);
    if (!added.length) { toast('Already checked in.'); return; }
    save(); query = ''; var q = document.getElementById('q'); if (q) q.value = '';
    render(); toast(label || (added.length === 1 ? C.guest(data, added[0]).name + ' checked in' : added.length + ' people checked in'), snap);
    var q2 = document.getElementById('q'); if (q2) q2.focus();
  }
  function readNames() { return [].map.call(document.querySelectorAll('.nm'), function (i) { return i.value; }); }

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'q') { query = t.value; paintResults(); }
    else if (t.id === 'pq') paintPeople();
    else if (t.id === 'org') { settings.org = t.value; save(); var h = document.querySelector('header.top h1'); if (h) h.textContent = t.value || 'Door check-in'; }
    else if (t.id === 'evn') settings.draftName = t.value;
    else if (t.classList && t.classList.contains('nm') && addForm) addForm.names = readNames();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return; var t = e.target;
    if (t.id === 'q') {
      var ev = currentEvent(), res = C.search(data, query, ev && ev.id, 20); e.preventDefault();
      var open = res.filter(function (r) { return !r.here; });
      if (res.length && (res.length === 1 || res[0].score > (res[1] ? res[1].score : -1)) && !res[0].here) checkInIds([res[0].guest.id]);
      else if (!res.length && query.trim()) openAdd();
      else if (open.length === 1) checkInIds([open[0].guest.id]);
    } else if (t.classList && t.classList.contains('nm')) { e.preventDefault(); go1(); }
    else if (t.id === 'evn' || t.id === 'evd') { e.preventDefault(); startEvent(); }
  });
  function go1() { var a = document.querySelector('[data-act=addGo]'); if (a) a.click(); }
  function openAdd() { addForm = { names: [C.tidyName(query)], focus: 0 }; render(); }
  function startEvent() {
    var r = C.addEvent(data, document.getElementById('evn').value, document.getElementById('evd').value);
    if (r.error) { document.getElementById('everr').textContent = r.error; return; }
    settings.currentEventId = r.event.id; settings.draftName = ''; save(); go('checkin'); toast(r.existed ? 'That event already existed, so it is open again.' : 'Event started. Ready for check-in.');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return; var act = b.dataset.act, id = b.dataset.id, ev = currentEvent(), snap;
    switch (act) {
      case 'tab': go(b.dataset.v); break;
      case 'theme': settings.theme = settings.theme === 'light' ? 'dark' : 'light'; document.documentElement.classList.toggle('light', settings.theme === 'light'); save(); render(); break;
      case 'welcomeOff': settings.welcome = false; save(); render(); break;
      case 'in1': checkInIds([id]); break;
      case 'inFam': checkInIds(C.familyMembers(data, C.guest(data, id)).map(function (g) { return g.id; })); break;
      case 'undo1': snap = snapshot(); C.undoCheckIn(data, ev.id, id); save(); render(); toast('Check-in removed.', snap); break;
      case 'addOpen': openAdd(); break;
      case 'addCancel': addForm = null; render(); break;
      case 'moreName': addForm.names = readNames(); var first = (addForm.names[0] || '').trim().split(' '); addForm.names.push(first.length > 1 ? first[first.length - 1] + ' ' : ''); addForm.focus = addForm.names.length - 1; render(); var nm = document.querySelectorAll('.nm'); nm[nm.length - 1].setSelectionRange(0, 0); break;
      case 'rmName': addForm.names = readNames(); addForm.names.splice(+b.dataset.i, 1); addForm.focus = 0; render(); break;
      case 'addGo':
        var names = readNames().filter(function (n) { return C.norm(n); }); addForm.names = readNames();
        if (!names.length) { addForm.err = 'Please type a name first.'; render(); break; }
        snap = snapshot(); var guests = names.length > 1 ? C.addFamily(data, names) : [C.addGuest(data, names[0]).guest];
        addForm = null; checkInIds(guests.map(function (g) { return g.id; }), guests.length === 1 ? guests[0].name + ' added and checked in' : guests.length + ' people added and checked in');
        break;
      case 'pickName': settings.draftName = b.dataset.v; render(); break;
      case 'evGo': startEvent(); break;
      case 'evUse': settings.currentEventId = id; save(); go('checkin'); break;
      case 'evDel':
        var de = C.event(data, id), n = C.headcount(data, id).total;
        if (confirm('Delete “' + de.name + ' · ' + C.fmtDate(de.date) + '” and its ' + n + ' check-ins? You can undo right after.')) { snap = snapshot(); C.removeEvent(data, id); save(); render(); toast('Event deleted.', snap); }
        break;
      case 'backup':
        var blob = new Blob([JSON.stringify({ data: data, settings: { org: settings.org } }, null, 1)], { type: 'application/json' }), a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'checkin-backup-' + C.today() + '.json'; document.body.appendChild(a); a.click(); a.remove(); toast('Backup saved to your Downloads folder.'); break;
      case 'restore': document.getElementById('file').click(); break;
      case 'rename':
        var g = C.guest(data, id), nn = prompt('Correct the name:', g.name);
        if (nn !== null) { snap = snapshot(); if (C.renameGuest(data, id, nn)) { save(); paintPeople(); toast('Name updated.', snap); } } break;
      case 'delGuest':
        var dg = C.guest(data, id);
        if (confirm('Remove ' + dg.name + ' from your list, including their past check-ins?')) { snap = snapshot(); C.removeGuest(data, id); save(); render(); toast(dg.name + ' removed.', snap); } break;
      case 'sampleReset':
        if (confirm('Replace everything with practice data? Your current records will be replaced.')) { snap = snapshot(); var sb = SAMPLE.build(); data = sb.data; settings.currentEventId = sb.currentEventId; settings.org = SAMPLE.orgName; settings.sample = true; settings.welcome = true; save(); go('checkin'); toast('Practice data loaded.', snap); } break;
      case 'fresh':
        if (confirm('Erase all people, events and check-ins? Save a backup first if you may need them.')) { snap = snapshot(); data = C.emptyData(); settings.currentEventId = null; settings.sample = false; settings.welcome = false; save(); go('events'); toast('Everything erased. Start your first event.', snap); } break;
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'file' || !e.target.files[0]) return;
    var fr = new FileReader(); fr.onload = function () {
      try {
        var j = JSON.parse(fr.result), d = C.sanitize(j.data || j);
        if (!d.guests.length && !d.events.length) throw new Error('empty');
        if (!confirm('Replace your current records with this backup (' + d.guests.length + ' people, ' + d.events.length + ' events)?')) return;
        var snap = snapshot(); data = d; settings.sample = false; settings.currentEventId = null; if (j.settings && j.settings.org) settings.org = j.settings.org; save(); go('checkin'); toast('Backup restored.', snap);
      } catch (err) { toast('That file does not look like a check-in backup. Please choose a file saved with “Save a backup file”.'); }
    }; fr.readAsText(e.target.files[0]);
  });

  render();
  if (location.protocol.indexOf('http') === 0 && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
})();
