/* Made-up sample for a small rural pantry. Dates are relative to today. No real people. */
(function (root) {
  'use strict';
  var P = root.Pantry;
  var ITEMS = [ // name, category, unit, lbPer, low
    ['Canned green beans', 'Canned vegetables', 'each', 0.9, 24], ['Canned corn', 'Canned vegetables', 'each', 0.9, 24],
    ['Canned tomatoes', 'Canned vegetables', 'each', 1.8, 12], ['Canned tuna', 'Canned protein', 'each', 0.4, 20],
    ['Peanut butter', 'Canned protein', 'each', 1.1, 12], ['Dried pinto beans (1 lb bag)', 'Canned protein', 'each', 1, 15],
    ['Canned peaches', 'Fruit', 'each', 1, 12], ['Applesauce cups', 'Fruit', 'each', 0.25, 24],
    ['Spaghetti (1 lb box)', 'Grains and pasta', 'each', 1, 20], ['White rice', 'Grains and pasta', 'lb', 1, 40],
    ['Oatmeal canisters', 'Breakfast', 'each', 1.5, 10], ['Cereal boxes', 'Breakfast', 'each', 0.8, 15],
    ['Chicken noodle soup', 'Soup and sauce', 'each', 0.7, 24], ['Pasta sauce jars', 'Soup and sauce', 'each', 1.5, 12],
    ['Eggs (dozen)', 'Dairy and eggs', 'each', 1.5, 6], ['Shelf-stable milk', 'Dairy and eggs', 'each', 2.1, 8],
    ['Potatoes', 'Fresh produce', 'lb', 1, 30], ['Apples', 'Fresh produce', 'lb', 1, 20],
    ['Frozen ground turkey', 'Frozen', 'lb', 1, 15], ['Diapers (pack)', 'Baby and kids', 'each', 2, 4],
    ['Bar soap', 'Household and hygiene', 'each', 0.3, 20], ['Toilet paper (4-roll)', 'Household and hygiene', 'each', 1.5, 6]];
  var DONORS = ['Valley Grocery', 'First Church food drive', 'Hill Farm', 'Regional Food Bank', 'Anonymous', 'Scout Troop 12', 'Grange Hall'];

  function seed(n) { var s = n || 7; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  root.PantrySample = {
    org: 'Maple Hollow Community Pantry',
    make: function () {
      var rnd = seed(11), d = P.empty(), ids = [];
      ITEMS.forEach(function (r) { var res = P.addItem(d, { name: r[0], category: r[1], unit: r[2], lbPer: r[3], low: r[4] }); ids.push(res.item.id); });
      var homes = []; for (var h = 1; h <= 26; h++) homes.push('H-' + (h < 10 ? '00' : '0') + h);
      homes.push('JS', 'AM', 'RT');
      var sizes = {}; homes.forEach(function (h) { sizes[h] = 1 + Math.floor(rnd() * 5); });
      function pick(a) { return a[Math.floor(rnd() * a.length)]; }
      function add(f, date) { f.date = date; var r = P.addMove(d, f); if (r.move) r.move.createdAt = date + 'T12:00:00.000Z'; }
      for (var back = 75; back >= 0; back--) {
        var dt = P.addDays(P.today(), -back), dow = new Date(dt + 'T12:00:00').getDay();
        if (dow === 2 || dow === 5) { // donation days: Tue, Fri
          for (var k = 0; k < 7; k++) {
            var ix = Math.floor(rnd() * ids.length), it = d.items[ix];
            add({ type: 'in', itemId: ids[ix], qty: it.unit === 'lb' ? 10 + Math.floor(rnd() * 40) : 6 + Math.floor(rnd() * 30), donor: pick(DONORS) }, dt);
          }
        }
        if (dow === 3 || dow === 6) { // distribution days: Wed, Sat
          var families = 4 + Math.floor(rnd() * 5);
          for (var f = 0; f < families; f++) {
            var home = pick(homes);
            for (var j = 0; j < 4 + Math.floor(rnd() * 3); j++) {
              var jx = Math.floor(rnd() * ids.length), jt = d.items[jx];
              var have = P.stockOf(d, ids[jx]); if (have <= 0) continue;
              var q = jt.unit === 'lb' ? Math.min(have, 3 + Math.floor(rnd() * 5)) : Math.min(have, 1 + Math.floor(rnd() * 4));
              add({ type: 'out', itemId: ids[jx], qty: q, household: home, size: sizes[home] }, dt);
            }
          }
        }
      }
      // make sure the demo shows a few flags
      [['Canned tuna', 4], ['Diapers (pack)', 0], ['Eggs (dozen)', 3]].forEach(function (p) {
        var it = d.items.filter(function (i) { return i.name === p[0]; })[0], have = P.stockOf(d, it.id);
        if (have > p[1]) add({ type: 'out', itemId: it.id, qty: have - p[1], household: 'H-004', size: sizes['H-004'] }, P.today());
      });
      return d;
    }
  };
})(window);
