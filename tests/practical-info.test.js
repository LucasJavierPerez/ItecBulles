import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import PracticalInfo from '../app/components/PracticalInfo.js';
import { campuses, contacts, links } from '../app/data/content.js';

let app;
let root;

function mount(props = {}) {
  root = document.createElement('div');
  document.body.appendChild(root);
  app = createApp({ render: () => h(PracticalInfo, props) });
  app.mount(root);
  return root;
}

const hrefs = (el) => [...el.querySelectorAll('a')].map((a) => a.getAttribute('href'));

afterEach(() => {
  app?.unmount();
  root?.remove();
});

describe('PracticalInfo', () => {
  it('is a labelled footer region', () => {
    const el = mount();
    const footer = el.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(el.querySelector('h2').textContent).toBe('Información práctica');
  });

  it('always shows phone, email and every WhatsApp line as text and links', () => {
    const el = mount({ expanded: false });
    const text = el.querySelector('.practical-info__bar').textContent;
    expect(text).toContain(contacts.phone.display);
    expect(text).toContain(contacts.email.address);
    for (const line of contacts.whatsapp) expect(text).toContain(line.display);
    expect(hrefs(el)).toEqual(
      expect.arrayContaining([contacts.phone.href, contacts.email.href, ...contacts.whatsapp.map((w) => w.url)]),
    );
  });

  it('shows every campus with address and published hours when expanded', () => {
    const el = mount({ expanded: true });
    const text = el.textContent;
    for (const campus of campuses) {
      expect(text).toContain(campus.name);
      expect(text).toContain(campus.address);
      for (const hours of campus.hours) expect(text).toContain(hours);
    }
  });

  it('lists current-student links (horarios, calendario, SiTec) and socials, with no login UI', () => {
    const el = mount({ expanded: true });
    expect(hrefs(el)).toEqual(
      expect.arrayContaining([links.schedules, links.calendar, links.sitec, ...contacts.socials.map((s) => s.url)]),
    );
    expect(el.querySelector('input, form')).toBeNull();
    expect(el.textContent).not.toMatch(/iniciar sesi[oó]n|contraseña/i);
  });

  it('keeps the campuses in the DOM but hidden when collapsed, and toggles', async () => {
    let expanded = false;
    const el = mount({
      get expanded() {
        return expanded;
      },
      'onUpdate:expanded': (v) => (expanded = v),
    });
    const toggle = el.querySelector('button[aria-controls]');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const panel = el.querySelector(`#${toggle.getAttribute('aria-controls')}`);
    expect(panel.hidden).toBe(true);
    toggle.click();
    expect(expanded).toBe(true);
  });
});
