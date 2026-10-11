# church-site-calendar-swap

A guide and small helpers for a charity or church that wants a free website where staff add events in Google Calendar and they appear on the site. It is a guide, not an app: nothing runs on the church's side.

## Use

1. Copy `template/SWAP_GUIDE_TEMPLATE.md` into the organization's build folder.
2. Fill in each `{{NAME}}` placeholder. The list is in `toolkit.json` (`config_schema`). `core/swap-guide.js` `fillTemplate` does this for you and tells you which blanks are left.
3. For the calendar links, use `core/swap-guide.js` in a page, or `require` it in Node:
   - `embedUrl(id, timeZone)`: the embed page for a public calendar.
   - `addUrl(id)`: the "add to my Google Calendar" link.
   - `icalUrl(id)`: the public feed for other calendar apps.
   - `calendarIdFromLink(text)`: gets the ID from a plain ID, an email, or a Google Calendar link.

## Check

    node tests/guide.test.js

The test checks the links, the pasted-link reader, the fill-in logic, that the placeholders in the template match `toolkit.json`, and that the template holds no organization details.

## Limits

- Google Sites cannot run custom animations or interactive pages. The template says so, and describes a free static host option, which has not been tested here.
- Google's free-tier terms are not checked by this guide.

MIT licensed, like the rest of the toolkit.
