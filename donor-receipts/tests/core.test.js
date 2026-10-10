const D = require('../core/donors.js'); const assert = require('assert'); require('../examples/sample.js');
let n = 0; const t = (name, f) => { f(); n++; };
t('money', () => { assert.equal(D.parseMoney('$1,250.50'), 125050); assert.equal(D.parseMoney('25'), 2500); assert.equal(D.parseMoney('abc'), null); assert.equal(D.parseMoney('0'), null); assert.equal(D.money(100000), '$1,000.00'); assert.equal(D.parseMoney('1.234,50'), 123450); });
t('names and donors', () => {
  assert.equal(D.tidyName('bellamy, grace'), 'Grace Bellamy'); assert.equal(D.tidyName('  mary   o\'neil'), "Mary O'Neil");
  const d = D.emptyData(); const a = D.addDonor(d, 'grace bellamy').donor; assert.ok(D.addDonor(d, 'Grace  Bellamy').existed); assert.ok(D.addDonor(d, ' ').error);
  D.addDonor(d, 'Graham Ng'); assert.equal(D.search(d, 'gra').length, 2); assert.equal(D.search(d, 'bel gr')[0].id, a.id); assert.equal(D.search(d, 'zz').length, 0);
});
t('gifts validate', () => {
  const d = D.emptyData(); const a = D.addDonor(d, 'A B').donor;
  assert.ok(D.addGift(d, { donorId: a.id, date: '', kind: 'cash', amount: '5' }).error); assert.ok(D.addGift(d, { donorId: a.id, date: '2026-01-01', kind: 'cash', amount: 'x' }).error);
  assert.ok(D.addGift(d, { donorId: a.id, date: '2026-01-01', kind: 'goods', desc: '' }).error); assert.ok(D.addGift(d, { donorId: 'nope', date: '2026-01-01', kind: 'cash', amount: '5' }).error);
  const g = D.addGift(d, { donorId: a.id, date: '2026-01-01', kind: 'cash', amount: '5' }).gift; assert.equal(g.cents, 500);
  assert.ok(D.updateGift(d, g.id, { date: '2026-01-02', kind: 'goods', desc: 'rice' }).gift); assert.equal(d.gifts[0].kind, 'goods'); assert.ok(D.removeGift(d, g.id));
});
t('letters', () => {
  global.Donors = D; const sample = globalThis.DonorSample.build(); const y = new Date().getFullYear() - 1;
  const sum = D.yearSummary(sample, y); assert.equal(sum.length, 7); assert.ok(sum[0].donor.name <= sum[1].donor.name);
  assert.equal(D.yearSummary(sample, y, true).length, 4); // Bellamy (three gifts under $250), Okafor and Lindqvist skipped
  const s = { org: 'Test Pantry', ein: '11-1111111' };
  const pr = sum.find(x => x.donor.name === 'Priya Rahman'); const L = D.letter(sample, s, pr.donor.id, y);
  assert.ok(L.rows[0].what.startsWith('Donated goods: 4 boxes')); assert.equal(L.rows[0].amount, 'Goods'); const txt = JSON.stringify(L);
  assert.ok(/does not put a dollar value/.test(txt)); assert.ok(/No goods or services were provided/.test(txt)); assert.ok(!/\$\d/.test(JSON.stringify(L.rows)));
  assert.ok(L.taxLine.includes('EIN 11-1111111'));
  const gr = D.letter(sample, s, sum.find(x => x.donor.name === 'Grace Bellamy').donor.id, y); assert.ok(gr.notes[0].includes('$300.00'));
  const dh = D.letter(sample, s, sum.find(x => x.donor.name === 'Delgado Hardware').donor.id, y); assert.ok(dh.notes.join(' ').includes('Dinner for two')); assert.ok(/other gifts/.test(dh.notes.join(' ')));
  assert.equal(D.letter(sample, s, sum[0].donor.id, 1999), null);
  assert.equal(D.csvRows(sample, y).length, 1 + 12);
  assert.equal(D.sanitize(JSON.parse(JSON.stringify(sample))).gifts.length, sample.gifts.length); assert.equal(D.sanitize(null).donors.length, 0);
});
t('csv import: venmo and paypal', () => {
  global.ToolkitCsv = require('../../components/csv-export/csv.js'); global.ToolkitDates = require('../../components/date-parse/dates.js'); global.Donors = D;
  const I = require('../core/import.js'), fs = require('fs');
  const v = I.read(fs.readFileSync(__dirname + '/../examples/venmo-sample.csv', 'utf8')); assert.equal(v.source, 'Venmo'); assert.equal(v.rows.length, 3); assert.equal(v.rows[2].cents, 120000); assert.equal(v.rows[0].date, '2026-03-04');
  const p = I.read(fs.readFileSync(__dirname + '/../examples/paypal-sample.csv', 'utf8')); assert.equal(p.source, 'PayPal'); assert.equal(p.rows.length, 3); assert.equal(p.rows[1].cents, 100000); assert.equal(p.rows[1].date, '2026-04-14');
  assert.ok(I.read('hello').error); assert.ok(I.read('Date,Amount\n1/1/2026,5').error);
  const g = I.read('Date,Donor,Amount\n3/4/2026,"bellamy, grace",$25\n3/5/2026,Bad Row,abc\n');
  assert.equal(g.source, 'Spreadsheet'); assert.equal(g.rows[0].name, 'Grace Bellamy'); assert.equal(g.rows[0].cents, 2500);
  const d = D.emptyData(); assert.ok(I.plan(d, 'Venmo', v.rows).every(r => r.isNew && !r.dup));
  assert.deepEqual(I.apply(d, 'Venmo', v.rows), { gifts: 3, donors: 3 }); assert.equal(d.gifts[0].source, 'Venmo');
  assert.ok(I.plan(d, 'Venmo', v.rows).every(r => r.dup && !r.isNew)); // same file again adds nothing new
  const noRef = I.plan(d, 'Venmo', [{ ref: '', date: '2026-03-04', name: 'Grace Bellamy', cents: 5000 }]); assert.ok(noRef[0].dup);
  const u = D.updateGift(d, d.gifts[0].id, { date: '2026-03-05', kind: 'cash', amount: '60' }); assert.equal(u.gift.ref, '1000000000000000001'); assert.equal(u.gift.source, 'Venmo');
});
t('old backups still load', () => {
  const B = require('../../components/backup-restore/backup.js'), fs = require('fs'), dir = __dirname + '/../examples/backups/';
  fs.readdirSync(dir).filter(f => f.endsWith('.json')).forEach(f => { const r = B.parse(fs.readFileSync(dir + f, 'utf8')), nd = D.sanitize(r.data); assert.ok(nd.donors.length && nd.gifts.length, f); assert.equal(nd.schemaVersion, 2); assert.equal(nd.gifts[0].source === '' || nd.gifts[0].source === 'Venmo', true); });
});
console.log('ok', n);
