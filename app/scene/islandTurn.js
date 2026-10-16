// Island turn while browsing: the carousel position drives the island (and its tree)
// around its vertical axis, so the bubble row seems to orbit the tree.
// Pure math, no three.js import.

const TAU = Math.PI * 2;
// Exponential smoothing rate (1/s) for the visible angle: ~0.35 s to cover 2/3 of a jump.
const TURN_RATE = 3;

// `position` = carousel offset in bubble slots (offset / spacing); one full loop of the
// carousel turns the island once. Positive position = bubbles slide left = clockwise
// seen from above, which is a negative rotation around +Y.
export function islandRotationFor(position, count) {
  if (!count) return 0;
  return (-TAU * position) / count;
}

// Frame-rate independent ease of `current` towards `target` over `delta` seconds.
export function approachAngle(current, target, delta, rate = TURN_RATE) {
  if (current === target) return current;
  return target + (current - target) * Math.exp(-rate * delta);
}
