/* NODE_PATH=<dir containing jsdom> node tests/ui-smoke.js <path to built index.html> */
const { JSDOM } = require('jsdom'); const fs = require('fs'); const assert = require('assert');
const dom = new JSDOM(fs.readFileSync(process.argv[2], 'utf8'), { runScripts: 'dangerously', url: 'https://example.test/', pretendToBeVisual: true });
const w = dom.window, d = w.document, errs = []; w.addEventListener('error', e => errs.push(e.message)); w.confirm = () => true;
const $ = s => d.querySelector(s), $$ = s => [...d.querySelectorAll(s)];
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
$('[data-act=welcomeOff]').click();
type($('#q'), 'gra'); assert.ok($('[data-act=pick]'), 'suggestions'); $('[data-act=pick]').click();
type($('#ga'), '$75'); type($('#gd'), '12/15/2026'); $('[data-act=saveGift]').click();
assert.ok($('.toast').textContent.includes('Grace Bellamy'), 'saved'); 
type($('#q'), 'Newly Added'); assert.ok($('#addr')); type($('#addr'), '1 Test Rd'); $('[data-act=kind][data-v=goods]').click(); type($('#gx'), '5 cans of beans'); $('[data-act=saveGift]').click();
assert.ok($('.toast').textContent.includes('Newly Added'));
$('[data-act=saveGift]').click(); assert.ok($('#ferr').textContent.length, 'friendly error when empty');
$('[data-act=tab][data-v=letters]').click(); const n = $$('.paper').length; assert.ok(n >= 5, 'letters shown ' + n);
assert.ok($('.paper').textContent.includes('Example Community Pantry') && $('.paper').textContent.includes('No goods or services'));
let printed = 0; w.print = () => printed++; $('[data-act=printLetters]').click(); assert.equal(printed, 1);
$('[data-act=tab][data-v=more]').click(); let saved = null; w.ToolkitDownload.save = (n, t) => { saved = { n, t }; };
$('[data-act=backup]').click(); assert.ok(JSON.parse(saved.t).data.donors.length >= 8); $('[data-act=csvAll]').click(); assert.ok(saved.t.includes('Newly Added'));
$('[data-act=tab][data-v=import]').click(); assert.ok($('[data-act=impPick]'), 'import screen');
(function () { // import a made-up Venmo file through the real file input
  const csv = fs.readFileSync(__dirname + '/../examples/venmo-sample.csv', 'utf8'), input = $('#impfile');
  Object.defineProperty(input, 'files', { value: [new w.File([csv], 'venmo.csv')], configurable: true }); input.dispatchEvent(new w.Event('change', { bubbles: true }));
})();
setTimeout(() => { assert.ok($$('[data-imp=on]').length === 3, 'import preview'); $('[data-act=impAdd]').click(); assert.ok($('.toast').textContent.includes('Added 3 gifts')); assert.deepEqual(errs, []); console.log('import ui ok'); }, 200);
$('[data-act=fresh]').click(); $('[data-act=tab][data-v=gifts]').click(); assert.ok(!$('.paper')); $('.toast button').click();
assert.deepEqual(errs, []); console.log('ui ok');
