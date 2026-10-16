// Bridges the ui store and the scene events bus to the sound manager.
// Returns a disposer that removes every listener and watcher.
import { watch } from 'vue';
import { soundForSceneEvent, soundForBubbleChange } from './soundManager.js';
import { SCENE_EVENTS } from '../scene/events.js';

const GESTURES = ['pointerdown', 'keydown', 'touchstart'];

export function connectSound({ ui, events, manager, doc = document }) {
  const offs = [];

  // Browsers only allow audio after a user gesture: unlock (and only then fetch
  // howler and the files) on the first one.
  const onGesture = () => {
    GESTURES.forEach((name) => doc.removeEventListener(name, onGesture, true));
    manager.unlock();
  };
  GESTURES.forEach((name) => doc.addEventListener(name, onGesture, true));
  offs.push(() => GESTURES.forEach((name) => doc.removeEventListener(name, onGesture, true)));

  for (const name of [SCENE_EVENTS.BUBBLE_HOVER, SCENE_EVENTS.BUBBLE_CLICK, SCENE_EVENTS.TRANSITION_START]) {
    offs.push(
      events.on(name, (payload) => {
        const action = soundForSceneEvent(name, payload);
        if (action) manager.play(action);
      }),
    );
  }

  offs.push(
    watch(
      () => ui.activeBubbleId,
      (next, previous) => {
        const action = soundForBubbleChange(previous, next);
        if (action) manager.play(action);
      },
    ),
  );

  // Keyboard focus in the offers list moves the carousel: same blop as a hover.
  offs.push(
    watch(
      () => ui.focusedBubbleId,
      (id) => id && manager.play('hover'),
    ),
  );

  offs.push(watch(() => ui.muted, (muted) => manager.setMuted(muted), { immediate: true }));
  offs.push(watch(() => ui.volume, (volume) => manager.setVolume(volume), { immediate: true }));

  const onVisibility = () => manager.setHidden(doc.visibilityState === 'hidden');
  doc.addEventListener('visibilitychange', onVisibility);
  offs.push(() => doc.removeEventListener('visibilitychange', onVisibility));

  return () => {
    offs.splice(0).forEach((off) => off());
  };
}
