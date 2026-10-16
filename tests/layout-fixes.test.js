// Regressions from the T7 browser check: footer drawer default, tutorial
// placement, loader removal in hidden tabs and the aspect-aware BUBBLE framing.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createApp, h, nextTick, ref } from 'vue';
import { defaultInfoExpanded } from '../app/data/layout.js';
import { getCameraState, bubbleScreenAnchor } from '../app/scene/cameraStates.js';
import TutorialHint from '../app/components/TutorialHint.js';
import SceneLoader from '../app/components/SceneLoader.js';

let app;
let root;

function mount(render) {
  root = document.createElement('div');
  document.body.appendChild(root);
  app = createApp({ render });
  app.mount(root);
  return root;
}

const setVisibility = (state) =>
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });

afterEach(() => {
  app?.unmount();
  root?.remove();
  app = null;
  setVisibility('visible');
  vi.useRealTimers();
});

describe('practical info drawer default', () => {
  it('starts collapsed on every step on phones', () => {
    for (const step of ['home', 'intro', 'overworld', 'bubble']) {
      expect(defaultInfoExpanded(step, { width: 390, height: 844 })).toBe(false);
    }
  });

  it('opens on the desktop home screen only when there is room for it', () => {
    expect(defaultInfoExpanded('home', { width: 1440, height: 900 })).toBe(true);
    expect(defaultInfoExpanded('home', { width: 1440, height: 600 })).toBe(false);
    expect(defaultInfoExpanded('overworld', { width: 1440, height: 900 })).toBe(false);
    expect(defaultInfoExpanded('bubble', { width: 1440, height: 900 })).toBe(false);
  });
});

describe('TutorialHint placement', () => {
  it('renders in the flow instead of floating over primary actions', () => {
    const el = mount(() => h(TutorialHint, { message: 'Hola' }));
    const card = el.querySelector('.tutorial-hint');
    expect(card.className).not.toMatch(/\bfixed\b/);
    expect(card.className).not.toMatch(/\bbottom-/);
  });
});

describe('BUBBLE camera framing', () => {
  it('keeps the legacy framing without an aspect', () => {
    expect(getCameraState('BUBBLE')).toEqual({ position: [0, 5.6, 5.7], target: [0, 5.6, 2.5] });
  });

  it('puts the opened bubble on the right half on wide screens', () => {
    const anchor = bubbleScreenAnchor(16 / 10);
    expect(anchor.x).toBeGreaterThan(0.3);
    const state = getCameraState('BUBBLE', 16 / 10);
    expect(state.position[0]).toBeLessThan(0);
    expect(state.target[0]).toBe(state.position[0]);
  });

  it('puts the opened bubble in the upper part on phones', () => {
    const anchor = bubbleScreenAnchor(390 / 844);
    expect(anchor.x).toBe(0);
    expect(anchor.y).toBeGreaterThan(0.3);
    const state = getCameraState('BUBBLE', 390 / 844);
    expect(state.position[0]).toBe(0);
    expect(state.target[1]).toBeLessThan(getCameraState('BUBBLE').target[1]);
  });
});

describe('SceneLoader', () => {
  it('fades out, then unmounts after the fade when the tab is visible', async () => {
    vi.useFakeTimers();
    const visible = ref(true);
    const el = mount(() => h(SceneLoader, { visible: visible.value }));
    expect(el.querySelector('[data-scene-loader]')).not.toBeNull();
    visible.value = false;
    await nextTick();
    expect(el.querySelector('[data-scene-loader]').classList.contains('is-leaving')).toBe(true);
    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(el.querySelector('[data-scene-loader]')).toBeNull();
  });

  it('is removed at once when the loader finishes in a hidden tab', async () => {
    const visible = ref(true);
    const el = mount(() => h(SceneLoader, { visible: visible.value }));
    setVisibility('hidden');
    visible.value = false;
    await nextTick();
    expect(el.querySelector('[data-scene-loader]')).toBeNull();
  });
});
