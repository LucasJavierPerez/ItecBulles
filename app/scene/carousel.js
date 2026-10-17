// Infinite horizontal bubble carousel, replicating the hand-written inertia of
// Projet Bulles: drag and wheel add velocity, friction .92 per 60 fps frame, max
// speed .4, and an arc that bends the bubbles away at the screen edges.
// Pure logic (no three.js): the scene layer reads `itemTransform(i)` every frame.
//
// Units: `offset`, `velocity` and `spacing` are world units; velocity is per 60 fps
// frame. Item i sits at x = wrap(i - offset / spacing) * spacing.

export const CAROUSEL = Object.freeze({
  friction: 0.92,
  maxSpeed: 0.4,
  // z = -arcDepth * x^2 and rotationY = -arcRotation * x.
  arcDepth: 0.09,
  arcRotation: 0.15,
  // Pointer pixels -> velocity, wheel delta -> velocity.
  dragFactor: 0.0012,
  wheelFactor: 0.0006,
  // Below this many pixels of total movement a pointer gesture is a click.
  clickThreshold: 6,
  // Snapping kicks in under this speed and eases by this fraction per frame.
  snapThreshold: 0.004,
  snapStrength: 0.12,
});

/** Wraps a relative item index into [-count / 2, count / 2). */
export function wrapRelative(value, count) {
  const half = count / 2;
  return ((((value + half) % count) + count) % count) - half;
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * Spacing and bubble radius for a viewport aspect ratio, so ~4-5 bubbles fit on a
 * desktop screen and ~2-3 on a phone (fov 45; `distance` = camera to bubble row, BubbleField
 * passes overworldRowDistance(aspect); the spacing clamp can show a few more on wide screens).
 */
export function layoutFor(aspect, { fov = 45, distance = 5 } = {}) {
  const halfWidth = distance * Math.tan(((fov / 2) * Math.PI) / 180) * aspect;
  const visible = aspect >= 1 ? 4.5 : 2.3;
  const spacing = clamp((2 * halfWidth) / visible, 0.7, 1.8);
  const radius = Math.min(0.55, spacing * 0.36);
  return { spacing, radius };
}

export function createCarousel(options = {}) {
  const cfg = { ...CAROUSEL, spacing: 1, snap: true, ...options };
  const { count } = cfg;
  const decay = (frames) => Math.pow(cfg.friction, frames);

  let pointerStart = null;
  let lastX = 0;
  let moved = 0;
  let target = null;

  const carousel = {
    offset: 0,
    velocity: 0,
    spacing: cfg.spacing,
    dragging: false,

    setSpacing(spacing) {
      const ratio = spacing / carousel.spacing;
      carousel.offset *= ratio;
      carousel.velocity *= ratio;
      if (target !== null) target *= ratio;
      carousel.spacing = spacing;
    },

    addVelocity(amount) {
      target = null;
      carousel.velocity = clamp(carousel.velocity + amount, -cfg.maxSpeed, cfg.maxSpeed);
    },

    wheel(delta) {
      carousel.addVelocity(delta * cfg.wheelFactor);
    },

    pointerDown(x) {
      pointerStart = x;
      lastX = x;
      moved = 0;
      // Grabbing stops the carousel, like catching a sliding card.
      carousel.velocity = 0;
      target = null;
    },

    pointerMove(x) {
      if (pointerStart === null) return;
      const dx = x - lastX;
      lastX = x;
      moved += Math.abs(dx);
      if (moved >= cfg.clickThreshold) carousel.dragging = true;
      carousel.addVelocity(-dx * cfg.dragFactor);
    },

    pointerUp(x = lastX) {
      if (pointerStart === null) return { click: false };
      carousel.pointerMove(x);
      const click = moved < cfg.clickThreshold;
      pointerStart = null;
      carousel.dragging = false;
      return { click };
    },

    snapNearest() {
      carousel.velocity = 0;
      target = Math.round(carousel.offset / carousel.spacing) * carousel.spacing;
    },

    // Glides to item i along the shortest way around the loop.
    focusIndex(index) {
      const current = carousel.offset / carousel.spacing;
      const k = index + count * Math.round((current - index) / count);
      carousel.velocity = 0;
      target = k * carousel.spacing;
    },

    focusedIndex() {
      const nearest = Math.round(carousel.offset / carousel.spacing);
      return ((nearest % count) + count) % count;
    },

    update(delta) {
      const frames = delta * 60;
      const v = carousel.velocity;
      if (v !== 0) {
        // Exact sum of a geometric decay over `frames`, so 30 and 60 fps agree.
        carousel.offset += (v * (1 - decay(frames))) / (1 - cfg.friction);
        carousel.velocity = v * decay(frames);
      }

      const slow = Math.abs(carousel.velocity) < cfg.snapThreshold;
      if (cfg.snap && target === null && slow && !carousel.dragging && pointerStart === null) {
        carousel.snapNearest();
      }
      if (target !== null) {
        const k = 1 - Math.pow(1 - cfg.snapStrength, frames);
        carousel.offset += (target - carousel.offset) * k;
        if (Math.abs(target - carousel.offset) < 1e-5) carousel.offset = target;
      }
    },

    itemTransform(index) {
      const rel = wrapRelative(index - carousel.offset / carousel.spacing, count);
      const x = rel * carousel.spacing;
      return { rel, x, z: -cfg.arcDepth * x * x, rotationY: -cfg.arcRotation * x };
    },
  };

  return carousel;
}
