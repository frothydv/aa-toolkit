/* Made-up sample data. Every name here is invented; no real people. Dates are relative to today. */
(function (root) {
  'use strict';
  var FAMILIES = [
    ['Marcus Alder', 'Priya Alder', 'Noah Alder', 'Ivy Alder'], ['Grace Bellamy', 'Tom Bellamy', 'Ruby Bellamy'],
    ['Elena Castillo', 'Mateo Castillo', 'Sofia Castillo'], ['Jonas Dahl', 'Maren Dahl'],
    ['Amara Okafor', 'Chidi Okafor', 'Zuri Okafor', 'Tobi Okafor'], ['Harold Finch', 'Margaret Finch'],
    ['Lucy Tran', 'Danny Tran'], ['Peter Whitlock', 'Susan Whitlock', 'Abby Whitlock'],
    ['Rosa Delgado', 'Luis Delgado', 'Ana Delgado'], ['Fatima Rahman', 'Yusuf Rahman', 'Layla Rahman', 'Omar Rahman']
  ];
  var SINGLES = ['Walter Pruitt', 'Dolores Haynes', 'Ethan Brooks', 'Mei Lin Park', 'George Abernathy', 'Hannah Voss', 'Samuel Njoroge',
    'Beatrice Lund', 'Kai Morrow', 'Ines Ferreira', 'Raymond Cole', 'Tessa Quinn', 'Arjun Mehta', 'Nora Kessler', 'Felix Ostrander',
    'Josephine Wray', 'Leo Santos', 'Edith Marlowe', 'Victor Hale', 'Clara Nyström'];
  var KIDS = /Noah|Ivy|Ruby|Sofia|Zuri|Tobi|Abby|Ana |Layla|Omar|Danny/;
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return root.Checkin.today(d); }
  root.CheckinSample = {
    orgName: 'Hillside Community Church (sample data)',
    build: function () {
      var C = root.Checkin, d = C.emptyData(), t0 = Date.now() - 90 * 864e5, all = [], seed = 7;
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      FAMILIES.forEach(function (f) { C.addFamily(d, f, t0).forEach(function (g) { all.push(g); }); });
      SINGLES.forEach(function (n) { all.push(C.addGuest(d, n, null, t0).guest); });
      var plan = [], dow = new Date().getDay();
      for (var w = 5; w >= 1; w--) { plan.push(['Sunday service', w * 7 + dow]); plan.push(['Community meal', w * 7 + dow - 3]); }
      plan.push(['Youth night', 10], ['Youth night', 24]);
      plan.sort(function (a, b) { return b[1] - a[1]; });
      plan.forEach(function (p) {
        if (p[1] < 1) return;
        var e = C.addEvent(d, p[0], daysAgo(p[1])).event, prob = p[0] === 'Sunday service' ? 0.66 : p[0] === 'Community meal' ? 0.55 : 0.5, fam = {};
        all.forEach(function (g, i) {
          if (p[0] === 'Youth night' && !KIDS.test(g.name + ' ') && i % 7) return;
          var k = g.familyId || g.id; if (!(k in fam)) fam[k] = rnd() < prob;
          if (fam[k]) C.checkIn(d, e.id, g.id, new Date(e.date + 'T10:' + ('0' + Math.floor(rnd() * 50)).slice(-2)).getTime());
        });
      });
      // First-time visitors at the most recent community meal.
      var meals = C.eventsSorted(d).filter(function (e) { return e.name === 'Community meal'; });
      if (meals[0]) ['Quinn Everett', 'Dara Whitfield'].forEach(function (n) { C.checkIn(d, meals[0].id, C.addGuest(d, n, null, Date.now()).guest.id, new Date(meals[0].date + 'T12:15').getTime()); });
      // Today's event, with a few people already in.
      var today = C.addEvent(d, 'Sunday service', C.today()).event, n = 0;
      all.forEach(function (g) { if (n < 14 && rnd() < 0.35) { C.checkIn(d, today.id, g.id, Date.now() - (n + 1) * 60000); n++; } });
      return { data: C.sanitize(d), currentEventId: today.id };
    }
  };
})(window);
