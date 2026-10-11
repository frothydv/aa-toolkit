/* node tests/fresh.test.js : seed practice data, "Start fresh", and fail if any practice record or setting survives.
   The first part is plain node. The click-through of the built single file needs jsdom; without it that part prints "skipped: no jsdom". */
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
global.window = global; global.Checkin = require('../core/checkin.js'); require('../examples/sample.js');
const PD = require('../../components/practice-data/practice.js'), SAMPLE = global.CheckinSample, C = global.Checkin;

// 1. Logic: the same calls the app makes
{
  const b = SAMPLE.build(), settings = {}; PD.seed(settings, { org: SAMPLE.orgName }); settings.currentEventId = b.currentEventId;
  assert.equal(settings.org, SAMPLE.orgName); assert.ok(b.data.guests.length > 10);
  const r = PD.startFresh({ data: b.data, settings }, { empty: C.emptyData, legacy: { org: [SAMPLE.orgName] }, onSettings: s => { s.currentEventId = null; } });
  assert.equal(r.data.guests.length, 0); assert.equal(r.data.events.length, 0); assert.equal(r.data.checkins.length, 0);
  assert.deepEqual(PD.leftovers(settings, [SAMPLE.orgName]), [], 'practice name survived');
  assert.ok(!settings.sample && !settings.welcome && !settings.currentEventId, 'banner/welcome/current event survived');
  assert.ok(!JSON.stringify(settings).includes('Hillside'), 'sample name anywhere in settings');
  const back = PD.restore(r.undo, settings); assert.equal(settings.org, SAMPLE.orgName); assert.equal(C.sanitize(back.data).guests.length, b.data.guests.length);
}

// 2. What a volunteer sees, in the built single file
let JSDOM; try { ({ JSDOM } = require('jsdom')); } catch (e) { console.log('skipped: no jsdom'); process.exit(0); }
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'ec-fresh-')); cp.execFileSync('node', [path.join(__dirname, '..', 'build-single-file.js'), out]);
const names = SAMPLE.build().data.guests.map(g => g.name);
function open() {
  const dom = new JSDOM(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), { runScripts: 'dangerously', url: 'https://example.test/', pretendToBeVisual: true });
  dom.window.confirm = () => true; dom.window.scrollTo = () => {}; return dom.window;
}
function seen(w) { const b = w.document.body.cloneNode(true); b.querySelectorAll('script,style').forEach(e => e.remove()); return b.textContent; }
function stored(w) { return JSON.stringify([w.localStorage.getItem('eventCheckin.data.v1'), w.localStorage.getItem('eventCheckin.settings.v1')]); }
function fresh(w) { w.document.querySelector('[data-act=tab][data-v=more]').click(); w.document.querySelector('[data-act=fresh]').click(); }
{
  const w = open(), d = w.document;
  assert.ok(d.querySelector('header.top h1').textContent.includes('Hillside'), 'practice name shows before'); assert.ok(d.querySelector('.sample'));
  fresh(w);
  const page = seen(w); assert.ok(!/Hillside|sample data|Practice mode/i.test(page), 'practice text on screen after Start fresh: ' + (page.match(/.{20}(Hillside|sample data|Practice mode).{20}/i) || [])[0]);
  assert.ok(!d.querySelector('.sample') && !d.querySelector('.welcome, [data-act=welcomeOff]'), 'banner or welcome survived');
  const s = stored(w); assert.ok(!s.includes('Hillside'), 'practice name saved'); names.forEach(n => assert.ok(!s.includes(n) && !page.includes(n), 'sample person survived: ' + n));
  w.document.querySelector('.toast button').click(); // one Undo brings back records and name
  assert.ok(d.querySelector('header.top h1').textContent.includes('Hillside') && d.querySelector('.sample'), 'undo restores the practice name and banner');
  fresh(w); w.close();
}
{ // a name the charity typed is kept
  const w = open(), d = w.document; d.querySelector('[data-act=tab][data-v=more]').click();
  const o = d.getElementById('org'); o.value = 'Our Real Church'; o.dispatchEvent(new w.Event('input', { bubbles: true })); o.dispatchEvent(new w.Event('change', { bubbles: true }));
  d.querySelector('[data-act=fresh]').click();
  assert.ok(d.querySelector('header.top h1').textContent.includes('Our Real Church'), 'own name kept'); assert.ok(!seen(w).includes('Hillside')); w.close();
}
console.log('event-checkin start-fresh tests passed');
