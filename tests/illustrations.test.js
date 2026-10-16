import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { offers } from '../app/data/content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sources = JSON.parse(readFileSync(path.join(root, 'assets/photos/sources.json'), 'utf8'));
const OFFICIAL_IMAGE_HOSTS = /(^|\.)googleusercontent\.com$|(^|\.)itecriocuarto\.org\.ar$/;

describe('bubble illustrations', () => {
  it('every offer declares an illustration and a non-empty Spanish alt text', () => {
    for (const offer of offers) {
      expect(offer.image, offer.id).toBe(`/bubbles/${offer.id}.webp`);
      expect(typeof offer.imageAlt, offer.id).toBe('string');
      expect(offer.imageAlt.trim(), offer.id).not.toBe('');
    }
  });

  it('every illustration file exists under public/', () => {
    for (const offer of offers) {
      expect(existsSync(path.join(root, 'public', offer.image)), offer.image).toBe(true);
    }
  });

  it('every illustration is a 1024x1024 webp', async () => {
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
