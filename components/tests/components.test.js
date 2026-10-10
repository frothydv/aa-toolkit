/* node tests/components.test.js : logic checks for csv-export and backup-restore (no browser needed). */
const assert = require('assert');
const Csv = require('../csv-export/csv.js'), B = require('../backup-restore/backup.js');
assert.equal(Csv.cell('plain'), 'plain');
assert.equal(Csv.cell('a,b'), '"a,b"');
assert.equal(Csv.cell('say "hi"'), '"say ""hi"""');
assert.equal(Csv.cell('=1+1'), "'=1+1", 'formula defused');
assert.equal(Csv.cell(null), ''); assert.equal(Csv.cell(0), '0');
assert.equal(Csv.fromRows([['a', 'b'], [1, 'x\ny']]), 'a,b\r\n1,"x\ny"');
assert.deepEqual(B.parse('{"app":"x","settings":{"org":"A"},"data":{"k":1}}'), { data: { k: 1 }, settings: { org: 'A' }, app: 'x' });
assert.deepEqual(B.parse('{"data":{"k":1},"org":"Old"}').settings, { org: 'Old' }, 'older pantry backups');
assert.deepEqual(B.parse('{"guests":[]}').data, { guests: [] }, 'bare data');
assert.throws(() => B.parse('nope')); assert.throws(() => B.parse('3'));
const D = require('../date-parse/dates.js');
assert.equal(D.parse('10/9/26'), '2026-10-09'); assert.equal(D.parse('2026-10-09'), '2026-10-09');
assert.equal(D.parse('10/2027'), '2027-10-31'); assert.equal(D.parse('Feb 2028'), '2028-02-29'); assert.equal(D.parse('Oct 9, 2026'), '2026-10-09');
assert.equal(D.parse('9 Oct 2026'), '2026-10-09'); assert.equal(D.parse('13/45/2026'), ''); assert.equal(D.parse('soon'), ''); assert.equal(D.parse(''), '');
assert.equal(D.daysBetween('2026-10-09', '2026-10-12'), 3); assert.equal(D.describe(1), '1 day left'); assert.equal(D.describe(-2), '2 days past'); assert.equal(D.describe(0), 'today');
console.log('component tests passed');
