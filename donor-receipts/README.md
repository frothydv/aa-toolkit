# donor-receipts

Donor gift log plus one-click year-end receipt letters. Plain JS, no server.

- `core/donors.js`: donors, gifts, year summary, `letter()` (letter as plain data), CSV rows. Money in cents. Tested in Node.
- `core/import.js`: reads Venmo / PayPal / generic transaction CSVs into gifts (`read`, `plan`, `apply`). Uses csv-export `parse` and date-parse. Samples: `examples/venmo-sample.csv`, `paypal-sample.csv` (made up). Column layouts are from Venmo/PayPal's usual downloads; if a service changes them, adjust `read()`.
- `adapters/browser-storage`: localStorage (data never leaves the device). `adapters/static-web`: the UI.
- `examples/sample.js`: made-up donors. `build-single-file.js outdir [org-config.js]` makes one double-clickable `index.html`.
- Tests: `node tests/core.test.js`; `NODE_PATH=<jsdom dir> node tests/ui-smoke.js <built html>`.

Letter wording follows the IRS written-acknowledgment elements (name of organization, cash amount, description but not value of goods, whether goods or services were given in return; IRS page "Charitable contributions - written acknowledgments"). Defaults are editable; not tax advice. Not handled: vehicle gifts, quid pro quo disclosure over $75 beyond the free-text "given in return" note, intangible religious benefits wording (edit the "nothing in return" text).
