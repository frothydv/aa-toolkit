/* node tests/fresh.test.js : seed practice data, "Start with an empty pantry", and fail if any practice record or setting survives.
   The first part is plain node. The click-through of the built single file needs jsdom; without it that part prints "skipped: no jsdom". */
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
global.window = global; const P = global.Pantry = require('../core/pantry.js'); require('../examples/sample.js');
const PD = require('../../components/practice-data/practice.js'), SAMPLE = global.PantrySample;
const PRACTICE = { legacy: { org: [SAMPLE.org] }, flags: { welcome: { key: 'welcomed', practice: false, fresh: true } } };

// 1. Logic: the same calls the app makes
{
  const data = SAMPLE.make(), settings = {}; PD.seed(settings, { org: SAMPLE.org }, PRACTICE);
  assert.ok(data.items.length > 5 && data.moves.length > 20); assert.equal(settings.org, SAMPLE.org); assert.equal(settings.welcomed, false);
  const r = PD.startFresh({ data, settings }, Object.assign({ empty: P.empty }, PRACTICE));
  assert.equal(r.data.items.length, 0, 'practice items survived'); assert.equal(r.data.moves.length, 0, 'practice entries survived');
  assert.deepEqual(PD.leftovers(settings, [SAMPLE.org]), [], 'practice pantry name survived'); assert.equal(settings.welcomed, true, 'welcome card would show again');
  assert.ok(!JSON.stringify(settings).includes('Maple Hollow'));
  const back = PD.restore(r.undo, settings); assert.equal(settings.org, SAMPLE.org); assert.equal(P.sanitize(back.data).moves.length, data.moves.length);
}

// 2. What a volunteer sees, in the built single file
let JSDOM; try { ({ JSDOM } = require('jsdom')); } catch (e) { console.log('skipped: no jsdom'); process.exit(0); }
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'pt-fresh-')); cp.execFileSync('node', [path.join(__dirname, '..', 'build-single-file.js'), out]);
const sampleItems = SAMPLE.make().items.map(i => i.name);
function open() {
  const w = new JSDOM(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), { runScripts: 'dangerously', url: 'https://example.test/', pretendToBeVisual: true }).window;
  w.confirm = () => true; w.scrollTo = () => {}; return w;
}
const click = (w, s) => { const e = w.document.querySelector(s); assert(e, 'missing ' + s); e.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const seen = w => { const b = w.document.body.cloneNode(true); b.querySelectorAll('script,style').forEach(e => e.remove()); return b.textContent; };
const stored = w => JSON.stringify([w.localStorage.getItem('pantryTracker.data.v1'), w.localStorage.getItem('pantryTracker.settings.v1')]);
const toMore = w => { const b = [...w.document.querySelectorAll('nav button, [data-view]')].find(x => /More/.test(x.textContent)); assert(b, 'More tab'); b.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
{
  const w = open(); assert.ok(w.document.querySelector('h1').textContent.includes('Maple Hollow')); assert.ok(/Welcome/.test(seen(w)));
  toMore(w); click(w, '[data-act=empty]');
  const page = seen(w), s = stored(w);
  assert.ok(!/Maple Hollow/.test(page + s), 'practice pantry name survived'); assert.ok(!/Welcome!/.test(page), 'welcome card survived');
  sampleItems.forEach(n => assert.ok(!s.includes('"' + n + '"'), 'practice item survived: ' + n));
  assert.equal(JSON.parse(w.localStorage.getItem('pantryTracker.data.v1')).moves.length, 0);
  click(w, '[data-act=undo]'); assert.ok(w.document.querySelector('h1').textContent.includes('Maple Hollow'), 'undo restores the name');
  assert.ok(JSON.parse(w.localStorage.getItem('pantryTracker.data.v1')).moves.length > 20, 'undo restores entries'); w.close();
}
{ // a name the charity typed is kept
  const w = open(); toMore(w); const o = w.document.getElementById('org'); o.value = 'Our Real Pantry'; o.dispatchEvent(new w.Event('change', { bubbles: true }));
  click(w, '[data-act=empty]'); assert.ok(w.document.querySelector('h1').textContent.includes('Our Real Pantry')); assert.ok(!/Maple Hollow/.test(seen(w) + stored(w))); w.close();
}
console.log('pantry-tracker start-fresh tests passed');
