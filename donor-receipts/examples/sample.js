/* Made-up practice data: invented people and businesses only. Years are relative to today so the demo always has "last year" gifts. */
(function (root) {
  'use strict';
  function build() {
    var D = root.Donors, d = D.emptyData(), y = new Date().getFullYear() - 1;
    var P = [['Grace Bellamy', '12 Maple Lane\nSpringfield, XX 00000'], ['Tomas Okafor', '48 Orchard Road\nSpringfield, XX 00000'], ['Priya Rahman', '7 Willow Court\nSpringfield, XX 00000'],
      ['Walter & June Castillo', '301 Elm Street\nSpringfield, XX 00000'], ['Delgado Hardware', '100 Main Street\nSpringfield, XX 00000'], ['Maple Street Bakery', '2 Main Street\nSpringfield, XX 00000'], ['Ida Lindqvist', '9 Birch Way\nSpringfield, XX 00000']];
    var id = {}; P.forEach(function (p) { id[p[0]] = D.addDonor(d, p[0], p[1]).donor.id; });
    function g(n, date, kind, amt, desc, ret) { D.addGift(d, { donorId: id[n], date: date, kind: kind, amount: amt, desc: desc, returned: ret }); }
    g('Grace Bellamy', y + '-03-04', 'cash', '50'); g('Grace Bellamy', y + '-06-10', 'cash', '50'); g('Grace Bellamy', y + '-12-02', 'cash', '200');
    g('Tomas Okafor', y + '-05-19', 'cash', '25'); g('Priya Rahman', y + '-11-23', 'goods', '', '4 boxes of pasta and 12 cans of tomatoes');
    g('Walter & June Castillo', y + '-04-14', 'cash', '$1,000'); g('Walter & June Castillo', y + '-12-20', 'goods', '', 'Two turkeys and a bag of potatoes');
    g('Delgado Hardware', y + '-08-30', 'goods', '', '3 folding tables for the distribution room'); g('Delgado Hardware', y + '-10-01', 'cash', '500', '', 'Dinner for two at the fall supper (estimated value $40)');
    g('Maple Street Bakery', y + '-07-07', 'goods', '', '10 loaves of bread (weekly gift, July)'); g('Ida Lindqvist', y + '-09-15', 'cash', '15'); g('Ida Lindqvist', y + '-12-28', 'cash', '30');
    g('Tomas Okafor', (y + 1) + '-01-02', 'cash', '20');
    return d;
  }
  root.DonorSample = { orgName: 'Example Community Pantry', letterhead: 'Example Community Pantry\n1 Church Street, Springfield, XX 00000\nexample-pantry.example · 555-0100', signer: 'Pat Sample', signerTitle: 'Treasurer', ein: '00-0000000', build: build };
})(typeof window !== 'undefined' ? window : globalThis);
