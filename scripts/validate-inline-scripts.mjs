import fs from 'node:fs';

const input = process.argv[2] || 'public/index.html';
const html = fs.readFileSync(input, 'utf8');
const scriptRegex = /<script(?:[^>]*)>([\s\S]*?)<\/script>/g;
const blocks = [...html.matchAll(scriptRegex)].map((m) => m[1]).filter(Boolean);

for (const [index, source] of blocks.entries()) {
  try {
    new Function(source);
  } catch (error) {
    console.error(`Inline <script> block ${index + 1} failed syntax validation in ${input}.`);
    throw error;
  }
}

console.log(`Validated ${blocks.length} inline <script> blocks in ${input}.`);
