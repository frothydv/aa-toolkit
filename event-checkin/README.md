# event-checkin

Plain HTML/JS door check-in for events (services, classes, meals, youth nights, fundraisers). No dependencies, no server, works from `file://`.

- `core/checkin.js`: pure logic (name tidying, type-ahead search, families, events, check-ins, headcount). Browser and Node.
- `adapters/browser-storage/storage.js`: localStorage adapter (`load`, `save`, `loadSettings`, `saveSettings`).
- `adapters/static-web/`: `index.html`, `app.js`, `style.css`, optional `sw.js` (offline reopen when hosted over http/https).
- `examples/sample.js`: made-up church/meal data (dates relative to today).
- `build-single-file.js`: `node build-single-file.js <outdir>` writes `index.html` (all inlined) and `sw.js`.
- Tests: `node tests/core.test.js`; `NODE_PATH=<dir with jsdom> node tests/ui-smoke.js <built index.html>`.

Data: `{version, guests:[{id,name,familyId,createdAt}], events:[{id,name,date}], checkins:[{id,eventId,guestId,at}]}`.
Only a name is stored per guest. A family is just guests sharing a `familyId` (groups of one are dropped). One check-in per guest per event. Ids are unique so a later shared-file merge can union by id.

Planned: per-event and over-time attendance reports with CSV export (phase 2), kiosk mode (phase 3).

Shared pieces (theme, backup/restore, CSV, print, welcome) live in `../components/`; `node build-single-file.js <out>` inlines them into the single file.
