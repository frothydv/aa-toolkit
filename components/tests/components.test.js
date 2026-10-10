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
console.log('component tests passed');
