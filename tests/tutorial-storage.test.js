import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import {
  loadCompletedTutorials,
  saveCompletedTutorials,
  TUTORIALS_STORAGE_KEY,
} from '../app/stores/tutorialStorage.js';
import { useUiStore } from '../app/stores/ui.js';

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    data,
  };
}

const throwing = {
  getItem() {
    throw new Error('blocked');
  },
  setItem() {
    throw new Error('blocked');
  },
};

describe('tutorial storage', () => {
  it('round-trips the completed tutorial names', () => {
    const storage = memoryStorage();
    saveCompletedTutorials(['overworld'], storage);
    expect(loadCompletedTutorials(storage)).toEqual(['overworld']);
  });

  it('returns an empty list when nothing is stored', () => {
    expect(loadCompletedTutorials(memoryStorage())).toEqual([]);
  });

  it('ignores malformed or foreign data', () => {
    expect(loadCompletedTutorials(memoryStorage({ [TUTORIALS_STORAGE_KEY]: '{oops' }))).toEqual([]);
    expect(loadCompletedTutorials(memoryStorage({ [TUTORIALS_STORAGE_KEY]: '{"a":1}' }))).toEqual([]);
    expect(loadCompletedTutorials(memoryStorage({ [TUTORIALS_STORAGE_KEY]: '["bubble",3,""]' }))).toEqual([
      'bubble',
    ]);
  });

  it('never throws when storage is blocked or missing', () => {
    expect(loadCompletedTutorials(throwing)).toEqual([]);
    expect(() => saveCompletedTutorials(['x'], throwing)).not.toThrow();
    expect(loadCompletedTutorials(null)).toEqual([]);
    expect(() => saveCompletedTutorials(['x'], null)).not.toThrow();
  });
});

describe('ui store tutorials and bubble switching', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setActivePinia(createPinia());
  });

  it('persists completed tutorials to localStorage', () => {
    const ui = useUiStore();
    ui.completeTutorial('overworld');
    expect(JSON.parse(window.localStorage.getItem(TUTORIALS_STORAGE_KEY))).toEqual(['overworld']);
  });

  it('hydrates completed tutorials from localStorage', () => {
    window.localStorage.setItem(TUTORIALS_STORAGE_KEY, '["bubble"]');
    const ui = useUiStore();
    ui.hydrateTutorials();
    expect(ui.isTutorialPending('bubble')).toBe(false);
    expect(ui.isTutorialPending('overworld')).toBe(true);
  });

  it('switchBubble moves between offers only inside a bubble', async () => {
    const { offers } = await import('../app/data/content.js');
    const ui = useUiStore();
    ui.switchBubble(offers[2].id);
    expect(ui.activeBubbleId).toBeNull();
    ui.startExperience();
    ui.completeIntro();
    ui.openBubble(offers[1].id);
    ui.switchBubble(offers[2].id);
    expect(ui.activeBubbleId).toBe(offers[2].id);
    ui.switchBubble('nope');
    expect(ui.activeBubbleId).toBe(offers[2].id);
    expect(ui.currentStep).toBe('bubble');
  });
});
