/* Volunteer sign-up app UI (plain JS). Needs: VolunteerShifts (core), VolunteerStorage (adapter), VOLUNTEER_SAMPLE. */
(function () {
  'use strict';
  var V = window.VolunteerShifts, S = window.VolunteerStorage, app = document.getElementById('app');
  var settings = S.loadSettings(), data = S.load();
  var ui = { mode: 'volunteer', view: 'list', month: V.todayISO().slice(0, 7), tab: 'schedule', openShift: null, rosterDate: V.todayISO(), msg: null, form: null, lastSignup: null, modal: null };
  var firstRun = !data;
  if (!data) data = V.sampleData(window.VOLUNTEER_SAMPLE);
  if (!settings.org) settings.org = window.VOLUNTEER_SAMPLE.org;
  if (firstRun) { S.save(data); S.saveSettings(settings); }
  ToolkitTheme.apply(settings.theme);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function save() { S.save(data); }
  function saveSettings() { S.saveSettings(settings); }
  function badge(st) {
    var t = st.state === 'full' ? 'Full' : st.state === 'open' ? 'Needs ' + st.missing : 'Needs ' + st.missing + ' more';
    return '<span class="badge ' + st.state + '">' + (st.state === 'full' ? '✓ ' : '! ') + t + '</span>';
  }
  function bar(st) { return '<div class="bar ' + st.state + '" aria-hidden="true"><i style="width:' + Math.min(100, Math.round(100 * st.signed / st.needed)) + '%"></i></div>'; }
  var toastTimer;
  function toast(text, undo) {
    var t = document.getElementById('toast'); if (t) t.remove();
    t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = '<span>' + esc(text) + '</span>' + (undo ? '<button class="link" data-act="undo">Undo</button>' : '');
    document.body.appendChild(t); toast.undo = undo; clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); toast.undo = null; }, undo ? 10000 : 3500);
  }
  function datePrefix(s) { return V.longDate(s.date); }

  // ---------- header ----------
  function header() {
    return '<header class="no-print"><h1>' + esc(settings.org) + '</h1><div class="row">' +
      '<button data-act="mode" data-v="volunteer" aria-pressed="' + (ui.mode === 'volunteer') + '">Sign up for a shift</button>' +
      '<button data-act="mode" data-v="coord" aria-pressed="' + (ui.mode === 'coord') + '">Coordinator</button>' +
      ToolkitTheme.button(settings.theme) + '</div></header>';
  }

  // ---------- volunteer view ----------
  function shiftCard(s) {
      var st = V.shiftStatus(data, s), open = ui.openShift === s.id;
      var h = '<div class="card"><button class="shift" data-act="open" data-id="' + s.id + '" aria-expanded="' + open + '" ' + (st.state === 'full' ? '' : '') + '>' +
        '<div class="row" style="justify-content:space-between"><strong>' + esc(s.title) + '</strong>' + badge(st) + '</div>' +
        '<div class="muted">' + esc(V.timeRange(s)) + (s.place ? ' · ' + esc(s.place) : '') + '</div>' + bar(st) +
        '<div class="small muted">' + st.signed + ' of ' + st.needed + ' signed up</div></button>';
      if (open) {
        h += s.notes ? '<p>' + esc(s.notes) + '</p>' : '';
        if (st.state === 'full') h += '<p><strong>This shift is full.</strong> Please pick another one. Thank you!</p>';
        else h += '<form data-form="signup" data-id="' + s.id + '" novalidate>' +
          '<label for="n' + s.id + '">Your name</label><input id="n' + s.id + '" name="name" autocomplete="name" required>' +
          '<label for="c' + s.id + '">Phone or email (so we can remind you)</label><input id="c' + s.id + '" name="contact" autocomplete="tel" inputmode="text" required>' +
          '<div id="e' + s.id + '" role="alert"></div>' +
          '<p class="small muted">We only keep your name and phone/email, only to run this shift. See the privacy note at the bottom.</p>' +
          '<button class="primary big" type="submit">Sign up</button></form>';
      }
      h += '</div>';
      return h;
  }

  function volunteerView() {
    var today = V.todayISO();
    var list = V.sortShifts(data.shifts.filter(function (s) { return s.date >= today; }));
    var h = '<h2>Pick a shift to help with</h2><p class="muted">Tap a shift, type your name and a phone or email, and you are signed up. No account needed.</p>' +
      '<div class="row" role="group" aria-label="How to show shifts"><button data-act="view" data-v="list" aria-pressed="' + (ui.view === 'list') + '">List</button><button data-act="view" data-v="cal" aria-pressed="' + (ui.view === 'cal') + '">Calendar</button></div>';
    if (ui.lastSignup) {
      var l = ui.lastSignup;
      h += '<div class="good" role="status"><strong>Thank you, ' + esc(l.name) + '!</strong> You are signed up for ' + esc(l.title) + ' on ' + esc(l.when) + '. ' +
        'Need to cancel? <button class="link" data-act="cancelmine" data-id="' + l.id + '">Cancel my sign-up</button></div>';
    }
    if (!list.length && ui.view === 'list') h += '<div class="card">No shifts are coming up yet. Please check back soon.</div>';
    if (ui.view === 'cal') return h + calendar(today);
    var last = '';
    list.forEach(function (s) {
      if (s.date !== last) { last = s.date; h += '<h2 class="day">' + esc(V.longDate(s.date)) + (s.date === today ? ' · today' : '') + '</h2>'; }
      h += shiftCard(s);
    });
    return h;
  }

  function calendar(today) {
    var weeks = V.monthGrid(ui.month), names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var h = '<div class="row cal-nav" style="justify-content:space-between;margin-top:12px"><button data-act="month" data-v="-1" aria-label="Previous month">‹ Back</button><h2 style="margin:0">' + esc(V.monthLabel(ui.month)) + '</h2><button data-act="month" data-v="1" aria-label="Next month">Next ›</button></div>' +
      '<p class="small muted"><span class="badge open">! Needs people</span> <span class="badge needs">! Needs more</span> <span class="badge full">✓ Full</span></p>' +
      '<div class="cal" role="grid" aria-label="' + esc(V.monthLabel(ui.month)) + '"><div class="cal-head" role="row">' + names.map(function (n) { return '<div role="columnheader">' + n + '</div>'; }).join('') + '</div>';
    weeks.forEach(function (w) {
      h += '<div class="cal-week" role="row">';
      w.forEach(function (c) {
        var list = V.sortShifts(data.shifts.filter(function (s) { return s.date === c.date; })), day = +c.date.slice(8);
        h += '<div role="gridcell" class="cal-day' + (c.inMonth ? '' : ' out') + (c.date === today ? ' today' : '') + (c.date < today ? ' past' : '') + '"><div class="dn">' + day + '</div>';
        list.forEach(function (s) {
          var st = V.shiftStatus(data, s), sel = ui.openShift === s.id;
          h += '<button class="chip ' + st.state + (sel ? ' sel' : '') + '" data-act="calshift" data-id="' + s.id + '" aria-label="' + esc(V.longDate(s.date) + ', ' + s.title + ', ' + V.timeRange(s) + ', ' + (st.state === 'full' ? 'full' : 'needs ' + st.missing)) + '">' +
            (st.state === 'full' ? '✓' : '!') + ' <span class="t">' + esc(V.fmtTime(s.start)) + '</span> <span class="n">' + esc(s.title) + '</span></button>';
        });
        h += '</div>';
      });
      h += '</div>';
    });
    h += '</div>';
    var sel = data.shifts.filter(function (s) { return s.id === ui.openShift; })[0];
    if (sel) h += '<h2 class="day">' + esc(V.longDate(sel.date)) + '</h2>' + shiftCard(sel);
    else h += '<p class="muted">Tap a shift on the calendar to sign up.</p>';
    return h;
  }

  // ---------- coordinator ----------
  function coordNav() {
    var tabs = [['schedule', 'Schedule'], ['add', 'Add shift'], ['roster', 'Print roster'], ['messages', 'Messages'], ['data', 'Data & settings']];
    return '<nav class="row no-print" aria-label="Coordinator sections">' + tabs.map(function (t) {
      return '<button data-act="tab" data-v="' + t[0] + '" aria-pressed="' + (ui.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</nav>';
  }
  function coordView() {
    return '<div class="banner small no-print">Coordinator view. In this single-device version, the schedule is saved in this browser only.</div>' + coordNav() +
      ({ schedule: scheduleTab, add: addTab, roster: rosterTab, messages: messagesTab, data: dataTab }[ui.tab])();
  }
  function scheduleTab() {
    var today = V.todayISO(), up = V.sortShifts(data.shifts.filter(function (s) { return s.date >= today; }));
    var gaps = V.gaps(data, today, 14), h = '';
    h += '<div class="card"><h2>' + (gaps.length ? gaps.length + ' shift' + (gaps.length > 1 ? 's' : '') + ' still need people (next 2 weeks)' : 'Every shift in the next 2 weeks is covered 🎉') + '</h2>' +
      (gaps.length ? '<button class="primary" data-act="tab" data-v="messages">Write a message asking for help</button>' : '') + '</div>';
    if (!up.length) h += '<div class="card">No upcoming shifts yet. <button class="primary" data-act="tab" data-v="add">Add a shift</button></div>';
    var last = '';
    up.forEach(function (s) {
      if (s.date !== last) { last = s.date; h += '<h2 class="day">' + esc(V.longDate(s.date)) + '</h2>'; }
      var st = V.shiftStatus(data, s), people = V.signupsFor(data, s.id);
      h += '<div class="card"><div class="row" style="justify-content:space-between"><strong>' + esc(s.title) + '</strong>' + badge(st) + '</div>' +
        '<div class="muted">' + esc(V.timeRange(s)) + (s.place ? ' · ' + esc(s.place) : '') + (s.repeatId ? ' · repeating' : '') + '</div>' + bar(st) +
        '<ul class="people">' + (people.length ? people.map(function (p) {
          return '<li><span>' + esc(p.name) + ' <span class="muted">' + esc(p.contact) + '</span></span><button class="link danger" data-act="rmsignup" data-id="' + p.id + '" aria-label="Remove ' + esc(p.name) + '">Remove</button></li>'; }).join('')
          : '<li class="muted">Nobody yet</li>') + '</ul>' +
        '<div class="row"><button data-act="addperson" data-id="' + s.id + '">Add a volunteer</button><button data-act="remind" data-id="' + s.id + '">Reminder message</button>' +
        '<button data-act="rmshift" data-id="' + s.id + '" class="danger">Delete shift</button></div></div>';
    });
    return h;
  }
  function addTab() {
    var f = ui.form || { title: '', date: V.addDays(V.todayISO(), 1), start: '9am', end: '11am', needed: 4, place: '', notes: '', repeat: 'none', count: 4 };
    var h = '<div class="card"><h2>Add a shift</h2>' + (ui.formErrors ? '<div class="err" role="alert">' + ui.formErrors.map(esc).join('<br>') + '</div>' : '') +
      '<form data-form="addshift" novalidate><label for="f_title">What is the shift?</label><input id="f_title" name="title" value="' + esc(f.title) + '" placeholder="Saturday food distribution">' +
      '<div class="grid2"><div><label for="f_date">Date</label><input id="f_date" type="date" name="date" value="' + esc(f.date) + '"></div>' +
      '<div><label for="f_needed">People needed</label><input id="f_needed" name="needed" type="number" min="1" inputmode="numeric" value="' + esc(f.needed) + '"></div>' +
      '<div><label for="f_start">Starts</label><input id="f_start" name="start" value="' + esc(f.start) + '" placeholder="9am"></div>' +
      '<div><label for="f_end">Ends</label><input id="f_end" name="end" value="' + esc(f.end) + '" placeholder="11am"></div></div>' +
      '<label for="f_rep">Does it repeat?</label><select id="f_rep" name="repeat"><option value="none"' + (f.repeat === 'none' ? ' selected' : '') + '>No, just once</option><option value="weekly"' + (f.repeat === 'weekly' ? ' selected' : '') + '>Every week on the same day</option><option value="daily"' + (f.repeat === 'daily' ? ' selected' : '') + '>Every day</option></select>' +
      '<div id="repcount"><label for="f_count">How many times in total?</label><input id="f_count" name="count" type="number" min="2" max="60" inputmode="numeric" value="' + esc(f.count) + '"></div>' +
      '<details><summary>More options</summary><label for="f_place">Where (optional)</label><input id="f_place" name="place" value="' + esc(f.place) + '">' +
      '<label for="f_notes">Notes for volunteers (optional)</label><input id="f_notes" name="notes" value="' + esc(f.notes) + '"></details>' +
      '<p><button class="primary big" type="submit">Add shift</button></p></form></div>';
    return h;
  }
  function rosterTab() {
    var rows = V.rosterRows(data, ui.rosterDate), h = '<div class="card no-print"><h2>Day roster</h2><label for="rd">Which day?</label><input id="rd" type="date" data-act="rosterdate" value="' + esc(ui.rosterDate) + '">' +
      '<p><button class="primary big" data-act="print">Print this day</button></p></div>';
    h += '<div id="rosterOut"><h2>' + esc(settings.org) + ' · ' + esc(V.longDate(ui.rosterDate)) + '</h2>';
    if (!rows.length) h += '<p>No shifts on this day.</p>';
    rows.forEach(function (r) {
      var blanks = Math.max(0, r.status.needed - r.people.length), tr = '';
      r.people.forEach(function (p) { tr += '<tr><td>' + esc(p.name) + '</td><td>' + esc(p.contact) + '</td><td class="sig"></td></tr>'; });
      for (var i = 0; i < blanks; i++) tr += '<tr><td class="sig"><span class="muted small">(open spot)</span></td><td></td><td></td></tr>';
      h += '<div class="card"><h3>' + esc(r.shift.title) + ' · ' + esc(V.timeRange(r.shift)) + '</h3>' + (r.shift.place ? '<div class="muted">' + esc(r.shift.place) + '</div>' : '') +
        '<p>' + r.status.signed + ' of ' + r.status.needed + ' signed up</p><table class="roster"><thead><tr><th>Name</th><th>Phone or email</th><th>Here? (sign)</th></tr></thead><tbody>' + tr + '</tbody></table></div>';
    });
    return h + '</div>';
  }
  function messagesTab() {
    var today = V.todayISO(), up = V.sortShifts(data.shifts.filter(function (s) { return s.date >= today; }));
    var link = settings.link || '';
    var h = '<div class="card"><h2>Ask for help with open shifts</h2><textarea class="msg" id="gapmsg" readonly aria-label="Message asking for help">' + esc(V.gapMessage(data, today, settings.org, link)) + '</textarea>' +
      '<p><button class="primary" data-act="copy" data-t="gapmsg">Copy message</button></p></div>';
    h += '<div class="card"><h2>Remind the people on a shift</h2>' + (up.length ? '<label for="remsel">Which shift?</label><select id="remsel" data-act="remsel">' + up.map(function (s) {
      return '<option value="' + s.id + '"' + (s.id === ui.remShift ? ' selected' : '') + '>' + esc(V.shortDate(s.date) + ' · ' + V.timeRange(s) + ' · ' + s.title) + '</option>'; }).join('') + '</select>' : '<p>No upcoming shifts.</p>');
    if (up.length) {
      var sid = ui.remShift && up.some(function (s) { return s.id === ui.remShift; }) ? ui.remShift : up[0].id, sh = up.filter(function (s) { return s.id === sid; })[0];
      var phones = V.signupsFor(data, sid).map(function (p) { return p.contact; });
      h += '<textarea class="msg" id="remmsg" readonly aria-label="Reminder message">' + esc(V.reminderMessage(data, sh, settings.org)) + '</textarea>' +
        '<div class="row"><button class="primary" data-act="copy" data-t="remmsg">Copy reminder</button>' +
        (phones.length ? '<button data-act="copytxt" data-v="' + esc(phones.join(', ')) + '">Copy their phones/emails</button>' : '') + '</div>';
    }
    return h + '</div>';
  }
  function dataTab() {
    return '<div class="card"><h2>Settings</h2><label for="orgname">Name shown at the top</label><input id="orgname" data-act="orgname" value="' + esc(settings.org) + '">' +
      '<label for="lnk">Your sign-up link (optional, goes into the “ask for help” message)</label><input id="lnk" data-act="link" value="' + esc(settings.link || '') + '" placeholder="https://"></div>' +
      '<div class="card"><h2>Save a copy</h2><div class="row"><button class="primary" data-act="backup">Save a backup file</button>' +
      '<button data-act="csv">Open in a spreadsheet (CSV)</button><button data-act="restore">Restore from a backup</button></div>' +
      '' + ToolkitBackup.fileInput('restorefile') + '</div>' +
      '<div class="card"><h2>Clean up old entries</h2><p class="muted">Past shifts and the names/phone numbers on them can be deleted to keep less information around.</p>' +
      '<button class="danger" data-act="clearold">Delete shifts from before today</button> <button class="link" data-act="clearall">More options</button></div>' +
      '<div class="card"><h2>Practice</h2><p class="muted">Replace everything with made-up sample data to try things out.</p><button data-act="sample">Start over with sample data</button> ' +
      '<button class="link" data-act="welcome">Show the welcome tour again</button></div>';
  }

  // ---------- modals ----------
  function modal(html) { ui.modal = html; render(); var f = document.querySelector('.modal button.primary, .modal input'); if (f) f.focus(); }
  function closeModal() { ui.modal = null; render(); }
  function confirmBox(title, text, yesLabel, onYes) {
    confirmBox.fn = onYes;
    modal('<h2>' + esc(title) + '</h2><p>' + esc(text) + '</p><div class="row"><button class="danger" data-act="yes">' + esc(yesLabel) + '</button><button class="primary" data-act="closemodal">Keep it</button></div>');
  }
  function welcome() {
    modal(ToolkitWelcome.html({ card: false, title: 'Welcome 👋', doneAct: 'closemodal', doneLabel: 'Got it, let me try it',
      intro: 'This is a free sign-up sheet for volunteer shifts. It is filled with <strong>made-up sample shifts</strong> so you can try it.', steps: [
      '<strong>See what volunteers see.</strong> Tap a shift and sign up.', '<strong>Tap “Coordinator”</strong> to see who is coming and which shifts still need people.',
      '<strong>Add your own shift</strong>, then use “Data &amp; settings” to clear the samples when you are ready.'] }).replace('class="primary"', 'class="primary big"'));
  }
  function addPersonModal(id, err) {
    var s = data.shifts.filter(function (x) { return x.id === id; })[0];
    modal('<h2>Add a volunteer</h2><p class="muted">' + esc(s.title) + ' · ' + esc(V.shortDate(s.date)) + '</p><form data-form="addperson" data-id="' + id + '" novalidate>' +
      '<label for="ap_n">Name</label><input id="ap_n" name="name"><label for="ap_c">Phone or email</label><input id="ap_c" name="contact">' +
      (err ? '<div class="err" role="alert">' + esc(err) + '</div>' : '') + '<p class="row"><button class="primary" type="submit">Add</button><button type="button" data-act="closemodal">Cancel</button></p></form>');
  }

  // ---------- render ----------
  function render() {
    var main = ui.mode === 'volunteer' ? volunteerView() + '<hr><p class="small muted"><strong>Privacy:</strong> We keep only your name and phone or email, and only to schedule and remind you about shifts. Nothing is sold or shared. Ask a coordinator to remove your details any time.</p>' : coordView();
    app.innerHTML = header() + '<main>' + main + '</main>' + (ui.modal ? '<div class="modal" role="dialog" aria-modal="true"><div>' + ui.modal + '</div></div>' : '');
    var rc = document.getElementById('repcount'), rs = document.getElementById('f_rep');
    if (rc && rs) rc.style.display = rs.value === 'none' ? 'none' : '';
  }

  function copyText(text, el) {
    function done() { toast('Copied. Now paste it into a text or email.'); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() { var t = el || document.createElement('textarea'); if (!el) { t.value = text; document.body.appendChild(t); } t.removeAttribute('readonly'); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Could not copy. Select the text and copy it by hand.'); } if (!el) t.remove(); else t.setAttribute('readonly', ''); }
  }
  function stamp() { return V.todayISO(); }
  function removedSummary(r) { return (r.shifts ? r.shifts.length : 0) + ' shift(s)'; }

  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b || b.tagName === 'INPUT' || b.tagName === 'SELECT') return;
    var act = b.dataset.act, id = b.dataset.id, v = b.dataset.v;
    if (act === 'mode') { ui.mode = v; ui.lastSignup = null; render(); }
    else if (act === 'view') { ui.view = v; if (v === 'cal' && ui.openShift) { var os = data.shifts.filter(function (x) { return x.id === ui.openShift; })[0]; if (os) ui.month = os.date.slice(0, 7); } render(); }
    else if (act === 'month') { ui.month = V.shiftMonth(ui.month, +v); render(); }
    else if (act === 'calshift') { ui.openShift = id; render(); var ni = document.getElementById('n' + id); if (ni) { ni.scrollIntoView({ block: 'center' }); ni.focus(); } }
    else if (act === 'tab') { ui.tab = v; ui.formErrors = null; render(); }
    else if (act === 'theme') { ToolkitTheme.toggle(settings); saveSettings(); render(); }
    else if (act === 'open') { ui.openShift = ui.openShift === id ? null : id; render(); if (ui.openShift) { var i = document.getElementById('n' + id); if (i) i.focus(); } }
    else if (act === 'cancelmine') {
      var l = ui.lastSignup; confirmBox('Cancel your sign-up?', 'We will take you off ' + l.title + ' on ' + l.when + '.', 'Yes, cancel me', function () {
        var r = V.removeSignup(data, l.id); save(); ui.lastSignup = null; closeModal(); toast('You are off the shift.', function () { if (r) { data.signups.push(r); save(); render(); } }); });
    }
    else if (act === 'rmsignup') { var r = V.removeSignup(data, id); save(); render(); toast('Removed ' + (r ? r.name : ''), function () { data.signups.push(r); save(); render(); }); }
    else if (act === 'rmshift') {
      var sh = data.shifts.filter(function (s) { return s.id === id; })[0], n = V.signupsFor(data, id).length;
      confirmBox('Delete this shift?', sh.title + ' on ' + V.longDate(sh.date) + (n ? ' and the ' + n + ' name(s) signed up for it' : '') + ' will be deleted.', 'Yes, delete', function () {
        var rm = V.removeShift(data, id); save(); closeModal(); toast('Shift deleted.', function () { V.restoreShift(data, rm); save(); render(); }); });
    }
    else if (act === 'addperson') addPersonModal(id);
    else if (act === 'remind') { ui.remShift = id; ui.tab = 'messages'; render(); }
    else if (act === 'closemodal') closeModal();
    else if (act === 'yes') { var fn = confirmBox.fn; confirmBox.fn = null; if (fn) fn(); }
    else if (act === 'undo') { if (toast.undo) toast.undo(); toast.undo = null; var t = document.getElementById('toast'); if (t) t.remove(); }
    else if (act === 'print') ToolkitPrint.print('Volunteer roster ' + ui.rosterDate);
    else if (act === 'copy') { var el = document.getElementById(b.dataset.t); copyText(el.value, el); }
    else if (act === 'copytxt') copyText(v);
    else if (act === 'backup') { ToolkitBackup.save({ app: 'volunteer-shifts', filename: 'volunteer-backup-' + stamp() + '.json', data: data, settings: settings }); toast('Backup saved to your Downloads.'); }
    else if (act === 'csv') { ToolkitCsv.download('volunteer-schedule-' + stamp() + '.csv', V.toRows(data)); toast('Spreadsheet file saved to your Downloads.'); }
    else if (act === 'restore') ToolkitBackup.pick('restorefile');
    else if (act === 'clearold') {
      var today = V.todayISO(), cnt = data.shifts.filter(function (s) { return s.date < today; });
      if (!cnt.length) return toast('There are no past shifts to delete.');
      confirmBox('Delete past shifts?', cnt.length + ' past shift(s) and every name and phone/email on them will be deleted.', 'Yes, delete them', function () {
        var rm = V.clearOlderThan(data, today); save(); closeModal(); toast('Past shifts deleted.', function () { rm.shifts.forEach(function (s) { data.shifts.push(s); }); rm.signups.forEach(function (x) { data.signups.push(x); }); save(); render(); }); });
    }
    else if (act === 'clearall') {
      confirmBox('Delete everything?', 'ALL shifts and ALL names and phone numbers will be deleted. Save a backup first if you might need them.', 'Yes, delete everything', function () {
        var old = data; data = V.emptyData(); save(); closeModal(); toast('Everything deleted.', function () { data = old; save(); render(); }); });
    }
    else if (act === 'sample') confirmBox('Start over with sample data?', 'Your current shifts and names will be replaced by made-up examples.', 'Yes, replace', function () {
      var old = data; data = V.sampleData(window.VOLUNTEER_SAMPLE); save(); closeModal(); toast('Sample data loaded.', function () { data = old; save(); render(); }); });
    else if (act === 'welcome') welcome();
  });
  document.addEventListener('input', function (e) {
    var a = e.target.dataset.act;
    if (a === 'orgname') { settings.org = e.target.value || 'Volunteer sign-up'; saveSettings(); document.querySelector('header h1').textContent = settings.org; }
    else if (a === 'link') { settings.link = e.target.value.trim(); saveSettings(); }
  });
  document.addEventListener('change', function (e) {
    var a = e.target.dataset.act;
    if (a === 'rosterdate') { ui.rosterDate = e.target.value || V.todayISO(); render(); }
    else if (a === 'remsel') { ui.remShift = e.target.value; render(); }
    else if (e.target.id === 'f_rep') { document.getElementById('repcount').style.display = e.target.value === 'none' ? 'none' : ''; }
    else if (e.target.id === 'restorefile') {
      var file = e.target.files[0]; if (!file) return;
      ToolkitBackup.read(file, function (err, bk) {
        try { if (err) throw err; var d = V.sanitize(bk.data); if (!d) throw 0;
          confirmBox('Restore this backup?', 'This has ' + d.shifts.length + ' shift(s). It will replace what is here now.', 'Yes, restore', function () { var old = data; data = d; save(); closeModal(); toast('Backup restored.', function () { data = old; save(); render(); }); });
        } catch (x) { toast('That file is not a backup from this app. Pick the file that was saved with “Save a backup file”.'); }
      });
      e.target.value = '';
    }
  });
  document.addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target, kind = f.dataset.form, fd = new FormData(f), id = f.dataset.id;
    if (kind === 'signup') {
      var r = V.addSignup(data, id, fd.get('name'), fd.get('contact'));
      if (!r.ok) { document.getElementById('e' + id).innerHTML = '<div class="err">' + esc(r.error) + '</div>'; return; }
      var s = data.shifts.filter(function (x) { return x.id === id; })[0];
      save(); ui.lastSignup = { id: r.signup.id, name: r.signup.name.split(' ')[0], title: s.title, when: V.longDate(s.date) + ', ' + V.timeRange(s) }; ui.openShift = null; render(); window.scrollTo(0, 0);
    } else if (kind === 'addshift') {
      var o = {}; fd.forEach(function (v, k) { o[k] = v; }); ui.form = o;
      var m = V.makeShifts(o);
      if (!m.ok) { ui.formErrors = m.errors; render(); return; }
      m.shifts.forEach(function (s) { data.shifts.push(s); }); save(); ui.form = null; ui.formErrors = null; ui.tab = 'schedule'; render();
      toast(m.shifts.length > 1 ? m.shifts.length + ' shifts added.' : 'Shift added.');
    } else if (kind === 'addperson') {
      var r2 = V.addSignup(data, id, fd.get('name'), fd.get('contact'));
      if (!r2.ok) return addPersonModal(id, r2.error);
      save(); closeModal(); toast('Volunteer added.');
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ui.modal) closeModal(); });

  render();
  if (firstRun) welcome();
})();
