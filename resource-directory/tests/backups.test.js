/* node tests/backups.test.js : every sample backup in examples/backups/ must load with the current code.
   Keep one file per saved-data format this tool has ever written; add a new one whenever the format changes. */
const a = require('assert'), fs = require('fs'), path = require('path');
require('../../components/typeahead-search/search.js'); global.window = global;
const B = require('../../components/backup-restore/backup.js'), D = require('../core/directory.js');
const dir = path.join(__dirname, '..', 'examples', 'backups');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
a.ok(files.length >= 2, 'one sample backup per saved-data format');
files.forEach(f => {
  const r = B.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  a.equal(r.app, 'resource-directory', f);
  const d = D.sanitize(r.data);
  a.equal(d.schemaVersion, D.SCHEMA_VERSION, f + ' upgraded to the current format');
  a.ok(d.places.length >= 1 && d.places.every(p => p.name && p.category), f + ' has places');
  a.ok(d.categories.length >= 1, f + ' has kinds of help');
  a.deepEqual(D.sanitize(d), d, f + ' loads the same way twice');
});
// the older unversioned backup upgrades to the same places as the current one
const oldD = D.sanitize(B.parse(fs.readFileSync(path.join(dir, '1.0.0-unversioned.json'), 'utf8')).data);
const newD = D.sanitize(B.parse(fs.readFileSync(path.join(dir, '1.2.0-schema-1.json'), 'utf8')).data);
a.deepEqual(oldD.places, newD.places, 'old and new backups hold the same places');
a.equal(D.migrate({ places: [] }).schemaVersion, 1, 'missing version counts as 1');
a.equal(D.migrate({ schemaVersion: 1, places: [{ name: 'x' }] }).places.length, 1, 'migrate keeps places');
console.log('backups ok');
