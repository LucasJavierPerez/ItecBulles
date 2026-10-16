import { describe, it, expect } from 'vitest';
import { offers, campuses, contacts, links, institution, KINDS } from '../src/content.js';

const OFFICIAL_HOST = 'www.itecriocuarto.org.ar';

function collectUrls(value, out = []) {
  if (typeof value === 'string') {
    if (/^[a-z]+:\/\//i.test(value)) out.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectUrls(v, out));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => collectUrls(v, out));
  }
  return out;
}

describe('content model', () => {
  it('has offers', () => {
    expect(offers.length).toBeGreaterThanOrEqual(9);
  });

  it('every offer has id, kind, title, summary and an official source', () => {
    for (const offer of offers) {
      expect(offer.id, JSON.stringify(offer)).toMatch(/^[a-z0-9-]+$/);
      expect(KINDS).toContain(offer.kind);
      expect(offer.title.trim()).not.toBe('');
      expect(offer.summary.trim()).not.toBe('');
      expect(offer.source).toMatch(/^https:\/\//);
    }
  });

  it('offer sources point to the official site or its course portal', () => {
    for (const offer of offers) {
      const host = new URL(offer.source).host;
      expect([OFFICIAL_HOST, 'cursos.itecriocuarto.org.ar']).toContain(host);
    }
  });

  it('offer ids are unique', () => {
    const ids = offers.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has exactly one central "ingreso" offer', () => {
    expect(offers.filter((o) => o.kind === 'ingreso')).toHaveLength(1);
  });

  it('details are label/value pairs with non-empty text', () => {
    for (const offer of offers) {
      for (const detail of offer.details ?? []) {
        expect(detail.label.trim()).not.toBe('');
        const values = Array.isArray(detail.value) ? detail.value : [detail.value];
        expect(values.length).toBeGreaterThan(0);
        values.forEach((v) => expect(String(v).trim()).not.toBe(''));
      }
    }
  });

  it('all URLs in the model use https', () => {
    const urls = collectUrls({ offers, campuses, contacts, links, institution });
    expect(urls.length).toBeGreaterThan(0);
    urls.forEach((url) => expect(url).toMatch(/^https:\/\//));
  });

  it('exposes the primary CTA url', () => {
    expect(links.cta.label).toBe('Quiero + Info');
    expect(links.cta.url).toMatch(/^https:\/\/docs\.google\.com\/forms\//);
  });

  it('lists both campuses with address and hours', () => {
    expect(campuses.map((c) => c.name)).toEqual(['Sede Centro', 'Sede Campus']);
    campuses.forEach((c) => {
      expect(c.address).toBeTruthy();
      expect(c.hours.length).toBeGreaterThan(0);
    });
  });

  it('lists phone, email and WhatsApp contacts', () => {
    expect(contacts.phone.display).toBe('0358-4643036');
    expect(contacts.email.address).toBe('informes@itecriocuarto.org.ar');
    expect(contacts.whatsapp.map((w) => w.url)).toEqual([
      'https://wa.me/5493585606036',
      'https://wa.me/5493585606052',
    ]);
  });
});
