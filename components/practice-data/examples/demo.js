/* node examples/demo.js : shows seed then start fresh on made-up settings. */
const PD = require('../practice.js'), s = {};
PD.seed(s, { org: 'Example Pantry (sample)' });
console.log('after seed', s);
console.log(PD.startFresh({ data: [1, 2], settings: s }, { empty: () => [] }).cleared, s);
