# print-layout

Print layout: hides menus and buttons, forces black on white (even from dark mode), keeps cards and rows together; noprint / print-only classes; print() sets the page title for Save-as-PDF.

## Use

Single plain script `print.js` (no build step, no dependencies beyond what is noted). Tools inline it into their single-file build; add it to the `js` map in `build-single-file.js`.

Include print.css, mark non-paper things class="noprint" and paper-only things class="print-only", then call ToolkitPrint.print('Day roster 2026-01-01').

## Example

Open `examples/example.html` by double-clicking. The gallery (`../gallery/`) shows all components together.

MIT licensed, like the rest of the toolkit.
