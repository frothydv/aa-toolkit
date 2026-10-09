/* Made-up sample schedule (test data only). dayOffset = days from today. */
window.VOLUNTEER_SAMPLE = {
  org: 'Riverbend Community Pantry (sample)',
  shifts: [
    { title: 'Saturday food distribution', dayOffset: 3, start: '09:00', end: '11:00', needed: 4, place: 'Pantry hall, side door', notes: 'Wear closed-toe shoes.', repeatWeeks: 4,
      people: [['Maria Santos', '555-201-3344'], ['Devon Clark', 'devon.clark@example.com'], ['Priya Nair', '555-777-0182']] },
    { title: 'Sorting donations', dayOffset: 1, start: '17:30', end: '19:00', needed: 3, place: 'Back warehouse', people: [['Tom Becker', '555-410-9921']] },
    { title: 'Delivery drivers', dayOffset: 3, start: '11:00', end: '13:00', needed: 2, place: 'Meet at the loading dock', notes: 'Bring a phone for directions.',
      people: [['Alex Rivera', 'alex.rivera@example.com'], ['Sam Okafor', '555-338-6150']] },
    { title: 'Kids reading corner', dayOffset: 5, start: '15:00', end: '16:30', needed: 2, place: 'Library annex', people: [] },
    { title: 'Cleanup crew', dayOffset: 9, start: '12:00', end: '13:30', needed: 5, place: 'Pantry hall', people: [['Jo Winters', '555-902-1177']] },
    { title: 'Morning setup', dayOffset: 0, start: '08:00', end: '09:00', needed: 2, place: 'Pantry hall', people: [['Maria Santos', '555-201-3344'], ['Tom Becker', '555-410-9921']] }
  ]
};
