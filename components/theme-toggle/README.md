# theme-toggle

Dark/light colour theme toggle: dark by default (no white flash), light mode for bright rooms, remembered by the app in its settings. Sets the <html> class and color-scheme meta.

## Use

Single plain script `theme.js` (no build step, no dependencies beyond what is noted). Tools inline it into their single-file build; add it to the `js` map in `build-single-file.js`.

ToolkitTheme.apply(settings.theme) on start; ToolkitTheme.button(settings.theme) in the header; on click of [data-act=theme] call ToolkitTheme.toggle(settings) then save settings.
The app's CSS defines its colours as variables on :root and overrides them in :root.light.

## Example

Open `examples/example.html` by double-clicking. The gallery (`../gallery/`) shows all components together.

MIT licensed, like the rest of the toolkit.
