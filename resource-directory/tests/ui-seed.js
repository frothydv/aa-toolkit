/* NODE_PATH=<dir containing jsdom> node tests/ui-seed.js : a made-up organization starting list (window.DirectorySeed)
   loads on first run with no practice-data banner, and its settings apply. Builds its own copy in a temp folder. */
const { JSDOM } = require('jsdom'); const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process'), assert = require('assert');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rd-seed-'));
const cfg = path.join(dir, 'seed.js');
fs.writeFileSync(cfg, "window.DirectorySeed = { settings: { org: 'Made-Up Helpers', printPerKind: true }, places: [ { category: 'pantry', name: 'Fake Pantry One', phone: '5550100', days: [2] }, { category: 'shelter', name: 'Fake Shelter Two' } ] };");
cp.execFileSync(process.execPath, [path.join(__dirname, '..', 'build-single-file.js'), path.join(dir, 'out'), cfg]);
const html = fs.readFileSync(path.join(dir, 'out', 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://example.test/', pretendToBeVisual: true });
const w = dom.window, d = w.document;
setTimeout(() => {
  assert.ok(d.querySelector('h1').textContent.includes('Made-Up Helpers'), 'org name from seed');
  assert.equal(d.querySelectorAll('#results .place h3').length, 2, 'seeded places listed');
  assert.ok(!d.querySelector('#app').textContent.includes('Practice mode'), 'no practice banner on a seeded start');
  assert.equal(d.querySelectorAll('#printArea .print-page').length, 2, 'seed turns on one page per kind');
  assert.ok(d.querySelector('#printArea').textContent.includes('Fake Pantry One'));
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('ui seed ok');
}, 50);
