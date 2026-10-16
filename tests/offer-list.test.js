import { describe, it, expect, vi, afterEach } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import OfferList from '../app/components/OfferList.js';
import { offers } from '../app/data/content.js';

let app;
let root;

function mount(props = {}) {
  root = document.createElement('div');
  document.body.appendChild(root);
  app = createApp({ render: () => h(OfferList, { offers, ...props }) });
  app.mount(root);
  return root;
}

const key = (el, k) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
const offerButtons = (el) => [...el.querySelectorAll('[data-offer-id]')];

afterEach(() => {
  app?.unmount();
  root?.remove();
});

describe('OfferList', () => {
  it('renders one real button per offer named after the offer', () => {
    const el = mount();
    const buttons = offerButtons(el);
    expect(buttons).toHaveLength(offers.length);
    buttons.forEach((b, i) => {
      expect(b.tagName).toBe('BUTTON');
      expect(b.getAttribute('type')).toBe('button');
      expect(b.textContent.trim()).toBe(offers[i].title);
    });
  });

  it('has a "Ver lista de propuestas" toggle that reveals the list panel', async () => {
    const el = mount();
    const toggle = el.querySelector('button[aria-controls]');
    expect(toggle.textContent).toContain('Ver lista de propuestas');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const panel = el.querySelector(`#${toggle.getAttribute('aria-controls')}`);
    expect(panel.classList.contains('sr-only')).toBe(true);
    toggle.click();
    await nextTick();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.classList.contains('sr-only')).toBe(false);
    expect(toggle.textContent).toContain('Ocultar lista');
  });

  it('becomes visible as soon as a list button gets keyboard focus', async () => {
    const el = mount();
    const panel = el.querySelector('.offer-list__panel');
    offerButtons(el)[0].focus();
    await nextTick();
    expect(panel.classList.contains('sr-only')).toBe(false);
  });

  it('moves focus with the arrow keys, wrapping, and emits focus with the offer id', async () => {
    const onFocus = vi.fn();
    const el = mount({ onFocus });
    const buttons = offerButtons(el);
    buttons[0].focus();
    key(buttons[0], 'ArrowRight');
    expect(document.activeElement).toBe(buttons[1]);
    key(buttons[1], 'ArrowLeft');
    key(buttons[0], 'ArrowLeft');
    expect(document.activeElement).toBe(buttons.at(-1));
    key(buttons.at(-1), 'Home');
    expect(document.activeElement).toBe(buttons[0]);
    key(buttons[0], 'End');
    expect(document.activeElement).toBe(buttons.at(-1));
    expect(onFocus).toHaveBeenCalledWith(offers[1].id);
    expect(onFocus).toHaveBeenLastCalledWith(offers.at(-1).id);
  });

  it('emits open with the offer id when a button is activated', () => {
    const onOpen = vi.fn();
    const el = mount({ onOpen });
    offerButtons(el)[3].click();
    expect(onOpen).toHaveBeenCalledWith(offers[3].id);
  });
});
