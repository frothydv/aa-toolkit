# practice-data

Makes "Start fresh" leave no made-up data behind. Plain script (`ToolkitPracticeData`) or `require()`; works on the tool's own settings object.

```js
var PD = ToolkitPracticeData;
// when seeding practice data:
PD.seed(settings, { org: SAMPLE.orgName, deskNote: SAMPLE.note });   // also sets settings.sample = true, settings.welcome = true
// on "Start fresh":
var r = PD.startFresh({ data: data, settings: settings }, { empty: Tool.empty });
data = Tool.sanitize(r.data); save();
toast('Cleared.', r.undo);                                           // r.undo is one string
// on Undo:
var back = PD.restore(r.undo, settings); data = Tool.sanitize(back.data); save();
```

Options (all optional): `flags` renames or changes the banner/welcome flags, e.g. `{ welcome: { key: 'welcomed', practice: false, fresh: true } }` (use `null` to skip one);
`blank` is what a cleared setting becomes (default `''`); `legacy` is `{ key: [oldPracticeValue, ...] }` so settings saved before this component are still recognised;
`onSettings(settings)` resets other things (e.g. a current-event id).

A setting is cleared only while it still equals the practice value, so a name the charity typed is kept (`kept` lists those). `leftovers(settings, values)` is for tests.
