/* Components gallery: each shared component working with made-up sample data. */
(function () {
  'use strict';
  var KEY = 'toolkitGallery.v1', mem = {};
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return JSON.parse(mem.v || '{}'); } }
  function put() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { mem.v = JSON.stringify(st); } }
  var st = load(), toastTimer = null;
  var SAMPLE = [
    { name: 'Alex Rivera', shift: 'Food sorting', day: 'Sat 9:00-12:00', contact: '555-0101' },
    { name: 'Jordan Lee', shift: 'Front desk', day: 'Sat 9:00-12:00', contact: 'jordan@example.test' },
    { name: 'Sam Patel', shift: 'Deliveries', day: 'Sun 13:00-16:00', contact: '555-0103' },
    { name: '=Test, "quoted" name', shift: 'Setup', day: 'Sun 10:00-11:00', contact: '' }
  ];
  if (!st.people) st.people = JSON.parse(JSON.stringify(SAMPLE));
  if (st.welcome === undefined) st.welcome = true;
  ToolkitTheme.apply(st.theme);
  var csvText = '';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rows() { return [['Name', 'Shift', 'When', 'Phone or email']].concat(st.people.map(function (p) { return [p.name, p.shift, p.day, p.contact]; })); }
  function toast(msg) { var o = document.getElementById('toast'); if (o) o.remove(); clearTimeout(toastTimer); var t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); toastTimer = setTimeout(function () { t.remove(); }, 6000); }

  function render() {
    var table = '<table><thead><tr><th>Name</th><th>Shift</th><th>When</th></tr></thead><tbody>' + st.people.map(function (p, i) {
      return '<tr><td>' + esc(p.name) + '</td><td>' + esc(p.shift) + '</td><td>' + esc(p.day) + '</td></tr>'; }).join('') + '</tbody></table>';
    document.getElementById('app').innerHTML =
      '<header class="top noprint"><h1>Toolkit components gallery</h1>' + ToolkitTheme.button(st.theme) + '</header><main>' +
      '<p class="muted noprint">Six small pieces shared by the event check-in, pantry tracker and volunteer shifts tools. Everything below is live and uses made-up people. Nothing leaves this page.</p>' +
      (st.welcome ? ToolkitWelcome.html({ title: 'Welcome! Try these three things', steps: ['Tap <b>Light</b> at the top to switch the colors, and watch them stay that way next time.', 'Under <b>Spreadsheet export</b>, tap <b>Download for spreadsheet</b>.', 'Under <b>Backup and restore</b>, save a backup, change the list, then restore the backup.'], doneLabel: 'Got it' }) : '<div class="noprint"><button class="small" data-act="welcomeOn">Show the welcome again</button></div>') +
      '<div class="card"><h2>1. Theme toggle</h2><p>Dark by default, light for bright rooms. The choice is remembered. Use the button at the top of the page.</p><p class="muted small">Now: <span class="pill">' + (st.theme === 'light' ? 'Light' : 'Dark') + '</span></p></div>' +
      '<div class="card"><h2>Sample volunteer list</h2><div id="list">' + table + '</div><p class="muted small noprint">The next three sections all work on this list.</p></div>' +
      '<div class="card noprint"><h2>2. Spreadsheet export (CSV)</h2><p>Opens in Excel, Google Sheets or Numbers. Names that start with = + - or @ are made safe so a spreadsheet never runs them as a formula (see the last row).</p>' +
      '<div class="actions"><button class="primary" data-act="csv">Download for spreadsheet</button><button data-act="csvPeek">Show what is in the file</button></div>' + (csvText ? '<pre tabindex="0" aria-label="File contents">' + esc(csvText) + '</pre>' : '') + '</div>' +
      '<div class="card noprint"><h2>3. Backup and restore</h2><p>One file with everything. Try it: save a backup, remove a person, then restore the backup.</p>' +
      '<div class="actions"><button class="primary" data-act="backup">Save a backup file</button><button data-act="restore">Restore from a backup</button><button data-act="removeOne">Remove the first person</button><button data-act="reset">Reset the sample list</button></div>' + ToolkitBackup.fileInput('file') + '<p class="muted small">' + st.people.length + ' people in the list.</p></div>' +
      '<div class="card noprint"><h2>4. Print layout</h2><p>Menus, buttons and colors disappear, so only the list prints, in black on white (even from dark mode). Try “Save as PDF” in the print window.</p><div class="actions"><button class="primary" data-act="print">Print the list</button></div></div>' +
      '<div class="card print-only"><p>Printed from the toolkit components gallery. Made-up sample data.</p></div>' +
      '<div class="card noprint"><h2>5. First-run welcome</h2><p>The panel at the top of this page. Tools show it the first time they open, with practice data, and keep a “show again” button under More.</p></div>' +
      '<div class="card noprint"><h2>Who uses what</h2><table><thead><tr><th>Component</th><th>Check-in</th><th>Pantry</th><th>Shifts</th></tr></thead><tbody>' +
      [['theme-toggle', 1, 1, 1], ['backup-restore', 1, 1, 1], ['csv-export', 1, 1, 1], ['print-layout', 1, 1, 1], ['first-run-welcome', 1, 1, 1]].map(function (r) { return '<tr><td>' + r[0] + '</td>' + r.slice(1).map(function (v) { return '<td>' + (v ? '✓' : '–') + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table><p class="muted small">file-download is a tiny helper that csv-export and backup-restore share.</p></div></main>';
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    switch (b.dataset.act) {
      case 'theme': st.theme = ToolkitTheme.toggle({ theme: st.theme }); put(); render(); break;
      case 'welcomeOff': st.welcome = false; put(); render(); break;
      case 'welcomeOn': st.welcome = true; put(); render(); break;
      case 'csv': ToolkitCsv.download('sample-volunteers.csv', rows()); toast('Spreadsheet file saved to your Downloads folder.'); break;
      case 'csvPeek': csvText = ToolkitCsv.fromRows(rows()); render(); break;
      case 'backup': ToolkitBackup.save({ app: 'components-gallery', filename: 'gallery-backup.json', data: st.people }); toast('Backup saved to your Downloads folder.'); break;
      case 'restore': ToolkitBackup.pick('file'); break;
      case 'removeOne': if (st.people.length && confirm('Remove ' + st.people[0].name + ' from the sample list?')) { st.people.shift(); put(); csvText = ''; render(); toast('Removed. Restore your backup to get them back.'); } break;
      case 'reset': st.people = JSON.parse(JSON.stringify(SAMPLE)); put(); csvText = ''; render(); toast('Sample list reset.'); break;
      case 'print': ToolkitPrint.print('Sample volunteer list'); break;
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'file' || !e.target.files[0]) return;
    ToolkitBackup.read(e.target.files[0], function (err, bk) {
      if (err || !Array.isArray(bk.data) || !bk.data.every(function (p) { return p && typeof p.name === 'string'; })) return toast('That file is not a backup from this page. Choose the file named gallery-backup.json.');
      if (!confirm('Replace the list with this backup (' + bk.data.length + ' people)?')) return;
      st.people = bk.data; put(); csvText = ''; render(); toast('Backup restored.');
    });
  });
  render();
})();
