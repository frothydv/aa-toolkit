# date-parse

Forgiving date entry. `ToolkitDates.parse(text)` returns `YYYY-MM-DD` or `''`.

- `10/9/26`, `10/9/2026`, `2026-10-09`, `10-9` (this year), `Oct 9 2026`, `9 Oct 2026`
- month + year only (`10/2027`, `Oct 2027`) means the last day of that month
- `daysBetween(from, to)`, `addDays(iso, n)`, `today()`, `describe(days)` ("3 days left", "2 days past")

One plain script `dates.js`; load it before your tool's own scripts. Open `examples/example.html` to try it.

MIT licensed, like the rest of the toolkit.
