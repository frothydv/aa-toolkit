# Changelog

## 1.1.0
- Import screen: read Venmo / PayPal / plain CSV transaction lists (core/import.js), preview, fix names, skip duplicates.
- Gifts carry optional `source` and `ref`; data format is now schemaVersion 2. Older saved data and backups (examples/backups/) load unchanged with empty values. CSV export has a new last column "How it came in".

## 1.0.0
- Gift log, year-end letters, backup/restore, CSV export.
