/* node tests/fresh.test.js : seed practice data, "Start fresh", and fail if any practice record or setting survives.
   The first part is plain node. The click-through of the built single file needs jsdom; without it that part prints "skipped: no jsdom". */
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
global.window = global; const V = require('../core/shifts.js'); require('../examples/sample.js');
const PD = require('../../components/practice-data/practice.js'), SAMPLE = global.VOLUNTEER_SAMPLE;
const PRACTICE = { legacy: { org: [SAMPLE.org] }, blank: 'Volunteer sign-up', flags: { welcome: null } };
const people = [...new Set(SAMPLE.shifts.flatMap(s => (s.people || []).map(p => p[0])))]; assert.ok(people.length > 3);

// 1. Logic: the same calls the app makes
{
  const data = V.sampleData(SAMPLE), settings = {}; PD.seed(settings, { org: SAMPLE.org }, PRACTICE);
  assert.ok(data.shifts.length > 3 && data.signups.length > 3);
  const r = PD.startFresh({ data, settings }, Object.assign({ empty: V.emptyData }, PRACTICE));
  assert.equal(r.data.shifts.length, 0, 'practice shifts survived'); assert.equal(r.data.signups.length, 0, 'practice sign-ups survived');
  assert.deepEqual(PD.leftovers(settings, [SAMPLE.org]), [], 'practice organization name survived'); assert.ok(!settings.sample);
  const back = PD.restore(r.undo, settings); assert.equal(settings.org, SAMPLE.org); assert.equal(V.sanitize(back.data).signups.length, data.signups.length);
}

// 2. What a volunteer sees, in the built single file
let JSDOM; try { ({ JSDOM } = require('jsdom')); } catch (e) { console.log('skipped: no jsdom'); process.exit(0); }
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'vs-fresh-')); cp.execFileSync('node', [path.join(__dirname, '..', 'build-single-file.js'), out]);
function open() {
  const w = new JSDOM(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), { runScripts: 'dangerously', url: 'https://example.test/', pretendToBeVisual: true }).window;
  w.scrollTo = () => {}; return w;
}
const click = (w, s) => { const e = w.document.querySelector(s); assert(e, 'missing ' + s); e.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const seen = w => { const b = w.document.body.cloneNode(true); b.querySelectorAll('script,style').forEach(e => e.remove()); return b.textContent; };
const stored = w => JSON.stringify([w.localStorage.getItem('volunteerShifts.data.v1'), w.localStorage.getItem('volunteerShifts.settings.v1')]);
const toData = w => { click(w, '[data-act=closemodal]'); click(w, '[data-act=mode][data-v=coord]'); click(w, '[data-act=tab][data-v=data]'); };
{
  const w = open(); assert.ok(w.document.querySelector('header h1').textContent.includes('Riverbend')); toData(w);
  click(w, '[data-act=fresh]'); click(w, '[data-act=yes]');
  const page = seen(w), s = stored(w);
  assert.ok(!/Riverbend/.test(page + s), 'practice organization name survived');
  people.forEach(n => assert.ok(!page.includes(n) && !s.includes(n), 'practice volunteer survived: ' + n));
  SAMPLE.shifts.forEach(sh => assert.ok(!s.includes(sh.title), 'practice shift survived: ' + sh.title));
  assert.equal(JSON.parse(w.localStorage.getItem('volunteerShifts.data.v1')).shifts.length, 0);
  click(w, '[data-act=undo]'); assert.ok(w.document.querySelector('header h1').textContent.includes('Riverbend'), 'undo restores the name');
  assert.ok(JSON.parse(w.localStorage.getItem('volunteerShifts.data.v1')).shifts.length > 3, 'undo restores shifts'); w.close();
}
{ // a name the charity typed is kept
  const w = open(); toData(w); const o = w.document.getElementById('orgname'); o.value = 'Our Real Group'; o.dispatchEvent(new w.Event('input', { bubbles: true }));
  click(w, '[data-act=fresh]'); click(w, '[data-act=yes]');
  assert.ok(w.document.querySelector('header h1').textContent.includes('Our Real Group')); assert.ok(!/Riverbend/.test(seen(w) + stored(w))); w.close();
}
console.log('volunteer-shifts start-fresh tests passed');
