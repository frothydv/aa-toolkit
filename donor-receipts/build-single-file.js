/* node build-single-file.js <outdir> [org-config.js] : writes outdir/index.html (everything inlined, double-click to run).
   The optional org-config.js is an organization's own layer: it runs right after the practice data and can change window.DonorSample
   (orgName, letterhead, signer, signerTitle, ein) so the first run uses their wording. */
const fs = require('fs'), path = require('path');
const out = process.argv[2]; if (!out) { console.error('usage: node build-single-file.js outdir [org-config.js]'); process.exit(1); }
const r = p => fs.readFileSync(path.isAbsolute(p) ? p : path.join(__dirname, p), 'utf8');
let html = r('adapters/static-web/index.html');
html = html.replace('<link rel="stylesheet" href="print.css">', () => '<style>' + r('../components/print-layout/print.css') + '</style>');
html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>' + r('adapters/static-web/style.css') + '</style>');
const js = { 'theme.js': '../components/theme-toggle/theme.js', 'download.js': '../components/file-download/download.js', 'csv.js': '../components/csv-export/csv.js', 'dates.js': '../components/date-parse/dates.js', 'backup.js': '../components/backup-restore/backup.js', 'print.js': '../components/print-layout/print.js', 'welcome.js': '../components/first-run-welcome/welcome.js', 'search.js': '../components/typeahead-search/search.js', 'donors.js': 'core/donors.js', 'sample.js': 'examples/sample.js', 'storage.js': 'adapters/browser-storage/storage.js', 'app.js': 'adapters/static-web/app.js' };
const inline = t => '<script>\n' + t.replace(/<\/script/gi, '<\\/script') + '\n</script>';
if (process.argv[3]) html = html.replace('<script src="storage.js"></script>', () => inline(fs.readFileSync(path.resolve(process.argv[3]), 'utf8')) + '<script src="storage.js"></script>');
for (const k in js) html = html.replace('<script src="' + k + '"></script>', () => inline(r(js[k])));
fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'index.html'), html);
