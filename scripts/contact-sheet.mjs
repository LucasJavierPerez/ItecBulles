// Renders every bubble image masked in a circle, labeled by offer id, into one PNG
// for visual review. Usage: node scripts/contact-sheet.mjs <output.png>
// The output path is required so review artifacts stay out of the repository.

import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'public/bubbles');
const out = process.argv[2];
if (!out) {
  console.error('Usage: node scripts/contact-sheet.mjs <output.png>');
  process.exit(1);
}

const TILE = 360;
const LABEL = 36;
const COLS = 4;
const files = (await readdir(DIR)).filter((f) => f.endsWith('.webp')).sort();
const circle = Buffer.from(
  `<svg width="${TILE}" height="${TILE}"><circle cx="${TILE / 2}" cy="${TILE / 2}" r="${TILE / 2 - 4}" fill="#fff"/></svg>`,
);

const tiles = await Promise.all(
  files.map(async (file, index) => {
    const disc = await sharp(path.join(DIR, file))
      .resize(TILE, TILE)
      .ensureAlpha()
      .composite([{ input: circle, blend: 'dest-in' }])
      .png()
      .toBuffer();
    const label = Buffer.from(
      `<svg width="${TILE}" height="${LABEL}"><text x="${TILE / 2}" y="24" font-family="sans-serif" font-size="20" text-anchor="middle" fill="#280b3c">${file.replace('.webp', '')}</text></svg>`,
    );
    const left = (index % COLS) * TILE;
    const top = Math.floor(index / COLS) * (TILE + LABEL);
    return [
      { input: disc, left, top },
      { input: label, left, top: top + TILE },
    ];
  }),
);

const rows = Math.ceil(files.length / COLS);
await sharp({
  create: { width: COLS * TILE, height: rows * (TILE + LABEL), channels: 3, background: '#fffaed' },
})
  .composite(tiles.flat())
  .png()
  .toFile(out);
console.log(`Contact sheet with ${files.length} bubble images: ${out}`);
