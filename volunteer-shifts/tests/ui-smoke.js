// Needs jsdom installed somewhere: node ui-smoke.js <folder containing index.html>
const {JSDOM}=require('jsdom');const fs=require('fs');const dir=process.argv[2];
const dom=new JSDOM(fs.readFileSync(dir+'/index.html','utf8'),{runScripts:'outside-only',url:'http://localhost/'});
const w=dom.window;w.eval('window.addEventListener("error",e=>{window.__err=(window.__err||"")+e.message})');
for(const f of ['sample.js','shifts.js','storage.js','app.js'])w.eval(fs.readFileSync(dir+'/'+f,'utf8'));
const $=s=>w.document.querySelector(s),click=s=>{const e=typeof s==='string'?$(s):s;e.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
const assert=require('assert');
w.Element.prototype.scrollIntoView=function(){};
assert(!w.__err,w.__err);
assert($('.modal'),'welcome');click('[data-act=closemodal]');assert(!$('.modal'));
assert($('header h1').textContent.includes('Riverbend'));
// volunteer signup on first shift w/ space
const open=[...w.document.querySelectorAll('[data-act=open]')].find(b=>b.textContent.includes('Kids reading'));click(open);
const f=$('form[data-form=signup]');f.querySelector('[name=name]').value='Test Person';f.querySelector('[name=contact]').value='(555) 222 3333';
f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert($('.good').textContent.includes('Thank you, Test'),'signup ok');
// bad contact
click([...w.document.querySelectorAll('[data-act=open]')].find(b=>b.textContent.includes('Kids reading')));
const f2=$('form[data-form=signup]');f2.querySelector('[name=name]').value='X';f2.querySelector('[name=contact]').value='nope';f2.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert($('.err'),'error shown');
// coordinator
click('[data-act=mode][data-v=coord]');assert($('#app').textContent.includes('Test Person'));
click('[data-act=tab][data-v=add]');
const a=$('form[data-form=addshift]');const E=n=>a.elements[n];E('title').value='Test shift';E('needed').value=2;E('repeat').value='weekly';E('count').value=3;
a.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert($('#toast').textContent.includes('3 shifts added'),'added');
// delete + undo
click('[data-act=rmshift]');click('[data-act=yes]');assert($('#toast'));click('[data-act=undo]');
for(const t of ['roster','messages','data'])click('[data-act=tab][data-v='+t+']');
click('[data-act=tab][data-v=roster]');
assert(!$('.err'));
click('[data-act=theme]');assert(w.document.documentElement.classList.contains('light'));
console.log('UI smoke OK; shifts:',JSON.parse(w.localStorage.getItem('volunteerShifts.data.v1')).shifts.length);
// calendar view
click('[data-act=mode][data-v=volunteer]');click('[data-act=view][data-v=cal]');
assert($('.cal'),'calendar');assert($('.chip.open,.chip.needs'),'colored chips');
const chip=$('.chip.needs, .chip.open');click(chip);assert($('form[data-form=signup]'),'chip opens signup');
click('[data-act=month][data-v="1"]');assert($('.cal'));click('[data-act=view][data-v=list]');assert(!$('.cal'));
console.log('calendar OK');
