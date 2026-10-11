/* node tests/practice.test.js : seed, undo and start fresh in isolation. */
const assert = require('assert'), PD = require('../practice.js');
let n = 0; const t = (name, f) => { f(); n++; };
t('seed records settings and sets flags', () => {
  const s = { theme: 'dark' }; PD.seed(s, { org: 'Sample Org', note: 'Hi' });
  assert.equal(s.org, 'Sample Org'); assert.equal(s.sample, true); assert.equal(s.welcome, true); assert.deepEqual(s.practiceSet, { org: 'Sample Org', note: 'Hi' });
});
t('start fresh clears unchanged practice values, banner, welcome, records', () => {
  const s = { theme: 'light' }; PD.seed(s, { org: 'Sample Org', note: 'Hi' });
  const r = PD.startFresh({ data: { rows: [1] }, settings: s }, { empty: () => ({ rows: [] }) });
  assert.deepEqual(r.data, { rows: [] }); assert.equal(s.org, ''); assert.equal(s.note, ''); assert.equal(s.sample, false); assert.equal(s.welcome, false);
  assert.ok(!('practiceSet' in s)); assert.equal(s.theme, 'light'); assert.deepEqual(r.cleared.sort(), ['note', 'org']);
});
t('a setting the charity changed is kept', () => {
  const s = {}; PD.seed(s, { org: 'Sample Org', note: 'Hi' }); s.org = 'Our Real Pantry';
  const r = PD.startFresh({ data: [], settings: s }, { empty: [] });
  assert.equal(s.org, 'Our Real Pantry'); assert.equal(s.note, ''); assert.deepEqual(r.kept, ['org']);
});
t('one undo restores data and settings', () => {
  const s = {}; PD.seed(s, { org: 'Sample Org' });
  const r = PD.startFresh({ data: { rows: [1, 2] }, settings: s }, { empty: () => ({ rows: [] }) });
  const back = PD.restore(r.undo, s);
  assert.deepEqual(back.data, { rows: [1, 2] }); assert.equal(s.org, 'Sample Org'); assert.equal(s.sample, true); assert.equal(s.welcome, true);
  assert.deepEqual(PD.practiceKeys(s), ['org'], 'still recognised as practice after undo');
});
t('old data-only snapshots still restore', () => {
  const s = { org: 'X' }; const b = PD.restore(JSON.stringify({ guests: [] }), s); assert.deepEqual(b.data, { guests: [] }); assert.equal(s.org, 'X');
});
t('legacy practice values (saved before this component) are cleared', () => {
  const s = { org: 'Old Sample', sample: true }; PD.startFresh({ data: [], settings: s }, { empty: [], legacy: { org: ['Old Sample'] } });
  assert.equal(s.org, ''); assert.equal(s.sample, false);
  const s2 = { org: 'Real Name' }; PD.clearSettings(s2, { legacy: { org: ['Old Sample'] } }); assert.equal(s2.org, 'Real Name');
});
t('custom flags and blank value', () => {
  const o = { flags: { welcome: { key: 'welcomed', practice: false, fresh: true }, sample: null }, blank: null }; const s = {}; PD.seed(s, { org: 'S' }, o);
  assert.equal(s.welcomed, false); assert.ok(!('sample' in s)); PD.clearSettings(s, o); assert.equal(s.welcomed, true); assert.equal(s.org, null);
});
t('leftovers reports surviving practice values', () => {
  assert.deepEqual(PD.leftovers({ org: 'A', x: 'B' }, ['A']), ['org']); assert.deepEqual(PD.leftovers({ org: '' }, { org: 'A' }), []);
});
t('fits donor-receipts style settings', () => {
  const P = { org: 'Example Pantry', signer: 'Pat Sample', ein: '00-0000000' }, s = { org: 'Example Pantry', signer: 'Pat Sample', ein: '12-3456789' };
  PD.clearSettings(s, { legacy: { org: [P.org], signer: [P.signer], ein: [P.ein] } });
  assert.equal(s.org, ''); assert.equal(s.signer, ''); assert.equal(s.ein, '12-3456789');
});
console.log(n + ' practice-data tests passed');
