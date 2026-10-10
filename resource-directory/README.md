# resource-directory
A volunteer-editable list of local help (any kinds you define), printable on one page, searchable ("food tuesday"), and shown on a map.

- `core/directory.js`: data model (`sanitize`, `blank`), `search` (words match names, kinds of help and their keywords, and open days incl. today/tomorrow/weekend), `group`, `hoursText`, `isStale`, `csvRows`, `tidyPhone`. Needs `components/typeahead-search` loaded first. No organization details.
- `adapters/browser-storage`: localStorage (falls back to memory).
- `adapters/static-web`: the UI (list, map, edit form, More with backup/restore/CSV/settings).
- `examples/sample.js`: made-up places with dates relative to today.
- `build-single-file.js <outdir> [org-config.js]`: one double-clickable `index.html`. `org-config.js` is the organization's thin layer (it edits `window.DirectorySample`: `orgName`, `deskNote`, `center`).
- Tests: `node tests/core.test.js`; `NODE_PATH=<jsdom> node tests/ui-smoke.js <built index.html>`.

Place: `{id, category, name, address, phone, days:[0-6], times, hoursNote, notes, checked:'YYYY-MM-DD', lat, lon}`.
Map: `components/offline-map` draws pins with no keys; tiles from OpenStreetMap only when online. Address lookup uses the free OpenStreetMap Nominatim service once per save, never blocks saving, and is skipped offline.
Not yet checked: print fit on very long lists (use "print size"); no multi-device sync.
