import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SOUNDS,
  createVariantPicker,
  soundForSceneEvent,
  soundForBubbleChange,
  loadMuted,
  saveMuted,
  MUTED_STORAGE_KEY,
  createSoundManager,
} from '../app/audio/soundManager.js';

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    data,
  };
}

const throwingStorage = {
  getItem() {
    throw new Error('blocked');
  },
  setItem() {
    throw new Error('blocked');
  },
};

// Minimal Howler double: records every Howl and the global mute.
function fakeHowler() {
  const howls = [];
  class Howl {
    constructor(options) {
      this.options = options;
      this.plays = 0;
      this.paused = false;
      this.fades = [];
      this.vol = options.volume ?? 1;
      howls.push(this);
    }
    play() {
      this.plays += 1;
      this.paused = false;
      return this.plays;
    }
    pause() {
      this.paused = true;
    }
    playing() {
      return this.plays > 0 && !this.paused;
    }
    fade(from, to, duration) {
      this.fades.push([from, to, duration]);
    }
    volume() {
      return this.vol;
    }
    unload() {}
  }
  const Howler = { muted: null, mute: vi.fn((value) => (Howler.muted = value)) };
  return { module: { Howl, Howler }, howls, Howler };
}

describe('sound catalogue', () => {
  it('lists the synthesized files per action under /sounds', () => {
    expect(SOUNDS.ambience.src).toEqual(['/sounds/ambience.wav']);
    expect(SOUNDS.hover.variants.length).toBeGreaterThanOrEqual(2);
    expect(SOUNDS.click.variants.length).toBe(2);
    for (const entry of Object.values(SOUNDS)) {
      for (const src of entry.variants ?? [entry.src[0]]) expect(src).toMatch(/^\/sounds\/[a-z0-9-]+\.wav$/);
    }
  });
});

describe('createVariantPicker', () => {
  it('rotates through the variants in order and wraps', () => {
    const next = createVariantPicker(3);
    expect([next(), next(), next(), next()]).toEqual([0, 1, 2, 0]);
  });

  it('always returns 0 for a single variant', () => {
    const next = createVariantPicker(1);
    expect([next(), next()]).toEqual([0, 0]);
  });
});

describe('event to sound mapping', () => {
  it('maps scene events to actions', () => {
    expect(soundForSceneEvent('bubble:hover', { id: 'mecatronica' })).toBe('hover');
    expect(soundForSceneEvent('bubble:hover', { id: null })).toBeNull();
    expect(soundForSceneEvent('bubble:click', { id: 'mecatronica' })).toBe('click');
    expect(soundForSceneEvent('transition:start', { id: 'x', kind: 'enter' })).toBe('whoosh');
    expect(soundForSceneEvent('transition:end', { id: 'x' })).toBeNull();
    expect(soundForSceneEvent('scene:ready', {})).toBeNull();
  });

  it('maps store bubble changes to actions', () => {
    expect(soundForBubbleChange(null, 'a')).toBe('click');
    expect(soundForBubbleChange('a', 'b')).toBe('click');
    expect(soundForBubbleChange('a', null)).toBe('close');
    expect(soundForBubbleChange(null, null)).toBeNull();
    expect(soundForBubbleChange('a', 'a')).toBeNull();
  });
});

describe('mute persistence', () => {
  it('round-trips the mute flag', () => {
    const storage = memoryStorage();
    expect(loadMuted(storage)).toBe(false);
    saveMuted(true, storage);
    expect(storage.data[MUTED_STORAGE_KEY]).toBe('1');
    expect(loadMuted(storage)).toBe(true);
    saveMuted(false, storage);
    expect(loadMuted(storage)).toBe(false);
  });

  it('survives blocked or missing storage', () => {
    expect(loadMuted(throwingStorage)).toBe(false);
    expect(() => saveMuted(true, throwingStorage)).not.toThrow();
    expect(loadMuted(null)).toBe(false);
  });
});

describe('createSoundManager', () => {
  let howler;
  let manager;

  beforeEach(() => {
    howler = fakeHowler();
    manager = createSoundManager({ loadHowler: async () => howler.module, now: () => 0 });
  });

  it('creates no Howl before the first gesture', () => {
    manager.play('hover');
    expect(howler.howls).toHaveLength(0);
    expect(manager.unlocked).toBe(false);
  });

  it('unlocks once, creates the Howls lazily and fades the ambience in', async () => {
    await manager.unlock();
    await manager.unlock();
    const ambience = howler.howls.find((h) => h.options.src[0] === '/sounds/ambience.wav');
    expect(ambience.options.loop).toBe(true);
    expect(ambience.options.preload).toBe(true);
    expect(ambience.plays).toBe(1);
    expect(ambience.fades.at(-1)[1]).toBeGreaterThan(0);
    const total = 1 + Object.values(SOUNDS).reduce((n, s) => n + (s.variants?.length ?? 0), 0);
    expect(howler.howls).toHaveLength(total);
  });

  it('rotates variants per action', async () => {
    await manager.unlock();
    manager.play('hover');
    manager.play('hover');
    const hovers = howler.howls.filter((h) => h.options.src[0].includes('hover'));
    expect(hovers[0].plays).toBe(1);
    expect(hovers[1].plays).toBe(1);
  });

  it('ignores unknown actions', async () => {
    await manager.unlock();
    expect(() => manager.play('nope')).not.toThrow();
  });

  it('applies the mute globally, also before unlocking', async () => {
    manager.setMuted(true);
    await manager.unlock();
    expect(howler.Howler.mute).toHaveBeenLastCalledWith(true);
    manager.setMuted(false);
    expect(howler.Howler.mute).toHaveBeenLastCalledWith(false);
  });

  it('fades the ambience out while the tab is hidden and back in when visible', async () => {
    await manager.unlock();
    const ambience = howler.howls.find((h) => h.options.loop);
    manager.setHidden(true);
    expect(ambience.fades.at(-1)[1]).toBe(0);
    manager.setHidden(false);
    expect(ambience.playing()).toBe(true);
    expect(ambience.fades.at(-1)[1]).toBeGreaterThan(0);
  });

  it('does not play effects while hidden', async () => {
    await manager.unlock();
    manager.setHidden(true);
    manager.play('click');
    const clicks = howler.howls.filter((h) => h.options.src[0].includes('click'));
    expect(clicks.every((h) => h.plays === 0)).toBe(true);
  });

  it('stays silent when Howler fails to load', async () => {
    const broken = createSoundManager({
      loadHowler: async () => {
        throw new Error('offline');
      },
    });
    await expect(broken.unlock()).resolves.toBeUndefined();
    expect(() => broken.play('click')).not.toThrow();
  });
});

describe('cooldown', () => {
  it('drops a repeated click inside its cooldown window', async () => {
    const howler = fakeHowler();
    let t = 0;
    const manager = createSoundManager({ loadHowler: async () => howler.module, now: () => t });
    await manager.unlock();
    manager.play('click');
    t = 500;
    manager.play('click');
    t = 2000;
    manager.play('click');
    const plays = howler.howls.filter((h) => h.options.src[0].includes('click')).map((h) => h.plays);
    expect(plays).toEqual([1, 1]);
  });
});
