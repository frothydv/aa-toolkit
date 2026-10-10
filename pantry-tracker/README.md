# pantry-tracker

Plain HTML/JS food pantry inventory and distribution tracker. No build dependencies, no server, works from `file://`.

- `core/pantry.js`: pure logic (items, donations/distributions, stock, low flags, household ID tidying, date parsing, CSV, sanitizing). Browser and Node.
- `adapters/browser-storage/storage.js`: localStorage adapter (`load`, `save`, `loadSettings`, `saveSettings`).
- `adapters/static-web/`: `index.html`, `app.js`, `style.css`. Dark default, light toggle.
- `examples/sample.js`: made-up rural pantry (dates relative to today).
- `build-single-file.js`: `node build-single-file.js out/index.html` bundles everything into one file.
- Tests: `node tests/core.test.js`; `NODE_PATH=<jsdom> node tests/ui-smoke.js out/index.html`.

Data: `{version, items:[{id,name,category,unit('lb'|'each'),lbPer,low}], moves:[{id,type('in'|'out'|'adj'),itemId,qty,date,donor,household,size,note,createdAt}]}`.
Stock = donations minus distributions. Moves have unique ids and are append-only, so a later shared-file merge can union them by id. Only a household ID or initials and a head count are stored, never names.

Best-by dates: a donation may carry `bestBy` (ISO date). `Pantry.lots(data)` replays the moves in date order into per-donation "lots" still on the shelf (food given out comes from the soonest date not yet passed); `Pantry.expiryReport(data, {soonDays, graceDays})` sorts them into `expired / soon / later / undated`; `Pantry.pullLot` records a count correction (`lotId`) that takes a lot off the shelf (undo with `removeMove`). Cutoffs are settings, not code. The printable pages use `ToolkitPrint.printSection`.

Planned: households/new-vs-returning, monthly report, shared-file merge.

`adj` entries are signed count corrections; reports must count only `in` and `out`.

Shared pieces (theme, backup/restore, CSV, print, welcome) live in `../components/`; `node build-single-file.js <out>` inlines them into the single file.
