/* node build-single-file.js <out.html> : the gallery as ONE html file (double-click to open, no server). */
const fs = require('fs'), path = require('path');
const out = process.argv[2]; if (!out) { console.error('usage: node build-single-file.js out.html'); process.exit(1); }
const r = p => fs.readFileSync(path.join(__dirname, p), 'utf8');
let html = r('index.html');
html = html.replace('<link rel="stylesheet" href="print.css">', () => '<style>' + r('../print-layout/print.css') + '</style>');
html = html.replace('<link rel="stylesheet" href="gallery.css">', () => '<style>' + r('gallery.css') + '</style>');
const js = { 'theme.js': '../theme-toggle/theme.js', 'download.js': '../file-download/download.js', 'csv.js': '../csv-export/csv.js', 'backup.js': '../backup-restore/backup.js', 'print.js': '../print-layout/print.js', 'welcome.js': '../first-run-welcome/welcome.js', 'gallery.js': 'gallery.js' };
for (const k in js) html = html.replace('<script src="' + k + '"></script>', () => '<script>\n' + r(js[k]).replace(/<\/script/gi, '<\\/script') + '\n</script>');
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out, html);
