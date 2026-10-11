/* node tests/ui.test.js : builds its own single-file copy in a temp folder and clicks through it with jsdom (no installs beyond jsdom being available). */
const { JSDOM } = require('jsdom'); const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert'), { execFileSync } = require('child_process');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dr-ui-')); execFileSync(process.execPath, [path.join(__dirname, '..', 'build-single-file.js'), out]);
const dom = new JSDOM(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), { runScripts: 'dangerously', url: 'https://example.test/', pretendToBeVisual: true });
const w = dom.window, d = w.document, errs = []; w.addEventListener('error', e => errs.push(e.message)); w.confirm = () => true; w.scrollTo = () => {};
const $ = s => d.querySelector(s), $$ = s => [...d.querySelectorAll(s)];
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
const tab = v => $('[data-act=tab][data-v=' + v + ']').click();
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  $('[data-act=welcomeOff]').click();
  type($('#q'), 'gra'); assert.ok($('[data-act=pick]'), 'suggestions'); $('[data-act=pick]').click();
  type($('#ga'), '$75'); type($('#gd'), '12/15/2026'); $('[data-act=saveGift]').click();
  assert.ok($('.toast').textContent.includes('Grace Bellamy'), 'saved');
  type($('#q'), 'Newly Added'); assert.ok($('#addr')); type($('#addr'), '1 Test Rd'); $('[data-act=kind][data-v=goods]').click(); type($('#gx'), '5 cans of beans'); $('[data-act=saveGift]').click();
  assert.ok($('.toast').textContent.includes('Newly Added'));
  $('[data-act=saveGift]').click(); assert.ok($('#ferr').textContent.length, 'friendly error when empty');
  tab('letters'); assert.ok($$('.paper').length >= 5, 'letters shown');
  assert.ok($('.paper').textContent.includes('Example Community Pantry') && $('.paper').textContent.includes('No goods or services'));
  let printed = 0; w.print = () => printed++; $('[data-act=printLetters]').click(); assert.equal(printed, 1);
  tab('more'); let saved = null; w.ToolkitDownload.save = (n, t) => { saved = { n, t }; };
  $('[data-act=backup]').click(); assert.ok(JSON.parse(saved.t).data.donors.length >= 8); $('[data-act=csvAll]').click(); assert.ok(saved.t.includes('Newly Added'));
  // import a made-up Venmo file through the real file input
  tab('import'); assert.ok($('[data-act=impPick]'), 'import screen');
  const input = $('#impfile'); Object.defineProperty(input, 'files', { value: [new w.File([fs.readFileSync(path.join(__dirname, '..', 'examples', 'venmo-sample.csv'), 'utf8')], 'venmo.csv')], configurable: true });
  input.dispatchEvent(new w.Event('change', { bubbles: true })); await wait(200);
  assert.equal($$('[data-imp=on]').length, 3, 'import preview'); $('[data-act=impAdd]').click(); assert.ok($('.toast').textContent.includes('Added 3 gifts'));
  // Start fresh: no practice letterhead, signer or EIN may survive, and Undo brings them back
  tab('more'); $('[data-act=fresh]').click();
  const st = JSON.parse(w.localStorage.getItem('donorReceipts.settings.v1'));
  ['Example Community Pantry', 'Pat Sample', '00-0000000'].forEach(v => assert.ok(!Object.values(st).some(x => String(x).includes(v)), 'practice value left after Start fresh: ' + v));
  tab('gifts'); assert.ok(!$('.paper')); $('.toast button').click();
  assert.ok(JSON.parse(w.localStorage.getItem('donorReceipts.settings.v1')).signer === 'Pat Sample', 'undo restores settings');
  assert.deepEqual(errs, []); console.log('ui ok'); fs.rmSync(out, { recursive: true, force: true }); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
