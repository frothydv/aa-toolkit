# backup-restore

One-click backup to a small .json file and restore from it, with older backup shapes accepted. The app validates the data, confirms before replacing, and offers undo.

## Use

Single plain script `backup.js` (no build step, no dependencies beyond what is noted). Tools inline it into their single-file build; add it to the `js` map in `build-single-file.js`.

Save: ToolkitBackup.save({app, filename, data, settings}).
Restore: put ToolkitBackup.fileInput('file') in the page, open it with ToolkitBackup.pick('file'), and on its change event call ToolkitBackup.read(file, function (err, {data, settings}) {...}). Then run your own sanitize(data), confirm(), and offer undo.
Needs file-download.

## Example

Open `examples/example.html` by double-clicking. The gallery (`../gallery/`) shows all components together.

MIT licensed, like the rest of the toolkit.
