// Pure view-model helpers for the inner bubble (offer detail).
// Everything comes from content.js: an offer field the official site does not state
// never becomes an item here, it is simply absent.
import { offers as allOffers, contacts } from './content.js';

// Hex twins of BUBBLE_COLORS in app/scene/bubbles/colors.js (kept three.js-free so
// the DOM can use them). A test keeps both lists in sync.
export const BUBBLE_HEX = ['#ffd333', '#8c00ff', '#ff94b6', '#ff0090'];

// Kinds answered by the courses WhatsApp line; every other kind uses careers.
const COURSE_KINDS = new Set(['capacitacion', 'trayecto']);

const slug = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toValues = (value) =>
  (Array.isArray(value) ? value : [value])
    .filter((v) => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);

/**
 * Ordered info items for an offer: `{ key, label, values: string[] }`.
 * Details without a label or without any non-empty value are dropped.
 */
export function buildDetail(offer) {
  const items = [];
  const seen = new Map();
  for (const detail of offer?.details ?? []) {
    const label = typeof detail?.label === 'string' ? detail.label.trim() : '';
    const values = toValues(detail?.value);
    if (!label || values.length === 0) continue;
    const base = slug(label) || 'item';
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    items.push({ key: count ? `${base}-${count + 1}` : base, label, values });
  }
  return items;
}

/** Previous / next offer around `id`, wrapping at both ends. */
export function adjacentOffers(id, list = allOffers) {
  const index = list.findIndex((offer) => offer.id === id);
  if (index < 0 || list.length === 0) return { prev: null, next: null };
  return {
    prev: list[(index - 1 + list.length) % list.length],
    next: list[(index + 1) % list.length],
  };
}

/** WhatsApp line for the offer kind (careers vs courses, as listed on the site). */
export function contactFor(offer) {
  return COURSE_KINDS.has(offer?.kind) ? contacts.whatsapp[1] : contacts.whatsapp[0];
}

/** Bubble color of an offer, same index rule as the 3D bubbles. */
export function tintFor(id, list = allOffers) {
  const index = Math.max(0, list.findIndex((offer) => offer.id === id));
  return BUBBLE_HEX[index % BUBBLE_HEX.length];
}
