import { describe, it, expect, vi, afterEach } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import StaticBubbleGrid from '../app/components/StaticBubbleGrid.js';
import { offers } from '../app/data/content.js';

let app;
let root;

function mount(props) {
  root = document.createElement('div');
  document.body.appendChild(root);
  app = createApp({ render: () => h(StaticBubbleGrid, props) });
  app.mount(root);
  return root;
}

afterEach(() => {
  app?.unmount();
  root?.remove();
});

describe('StaticBubbleGrid', () => {
  it('renders one button per offer with its title as accessible name', () => {
    const el = mount({ offers });
    const buttons = el.querySelectorAll('button');
    expect(buttons).toHaveLength(offers.length);
    expect(buttons[0].textContent).toContain(offers[0].title);
    buttons.forEach((b) => expect(b.getAttribute('type')).toBe('button'));
  });

  it('shows each illustration with its alt text', () => {
    const el = mount({ offers });
    const images = [...el.querySelectorAll('img')];
    expect(images).toHaveLength(offers.length);
    expect(images[2].getAttribute('src')).toBe(offers[2].image);
    expect(images[2].getAttribute('alt')).toBe(offers[2].imageAlt);
  });

  it('emits open with the offer id on click', async () => {
    const onOpen = vi.fn();
    const el = mount({ offers, onOpen });
    el.querySelectorAll('button')[3].click();
    await nextTick();
    expect(onOpen).toHaveBeenCalledWith(offers[3].id);
  });
});
