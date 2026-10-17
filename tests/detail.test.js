import { describe, it, expect } from 'vitest';
import { buildDetail, adjacentOffers, contactFor, tintFor, BUBBLE_HEX } from '../app/data/detail.js';
import { offers, contacts, KIND_LABELS } from '../app/data/content.js';
import { BUBBLE_COLORS } from '../app/scene/bubbles/colors.js';

const byId = (id) => offers.find((offer) => offer.id === id);

describe('buildDetail', () => {
  it('turns every detail of an offer into an ordered info item', () => {
    const offer = byId('mecatronica');
    const items = buildDetail(offer);
    expect(items.map((item) => item.label)).toEqual(offer.details.map((d) => d.label));
  });

  it('normalizes values to a list of strings', () => {
    const items = buildDetail(byId('mecatronica'));
    const title = items.find((item) => item.label === 'Título');
    expect(title.values).toEqual(['Técnico en Mecatrónica.']);
    const profile = items.find((item) => item.label === 'Perfil profesional');
    expect(profile.values.length).toBe(3);
  });

  it('gives each item a stable, unique, DOM-safe key', () => {
    const items = buildDetail(byId('ingreso-2027'));
    const keys = items.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
    keys.forEach((key) => expect(key).toMatch(/^[a-z0-9-]+$/));
  });

  it('never fabricates: offers without a field get no item for it', () => {
    const items = buildDetail(byId('desarrollo-de-software'));
    expect(items.find((item) => item.label === 'Duración')).toBeUndefined();
    expect(items.find((item) => item.label === 'Título')).toBeUndefined();
  });

  it('omits details with empty or missing values', () => {
    const items = buildDetail({
      id: 'x',
      details: [
        { label: 'Vacío', value: '' },
        { label: 'Lista vacía', value: [] },
        { label: 'Sin valor' },
        { label: '', value: 'sin etiqueta' },
        { label: 'Ok', value: ['  ', 'Dato'] },
      ],
    });
    expect(items).toEqual([{ key: 'ok', label: 'Ok', values: ['Dato'] }]);
  });

  it('handles offers without details', () => {
    expect(buildDetail({ id: 'x' })).toEqual([]);
    expect(buildDetail(null)).toEqual([]);
  });

  it('every real offer yields at least one item and only labels from content', () => {
    offers.forEach((offer) => {
      const items = buildDetail(offer);
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => expect(offer.details.some((d) => d.label === item.label)).toBe(true));
    });
  });

  it('kind labels exist for every offer kind', () => {
    offers.forEach((offer) => expect(KIND_LABELS[offer.kind]).toBeTruthy());
  });
});

describe('adjacentOffers', () => {
  it('returns the previous and next offer', () => {
    const { prev, next } = adjacentOffers(offers[3].id);
    expect(prev.id).toBe(offers[2].id);
    expect(next.id).toBe(offers[4].id);
  });

  it('wraps around at both ends', () => {
    expect(adjacentOffers(offers[0].id).prev.id).toBe(offers[offers.length - 1].id);
    expect(adjacentOffers(offers[offers.length - 1].id).next.id).toBe(offers[0].id);
  });

  it('returns nulls for unknown ids', () => {
    expect(adjacentOffers('nope')).toEqual({ prev: null, next: null });
  });
});

describe('contactFor', () => {
  it('uses the careers WhatsApp for careers and enrollment', () => {
    expect(contactFor(byId('mecatronica'))).toBe(contacts.whatsapp[0]);
    expect(contactFor(byId('ingreso-2027'))).toBe(contacts.whatsapp[0]);
  });

  it('uses the courses WhatsApp for courses and training paths', () => {
    expect(contactFor(byId('capacitacion-continua'))).toBe(contacts.whatsapp[1]);
    expect(contactFor(byId('operario-electromecanico'))).toBe(contacts.whatsapp[1]);
  });

  it('returns a real contact for every offer', () => {
    offers.forEach((offer) => expect(contacts.whatsapp).toContain(contactFor(offer)));
  });
});

describe('tintFor', () => {
  it('matches the bubble color used by the scene', () => {
    expect(BUBBLE_HEX.map((hex) => parseInt(hex.slice(1), 16))).toEqual(BUBBLE_COLORS);
    offers.forEach((offer, i) => expect(tintFor(offer.id)).toBe(BUBBLE_HEX[i % BUBBLE_HEX.length]));
  });

  it('falls back to the first color for unknown ids', () => {
    expect(tintFor('nope')).toBe(BUBBLE_HEX[0]);
  });
});
