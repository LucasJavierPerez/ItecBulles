import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { offers } from '../app/data/content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sources = JSON.parse(readFileSync(path.join(root, 'assets/photos/sources.json'), 'utf8'));
const OFFICIAL_IMAGE_HOSTS = /(^|\.)googleusercontent\.com$|(^|\.)itecriocuarto\.org\.ar$/;

describe('bubble images', () => {
  it('every offer declares an image and a Spanish alt text describing the photo', () => {
    for (const offer of offers) {
      expect(offer.image, offer.id).toBe(`/bubbles/${offer.id}.webp`);
      expect(typeof offer.imageAlt, offer.id).toBe('string');
      expect(offer.imageAlt.trim(), offer.id).not.toBe('');
      expect(offer.imageAlt, offer.id).toMatch(/^Foto /);
    }
  });

  it('the image script defaults to real photos and keeps the illustration mode', () => {
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    expect(pkg.scripts['bubble-images']).toBe('node scripts/bubble-images.mjs');
    expect(pkg.scripts.illustrate).toBe('node scripts/bubble-images.mjs --mode illustration');
  });

  it('every square crop fits inside its source photo', async () => {
    for (const offer of offers) {
      const { file, crop } = sources[offer.id];
      const meta = await sharp(path.join(root, 'assets/photos', file)).metadata();
      expect(crop.left + crop.size, offer.id).toBeLessThanOrEqual(meta.width);
      expect(crop.top + crop.size, offer.id).toBeLessThanOrEqual(meta.height);
    }
  });

  it('every image file exists under public/', () => {
    for (const offer of offers) {
      expect(existsSync(path.join(root, 'public', offer.image)), offer.image).toBe(true);
    }
  });

  it('every image is a 1024x1024 webp', async () => {
    for (const offer of offers) {
      const meta = await sharp(path.join(root, 'public', offer.image)).metadata();
      expect(meta.format, offer.id).toBe('webp');
      expect([meta.width, meta.height], offer.id).toEqual([1024, 1024]);
    }
  });

  it('sources.json traces every offer to an official photo', () => {
    for (const offer of offers) {
      const entry = sources[offer.id];
      expect(entry, offer.id).toBeTruthy();
      const url = new URL(entry.url);
      expect(url.protocol, offer.id).toBe('https:');
      expect(url.host, offer.id).toMatch(OFFICIAL_IMAGE_HOSTS);
      expect(new URL(entry.page).host, offer.id).toMatch(/(^|\.)itecriocuarto\.org\.ar$/);
      expect(existsSync(path.join(root, 'assets/photos', entry.file)), entry.file).toBe(true);
    }
  });
});
