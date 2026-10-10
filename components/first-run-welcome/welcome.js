/* Guided first-run welcome: a short "do these 2-3 things first" panel.
   ToolkitWelcome.html({title, intro, steps:[...], doneLabel, doneAct, card:true}) -> html string.
   steps/intro are trusted html written by the app author (use <b> for the thing to tap). The done button carries data-act=doneAct
   (default "welcomeOff"); the app hides the welcome, remembers that in its settings, and offers "Show the welcome again" somewhere under More. */
(function (root) {
  'use strict';
  function html(o) {
    var inner = '<h2' + (o.card === false ? '' : ' style="margin-top:0"') + '>' + (o.title || 'Welcome!') + '</h2>' + (o.intro ? '<p>' + o.intro + '</p>' : '') +
      '<ol class="steps">' + (o.steps || []).map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
      '<button class="primary" type="button" data-act="' + (o.doneAct || 'welcomeOff') + '">' + (o.doneLabel || 'Got it, let’s start') + '</button>';
    return o.card === false ? inner : '<div class="card" role="region" aria-label="Welcome">' + inner + '</div>';
  }
  root.ToolkitWelcome = { html: html };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ToolkitWelcome;
})(typeof window !== 'undefined' ? window : globalThis);
