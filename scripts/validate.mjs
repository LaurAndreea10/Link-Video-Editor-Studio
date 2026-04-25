import fs from 'node:fs';

const requiredFiles = [
  'index.html',
  'assets/premium.css',
  'assets/premium.js',
  'assets/style-addon.js',
  'assets/export-style-addon.js',
  'assets/captions-addon.js',
  'assets/keyframes-shorts-addon.js',
  'manifest.webmanifest',
  'package.json'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const file of requiredFiles) {
  assert(fs.existsSync(file), `Missing required file: ${file}`);
}

const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('assets/keyframes-shorts-addon.js'), 'index.html must load keyframes-shorts-addon.js');
assert(html.includes('assets/captions-addon.js'), 'index.html must load captions-addon.js');
assert(html.includes('assets/export-style-addon.js'), 'index.html must load export-style-addon.js');

console.log('Repository validation passed.');
