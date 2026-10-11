# Changelog

## 1.1.2
- Tests only: the browser (jsdom) test is now `tests/ui.test.js`, builds its own copy and runs with plain `node tests/ui.test.js`; it now passes and covers import and Start fresh (including Undo). No app change.

## 1.1.1
- Fix: "Start fresh" now also clears the practice letterhead, signer, title and EIN (only values still equal to the practice ones; anything typed in is kept), and Undo brings them back. Practice text left by an earlier "Start fresh" is cleared when the page opens.

## 1.1.0
- Import screen: read Venmo / PayPal / plain CSV transaction lists (core/import.js), preview, fix names, skip duplicates.
- Gifts carry optional `source` and `ref`; data format is now schemaVersion 2. Older saved data and backups (examples/backups/) load unchanged with empty values. CSV export has a new last column "How it came in".

## 1.0.0
- Gift log, year-end letters, backup/restore, CSV export.
