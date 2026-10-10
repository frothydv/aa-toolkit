/* Dark/light theme toggle. Dark is the default; light adds class "light" to <html>.
   The app keeps the choice in its own settings object ({theme: 'dark'|'light'}) and saves it however it likes.
   API: ToolkitTheme.apply(theme)  ToolkitTheme.toggle(settings) -> new theme (also applies it; caller saves settings)
        ToolkitTheme.button(theme) -> html for the button, clicks are handled by the app on [data-act=theme] */
(function (root) {
  'use strict';
  function apply(theme) {
    var light = theme === 'light', d = root.document;
    d.documentElement.classList.toggle('light', light);
    var m = d.querySelector('meta[name=color-scheme]'); if (m) m.setAttribute('content', light ? 'light' : 'dark');
    var tc = d.querySelector('meta[name=theme-color]'); if (tc) tc.setAttribute('content', light ? '#f6f7f4' : '#12161c');
  }
  function toggle(settings) { settings.theme = settings.theme === 'light' ? 'dark' : 'light'; apply(settings.theme); return settings.theme; }
  function button(theme) {
    return '<button class="small" type="button" data-act="theme" aria-label="Switch between dark and light colors">' + (theme === 'light' ? '🌙 Dark' : '☀️ Light') + '</button>';
  }
  var api = { apply: apply, toggle: toggle, button: button };
  root.ToolkitTheme = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
