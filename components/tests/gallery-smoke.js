/* NODE_PATH=<dir with jsdom> node tests/gallery-smoke.js <built gallery.html> */
const { JSDOM } = require('jsdom'); const fs = require('fs'); const assert = require('assert');
const dom = new JSDOM(fs.readFileSync(process.argv[2], 'utf8'), { runScripts: 'dangerously', url: 'http://localhost/' });
const w = dom.window, $ = s => w.document.querySelector(s), errs = []; w.addEventListener('error', e => errs.push(e.message));
w.confirm = () => true; w.print = () => { printed++; }; let printed = 0, saved = null; w.ToolkitDownload.save = (n, t) => { saved = { n, t }; };
const click = s => $(s).dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
assert.ok($('[data-act=welcomeOff]')); click('[data-act=welcomeOff]'); assert.ok(!$('[data-act=welcomeOff]'));
click('[data-act=theme]'); assert.ok(w.document.documentElement.classList.contains('light'));
assert.equal(JSON.parse(w.localStorage.getItem('toolkitGallery.v1')).theme, 'light', 'theme remembered');
click('[data-act=csv]'); assert.ok(saved.t.startsWith('﻿Name,Shift') && saved.t.includes("'=Test"), 'csv with formula guard');
click('[data-act=backup]'); const bk = saved.t;
click('[data-act=removeOne]'); assert.ok(!$('#list').textContent.includes('Alex Rivera'));
const inp = $('#file'); Object.defineProperty(inp, 'files', { value: [new w.File([bk], 'b.json')] }); inp.dispatchEvent(new w.Event('change', { bubbles: true }));
setTimeout(() => {
  assert.ok($('#list').textContent.includes('Alex Rivera'), 'restore brings person back');
  click('[data-act=print]'); assert.equal(printed, 1);
  inp.dispatchEvent(new w.Event('change', { bubbles: true })); assert.deepEqual(errs, []); console.log('gallery smoke passed');
}, 300);
