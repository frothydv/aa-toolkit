/* Made-up practice data (fake places, 555 phone numbers, rough coordinates). Dates are relative to today so the demo never looks old. */
(function (root) {
  'use strict';
  function ago(n) { var d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function build() {
    var P = function (category, name, address, phone, days, times, hoursNote, notes, age, lat, lon) { return { category: category, name: name, address: address, phone: phone, days: days, times: times, hoursNote: hoursNote, notes: notes, checked: ago(age), lat: lat, lon: lon }; };
    return { places: [
      P('pantry', 'Maple Street Food Pantry', '120 Maple St, Frederick, MD', '3015550101', [2, 4], '10am–1pm', '', 'Bring photo ID. Once a week per household.', 12, 39.4145, -77.4105),
      P('pantry', 'Riverside Community Cupboard', '48 River Rd, Frederick, MD', '3015550102', [1, 3, 5], '9am–noon', 'Closed holidays', 'Fresh produce on Fridays.', 30, 39.4262, -77.3987),
      P('pantry', 'Eastgate Neighbors Pantry', '900 Eastgate Ave, Frederick, MD', '3015550103', [6], '9am–11am', 'First and third Saturday only', 'Call first in winter.', 140, 39.4051, -77.3849),
      P('meals', 'Hope Soup Kitchen', '15 Court Alley, Frederick, MD', '3015550110', [0, 1, 2, 3, 4, 5, 6], '5pm–6:30pm', 'Dinner, no sign-up', '', 9, 39.4139, -77.4118),
      P('meals', 'Tuesday Table Community Lunch', '77 Church Hill Rd, Frederick, MD', '3015550111', [2], '12pm–1:30pm', '', 'Open to everyone. Kids welcome.', 20, 39.4208, -77.4231),
      P('meals', 'Sunrise Breakfast Club', '305 Market St, Frederick, MD', '3015550112', [1, 2, 3, 4, 5], '7am–8:30am', '', '', 70, 39.4177, -77.4086),
      P('rides', 'Care Wheels Medical Rides', '', '3015550120', [1, 2, 3, 4, 5], '8am–4pm', 'Book 3 days ahead', 'Free rides to doctor and clinic visits in the county. Call to book.', 15, 39.4120, -77.4000),
      P('rides', 'Senior Van Service', '22 Elm Court, Frederick, MD', '3015550121', [2, 4], '9am–2pm', 'Ages 60+', '', 200, 39.4332, -77.4147),
      P('shelter', 'Harbor House Emergency Shelter', '510 Prospect Blvd, Frederick, MD', '3015550130', [0, 1, 2, 3, 4, 5, 6], 'Open 24 hours', 'Intake at 6pm', 'Families and single adults. Call ahead.', 5, 39.4098, -77.4172),
      P('shelter', 'Winter Warming Center', '18 Chapel St, Frederick, MD', '3015550131', [0, 1, 2, 3, 4, 5, 6], '7pm–7am', 'November to March', '', 45, 39.4189, -77.4034),
      P('utilities', 'County Energy Assistance Office', '350 County Plaza, Frederick, MD', '3015550140', [1, 2, 3, 4, 5], '8:30am–4:30pm', 'Appointments preferred', 'Help with electric and heating bills.', 25, 39.4283, -77.4262),
      P('utilities', 'Neighbors Helping Neighbors Bill Fund', '61 Walnut St, Frederick, MD', '3015550141', [3], '1pm–4pm', 'Walk-ins only', 'Water and gas bills, one time per year.', 100, 39.4032, -77.4201)
    ] };
  }
  root.DirectorySample = { build: build, orgName: 'Welcome Desk', deskNote: 'Hours change. Please call before you go. Ask at the desk if you need help finding something else.', center: [39.4143, -77.4105] };
})(typeof window !== 'undefined' ? window : globalThis);
