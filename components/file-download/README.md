# file-download

Saves text as a file in the Downloads folder from a plain web page (no server). Used by csv-export and backup-restore.

## Use

Single plain script `download.js` (no build step, no dependencies beyond what is noted). Tools inline it into their single-file build; add it to the `js` map in `build-single-file.js`.

ToolkitDownload.save('notes.txt', 'hello', 'text/plain')

## Example

Open `examples/example.html` by double-clicking. The gallery (`../gallery/`) shows all components together.

MIT licensed, like the rest of the toolkit.
