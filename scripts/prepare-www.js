// Menyalin font Press Start 2P dari node_modules ke www/fonts (dipakai offline di dalam app).
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'node_modules', '@fontsource', 'press-start-2p', 'files');
const out = path.join(__dirname, '..', 'www', 'fonts');
fs.mkdirSync(out, { recursive: true });
const candidates = ['press-start-2p-latin-400-normal.woff2'];
let src = candidates.map(f => path.join(dir, f)).find(f => fs.existsSync(f));
if (!src && fs.existsSync(dir)) {
  const f = fs.readdirSync(dir).find(n => /latin-400-normal\.woff2$/.test(n));
  if (f) src = path.join(dir, f);
}
if (!src) {
  console.warn('[prepare-www] Font tidak ditemukan, game akan memakai font monospace.');
  process.exit(0);
}
fs.copyFileSync(src, path.join(out, 'press-start-2p.woff2'));
console.log('[prepare-www] font disalin:', path.basename(src));
