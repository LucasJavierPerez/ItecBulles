// Tiny event bus between the three.js scene and the rest of the app (detail view,
// sound). Mirrors the event-driven bridge of Projet Bulles (SHOW_BUBBLE, ...).
//
//   scene:ready        { experience }       scene mounted and warmed up
//   bubble:hover       { id }               pointer entered a bubble (id null on leave)
//   bubble:click       { id }               a bubble was chosen (before the transition)
//   transition:start   { id, kind }         full-screen ripple started ('enter')
//   transition:end     { id, kind }         ripple finished, detail view visible
export const SCENE_EVENTS = Object.freeze({
  READY: 'scene:ready',
  BUBBLE_HOVER: 'bubble:hover',
  BUBBLE_CLICK: 'bubble:click',
  TRANSITION_START: 'transition:start',
  TRANSITION_END: 'transition:end',
});

export function createEmitter() {
  const listeners = new Map();
  return {
    on(name, fn) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(fn);
      return () => listeners.get(name)?.delete(fn);
    },
    emit(name, payload) {
      for (const fn of listeners.get(name) ?? []) {
        try {
          fn(payload);
        } catch (error) {
          console.warn(`[scene] listener for ${name} failed`, error);
        }
      }
    },
    clear() {
      listeners.clear();
    },
  };
}

// App-wide singleton (client only).
export const sceneEvents = createEmitter();
