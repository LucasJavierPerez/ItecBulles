// Mouse parallax with the Projet Bulles constants (strength .85, smoothing .04).
// The smoothing is a per-frame lerp at 60 fps; it is rescaled by the real frame
// delta so the motion feels the same on 60 Hz and 120 Hz screens.
export const PARALLAX = Object.freeze({ strength: 0.85, smoothing: 0.04 });

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Viewport pixels -> [-1, 1] on both axes, y pointing up.
export function normalizePointer(clientX, clientY, width, height) {
  return {
    x: clamp((clientX / width) * 2 - 1, -1, 1),
    y: clamp(1 - (clientY / height) * 2, -1, 1),
  };
}

export function createParallax({ strength = PARALLAX.strength, smoothing = PARALLAX.smoothing } = {}) {
  const target = { x: 0, y: 0 };
  const offset = { x: 0, y: 0 };

  return {
    target,
    offset,

    setPointer(clientX, clientY, width, height) {
      const p = normalizePointer(clientX, clientY, width, height);
      target.x = p.x * strength;
      target.y = p.y * strength;
    },

    update(delta = 1 / 60) {
      const factor = 1 - (1 - smoothing) ** (delta * 60);
      offset.x += (target.x - offset.x) * factor;
      offset.y += (target.y - offset.y) * factor;
    },

    reset() {
      target.x = target.y = offset.x = offset.y = 0;
    },
  };
}
