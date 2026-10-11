/* node tests/guide.test.js : logic checks for the calendar-swap guide (no browser needed). */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const S = require('../core/swap-guide.js');

// Calendar links
assert.equal(S.embedUrl('club@example.org'), 'https://calendar.google.com/calendar/embed?src=club%40example.org');
assert.equal(S.embedUrl('club@example.org', 'America/New_York'), 'https://calendar.google.com/calendar/embed?src=club%40example.org&ctz=America%2FNew_York');
assert.equal(S.addUrl('club@example.org'), 'https://calendar.google.com/calendar/r?cid=club%40example.org');
assert.equal(S.icalUrl('club@example.org'), 'https://calendar.google.com/calendar/ical/club%40example.org/public/basic.ics');

// Reading a calendar ID from what a staff member pastes
assert.equal(S.calendarIdFromLink('club@example.org'), 'club@example.org', 'plain email');
assert.equal(S.calendarIdFromLink('  en.usa#holiday@group.v.calendar.google.com  '), 'en.usa#holiday@group.v.calendar.google.com', 'plain ID');
assert.equal(S.calendarIdFromLink('https://calendar.google.com/calendar/embed?src=club%40example.org&ctz=UTC'), 'club@example.org', 'embed link');
assert.equal(S.calendarIdFromLink('https://calendar.google.com/calendar/u/0?cid=club%40example.org'), 'club@example.org', 'cid with @');
const b64 = Buffer.from('club@example.org').toString('base64').replace(/=+$/, '');
assert.equal(S.calendarIdFromLink('https://calendar.google.com/calendar/u/0?cid=' + b64), 'club@example.org', 'base64 cid, no padding');
assert.equal(S.calendarIdFromLink('https://example.org/some/page'), '', 'link without a calendar');
assert.equal(S.calendarIdFromLink(''), ''); assert.equal(S.calendarIdFromLink(null), '');

// Filling the template
const f = S.fillTemplate('Hi {{ORG_NAME}}, see {{CALENDAR_ID}} and {{ORG_NAME}}. {{TIME_ZONE}}', { ORG_NAME: 'Example Church', CALENDAR_ID: 'x@y.z', TIME_ZONE: '' });
assert.equal(f.text, 'Hi Example Church, see x@y.z and Example Church. {{TIME_ZONE}}');
assert.deepEqual(f.missing, ['TIME_ZONE'], 'blank values are reported, not silently removed');
assert.deepEqual(S.placeholdersIn('{{A}} {{B_2}} {{A}}'), ['A', 'B_2']);

// The template: every placeholder is documented in toolkit.json, and it holds no real organization details
const dir = path.join(__dirname, '..');
const tpl = fs.readFileSync(path.join(dir, 'template', 'SWAP_GUIDE_TEMPLATE.md'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'toolkit.json'), 'utf8'));
const used = S.placeholdersIn(tpl).sort(), declared = Object.keys(manifest.config_schema).sort();
assert.deepEqual(used, declared, 'placeholders in template and toolkit.json must match');
assert.doesNotThrow(() => S.fillTemplate(tpl, Object.fromEntries(used.map(k => [k, 'X']))));
assert.ok(!/fbcfamily|fredericktowne|walkersville|301-|8645 Biggs/i.test(tpl), 'template must not contain organization details');

console.log('guide tests passed');
