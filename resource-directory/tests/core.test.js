/* node tests/core.test.js */
const a = require('assert'); require('../../components/typeahead-search/search.js'); const D = require('../core/directory.js'), Sam = (global.window = global, require('../examples/sample.js'), global.DirectorySample);
const data = D.sanitize(Sam.build()), today = '2026-10-13'; // a Tuesday
a.equal(new Date(today + 'T12:00:00').getDay(), 2);
a.equal(data.places.length, 12);
const names = q => D.search(data, q, today).map(p => p.name);
a.ok(names('food tuesday').includes('Maple Street Food Pantry'));
a.ok(names('food tuesday').includes('Tuesday Table Community Lunch'));
a.ok(!names('food tuesday').includes('Riverside Community Cupboard'), 'Mon/Wed/Fri pantry is closed Tuesday');
a.ok(names('food on tue').includes('Hope Soup Kitchen'));
a.deepEqual(names('pantry sat'), ['Eastgate Neighbors Pantry']);
a.ok(names('ride').every(n => /Wheels|Van/.test(n)) && names('ride').length === 2);
a.ok(names('food today').includes('Maple Street Food Pantry') && !names('food today').includes('Eastgate Neighbors Pantry'));
a.ok(names('electric').includes('County Energy Assistance Office'));
a.ok(names('shelter weekend').length === 2);
a.equal(names('zzzz').length, 0); a.equal(names('').length, 12);
a.equal(D.tidyPhone('301.555.0142'), '(301) 555-0142'); a.equal(D.tidyPhone('1-301-555-0142'), '(301) 555-0142'); a.equal(D.tidyPhone('211'), '211');
a.equal(D.dayList([1, 2, 3, 5]), 'Mon–Wed, Fri'); a.equal(D.dayList([2, 4]), 'Tue, Thu'); a.equal(D.dayList([0, 1, 2, 3, 4, 5, 6]), 'Every day');
a.equal(D.hoursText({ days: [], times: '', hoursNote: '' }), 'Call for hours');
a.equal(D.hoursText({ days: [2, 4], times: '10am–1pm', hoursNote: 'Closed holidays' }), 'Tue, Thu 10am–1pm · Closed holidays');
a.ok(D.isStale({ checked: '' }, today, 90) && D.isStale({ checked: '2026-06-01' }, today, 90) && !D.isStale({ checked: '2026-10-01' }, today, 90));
const g = D.group(data, data.places); a.equal(g[0].cat.id, 'pantry'); a.equal(g.length, 5);
const bad = D.sanitize({ places: [{ name: ' X ', category: 'nope', days: [9, 2, 2, 'x'], lat: 'abc', lon: 5, checked: 'yesterday' }, { name: '' }] });
a.equal(bad.places.length, 1); a.equal(bad.places[0].category, 'other'); a.deepEqual(bad.places[0].days, [2]); a.equal(bad.places[0].lat, null); a.equal(bad.places[0].checked, '');
a.equal(D.sanitize(null).places.length, 0);
a.equal(D.csvRows(data).length, 13);
console.log('core ok');
