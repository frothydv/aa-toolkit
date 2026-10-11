/* swap-guide.js: Google Calendar links for a website, and filling in the swap-guide template.
   No organization details in here. Works in browsers (global ToolkitSwapGuide) and Node (require). */
(function (root) {
  'use strict';

  // Embed page for a public Google Calendar. timeZone is optional, e.g. 'America/New_York'.
  function embedUrl(calendarId, timeZone) {
    var q = 'src=' + encodeURIComponent(calendarId);
    if (timeZone) q += '&ctz=' + encodeURIComponent(timeZone);
    return 'https://calendar.google.com/calendar/embed?' + q;
  }
  // Link a visitor clicks to add the calendar to their own Google Calendar.
  function addUrl(calendarId) {
    return 'https://calendar.google.com/calendar/r?cid=' + encodeURIComponent(calendarId);
  }
  // Public iCal feed, for other calendar apps. The calendar must be public.
  function icalUrl(calendarId) {
    return 'https://calendar.google.com/calendar/ical/' + encodeURIComponent(calendarId) + '/public/basic.ics';
  }

  function decodeBase64(s) {
    if (typeof atob === 'function') return atob(s);
    return Buffer.from(s, 'base64').toString('utf8');
  }

  // Get the calendar ID from whatever the staff member has: a plain ID or email, a
  // Google Calendar link with src= or cid=, or a cid that is base64 of the email.
  // Returns '' if nothing usable is found, so the page can say so instead of breaking.
  function calendarIdFromLink(text) {
    text = String(text == null ? '' : text).trim();
    if (!text) return '';
    if (!/[\/?&=]/.test(text)) return text; // already a plain ID or email
    var m = /[?&](src|cid)=([^&#]+)/.exec(text);
    if (!m) return '';
    var value = decodeURIComponent(m[2]);
    if (m[1] === 'cid' && /^[A-Za-z0-9_\-+\/=]+$/.test(value) && value.indexOf('@') < 0) {
      try {
        var decoded = decodeBase64(value.replace(/-/g, '+').replace(/_/g, '/'));
        if (/@|#/.test(decoded)) return decoded;
      } catch (e) { /* not base64: fall through and use the value as it is */ }
    }
    return value;
  }

  // Fill {{NAME}} placeholders. Returns { text, missing } so the caller can warn about blanks.
  function fillTemplate(template, values) {
    var missing = [];
    var text = String(template).replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, function (all, key) {
      var v = values && values[key];
      if (v == null || String(v).trim() === '') { if (missing.indexOf(key) < 0) missing.push(key); return all; }
      return String(v);
    });
    return { text: text, missing: missing };
  }

  // Placeholder names used in template/SWAP_GUIDE_TEMPLATE.md.
  function placeholdersIn(template) {
    var found = [];
    String(template).replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, function (all, key) {
      if (found.indexOf(key) < 0) found.push(key);
      return all;
    });
    return found;
  }

  var api = { embedUrl: embedUrl, addUrl: addUrl, icalUrl: icalUrl, calendarIdFromLink: calendarIdFromLink, fillTemplate: fillTemplate, placeholdersIn: placeholdersIn };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ToolkitSwapGuide = api;
})(typeof self !== 'undefined' ? self : this);
