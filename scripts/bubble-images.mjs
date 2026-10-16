// Builds the bubble images (public/bubbles/<offer-id>.webp, 1024x1024) from the official
// iTec photos in assets/photos/.
//
//   npm run bubble-images                      # default: --mode photo
//   node scripts/bubble-images.mjs --mode illustration
//
// Both modes start from the square declared in `crop` in assets/photos/sources.json
// (chosen to avoid text baked into banners).
//
// photo (default, used by the site): the real photo with gentle enhancement only —
//   restore contrast (several headers carry a white wash), mild saturation, slight sharpen.
//   Low-resolution crops (< LOW_RES px) are upscaled with a soft treatment instead of
//   sharpening, so they read as slightly dreamy rather than broken.
//
// illustration (kept, not used): flat, stylized drawing —
//   1. simplify shapes (median filter) and stretch contrast,
//   2. map luminance bands onto the Projet Bulles palette (gradient map, per-image quantiles),
//   3. draw ink outlines from a Sobel edge pass,
//   4. add a deterministic paper grain.
//
// The output is fully deterministic: same inputs produce byte-identical files.

import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PHOTOS = path.join(ROOT, 'assets/photos');
const OUT = path.join(ROOT, 'public/bubbles');
const SIZE = 1024;

// Darkest to lightest. Ink is reserved for the deepest shadows and the outlines.
const PALETTE = ['#280b3c', '#b88ff4', '#8da0fb', '#fbc77a', '#e1e2fe', '#fffaed'].map(hexToRgb);
const INK = PALETTE[0];
// Cumulative share of pixels assigned to each band (the last band takes the rest).
const BAND_QUANTILES = [0.1, 0.32, 0.54, 0.72, 0.88];
const EDGE_THRESHOLD = 120; // Sobel magnitude (0-1442) above which a pixel becomes an outline.
const GRAIN = 7; // +/- amplitude of the paper grain, in 8-bit levels.
const SEED = 20261016;
// Crops smaller than this (in source pixels) get the soft upscale instead of sharpening.
const LOW_RES = 400;
const MODES = ['photo', 'illustration'];

function parseMode(argv) {
  const index = argv.indexOf('--mode');
  const mode = index === -1 ? 'photo' : argv[index + 1];
  if (!MODES.includes(mode)) {
    throw new Error(`Unknown --mode "${mode}". Use one of: ${MODES.join(', ')}`);
  }
  return mode;
}

function hexToRgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Small deterministic PRNG (mulberry32) so the grain never changes between runs.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function quantileThresholds(gray) {
  const hist = new Uint32Array(256);
  for (const v of gray) hist[v] += 1;
  const thresholds = [];
  let acc = 0;
  let q = 0;
  for (let v = 0; v < 256 && q < BAND_QUANTILES.length; v += 1) {
    acc += hist[v];
    while (q < BAND_QUANTILES.length && acc >= BAND_QUANTILES[q] * gray.length) {
      thresholds.push(v);
      q += 1;
    }
  }
  while (thresholds.length < BAND_QUANTILES.length) thresholds.push(255);
  return thresholds;
}

function sobelEdges(gray, size) {
  const edges = new Uint8Array(gray.length);
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const i = y * size + x;
      const tl = gray[i - size - 1], t = gray[i - size], tr = gray[i - size + 1];
      const l = gray[i - 1], r = gray[i + 1];
      const bl = gray[i + size - 1], b = gray[i + size], br = gray[i + size + 1];
      const gx = tr + 2 * r + br - tl - 2 * l - bl;
      const gy = bl + 2 * b + br - tl - 2 * t - tr;
      if (Math.hypot(gx, gy) > EDGE_THRESHOLD) edges[i] = 1;
    }
  }
  return edges;
}

// Thicken outlines by one pixel so they read as pen strokes at bubble size.
function dilate(mask, size) {
  const out = new Uint8Array(mask.length);
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const i = y * size + x;
      if (mask[i] || mask[i - 1] || mask[i + 1] || mask[i - size] || mask[i + size]) out[i] = 1;
    }
  }
  return out;
}

async function illustrate(id, entry) {
  const { left, top, size } = entry.crop;
  const base = sharp(path.join(PHOTOS, entry.file))
    .extract({ left, top, width: size, height: size })
    .resize(SIZE, SIZE, { kernel: 'lanczos3' })
    .normalise()
    .median(15)
    .blur(1.2);

  // Luminance for banding; a softer copy for edges so outlines follow shapes, not texture.
  // sharp widens raw single-channel pipelines to sRGB unless told otherwise, hence 'b-w'.
  const gray = await base.clone().toColourspace('b-w').raw().toBuffer();
  const soft = await sharp(gray, { raw: { width: SIZE, height: SIZE, channels: 1 } })
    .blur(3)
    .toColourspace('b-w')
    .raw()
    .toBuffer();
  for (const buffer of [gray, soft]) {
    if (buffer.length !== SIZE * SIZE) throw new Error(`${id}: expected a single-channel buffer`);
  }

  const thresholds = quantileThresholds(gray);
  const edges = dilate(sobelEdges(soft, SIZE), SIZE);
  const random = mulberry32(SEED);
  const rgb = Buffer.alloc(SIZE * SIZE * 3);

  for (let i = 0; i < gray.length; i += 1) {
    let band = thresholds.findIndex((t) => gray[i] <= t);
    if (band === -1) band = PALETTE.length - 1;
    const color = edges[i] ? INK : PALETTE[band];
    const grain = Math.round((random() * 2 - 1) * GRAIN);
    for (let c = 0; c < 3; c += 1) {
      rgb[i * 3 + c] = Math.max(0, Math.min(255, color[c] + grain));
    }
  }

  const file = path.join(OUT, `${id}.webp`);
  const info = await sharp(rgb, { raw: { width: SIZE, height: SIZE, channels: 3 } })
    .webp({ quality: 78, effort: 6 })
    .toFile(file);
  return { id, file: path.relative(ROOT, file), kb: Math.round(info.size / 1024) };
}

async function photo(id, entry) {
  const { left, top, size } = entry.crop;
  const lowRes = size < LOW_RES;
  let pipeline = sharp(path.join(PHOTOS, entry.file))
    .extract({ left, top, width: size, height: size })
    .resize(SIZE, SIZE, { kernel: lowRes ? 'mitchell' : 'lanczos3' })
    .normalise({ lower: 1, upper: 99 })
    .modulate({ saturation: 1.1 })
    .linear(1.04, -4);
  pipeline = lowRes ? pipeline.blur(1.4) : pipeline.sharpen({ sigma: 0.7 });

  const file = path.join(OUT, `${id}.webp`);
  const info = await pipeline.webp({ quality: 82, effort: 6 }).toFile(file);
  const label = lowRes ? ' (low-res source, soft upscale)' : '';
  return { id, file: path.relative(ROOT, file), kb: Math.round(info.size / 1024), label };
}

const mode = parseMode(process.argv.slice(2));
const build = mode === 'photo' ? photo : illustrate;
const sources = JSON.parse(await readFile(path.join(PHOTOS, 'sources.json'), 'utf8'));
await mkdir(OUT, { recursive: true });
for (const [id, entry] of Object.entries(sources)) {
  const result = await build(id, entry);
  console.log(`${result.file}  ${result.kb} KB${result.label ?? ''}`);
}
