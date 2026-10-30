import { build } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = resolve(projectRoot, 'dist');
await build({ configFile: resolve(projectRoot, 'vite.config.js') });

// file:// pages cannot import JSX or ES modules. Inline a classic bundle
// so the same document works from disk and on static hosting.
let html = await readFile(resolve(distRoot, 'index.html'), 'utf8');
const assets = [...html.matchAll(/<(script|link)\b[^>]*(?:src|href)="(\.\/assets\/[^"]+)"[^>]*(?:><\/script>|>)/g)];
let scriptsInlined = 0;
let stylesInlined = 0;
let applicationScript = '';
for (const [tag, kind, relativePath] of assets) {
  const assetPath = resolve(distRoot, relativePath);
  if (!assetPath.startsWith(distRoot + sep)) throw new Error('Invalid asset path');
  const source = await readFile(assetPath, 'utf8');
  if (kind === 'script') {
    applicationScript = '<script>' + source.replace(/<\/script/gi, '<\\/script') + '</script>';
    html = html.replace(tag, '');
    scriptsInlined++;
  } else if (/rel="stylesheet"/.test(tag)) {
    html = html.replace(tag, () => '<style>' + source.replace(/<\/style/gi, '<\\/style') + '</style>');
    stylesInlined++;
  }
}
if (scriptsInlined !== 1 || stylesInlined !== 1) {
  throw new Error('Expected one script and one stylesheet; got ' + scriptsInlined + ' and ' + stylesInlined);
}
// Classic inline scripts run immediately. Mount only after #root exists.
html = html.replace('</body>', () => applicationScript + '\n  </body>');
if (/<script\b[^>]*(?:src=|type="module")|<link\b[^>]*href="\.\/assets\//i.test(html)) {
  throw new Error('Standalone HTML still depends on external application assets');
}
await Promise.all([
  writeFile(resolve(distRoot, 'index.html'), html),
  writeFile(resolve(projectRoot, 'index.html'), html),
]);
console.log('Standalone pages ready: index.html and dist/index.html (open directly in a browser).');
