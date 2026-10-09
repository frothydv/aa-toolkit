const C = require('../core/checkin.js'); const assert = require('assert');
let n = 0; const t = (name, f) => { f(); n++; };
t('tidyName', () => { assert.equal(C.tidyName("  mary   o'neil "), "Mary O'Neil"); assert.equal(C.tidyName('SMITH, john'), 'John Smith'); assert.equal(C.tidyName('Mary-Jo McDonald'), 'Mary-Jo McDonald'); });
t('dates', () => { assert.equal(C.parseDate('2026-10-9'), '2026-10-09'); assert.equal(C.parseDate('9 Oct 2026'), '2026-10-09'); assert.equal(C.parseDate('nonsense'), null); });
t('guests and search', () => {
  const d = C.emptyData(); const e = C.addEvent(d, 'Sunday', '2026-10-11').event;
  const a = C.addGuest(d, 'Grace Bellamy').guest; C.addGuest(d, 'Graham Ng');
  assert.ok(C.addGuest(d, 'grace  bellamy').existed); assert.ok(C.addGuest(d, '  ').error);
  assert.equal(C.search(d, 'gra', e.id).length, 2); assert.equal(C.search(d, 'bel gr', e.id)[0].guest.id, a.id);
  assert.equal(C.search(d, 'zzz', e.id).length, 0); assert.equal(C.search(d, '', e.id).length, 0);
  C.addGuest(d, 'Élena Ruiz'); assert.equal(C.search(d, 'elena').length, 1);
  assert.ok(C.checkIn(d, e.id, a.id)); assert.ok(!C.checkIn(d, e.id, a.id));
  assert.ok(C.search(d, 'grace', e.id)[0].here); assert.equal(C.headcount(d, e.id).total, 1);
  assert.ok(C.undoCheckIn(d, e.id, a.id)); assert.equal(C.headcount(d, e.id).total, 0);
});
t('families', () => {
  const d = C.emptyData(); const e = C.addEvent(d, 'Meal', '2026-10-11').event;
  const f = C.addFamily(d, ['A One', 'B One', 'C One', '']); assert.equal(f.length, 3); assert.equal(C.familyMembers(d, f[0]).length, 3);
  assert.equal(C.checkInMany(d, e.id, f.map(g => g.id)).length, 3); assert.equal(C.checkInMany(d, e.id, f.map(g => g.id)).length, 0);
  C.addFamily(d, ['Solo Person']); assert.equal(C.findByName(d, 'Solo Person').familyId, null);
  C.removeGuest(d, f[2].id); assert.equal(C.headcount(d, e.id).total, 2); C.removeGuest(d, f[1].id); assert.equal(f[0].familyId, null);
});
t('first time + sanitize', () => {
  const d = C.emptyData(); const e1 = C.addEvent(d, 'S', '2026-10-04').event, e2 = C.addEvent(d, 'S', '2026-10-11').event;
  const a = C.addGuest(d, 'Old Timer').guest, b = C.addGuest(d, 'New Face').guest;
  C.checkIn(d, e1.id, a.id); C.checkIn(d, e2.id, a.id); C.checkIn(d, e2.id, b.id);
  assert.deepEqual(C.headcount(d, e2.id), { total: 2, firstTime: 1 }); assert.deepEqual(C.headcount(d, e1.id), { total: 1, firstTime: 1 });
  assert.equal(C.sanitize(JSON.parse(JSON.stringify(d))).checkins.length, 3);
  assert.equal(C.sanitize({ guests: [{ id: 1, name: 'X' }], checkins: [{ guestId: 1, eventId: 'zz' }] }).checkins.length, 0); assert.equal(C.sanitize(null).guests.length, 0);
});
t('removeEvent', () => { const d = C.emptyData(); const e = C.addEvent(d, 'S', '2026-10-04').event; const g = C.addGuest(d, 'A B').guest; C.checkIn(d, e.id, g.id); C.removeEvent(d, e.id); assert.equal(d.checkins.length, 0); });
console.log(n + ' tests passed');
