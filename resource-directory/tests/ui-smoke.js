/* NODE_PATH=<dir containing jsdom> node tests/ui-smoke.js <path to built index.html> */
const { JSDOM } = require('jsdom'); const fs = require('fs'); const assert = require('assert');
const html = fs.readFileSync(process.argv[2], 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://example.test/', pretendToBeVisual: true });
const w = dom.window, d = w.document, errs = []; w.addEventListener('error', e => errs.push(e.message));
w.confirm = () => true; w.fetch = () => Promise.resolve({ json: () => Promise.resolve([{ lat: '39.42', lon: '-77.41' }]) });
const $ = s => d.querySelector(s), $$ = s => [...d.querySelectorAll(s)];
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
const tab = v => $('[data-act=tab][data-v=' + v + ']').click();
const names = () => $$('#results .place h3').map(h => h.textContent);
// list + welcome
assert.ok($('[data-act=welcomeOff]')); $('[data-act=welcomeOff]').click();
const all = names().length; assert.ok(all >= 10, 'sample list shown');
assert.ok($$('#results h2').length >= 5, 'grouped by kind');
assert.ok($('#printArea') && $('#printArea').textContent.includes('Hope Soup Kitchen'), 'print area has the whole list');
// search
type($('#q'), 'food tuesday'); const f = names(); assert.ok(f.length > 0 && f.length < all, 'filtered'); assert.ok(f.some(n => n.includes('Maple')) && !f.some(n => n.includes('Eastgate')));
type($('#q'), 'zork'); assert.ok($('#results').textContent.includes('Nothing matches'));
$('[data-act=clear]').click(); assert.equal(names().length, all);
// map
type($('#q'), 'ride'); tab('map'); assert.ok($('svg.tmap'), 'map drawn'); assert.equal($$('svg.tmap .pin').length, 2, 'only matching pins'); assert.equal($('#q').value, 'ride', 'search kept on map');
$('svg.tmap .pin').dispatchEvent(new w.MouseEvent('click', { bubbles: true })); assert.ok($('.place.sel'), 'pin selects place');
tab('list'); $('[data-act=clear]').click();
// edit + checked today
const first = $('[data-act=edit]'); first.click(); assert.ok($('#f_name').value);
$('#f_times').value = '8am–9am'; $('[data-act=day][data-v="0"]').click(); $('#f_checked').value = 'today'; $('[data-act=formSave]').click();
assert.ok($('.toast') && $('#results').textContent.includes('8am–9am'), 'edit saved');
$('.toast button').click(); assert.ok(!$('#results').textContent.includes('8am–9am'), 'undo');
// add place with bad date, then good
$('[data-act=add]').click(); $('[data-act=formSave]').click(); assert.ok($('#ferr').textContent.includes('name'));
$('#f_name').value = 'Test Pantry'; $('#f_category').value = 'pantry'; $('#f_phone').value = '301.555.0199'; $('#f_address').value = '1 Test St'; $('#f_checked').value = 'nonsense'; $('[data-act=formSave]').click();
assert.ok($('#ferr').textContent.includes('date')); $('#f_checked').value = '10/9/26'; $('[data-act=daysSet]').click(); $('[data-act=formSave]').click();
assert.ok(names().includes('Test Pantry') && $('#results').textContent.includes('(301) 555-0199'), 'added, phone tidied');
// geocode pin arrives
setTimeout(() => {
  tab('map'); assert.ok($$('svg.tmap .pin').length >= 12, 'new place pinned after lookup');
  // checked today
  tab('list'); type($('#q'), 'test pantry'); $('[data-act=checked]').click(); assert.ok($('#results').textContent.includes('Checked today'));
  // delete
  $('[data-act=clear]').click(); type($('#q'), 'test pantry'); $('[data-act=edit]').click(); $('[data-act=formDelete]').click(); assert.ok(!names().includes('Test Pantry'));
  // backup / csv / fresh / restore
  let saved = null; w.ToolkitDownload.save = (n, t) => { saved = { n, t }; };
  tab('more'); $('[data-act=backup]').click(); const bk = JSON.parse(saved.t); assert.ok(bk.data.places.length >= 12 && saved.n.startsWith('local-help-backup'));
  $('[data-act=csv]').click(); assert.ok(saved.t.includes('Kind of help') && saved.t.includes('Maple Street'));
  tab('list'); $('[data-act=clear]').click(); tab('more'); $('[data-act=fresh]').click(); assert.equal(names().length, 0, 'fresh is empty'); $('.toast button').click(); assert.ok(names().length >= 12, 'undo fresh');
  tab('more'); $('[data-act=sample]').click();
  // settings
  tab('more'); const o = $('#s_org'); o.value = 'Test Desk'; o.dispatchEvent(new w.Event('change', { bubbles: true })); tab('list'); assert.ok($('h1').textContent.includes('Test Desk'));
  // theme
  $('[data-act=theme]').click(); assert.ok(d.documentElement.classList.contains('light'));
  assert.deepEqual(errs, [], 'no script errors');
  console.log('ui ok');
}, 50);
