# csv-export

CSV export for spreadsheets: safe quoting, spreadsheet-formula guard (= + - @), Excel-friendly byte-order mark. Also usable from Node core logic (require).

## Use

Single plain script `csv.js` (no build step, no dependencies beyond what is noted). Tools inline it into their single-file build; add it to the `js` map in `build-single-file.js`.

Build rows as arrays of arrays in your core logic (first row = headings), e.g. return [['Name','Phone'],['Ana','555']].
Core: Csv.fromRows(rows) -> text; Csv.parse(text) -> rows (the reverse). UI: ToolkitCsv.download('people-2026-01-01.csv', rows). Needs file-download loaded first in the browser.

## Example

Open `examples/example.html` by double-clicking. The gallery (`../gallery/`) shows all components together.

MIT licensed, like the rest of the toolkit.
