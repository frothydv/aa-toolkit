/* Forgiving dates for forms. ToolkitDates.parse('10/9/26') -> '2026-10-09' (or '' if it is not a date).
   Accepts 2026-10-09, 10/9/2026, 10/9/26, 10-9 (this year), "Oct 9 2026", "9 Oct 2026", and month + year only
   ("10/2027", "Oct 2027") which means the LAST day of that month (how best-by dates on cans are usually read).
   Also: iso(Date), today(), addDays(iso, n), daysBetween(fromIso, toIso), describe(days). Works in browser and Node. */
(function (root) {
  'use strict';
  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return iso(new Date()); }
  function addDays(s, n) { var d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }
  function build(y, mo, d) {
    if (y < 100) y += 2000;
    var dt = new Date(y, mo - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? iso(dt) : '';
  }
  function monthNum(w) { var i = MONTHS.indexOf(String(w).slice(0, 3).toLowerCase()); return i < 0 ? 0 : i + 1; }
  function lastDay(y, mo) { if (y < 100) y += 2000; return new Date(y, mo, 0).getDate(); }

  function parse(s) {
    s = String(s == null ? '' : s).replace(/[,\s]+/g, ' ').trim(); if (!s) return '';
    var m, y = new Date().getFullYear();
    if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) return build(+m[1], +m[2], +m[3]);
    if ((m = s.match(/^(\d{1,2})[\/.-](\d{4})$/))) return +m[1] >= 1 && +m[1] <= 12 ? build(+m[2], +m[1], lastDay(+m[2], +m[1])) : '';
    if ((m = s.match(/^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2}|\d{4}))?$/))) return build(m[3] ? +m[3] : y, +m[1], +m[2]);
    if ((m = s.match(/^([A-Za-z]{3,9})\.? (\d{4})$/)) && monthNum(m[1])) return build(+m[2], monthNum(m[1]), lastDay(+m[2], monthNum(m[1])));
    if ((m = s.match(/^([A-Za-z]{3,9})\.? (\d{1,2})(?: (\d{2}|\d{4}))?$/)) && monthNum(m[1])) return build(m[3] ? +m[3] : y, monthNum(m[1]), +m[2]);
    if ((m = s.match(/^(\d{1,2}) ([A-Za-z]{3,9})\.?(?: (\d{2}|\d{4}))?$/)) && monthNum(m[2])) return build(m[3] ? +m[3] : y, monthNum(m[2]), +m[1]);
    return '';
  }

  /* 3 -> "3 days left", 1 -> "1 day left", 0 -> "today", -2 -> "2 days past" */
  function describe(days) {
    if (days === 0) return 'today';
    var n = Math.abs(days); return n + (n === 1 ? ' day ' : ' days ') + (days > 0 ? 'left' : 'past');
  }

  root.ToolkitDates = { parse: parse, iso: iso, today: today, addDays: addDays, daysBetween: daysBetween, describe: describe };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ToolkitDates;
})(typeof window !== 'undefined' ? window : globalThis);
