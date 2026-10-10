/* Resource directory core: a list of local help places (food, meals, rides, shelter...) with structured open days.
   No organization details here. Works in the browser and in Node. Needs ToolkitSearch (typeahead-search) loaded first.
   Place: {id, category, name, address, phone, days:[0-6 Sun..Sat], times, hoursNote, notes, checked:'YYYY-MM-DD', lat, lon}
   Data:  {places:[...], categories:[{id,label,color,words}]}   (categories optional: defaults are filled in) */
(function (root) {
  'use strict';
  var S = root.ToolkitSearch; // load components/typeahead-search/search.js first
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var CATEGORIES = [
    { id: 'pantry', label: 'Food pantries', color: '#1f7a45', words: 'food pantry groceries grocery hungry box' },
    { id: 'meals', label: 'Free meals', color: '#b45309', words: 'food meal meals lunch dinner breakfast hot soup kitchen eat supper' },
    { id: 'rides', label: 'Rides to medical appointments', color: '#1c55b0', words: 'ride rides transport transportation medical doctor appointment clinic driver van' },
    { id: 'shelter', label: 'Shelters', color: '#7e3fb0', words: 'shelter bed beds housing homeless overnight warming sleep' },
    { id: 'utilities', label: 'Utility help', color: '#b3261e', words: 'utility utilities electric electricity gas heat heating water bill bills power' },
    { id: 'other', label: 'Other help', color: '#46505b', words: 'other clothing legal' }
  ];
  var DAY_WORDS = { weekend: [0, 6], weekends: [0, 6], weekday: [1, 2, 3, 4, 5], weekdays: [1, 2, 3, 4, 5] };

  function str(v, max) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max || 200); }
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function isoOk(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s : ''; }
  function num(v, lim) { if (v === '' || v == null) return null; v = +v; return isFinite(v) && Math.abs(v) <= lim ? v : null; }

  /* 3015550142 / 301.555.0142 / 1-301-555-0142 -> (301) 555-0142; anything else (extensions, 211) is kept as typed */
  function tidyPhone(p) {
    p = str(p, 40); var d = p.replace(/\D/g, '');
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    if (d.length === 10 && /^[\d\s().\-+]+$/.test(p)) return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
    return p;
  }
  function cats(data) { return data && data.categories && data.categories.length ? data.categories : CATEGORIES; }
  function cleanPlace(p, cl) {
    p = p || {}; var ids = cl.map(function (c) { return c.id; }), seen = {}, days = [];
    (Array.isArray(p.days) ? p.days : []).forEach(function (d) { d = +d; if (d >= 0 && d <= 6 && d === Math.floor(d) && !seen[d]) { seen[d] = 1; days.push(d); } });
    days.sort(function (a, b) { return a - b; });
    var lat = num(p.lat, 90), lon = num(p.lon, 180); if (lat == null || lon == null) { lat = null; lon = null; }
    return { id: str(p.id, 40) || uid(), category: ids.indexOf(p.category) >= 0 ? p.category : ids[ids.length - 1], name: str(p.name, 120), address: str(p.address, 200), phone: tidyPhone(p.phone),
      days: days, times: str(p.times, 60), hoursNote: str(p.hoursNote, 160), notes: str(p.notes, 300), checked: isoOk(p.checked), lat: lat, lon: lon };
  }
  function sanitize(d) {
    d = d && typeof d === 'object' ? d : {};
    var cl = Array.isArray(d.categories) && d.categories.length ? d.categories.map(function (c) { return { id: str(c.id, 30), label: str(c.label, 60), color: /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : '#46505b', words: str(c.words, 300) }; }).filter(function (c) { return c.id && c.label; }) : CATEGORIES;
    if (!cl.length) cl = CATEGORIES;
    return { categories: cl, places: (Array.isArray(d.places) ? d.places : []).map(function (p) { return cleanPlace(p, cl); }).filter(function (p) { return p.name; }) };
  }
  function blank(category, today) { return { id: uid(), category: category || 'pantry', name: '', address: '', phone: '', days: [], times: '', hoursNote: '', notes: '', checked: today || '', lat: null, lon: null }; }

  /* [1,2,3,5] -> "Mon–Wed, Fri"; all seven -> "Every day" */
  function dayList(days) {
    if (!days.length) return ''; if (days.length === 7) return 'Every day';
    var out = [], i = 0;
    while (i < days.length) {
      var j = i; while (j + 1 < days.length && days[j + 1] === days[j] + 1) j++;
      out.push(j - i >= 2 ? SHORT[days[i]] + '–' + SHORT[days[j]] : days.slice(i, j + 1).map(function (d) { return SHORT[d]; }).join(', ')); i = j + 1;
    }
    return out.join(', ');
  }
  function hoursText(p) {
    var a = [dayList(p.days), p.times].filter(Boolean).join(' '), parts = [a, p.hoursNote].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Call for hours';
  }
  /* Days since "checked" (null if never). stale = never checked, or older than staleDays. */
  function daysSince(p, today) { return p.checked ? Math.round((new Date(today + 'T12:00:00') - new Date(p.checked + 'T12:00:00')) / 86400000) : null; }
  function isStale(p, today, staleDays) { var n = daysSince(p, today); return n == null || n > (staleDays || 90); }

  function dayTokens(t, today) {
    var out = [], i;
    if (DAY_WORDS[t]) return DAY_WORDS[t];
    var now = today ? new Date(today + 'T12:00:00').getDay() : -1;
    if (t === 'today' || t === 'tonight') return now < 0 ? [] : [now];
    if (t === 'tomorrow') return now < 0 ? [] : [(now + 1) % 7];
    if (t.length < 2) return out;
    for (i = 0; i < 7; i++) if (DAYS[i].toLowerCase().indexOf(t) === 0) out.push(i);
    if (!out.length && t.length >= 3) for (i = 0; i < 7; i++) if (t.indexOf(DAYS[i].toLowerCase().slice(0, 3)) === 0 && DAYS[i].toLowerCase().indexOf(t.slice(0, 4)) === 0) out.push(i); // "thurs", "tues"
    return out;
  }
  /* Does one typed word fit this place? Name/address/notes words, its kind of help (and that kind's keywords), or an open day. */
  function tokenFits(t, p, cat, today) {
    if (S.wordPrefix(t, p.name + ' ' + p.address + ' ' + p.notes + ' ' + p.hoursNote)) return true;
    if (cat && (S.wordPrefix(t, cat.label) || S.wordPrefix(t, cat.words))) return true;
    var dt = dayTokens(t, today); if (dt.length) return dt.some(function (d) { return p.days.indexOf(d) >= 0; });
    return false;
  }
  function search(data, query, today) {
    var toks = S.tokens(query), cl = cats(data), byId = {}; cl.forEach(function (c) { byId[c.id] = c; });
    return data.places.filter(function (p) { return S.matchAll(toks, function (t) { return tokenFits(t, p, byId[p.category], today); }); });
  }
  function sortPlaces(list) { return list.slice().sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; }); }
  /* -> [{cat, places:[...]}] in category order, empty groups left out */
  function group(data, places) {
    return cats(data).map(function (c) { return { cat: c, places: sortPlaces(places.filter(function (p) { return p.category === c.id; })) }; }).filter(function (g) { return g.places.length; });
  }
  function csvRows(data) {
    var byId = {}; cats(data).forEach(function (c) { byId[c.id] = c.label; });
    var rows = [['Kind of help', 'Name', 'Address', 'Phone', 'Open days', 'Times', 'Hours note', 'Notes', 'Last checked']];
    group(data, data.places).forEach(function (g) { g.places.forEach(function (p) { rows.push([g.cat.label, p.name, p.address, p.phone, dayList(p.days), p.times, p.hoursNote, p.notes, p.checked]); }); });
    return rows;
  }
  var api = { DAYS: DAYS, SHORT: SHORT, CATEGORIES: CATEGORIES, sanitize: sanitize, blank: blank, tidyPhone: tidyPhone, dayList: dayList, hoursText: hoursText, daysSince: daysSince, isStale: isStale,
    search: search, group: group, sortPlaces: sortPlaces, csvRows: csvRows, categories: cats };
  root.Directory = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
