/* Volunteer shifts core: pure logic, no storage, no DOM, no organization details.
   Works in a browser (global VolunteerShifts) and in Node (module.exports). */
(function (root) {
  'use strict';

  function uid(prefix) {
    return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseISO(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(iso, n) { var d = parseISO(iso); d.setDate(d.getDate() + n); return isoDate(d); }
  function todayISO() { return isoDate(new Date()); }

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function longDate(iso) { var d = parseISO(iso); return DAYS[d.getDay()] + ' ' + MONTHS[d.getMonth()] + ' ' + d.getDate(); }
  function shortDate(iso) { var d = parseISO(iso); return DAYS[d.getDay()].slice(0, 3) + ' ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate(); }

  /* "9:00", "9am", "930", "2 pm", "14:30" -> "HH:MM" or '' */
  function parseTime(s) {
    s = String(s == null ? '' : s).trim().toLowerCase().replace(/\./g, '');
    var m = s.match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm|a|p)?$/);
    if (!m) return '';
    var h = +m[1], min = m[2] ? +m[2] : 0, ap = m[3];
    if (min > 59) return '';
    if (ap) { if (h < 1 || h > 12) return ''; if (ap[0] === 'p' && h < 12) h += 12; if (ap[0] === 'a' && h === 12) h = 0; }
    else if (h > 23) return '';
    return pad(h) + ':' + pad(min);
  }
  function fmtTime(t) {
    if (!t) return '';
    var p = t.split(':'), h = +p[0], m = p[1];
    var ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
    return h + (m === '00' ? '' : ':' + m) + ap;
  }
  function timeRange(s) { return fmtTime(s.start) + (s.end ? '–' + fmtTime(s.end) : ''); }

  /* Phone numbers: accept messy input, keep a tidy form. Returns {ok, kind, value}. */
  function cleanContact(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (!s) return { ok: false, kind: '', value: '' };
    if (s.indexOf('@') >= 0) {
      var e = s.replace(/\s+/g, '').toLowerCase();
      return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e) ? { ok: true, kind: 'email', value: e } : { ok: false, kind: 'email', value: s };
    }
    var digits = s.replace(/\D/g, '');
    if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1);
    if (digits.length === 10) return { ok: true, kind: 'phone', value: digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6) };
    if (digits.length >= 7 && digits.length <= 15 && /^[\d\s()+.\-]+$/.test(s)) return { ok: true, kind: 'phone', value: s.replace(/\s+/g, ' ') };
    return { ok: false, kind: 'phone', value: s };
  }
  function cleanName(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, 60); }

  /* Build one or many shifts. opts: {title,date,start,end,needed,place,notes, repeat:'none'|'weekly'|'daily', count}
     Repeats are stored as separate shifts sharing a repeatId so each can be edited or removed alone. */
  function makeShifts(o) {
    var errors = [];
    var title = String(o.title || '').trim();
    if (!title) errors.push('Give the shift a name, like "Saturday food distribution".');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(o.date || '')) errors.push('Pick a date.');
    var start = parseTime(o.start), end = o.end ? parseTime(o.end) : '';
    if (!start) errors.push('Enter a start time, like 9am.');
    if (o.end && !end) errors.push('The end time did not look right. Try 11am.');
    var needed = parseInt(o.needed, 10);
    if (!(needed >= 1)) errors.push('How many people are needed? Enter 1 or more.');
    if (errors.length) return { ok: false, errors: errors, shifts: [] };
    var repeat = o.repeat || 'none';
    var count = repeat === 'none' ? 1 : Math.max(1, Math.min(60, parseInt(o.count, 10) || 1));
    var step = repeat === 'daily' ? 1 : 7;
    var repeatId = count > 1 ? uid('rep') : '';
    var out = [];
    for (var i = 0; i < count; i++) {
      out.push({ id: uid('s'), title: title, date: addDays(o.date, i * step), start: start, end: end, needed: needed,
        place: String(o.place || '').trim(), notes: String(o.notes || '').trim(), repeatId: repeatId });
    }
    return { ok: true, errors: [], shifts: out };
  }

  function signupsFor(data, shiftId) { return data.signups.filter(function (x) { return x.shiftId === shiftId; }); }

  /* status: 'open' (nobody), 'needs' (some, not enough), 'full' */
  function shiftStatus(data, shift) {
    var n = signupsFor(data, shift.id).length, need = shift.needed;
    return { signed: n, needed: need, missing: Math.max(0, need - n),
      state: n >= need ? 'full' : (n === 0 ? 'open' : 'needs') };
  }

  function sortShifts(list) {
    return list.slice().sort(function (a, b) {
      return (a.date + (a.start || '')).localeCompare(b.date + (b.start || '')) || a.title.localeCompare(b.title);
    });
  }

  function addSignup(data, shiftId, name, contact) {
    var shift = data.shifts.filter(function (s) { return s.id === shiftId; })[0];
    if (!shift) return { ok: false, error: 'That shift is no longer on the schedule. Please refresh.' };
    name = cleanName(name);
    if (!name) return { ok: false, error: 'Please type your name.' };
    var c = cleanContact(contact);
    if (!c.ok) return { ok: false, error: c.value ? 'That phone or email does not look right. Try a phone like 555-123-4567 or an email like you@example.com.' : 'Please add a phone number or an email so we can remind you.' };
    var dupe = signupsFor(data, shiftId).some(function (x) { return x.contact === c.value || x.name.toLowerCase() === name.toLowerCase(); });
    if (dupe) return { ok: false, error: 'You are already signed up for this shift.' };
    if (signupsFor(data, shiftId).length >= shift.needed) return { ok: false, error: 'Sorry, this shift just filled up. Please pick another.' };
    var s = { id: uid('v'), shiftId: shiftId, name: name, contact: c.value, createdAt: new Date().toISOString() };
    data.signups.push(s);
    return { ok: true, signup: s };
  }

  function removeShift(data, shiftId) {
    var shift = data.shifts.filter(function (s) { return s.id === shiftId; })[0];
    var sus = signupsFor(data, shiftId);
    data.shifts = data.shifts.filter(function (s) { return s.id !== shiftId; });
    data.signups = data.signups.filter(function (x) { return x.shiftId !== shiftId; });
    return { shift: shift, signups: sus };
  }
  function restoreShift(data, removed) {
    if (removed.shift) data.shifts.push(removed.shift);
    removed.signups.forEach(function (x) { data.signups.push(x); });
  }
  function removeSignup(data, signupId) {
    var s = data.signups.filter(function (x) { return x.id === signupId; })[0];
    data.signups = data.signups.filter(function (x) { return x.id !== signupId; });
    return s;
  }
  /* Data care: delete every shift (and its entries) dated before `beforeISO`. Returns the removed pieces for undo. */
  function clearOlderThan(data, beforeISO) {
    var gone = data.shifts.filter(function (s) { return s.date < beforeISO; });
    var ids = {}; gone.forEach(function (s) { ids[s.id] = 1; });
    var gs = data.signups.filter(function (x) { return ids[x.shiftId]; });
    data.shifts = data.shifts.filter(function (s) { return !ids[s.id]; });
    data.signups = data.signups.filter(function (x) { return !ids[x.shiftId]; });
    return { shifts: gone, signups: gs };
  }

  function gaps(data, fromISO, days) {
    var to = addDays(fromISO, days || 14);
    return sortShifts(data.shifts.filter(function (s) { return s.date >= fromISO && s.date <= to && shiftStatus(data, s).missing > 0; }));
  }

  /* Printable roster text for one day (also used as the plain-text fallback). */
  function rosterRows(data, iso) {
    return sortShifts(data.shifts.filter(function (s) { return s.date === iso; })).map(function (s) {
      var st = shiftStatus(data, s);
      return { shift: s, status: st, people: signupsFor(data, s.id) };
    });
  }

  /* Reminder message to paste into a text or email. */
  function reminderMessage(data, shift, orgName) {
    var people = signupsFor(data, shift.id);
    var names = people.map(function (p) { return p.name.split(' ')[0]; });
    var greet = names.length ? 'Hi ' + names.join(', ') + '!' : 'Hi everyone!';
    return greet + ' A friendly reminder from ' + (orgName || 'our team') + ': ' + shift.title + ' is ' + longDate(shift.date) +
      ', ' + timeRange(shift) + (shift.place ? ' at ' + shift.place : '') + '.' +
      (shift.notes ? ' ' + shift.notes : '') + ' Thank you for helping! Can\'t make it? Please let us know as soon as you can.';
  }
  /* Message asking for help on unfilled shifts. */
  function gapMessage(data, fromISO, orgName, link) {
    var g = gaps(data, fromISO, 21);
    if (!g.length) return 'Every upcoming shift is covered. Thank you, volunteers!';
    var lines = g.map(function (s) { var m = shiftStatus(data, s).missing; return '• ' + shortDate(s.date) + ', ' + timeRange(s) + ' ' + s.title + ' (need ' + m + ' more)'; });
    return (orgName || 'We') + ' still need help with:\n' + lines.join('\n') + (link ? '\nSign up here: ' + link : '\nSign up with the link we shared.');
  }

  function csvCell(v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  /* One row per volunteer entry, plus a row for each shift with nobody signed up. */
  function toCSV(data) {
    var rows = [['Date', 'Start', 'End', 'Shift', 'Place', 'People needed', 'Volunteer', 'Phone or email', 'Signed up on']];
    sortShifts(data.shifts).forEach(function (s) {
      var people = signupsFor(data, s.id);
      var base = [s.date, fmtTime(s.start), fmtTime(s.end), s.title, s.place, s.needed];
      if (!people.length) rows.push(base.concat(['', '', '']));
      people.forEach(function (p) { rows.push(base.concat([p.name, p.contact, (p.createdAt || '').slice(0, 10)])); });
    });
    return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
  }

  function emptyData() { return { version: 1, shifts: [], signups: [] }; }
  /* Validate/repair data read from a backup file or storage. Returns a clean object or null. */
  function sanitize(d) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.shifts) || !Array.isArray(d.signups)) return null;
    var out = emptyData();
    d.shifts.forEach(function (s) {
      if (s && s.id && s.title && /^\d{4}-\d{2}-\d{2}$/.test(s.date || '')) out.shifts.push({ id: String(s.id), title: String(s.title), date: s.date,
        start: s.start || '', end: s.end || '', needed: Math.max(1, parseInt(s.needed, 10) || 1), place: s.place || '', notes: s.notes || '', repeatId: s.repeatId || '' });
    });
    var ids = {}; out.shifts.forEach(function (s) { ids[s.id] = 1; });
    d.signups.forEach(function (x) { if (x && x.id && ids[x.shiftId] && x.name) out.signups.push({ id: String(x.id), shiftId: x.shiftId, name: String(x.name), contact: String(x.contact || ''), createdAt: x.createdAt || '' }); });
    return out;
  }

  /* Made-up sample schedule, dated relative to today so it always looks current. */
  function sampleData(sample) {
    var base = todayISO(), d = emptyData();
    sample.shifts.forEach(function (t) {
      var date = addDays(base, t.dayOffset), repeatId = t.repeatWeeks ? uid('rep') : '';
      for (var w = 0; w < (t.repeatWeeks || 1); w++) {
        var s = { id: uid('s'), title: t.title, date: addDays(date, w * 7), start: t.start, end: t.end, needed: t.needed, place: t.place || '', notes: t.notes || '', repeatId: repeatId };
        d.shifts.push(s);
        if (w === 0) (t.people || []).forEach(function (p) { d.signups.push({ id: uid('v'), shiftId: s.id, name: p[0], contact: p[1], createdAt: new Date().toISOString() }); });
      }
    });
    return d;
  }

  root.VolunteerShifts = { uid: uid, isoDate: isoDate, parseISO: parseISO, addDays: addDays, todayISO: todayISO, longDate: longDate, shortDate: shortDate,
    parseTime: parseTime, fmtTime: fmtTime, timeRange: timeRange, cleanContact: cleanContact, cleanName: cleanName, makeShifts: makeShifts,
    signupsFor: signupsFor, shiftStatus: shiftStatus, sortShifts: sortShifts, addSignup: addSignup, removeShift: removeShift, restoreShift: restoreShift,
    removeSignup: removeSignup, clearOlderThan: clearOlderThan, gaps: gaps, rosterRows: rosterRows, reminderMessage: reminderMessage,
    gapMessage: gapMessage, toCSV: toCSV, emptyData: emptyData, sanitize: sanitize, sampleData: sampleData };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.VolunteerShifts;
})(typeof window !== 'undefined' ? window : globalThis);
