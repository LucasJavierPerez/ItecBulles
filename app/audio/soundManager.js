// Sound layer (Howler), as in Projet Bulles: ambience loop plus hover / click /
// transition / close effects with several variants per action.
// Differences on purpose (see docs/referencia/bulles-teardown.md):
//   - nothing is downloaded before the first user gesture (`unlock`): howler itself
//     is imported lazily and the Howls are created only then;
//   - the mute is global (Howler.mute) and persisted in localStorage;
//   - a master volume (Howler.volume, 0..1) scales every sound on top of its own
//     volume; it is persisted too and applied as soon as howler loads;
//   - the ambience fades out while the tab is hidden.
// The files in /public/sounds are synthesized by `npm run sounds`.

export const MUTED_STORAGE_KEY = 'itec-bulles:muted';
export const VOLUME_STORAGE_KEY = 'itec-bulles:volume';
export const DEFAULT_VOLUME = 0.7;

const file = (name) => `/sounds/${name}.wav`;

// `cooldown` (ms) drops repeats of the same action: a scene click is followed by
// the store opening the bubble ~1 s later, which must not click twice.
export const SOUNDS = Object.freeze({
  ambience: { src: [file('ambience')], volume: 0.35 },
  hover: { variants: [file('hover-1'), file('hover-2'), file('hover-3')], volume: 0.45, cooldown: 0 },
  click: { variants: [file('click-1'), file('click-2')], volume: 0.6, cooldown: 1500 },
  whoosh: { variants: [file('whoosh')], volume: 0.5, cooldown: 300 },
  close: { variants: [file('close')], volume: 0.5, cooldown: 300 },
});

const AMBIENCE_FADE_MS = 1600;

/** Returns a function yielding 0, 1, …, count - 1, 0, … (round robin). */
export function createVariantPicker(count) {
  let index = -1;
  return () => {
    index = (index + 1) % Math.max(1, count);
    return index;
  };
}

/** Scene event (app/scene/events.js) -> sound action, or null. */
export function soundForSceneEvent(name, payload = {}) {
  if (name === 'bubble:hover') return payload?.id ? 'hover' : null;
  if (name === 'bubble:click') return 'click';
  if (name === 'transition:start') return 'whoosh';
  return null;
}

/** ui.activeBubbleId change -> sound action: open / switch click, close sound. */
export function soundForBubbleChange(previous, next) {
  if (previous === next) return null;
  if (next) return 'click';
  return previous ? 'close' : null;
}

const browserStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

export function loadMuted(storage = browserStorage()) {
  try {
    return storage?.getItem(MUTED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveMuted(muted, storage = browserStorage()) {
  try {
    storage?.setItem(MUTED_STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // Not persisted: the visitor may need to mute again next time.
  }
}

/** Master volume in 0..1, rounded to hundredths; garbage falls back to the default. */
export function clampVolume(value) {
  if (value === null || value === undefined || value === '') return DEFAULT_VOLUME;
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_VOLUME;
  return Math.round(Math.min(1, Math.max(0, number)) * 100) / 100;
}

export function loadVolume(storage = browserStorage()) {
  try {
    return clampVolume(storage?.getItem(VOLUME_STORAGE_KEY));
  } catch {
    return DEFAULT_VOLUME;
  }
}

export function saveVolume(volume, storage = browserStorage()) {
  try {
    storage?.setItem(VOLUME_STORAGE_KEY, String(clampVolume(volume)));
  } catch {
    // Not persisted: the volume goes back to the default next time.
  }
}

export function createSoundManager({
  loadHowler = () => import('howler'),
  now = () => (typeof performance === 'undefined' ? Date.now() : performance.now()),
} = {}) {
  let howlerApi = null;
  let ambience = null;
  let unlocking = null;
  let muted = false;
  let volume = DEFAULT_VOLUME;
  let hidden = false;
  const effects = new Map(); // action -> { howls, next, cooldown, lastAt }

  function fadeAmbienceIn() {
    if (!ambience) return;
    if (!ambience.playing()) ambience.play();
    ambience.fade(ambience.volume(), SOUNDS.ambience.volume, AMBIENCE_FADE_MS);
  }

  async function createHowls() {
    try {
      const mod = await loadHowler();
      const { Howl, Howler } = mod.default?.Howl ? mod.default : mod;
      howlerApi = Howler;
      Howler.mute(muted);
      Howler.volume(volume);
      ambience = new Howl({ src: SOUNDS.ambience.src, loop: true, volume: 0, preload: true });
      for (const [action, entry] of Object.entries(SOUNDS)) {
        if (!entry.variants) continue;
        effects.set(action, {
          howls: entry.variants.map((src) => new Howl({ src: [src], volume: entry.volume, preload: true })),
          next: createVariantPicker(entry.variants.length),
          cooldown: entry.cooldown ?? 0,
          lastAt: -Infinity,
        });
      }
      if (!hidden) fadeAmbienceIn();
    } catch (error) {
      console.warn('[sound] audio unavailable, continuing silently.', error);
    }
  }

  return {
    get unlocked() {
      return unlocking !== null;
    },

    /** Call from the first user gesture: browsers block audio before it. */
    unlock() {
      unlocking ??= createHowls();
      return unlocking;
    },

    play(action) {
      const effect = effects.get(action);
      if (!effect || hidden) return;
      const t = now();
      if (effect.cooldown && t - effect.lastAt < effect.cooldown) return;
      effect.lastAt = t;
      effect.howls[effect.next()].play();
    },

    setMuted(value) {
      muted = Boolean(value);
      howlerApi?.mute(muted);
    },

    /** Master volume (0..1); per-sound volumes and fade targets stay as they are. */
    setVolume(value) {
      volume = clampVolume(value);
      howlerApi?.volume(volume);
    },

    setHidden(value) {
      hidden = Boolean(value);
      if (!ambience) return;
      if (hidden) ambience.fade(ambience.volume(), 0, 400);
      else fadeAmbienceIn();
    },

    dispose() {
      ambience?.unload?.();
      for (const effect of effects.values()) effect.howls.forEach((howl) => howl.unload?.());
      effects.clear();
      ambience = null;
    },
  };
}
