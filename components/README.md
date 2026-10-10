# Shared components

Small plain-JS pieces reused by every tool. Each folder has `toolkit.json`, `README.md` and `examples/example.html`.

| Component | What it does |
|---|---|
| `theme-toggle` | dark/light colours, remembered |
| `backup-restore` | save/restore one backup file |
| `csv-export` | safe CSV for spreadsheets |
| `file-download` | save text as a file (used by the two above) |
| `print-layout` | print CSS and print helper |
| `first-run-welcome` | "do these first" panel |
| `gallery` | one-page showcase of all of them |

Tools load them as globals (`ToolkitTheme`, `ToolkitCsv`, ...) in this order: theme, download, csv, backup, print, welcome, then the tool's own scripts. Each tool's `build-single-file.js` inlines them, so a built tool is still one file. A fix here reaches every tool at its next build.

Tests: `node tests/components.test.js`; with jsdom, `tests/gallery-smoke.js`. Check each tool: `node <tool>/tests/core.test.js` and `<tool>/tests/ui-smoke.js <built html>`.
