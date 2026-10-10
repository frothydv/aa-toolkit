# volunteer-shifts

Plain HTML/JS volunteer sign-up and shift scheduler. No build step, no dependencies, works from `file://`.

- `core/shifts.js`: pure logic (month grid helpers, shifts, repeats, sign-ups, gaps, roster, messages, CSV, sanitizing). No DOM, no storage. Works in browser and Node.
- `adapters/browser-storage/storage.js`: localStorage adapter. Interface: `load()`, `save(data)`, `loadSettings()`, `saveSettings(obj)`. A Google Sheet adapter (phase 2) implements the same interface.
- `adapters/static-web/`: `index.html`, `app.js`, `style.css`. Dark by default, light toggle.
- `examples/sample.js`: made-up schedule (dates relative to today).
- `tests/core.test.js` (`node tests/core.test.js`), `tests/ui-smoke.js` (needs jsdom).

To package for an organization: copy `core/shifts.js`, `examples/sample.js`, one storage adapter and the `static-web` files into one folder; edit the sample org name only if wanted (it is editable in the app).

Data model: `{version, shifts:[{id,title,date,start,end,needed,place,notes,repeatId}], signups:[{id,shiftId,name,contact,createdAt}]}`. Repeating shifts are stored as separate shifts sharing a `repeatId`.

Shared pieces (theme, backup/restore, CSV, print, welcome) live in `../components/`; `node build-single-file.js <out>` inlines them into the single file.
