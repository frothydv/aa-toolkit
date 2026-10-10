# print-layout

Print layout: hides menus and buttons, forces black on white (even from dark mode), keeps cards and rows together; noprint / print-only classes; print() sets the page title for Save-as-PDF.

## Use

Single plain script `print.js` (no build step, no dependencies beyond what is noted). Tools inline it into their single-file build; add it to the `js` map in `build-single-file.js`.

Include print.css, mark non-paper things class="noprint" and paper-only things class="print-only", then call ToolkitPrint.print('Day roster 2026-01-01').

To print only one part of a page, mark parts `class="print-section" data-section="a"` and call `ToolkitPrint.printSection('Title', 'a')`. Add class `print-break` to start a new page.

## Example

Open `examples/example.html` by double-clicking. The gallery (`../gallery/`) shows all components together.

MIT licensed, like the rest of the toolkit.
