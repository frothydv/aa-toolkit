/* node tests/fresh.test.js : seed practice data, "Start fresh", and fail if any practice record or setting survives.
   The first part is plain node. The click-through of the built single file needs jsdom; without it that part prints "skipped: no jsdom". */
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
global.window = global; const D = global.Directory = require('../core/directory.js'); require('../examples/sample.js');
const PD = require('../../components/practice-data/practice.js'), SAMPLE = global.DirectorySample;
const PRACTICE = { legacy: { org: [SAMPLE.orgName], deskNote: [SAMPLE.deskNote], center: [SAMPLE.center] } };
const PV = { org: SAMPLE.orgName, deskNote: SAMPLE.deskNote, center: SAMPLE.center };

// 1. Logic: the same calls the app makes
{
  const data = D.sanitize(SAMPLE.build()), settings = {}; PD.seed(settings, PV, PRACTICE);
  assert.ok(data.places.length > 5); assert.equal(settings.sample, true);
  const r = PD.startFresh({ data, settings }, Object.assign({ empty: () => D.sanitize({ places: [] }) }, PRACTICE));
  assert.equal(r.data.places.length, 0, 'practice places survived'); assert.deepEqual(PD.leftovers(settings, PV), [], 'practice name, note or map centre survived');
  assert.ok(!settings.sample && !settings.welcome, 'banner or welcome flag survived');
  const back = PD.restore(r.undo, settings); assert.equal(settings.org, SAMPLE.orgName); assert.equal(D.sanitize(back.data).places.length, data.places.length);
}

// 2. What a volunteer sees, in the built single file
let JSDOM; try { ({ JSDOM } = require('jsdom')); } catch (e) { console.log('skipped: no jsdom'); process.exit(0); }
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rd-fresh-')); cp.execFileSync(process.execPath, [path.join(__dirname, '..', 'build-single-file.js'), dir]);
const names = D.sanitize(SAMPLE.build()).places.map(p => p.name);
function open() {
  const w = new JSDOM(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'), { runScripts: 'dangerously', url: 'https://example.test/', pretendToBeVisual: true }).window;
  w.confirm = () => true; w.scrollTo = () => {}; return w;
}
const click = (w, s) => { const e = w.document.querySelector(s); assert(e, 'missing ' + s); e.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const seen = w => { const b = w.document.body.cloneNode(true); b.querySelectorAll('script,style').forEach(e => e.remove()); return b.textContent; };
const stored = w => JSON.stringify([w.localStorage.getItem('resourceDirectory.data.v1'), w.localStorage.getItem('resourceDirectory.settings.v1')]);
const fresh = w => { click(w, '[data-act=tab][data-v=more]'); click(w, '[data-act=fresh]'); };
setTimeout(() => {
  { const w = open(), d = w.document;
    assert.ok(d.querySelector('h1').textContent.includes(SAMPLE.orgName)); assert.ok(d.querySelector('.sample'), 'practice banner before');
    fresh(w);
    const page = seen(w), s = stored(w);
    assert.ok(!page.includes(SAMPLE.orgName) && !s.includes(SAMPLE.orgName), 'practice name survived');
    assert.ok(!page.includes(SAMPLE.deskNote) && !s.includes('Hours change'), 'practice note survived'); assert.ok(!d.querySelector('.sample'), 'banner survived');
    assert.ok(!d.querySelector('[data-act=welcomeOff]') && !/Practice mode/.test(page), 'welcome card or practice banner survived');
    names.forEach(n => assert.ok(!page.includes(n) && !s.includes(n), 'practice place survived: ' + n));
    assert.ok(!JSON.parse(w.localStorage.getItem('resourceDirectory.settings.v1')).center, 'practice map centre survived');
    click(w, '.toast button'); assert.ok(d.querySelector('h1').textContent.includes(SAMPLE.orgName), 'undo restores the practice name'); assert.ok(seen(w).includes(names[0]), 'undo restores places'); w.close(); }
  { const w = open(), d = w.document; click(w, '[data-act=tab][data-v=more]');
    const o = d.getElementById('s_org'); o.value = 'Our Real Help List'; o.dispatchEvent(new w.Event('change', { bubbles: true })); o.dispatchEvent(new w.Event('input', { bubbles: true }));
    click(w, '[data-act=fresh]'); assert.ok(d.querySelector('h1').textContent.includes('Our Real Help List'), 'own name kept'); assert.ok(!seen(w).includes(SAMPLE.deskNote)); w.close(); }
  console.log('resource-directory start-fresh tests passed');
}, 50);
