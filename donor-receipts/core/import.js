/* Read the transaction lists Venmo and PayPal let you download (or any CSV with a date, a name and an amount) and turn them into gifts.
   Pure logic, no page access: browser (global DonorImport) and Node. Needs Donors, ToolkitCsv (parse) and ToolkitDates (parse).
   read(text)          -> {source:'Venmo'|'PayPal'|'Spreadsheet', rows:[{ref,date,name,cents}], skipped:[{why,n}]} or {error}
   plan(data, source, rows) -> same rows with .dup (already in the log) and .isNew (donor not yet known)
   apply(data, source, rows) -> {gifts, donors}: adds the rows the caller left (caller drops duplicates / unticked rows) */
(function (root) {
  'use strict';
  function D() { return root.Donors || require('./donors.js'); }
  function Csv() { return root.ToolkitCsv || require('../../components/csv-export/csv.js'); }
  function Dt() { return root.ToolkitDates || require('../../components/date-parse/dates.js'); }
  var low = function (s) { return String(s == null ? '' : s).trim().toLowerCase(); };
  var BAD_TYPE = /refund|reversal|chargeback|dispute|fee|withdraw|transfer|conversion|hold|release|payout|bank|card|reserve|cancel|currency|authoriz|order|invoice sent|subscription (sign|cancel)/;

  function col(h, re) { for (var i = 0; i < h.length; i++) if (re.test(h[i])) return i; return -1; }
  /* "+ $1,250.00" -> 125000, "- $5.00" -> -500, "(5.00)" -> -500 */
  function signedCents(s) {
    s = String(s == null ? '' : s).trim(); if (!s) return null;
    var neg = /-/.test(s) || /^\(/.test(s), c = D().parseMoney(s.replace(/[+\-()]/g, ''));
    return c == null ? null : (neg ? -c : c);
  }
  function isoDate(s) { s = String(s || '').trim(); var m = /^(\d{4}-\d\d-\d\d)/.exec(s); return m ? m[1] : Dt().parse(s.replace(/\s+\d{1,2}:\d\d.*$/, '')); }

  function read(text) {
    var rows; try { rows = Csv().parse(text); } catch (e) { rows = []; }
    var hi = -1, h, i;
    for (i = 0; i < Math.min(rows.length, 30); i++) {
      h = rows[i].map(low);
      if (h.some(function (x) { return /^(date|datetime|transaction date)/.test(x); }) && h.some(function (x) { return /amount|gross|total|paid/.test(x); })) { hi = i; break; }
    }
    if (hi < 0) return { error: 'We could not find the dates and amounts in that file. Is it the CSV list of transactions you downloaded from Venmo or PayPal?' };
    h = rows[hi].map(low);
    var cDate = col(h, /^(date|datetime|transaction date)/), venmo = col(h, /^amount \(total\)/) >= 0 && col(h, /^from$/) >= 0, paypal = col(h, /^gross$/) >= 0 && col(h, /^name$/) >= 0;
    var cAmt = venmo ? col(h, /^amount \(total\)/) : paypal ? col(h, /^gross$/) : col(h, /^amount|^gross|^total|^paid|amount/);
    var cName = venmo ? col(h, /^from$/) : paypal ? col(h, /^name$/) : col(h, /^(donor|name|from|payer|received from|paid by|full name)/);
    var cType = col(h, /^type$/), cStat = col(h, /^status$/), cRef = venmo ? col(h, /^id$/) : col(h, /^(transaction id|reference|id)/);
    if (cName < 0 || cAmt < 0) return { error: 'We found dates and amounts but no column of names. Open the file in a spreadsheet and make sure there is a column headed “Name”.' };
    var out = [], skipped = {}, skip = function (w) { skipped[w] = (skipped[w] || 0) + 1; };
    rows.slice(hi + 1).forEach(function (r) {
      var cents = signedCents(r[cAmt]), name = String(r[cName] || '').trim(), type = low(cType >= 0 ? r[cType] : ''), st = low(cStat >= 0 ? r[cStat] : '');
      if (!r.some(function (x) { return String(x).trim(); }) || (cents == null && !name)) return;
      if (cents == null) return skip('no readable amount');
      if (cents <= 0) return skip('money going out, refunds and fees');
      if (st && !/^(complete|completed|paid|cleared|success)/.test(st)) return skip('not completed');
      if (type && (BAD_TYPE.test(type) || (venmo && !/payment|charge/.test(type)))) return skip('transfers, refunds and other non-gifts');
      if (!name) return skip('no name');
      var date = isoDate(r[cDate]); if (!date) return skip('no readable date');
      out.push({ ref: cRef >= 0 ? String(r[cRef] || '').trim() : '', date: date, name: D().tidyName(name), cents: cents });
    });
    return { source: venmo ? 'Venmo' : paypal ? 'PayPal' : 'Spreadsheet', rows: out, skipped: Object.keys(skipped).map(function (w) { return { why: w, n: skipped[w] }; }) };
  }

  function plan(data, source, rows) {
    return rows.map(function (r) {
      var dn = D().findDonor(data, r.name), dup = data.gifts.some(function (g) {
        if (r.ref && g.ref && g.ref === r.ref) return true;
        return !!dn && g.donorId === dn.id && g.date === r.date && g.cents === r.cents && (!g.source || g.source === source) && g.kind === 'cash' && !(r.ref && g.ref);
      });
      return Object.assign({}, r, { dup: dup, isNew: !dn });
    });
  }
  function apply(data, source, rows) {
    var gifts = 0, donors = 0, src = source === 'Spreadsheet' ? 'Imported' : source;
    rows.forEach(function (r) {
      var before = data.donors.length, a = D().addDonor(data, r.name); if (a.error) return;
      if (data.donors.length > before) donors++;
      var g = D().addGift(data, { donorId: a.donor.id, date: r.date, kind: 'cash', amount: r.cents / 100, source: src, ref: r.ref });
      if (g.gift) gifts++;
    });
    return { gifts: gifts, donors: donors };
  }
  var api = { read: read, plan: plan, apply: apply, signedCents: signedCents };
  root.DonorImport = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
