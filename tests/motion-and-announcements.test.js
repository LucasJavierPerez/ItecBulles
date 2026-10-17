import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp, h } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useUiStore } from '../app/stores/ui.js';
import {
  REDUCED_MOTION_STORAGE_KEY,
  loadReducedMotionPreference,
  saveReducedMotionPreference,
} from '../app/stores/preferences.js';
import { announcementFor } from '../app/data/announcements.js';
import MotionToggle from '../app/components/MotionToggle.js';
import { offers } from '../app/data/content.js';

const throwingStorage = {
  getItem() {
    throw new Error('blocked');
  },
  setItem() {
    throw new Error('blocked');
  },
};

describe('reduced-motion preference storage', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when the visitor never chose', () => {
    expect(loadReducedMotionPreference()).toBeNull();
  });

  it('round-trips true and false', () => {
    saveReducedMotionPreference(true);
    expect(localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)).toBe('1');
    expect(loadReducedMotionPreference()).toBe(true);
    saveReducedMotionPreference(false);
    expect(loadReducedMotionPreference()).toBe(false);
  });

  it('survives blocked storage', () => {
    expect(loadReducedMotionPreference(throwingStorage)).toBeNull();
    expect(() => saveReducedMotionPreference(true, throwingStorage)).not.toThrow();
  });
});

describe('ui store reduced motion', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('the user toggle sets reducedMotion and persists it', () => {
    const ui = useUiStore();
    ui.setUserReducedMotion(true);
    expect(ui.reducedMotion).toBe(true);
    expect(loadReducedMotionPreference()).toBe(true);
    setActivePinia(createPinia());
    const fresh = useUiStore();
    fresh.hydratePreferences();
    expect(fresh.reducedMotion).toBe(true);
  });

  it('the system setting applies only while the visitor has not chosen', () => {
    const ui = useUiStore();
    ui.applySystemReducedMotion(true);
    expect(ui.reducedMotion).toBe(true);
    ui.setUserReducedMotion(false);
    ui.applySystemReducedMotion(true);
    expect(ui.reducedMotion).toBe(false);
  });

  it('turning reduced motion on during the intro lands on the bubbles', () => {
    const ui = useUiStore();
    ui.startExperience();
    expect(ui.currentStep).toBe('intro');
    ui.setUserReducedMotion(true);
    expect(ui.currentStep).toBe('overworld');
  });
});

describe('MotionToggle', () => {
  let app;
  let root;
  afterEach(() => {
    app?.unmount();
    root?.remove();
  });

  it('is a pressed-state toggle named "Reducir movimiento"', () => {
    const onToggle = vi.fn();
    root = document.createElement('div');
    document.body.appendChild(root);
    app = createApp({ render: () => h(MotionToggle, { reduced: true, onToggle }) });
    app.mount(root);
    const button = root.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Reducir movimiento');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    button.click();
    expect(onToggle).toHaveBeenCalledOnce();
  });
});

describe('announcementFor', () => {
  const title = offers[2].title;

  it('announces an opened offer, also on prev / next', () => {
    expect(announcementFor({ step: 'bubble', previousStep: 'overworld', offerTitle: title })).toBe(
      `Propuesta abierta: ${title}`,
    );
    expect(announcementFor({ step: 'bubble', previousStep: 'bubble', offerTitle: title })).toBe(
      `Propuesta abierta: ${title}`,
    );
  });

  it('announces the return to the bubbles', () => {
    expect(announcementFor({ step: 'overworld', previousStep: 'bubble' })).toBe('Volviste a las burbujas');
  });

  it('announces arriving at the offers with their count', () => {
    expect(announcementFor({ step: 'overworld', previousStep: 'intro', offerCount: 11 })).toBe(
      'Estás en las propuestas: 11 burbujas para explorar.',
    );
  });

  it('announces the intro and stays silent on home', () => {
    expect(announcementFor({ step: 'intro', previousStep: 'home' })).toMatch(/introducción/i);
    expect(announcementFor({ step: 'home', previousStep: null })).toBe('');
  });
});
