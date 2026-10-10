/* NODE_PATH=<dir containing jsdom> node tests/ui-smoke.js <path to built index.html> */
const { JSDOM } = require('jsdom'); const fs = require('fs'); const assert = require('assert');
const html = fs.readFileSync(process.argv[2], 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://example.test/', pretendToBeVisual: true });
const w = dom.window, d = w.document, errs = []; w.addEventListener('error', e => errs.push(e.message));
w.confirm = () => true; w.prompt = () => 'Grace B. Bellamy';
const $ = s => d.querySelector(s), $$ = s => [...d.querySelectorAll(s)];
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
const key = (el, k) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true }));
const hc = () => +$('#hc').textContent;
const start = hc(); assert.ok(start > 0, 'sample has people already in');
$('[data-act=welcomeOff]').click();
// The sample's "already in today" people depend on the weekday, so look for any family that is still fully out.
for (const fam of ['bellamy', 'alder', 'okafor', 'rahman', 'castillo', 'delgado']) { type($('#q'), fam); if ($('[data-act=inFam]')) break; }
assert.ok($('#results').textContent.length > 20, 'search shows results');
assert.ok($('[data-act=inFam]'), 'family button shown'); $('[data-act=inFam]').click();
const afterFam = hc(); assert.ok(afterFam >= start + 1, 'family checked in'); assert.ok($('.toast'));
$('.toast button').click(); assert.equal(hc(), start, 'undo restores headcount');
type($('#q'), 'zork'); assert.ok($('#results').textContent.includes('Nobody called')); key($('#q'), 'Enter');
assert.ok($('#addcard'), 'enter opens add form'); assert.equal($('.nm').value, 'Zork');
$('.nm').value = 'Zork Testwright'; $('[data-act=moreName]').click(); assert.equal($$('.nm').length, 2);
$$('.nm')[1].value = 'Testwright Junior'; $('[data-act=addGo]').click(); assert.equal(hc(), start + 2, 'new family added and in');
type($('#q'), 'zork'); assert.ok($('#results').textContent.includes('Here'));
$('[data-act=tab][data-v=here]').click(); assert.ok($('main').textContent.includes('Testwright Junior'));
assert.ok($('[data-act=printHere]') && $('[data-act=hereCsv]'), 'print and spreadsheet buttons');
let saved = null; w.ToolkitDownload.save = (n, t) => { saved = { n, t }; }; $('[data-act=hereCsv]').click();
assert.ok(saved && saved.n.endsWith('.csv') && saved.t.includes('\ufeff') && saved.t.includes('Testwright Junior'), 'csv content');
$('[data-act=tab][data-v=more]').click(); $('[data-act=backup]').click();
assert.ok(JSON.parse(saved.t).data.guests.length > 0 && saved.n.startsWith('checkin-backup'), 'backup content');
$('[data-act=tab][data-v=here]').click();
$('[data-act=tab][data-v=events]').click(); type($('#evn'), 'Fundraiser'); $('[data-act=evGo]').click();
assert.ok($('main').textContent.includes('Fundraiser') && hc() === 0, 'new event starts at zero');
$('[data-act=tab][data-v=more]').click(); type($('#org'), 'My Group'); assert.equal($('header h1').textContent, 'My Group');
$('[data-act=theme]').click(); assert.ok(d.documentElement.classList.contains('light'));
$('[data-act=fresh]').click(); assert.ok($('main').textContent.includes('Start an event'));
assert.deepEqual(errs, []); console.log('UI smoke test passed');
