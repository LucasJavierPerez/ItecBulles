import { describe, it, expect, vi, afterEach } from 'vitest';
import { createApp, h, nextTick, ref } from 'vue';
import BubbleDetail from '../app/components/BubbleDetail.js';
import TutorialHint from '../app/components/TutorialHint.js';
import { offers, links, contacts, KIND_LABELS } from '../app/data/content.js';

let app;
let root;

function mount(component, props) {
  root = document.createElement('div');
  document.body.appendChild(root);
  app = createApp({ render: () => h(component, typeof props === 'function' ? props() : props) });
  app.mount(root);
  return root;
}

afterEach(() => {
  app?.unmount();
  root?.remove();
  app = null;
});

const mecatronica = offers.find((offer) => offer.id === 'mecatronica');

describe('BubbleDetail', () => {
  it('renders kind label, title, summary and illustration', () => {
    const el = mount(BubbleDetail, { offer: mecatronica });
    expect(el.textContent).toContain(KIND_LABELS.carrera);
    expect(el.querySelector('h2').textContent).toBe(mecatronica.title);
    expect(el.textContent).toContain(mecatronica.summary);
    const img = el.querySelector('img');
    expect(img.getAttribute('src')).toBe(mecatronica.image);
    expect(img.getAttribute('alt')).toBe(mecatronica.imageAlt);
  });

  it('is a labelled region', () => {
    const el = mount(BubbleDetail, { offer: mecatronica });
    const region = el.querySelector('section');
    const heading = el.querySelector('h2');
    expect(region.getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it('renders one info item per real detail with all its values', () => {
    const el = mount(BubbleDetail, { offer: mecatronica });
    const items = el.querySelectorAll('[data-detail-item]');
    expect(items).toHaveLength(mecatronica.details.length);
    expect(items[0].textContent).toContain('Título');
    expect(items[0].textContent).toContain('Técnico en Mecatrónica.');
    expect(items[2].querySelectorAll('li')).toHaveLength(3);
  });

  it('links the single primary CTA to the form in a new tab', () => {
    const el = mount(BubbleDetail, { offer: mecatronica });
    const cta = el.querySelector('[data-cta="primary"]');
    expect(cta.getAttribute('href')).toBe(links.cta.url);
    expect(cta.textContent).toContain('Quiero + Info');
    expect(cta.getAttribute('target')).toBe('_blank');
    expect(cta.getAttribute('rel')).toContain('noopener');
  });

  it('offers the WhatsApp line for the kind and the official page', () => {
    const el = mount(BubbleDetail, { offer: mecatronica });
    const hrefs = [...el.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(contacts.whatsapp[0].url);
    expect(hrefs).toContain(mecatronica.source);
    [...el.querySelectorAll('a[target="_blank"]')].forEach((a) =>
      expect(a.getAttribute('rel')).toContain('noopener'),
    );
  });

  it('shows extra official links when the offer has them', () => {
    const ada = offers.find((offer) => offer.id === 'secundario-ada-byron');
    const el = mount(BubbleDetail, { offer: ada });
    const hrefs = [...el.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(ada.extraLinks[0].url);
  });

  it('closes with the back button and with Escape', async () => {
    const onClose = vi.fn();
    const el = mount(BubbleDetail, { offer: mecatronica, onClose });
    el.querySelector('[data-action="close"]').click();
    expect(onClose).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('stops listening for Escape once unmounted', () => {
    const onClose = vi.fn();
    mount(BubbleDetail, { offer: mecatronica, onClose });
    app.unmount();
    app = null;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('navigates to the previous and next offers with wrap-around', () => {
    const onNavigate = vi.fn();
    const el = mount(BubbleDetail, { offer: offers[0], onNavigate });
    const prev = el.querySelector('[data-action="prev"]');
    const next = el.querySelector('[data-action="next"]');
    expect(prev.textContent).toContain(offers[offers.length - 1].title);
    prev.click();
    next.click();
    expect(onNavigate).toHaveBeenNthCalledWith(1, offers[offers.length - 1].id);
    expect(onNavigate).toHaveBeenNthCalledWith(2, offers[1].id);
  });

  it('moves focus to the heading on open and when the offer changes', async () => {
    const current = ref(offers[0]);
    const el = mount(BubbleDetail, () => ({ offer: current.value }));
    await nextTick();
    expect(document.activeElement).toBe(el.querySelector('h2'));
    el.querySelector('[data-action="close"]').focus();
    current.value = offers[1];
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(el.querySelector('h2'));
    expect(el.querySelector('h2').textContent).toBe(offers[1].title);
  });
});

describe('TutorialHint', () => {
  it('shows the message and emits dismiss', () => {
    const onDismiss = vi.fn();
    const el = mount(TutorialHint, { message: 'Arrastrá para explorar', onDismiss });
    expect(el.textContent).toContain('Arrastrá para explorar');
    el.querySelector('button').click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('announces politely', () => {
    const el = mount(TutorialHint, { message: 'Hola' });
    expect(el.querySelector('[role="status"]')).not.toBeNull();
  });
});

describe('BubbleDetail composition (T7 fixes)', () => {
  it('drops the HTML illustration when the 3D bubble is on screen', () => {
    const el = mount(BubbleDetail, { offer: mecatronica, sceneActive: true });
    expect(el.querySelector('.detail-orb')).toBeNull();
    expect(el.querySelector('.bubble-detail').classList.contains('has-scene')).toBe(true);
  });

  it('keeps the HTML illustration in static mode', () => {
    const el = mount(BubbleDetail, { offer: mecatronica, sceneActive: false });
    expect(el.querySelector('.detail-orb img').getAttribute('src')).toBe(mecatronica.image);
  });

  it('renders the hint slot right after the back button, before the title', () => {
    root = document.createElement('div');
    document.body.appendChild(root);
    app = createApp({
      render: () => h(BubbleDetail, { offer: mecatronica }, { hint: () => h('p', { 'data-hint': '' }, 'Tip') }),
    });
    app.mount(root);
    const hint = root.querySelector('[data-hint]');
    const close = root.querySelector('[data-action="close"]');
    const title = root.querySelector('#bubble-title');
    expect(close.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hint.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
