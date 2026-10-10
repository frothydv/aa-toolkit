/* node build-single-file.js <out.html> : bundles the app and the shared components into ONE html file (no server, no install). */
const fs = require('fs'), path = require('path');
const out = process.argv[2]; if (!out) { console.error('usage: node build-single-file.js out.html'); process.exit(1); }
const r = p => fs.readFileSync(path.join(__dirname, p), 'utf8');
let html = r('adapters/static-web/index.html');
html = html.replace('<link rel="stylesheet" href="print.css">', () => '<style>' + r('../components/print-layout/print.css') + '</style>');
html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>' + r('adapters/static-web/style.css') + '</style>');
const js = { 'theme.js': '../components/theme-toggle/theme.js', 'download.js': '../components/file-download/download.js', 'csv.js': '../components/csv-export/csv.js', 'backup.js': '../components/backup-restore/backup.js', 'print.js': '../components/print-layout/print.js', 'welcome.js': '../components/first-run-welcome/welcome.js', 'sample.js': 'examples/sample.js', 'shifts.js': 'core/shifts.js', 'storage.js': 'adapters/browser-storage/storage.js', 'app.js': 'adapters/static-web/app.js' };
for (const k in js) html = html.replace('<script src="' + k + '"></script>', () => '<script>\n' + r(js[k]).replace(/<\/script/gi, '<\\/script') + '\n</script>');
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out, html);
