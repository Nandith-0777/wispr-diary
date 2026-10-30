// Publish only browser assets. Optional Python API adapters run separately.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'public');
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(root, 'dist'), out, { recursive: true });
fs.writeFileSync(path.join(out, 'hosting-config.js'), 'window.diaryDeployment={staticHosting:true,googleTesting:false};\n');
let html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
html = html.replace('<head>', '<head><script src="hosting-config.js?v=1"></script>');
html = html.replace('</body>', '<script src="hosting-ui.js?v=1"></script></body>');
fs.writeFileSync(path.join(out, 'index.html'), html);
for (const name of ['ai', 'voice']) {
  const dir = path.join(out, 'api', name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify({ configured: false, staticHosting: true }));
}
const media = path.join(out, 'demo-media');
fs.mkdirSync(media, { recursive: true });
for (const file of ['wispr-diary-promo.mp4', 'poster.jpg', 'captions.vtt']) {
  fs.copyFileSync(path.join(root, 'docs', 'media', file), path.join(media, file));
}
console.log('Built public/: account books, browser dictation, sample book, and narrated demo.');
