# Changelog

## 1.1.1
- Fixed: "Start fresh" now also clears the practice name, printout note and map centre (only while they are still the practice values), using components/practice-data. A name or note you typed yourself is kept. One Undo brings back the places and the settings.

## 1.1.0
- Added: "Print each kind of help on its own page" option (More → Names and printing). Each kind gets its own printed page with the heading and the note.
- Added: `window.DirectorySeed` in the build's config file loads an organization's own starting list on first run, without the practice-data banner. Settings in the seed (name, note, map center, print option) apply too. `Directory.fromSeed()` in core.
- Added: `tests/ui-seed.js`.
- Data format unchanged (no migration needed).

## 1.0.0
- First release: grouped places, structured open days, last-checked warnings, one-page printout, offline pin map, search by need and day, backup/restore, spreadsheet export, practice data.
