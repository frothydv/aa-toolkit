/* event-checkin core: pure logic, no DOM, no storage. Works in browsers and Node.
   Data: {version, guests:[{id,name,familyId|null,createdAt}], events:[{id,name,date}],
          checkins:[{id,eventId,guestId,at}]}
   Only a name is stored for each guest. Families are just a shared familyId. */
(function (root) {
  'use strict';
  var C = {};
  var seq = 0;
  C.uid = function (p) { seq++; return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + seq.toString(36); };
  C.emptyData = function () { return { version: 1, guests: [], events: [], checkins: [] }; };
  C.norm = function (s) {
    s = String(s == null ? '' : s).toLowerCase();
    try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
    return s.replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  };
  /* Tidy a typed name: trim, squash spaces, fix ALL CAPS / all lower case, "Last, First" -> "First Last". */
  C.tidyName = function (s) {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, 80);
    if (s.indexOf(',') > 0 && s.split(',').length === 2) { var p = s.split(','); s = (p[1].trim() + ' ' + p[0].trim()).trim(); }
    /* Fix a word only if it is all lower or all upper case; leave McDonald, DeShawn etc. alone. */
    s = s.split(' ').map(function (w) {
      if (w !== w.toLowerCase() && w !== w.toUpperCase()) return w;
      return w.toLowerCase().replace(/(^|[\-'])([a-z\u00c0-\u024f])/g, function (m, x, y) { return x + y.toUpperCase(); });
    }).join(' ');
    return s;
  };
  C.today = function (d) { d = d || new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  /* Understands 2026-10-09 and "9 Oct 2026" (day/month numbers are ambiguous, so not guessed); else null. */
  C.parseDate = function (s) {
    s = String(s || '').trim(); var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s), t;
    if (m) t = new Date(+m[1], +m[2] - 1, +m[3]); else { var n = Date.parse(s); if (isNaN(n)) return null; t = new Date(n); }
    if (isNaN(t.getTime()) || t.getFullYear() < 2000 || t.getFullYear() > 2100) return null;
    return C.today(t);
  };
  C.sanitize = function (d) {
    var o = C.emptyData(); if (!d || typeof d !== 'object') return o;
    var gids = {}, eids = {}, seen = {};
    (Array.isArray(d.guests) ? d.guests : []).forEach(function (g) {
      if (!g || !g.id || !g.name || gids[g.id]) return;
      gids[g.id] = 1; o.guests.push({ id: String(g.id), name: C.tidyName(g.name) || String(g.name).slice(0, 80), familyId: g.familyId ? String(g.familyId) : null, createdAt: +g.createdAt || 0 });
    });
    (Array.isArray(d.events) ? d.events : []).forEach(function (e) {
      if (!e || !e.id || eids[e.id]) return; var dt = C.parseDate(e.date); if (!dt) return;
      eids[e.id] = 1; o.events.push({ id: String(e.id), name: String(e.name || 'Event').slice(0, 80), date: dt });
    });
    (Array.isArray(d.checkins) ? d.checkins : []).forEach(function (c) {
      if (!c || !gids[c.guestId] || !eids[c.eventId]) return;
      var k = c.eventId + '|' + c.guestId; if (seen[k]) return; seen[k] = 1;
      o.checkins.push({ id: String(c.id || C.uid('c')), eventId: c.eventId, guestId: c.guestId, at: +c.at || 0 });
    });
    C.leaveLoneFamilies(o);
    return o;
  };
  C.guest = function (d, id) { for (var i = 0; i < d.guests.length; i++) if (d.guests[i].id === id) return d.guests[i]; return null; };
  C.event = function (d, id) { for (var i = 0; i < d.events.length; i++) if (d.events[i].id === id) return d.events[i]; return null; };
  C.findByName = function (d, name) { var n = C.norm(name); return d.guests.filter(function (g) { return C.norm(g.name) === n; })[0] || null; };
  C.addGuest = function (d, name, familyId, now) {
    name = C.tidyName(name); if (!C.norm(name)) return { error: 'Please type a name.' };
    var ex = C.findByName(d, name); if (ex) return { guest: ex, existed: true };
    var g = { id: C.uid('g'), name: name, familyId: familyId || null, createdAt: now || Date.now() };
    d.guests.push(g); return { guest: g, existed: false };
  };
  /* names: typed names that belong together. Existing guests are reused and joined to the family. */
  C.addFamily = function (d, names, now) {
    var fid = C.uid('f'), out = [];
    names.forEach(function (n) {
      if (!C.norm(n)) return;
      var r = C.addGuest(d, n, fid, now); if (r.error) return;
      if (r.existed && r.guest.familyId && r.guest.familyId !== fid) { var keep = r.guest.familyId; out.forEach(function (g) { g.familyId = keep; }); fid = keep; }
      r.guest.familyId = fid; if (out.indexOf(r.guest) < 0) out.push(r.guest);
    });
    C.leaveLoneFamilies(d);
    return out;
  };
  C.familyMembers = function (d, g) { return g.familyId ? d.guests.filter(function (x) { return x.familyId === g.familyId; }) : [g]; };
  C.leaveLoneFamilies = function (d) {
    var n = {}; d.guests.forEach(function (g) { if (g.familyId) n[g.familyId] = (n[g.familyId] || 0) + 1; });
    d.guests.forEach(function (g) { if (g.familyId && n[g.familyId] < 2) g.familyId = null; });
  };
  C.renameGuest = function (d, id, name) { var g = C.guest(d, id); name = C.tidyName(name); if (!g || !C.norm(name)) return false; g.name = name; return true; };
  C.removeGuest = function (d, id) {
    d.guests = d.guests.filter(function (g) { return g.id !== id; });
    d.checkins = d.checkins.filter(function (c) { return c.guestId !== id; }); C.leaveLoneFamilies(d);
  };
  C.addEvent = function (d, name, date) {
    name = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 80); if (!name) return { error: 'Please give the event a name.' };
    var dt = C.parseDate(date || C.today()); if (!dt) return { error: 'That date was not understood. Try it like 2026-10-11 or 11 Oct 2026.' };
    var ex = d.events.filter(function (e) { return e.name.toLowerCase() === name.toLowerCase() && e.date === dt; })[0];
    if (ex) return { event: ex, existed: true };
    var e = { id: C.uid('e'), name: name, date: dt }; d.events.push(e); return { event: e, existed: false };
  };
  C.removeEvent = function (d, id) { d.events = d.events.filter(function (e) { return e.id !== id; }); d.checkins = d.checkins.filter(function (c) { return c.eventId !== id; }); };
  C.eventsSorted = function (d) { return d.events.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; }); };
  C.isHere = function (d, eventId, guestId) { for (var i = 0; i < d.checkins.length; i++) if (d.checkins[i].eventId === eventId && d.checkins[i].guestId === guestId) return true; return false; };
  C.checkIn = function (d, eventId, guestId, now) {
    if (!C.event(d, eventId) || !C.guest(d, guestId) || C.isHere(d, eventId, guestId)) return false;
    d.checkins.push({ id: C.uid('c'), eventId: eventId, guestId: guestId, at: now || Date.now() }); return true;
  };
  /* Checks in several people; returns the ids actually added (so Undo removes exactly those). */
  C.checkInMany = function (d, eventId, ids, now) { return ids.filter(function (id) { return C.checkIn(d, eventId, id, now); }); };
  C.undoCheckIn = function (d, eventId, guestId) {
    var n = d.checkins.length; d.checkins = d.checkins.filter(function (c) { return !(c.eventId === eventId && c.guestId === guestId); }); return d.checkins.length < n;
  };
  C.visitCounts = function (d) { var m = {}; d.checkins.forEach(function (c) { m[c.guestId] = (m[c.guestId] || 0) + 1; }); return m; };
  C.lastSeen = function (d) {
    var ev = {}; d.events.forEach(function (e) { ev[e.id] = e.date; }); var m = {};
    d.checkins.forEach(function (c) { var dt = ev[c.eventId]; if (dt && (!m[c.guestId] || dt > m[c.guestId])) m[c.guestId] = dt; }); return m;
  };
  /* Every typed word must start a word of the name. Best matches first, then frequent visitors.
     Returns [{guest, here, visits}] (max `limit`). */
  C.search = function (d, q, eventId, limit) {
    var words = C.norm(q).split(' ').filter(Boolean); if (!words.length) return [];
    var counts = C.visitCounts(d), res = [];
    d.guests.forEach(function (g) {
      var n = C.norm(g.name), parts = n.split(' '), score = 0, ok = true;
      words.forEach(function (w) {
        if (n.indexOf(w) === 0) score += 3;
        else if (parts.some(function (p) { return p.indexOf(w) === 0; })) score += 2;
        else ok = false;
      });
      if (!ok) return;
      if (n === words.join(' ')) score += 5;
      res.push({ guest: g, here: eventId ? C.isHere(d, eventId, g.id) : false, visits: counts[g.id] || 0, score: score });
    });
    res.sort(function (a, b) { return b.score - a.score || b.visits - a.visits || (a.guest.name < b.guest.name ? -1 : 1); });
    return res.slice(0, limit || 30);
  };
  C.attendees = function (d, eventId) {
    var gs = {}; d.guests.forEach(function (g) { gs[g.id] = g; });
    return d.checkins.filter(function (c) { return c.eventId === eventId && gs[c.guestId]; })
      .sort(function (a, b) { return b.at - a.at; }).map(function (c) { return { guest: gs[c.guestId], at: c.at }; });
  };
  /* Live headcount for one event. firstTime = people with no check-in at any earlier event. */
  C.headcount = function (d, eventId) {
    var ev = C.event(d, eventId); if (!ev) return { total: 0, firstTime: 0 };
    var dates = {}; d.events.forEach(function (e) { dates[e.id] = e.date; });
    var before = {}; d.checkins.forEach(function (c) { if (c.eventId !== eventId && dates[c.eventId] && dates[c.eventId] < ev.date) before[c.guestId] = 1; });
    var total = 0, ft = 0;
    d.checkins.forEach(function (c) { if (c.eventId !== eventId) return; total++; if (!before[c.guestId]) ft++; });
    return { total: total, firstTime: ft };
  };
  C.fmtDate = function (iso) {
    var p = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ''); if (!p) return iso || '';
    var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return +p[3] + ' ' + m[+p[2] - 1] + ' ' + p[1];
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.Checkin = C;
})(typeof window !== 'undefined' ? window : this);
