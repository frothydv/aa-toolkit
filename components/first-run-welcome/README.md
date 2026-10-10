# first-run-welcome

Guided first-run welcome panel (2-3 things to try first), as a card or modal body. The app remembers once it has been dismissed.

## Use

Single plain script `welcome.js` (no build step, no dependencies beyond what is noted). Tools inline it into their single-file build; add it to the `js` map in `build-single-file.js`.

html = ToolkitWelcome.html({title, intro, steps:[...], doneLabel, doneAct, card:true|false}). Steps are trusted HTML written by the app author. The done button has data-act = doneAct (default welcomeOff); your click handler stores 'seen' in settings.
Offer "Show the welcome again" under More.

## Example

Open `examples/example.html` by double-clicking. The gallery (`../gallery/`) shows all components together.

MIT licensed, like the rest of the toolkit.
