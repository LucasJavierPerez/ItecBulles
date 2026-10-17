// Intro camera flight: HOME -> up into the sky -> over and around the floating
// island -> down to OVERWORLD. Bulles loads this curve from introPath.glb; here it
// is a uniform Catmull-Rom spline through hand-placed points (no asset to load).
import { CAMERA_STATES, ISLAND_FOCUS, getCameraState } from './cameraStates.js';

export const INTRO_DURATION = 5; // seconds

export const INTRO_POINTS = Object.freeze([
  CAMERA_STATES.HOME.position,
  [2.5, 7.5, 5],
  [4, 9, -2],
  [-1.5, 8, -5],
  [-4.5, 6, 1],
  [-2.5, 5.5, 7],
  CAMERA_STATES.OVERWORLD.position,
]);

// Same flight, starting at the HOME state and ending at the OVERWORLD state framed
// for this viewport aspect, so the intro never jumps at either end.
export function introPointsFor(aspect) {
  return [
    getCameraState('HOME', aspect).position,
    ...INTRO_POINTS.slice(1, -1),
    getCameraState('OVERWORLD', aspect).position,
  ];
}

const clamp01 = (t) => Math.min(1, Math.max(0, t));

export function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return p1.map(
    (_, i) =>
      0.5 *
      (2 * p1[i] +
        (-p0[i] + p2[i]) * t +
        (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 +
        (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3),
  );
}

// Position on the curve for t in [0, 1]; the ends are clamped by repeating them.
export function pointAt(t, points = INTRO_POINTS) {
  const u = clamp01(t);
  const segments = points.length - 1;
  if (u === 1) return [...points[segments]];
  const scaled = u * segments;
  const i = Math.floor(scaled);
  const local = scaled - i;
  const p = (k) => points[Math.min(segments, Math.max(0, k))];
  return catmullRom(p(i - 1), p(i), p(i + 1), p(i + 2), local);
}

const smoothstep = (edge0, edge1, x) => {
  const k = clamp01((x - edge0) / (edge1 - edge0));
  return k * k * (3 - 2 * k);
};

// Start on the HOME target (sky above the island), turn to the island early, look at
// it for most of the flight, then settle on the OVERWORLD target (both framed for
// `aspect` when given).
export function targetAt(t, aspect) {
  const u = clamp01(t);
  const start = getCameraState('HOME', aspect).target;
  const toIsland = smoothstep(0, 0.3, u);
  const toEnd = smoothstep(0.55, 1, u);
  const end = getCameraState('OVERWORLD', aspect).target;
  return ISLAND_FOCUS.map((v, i) => {
    const look = start[i] + (v - start[i]) * toIsland;
    return look + (end[i] - look) * toEnd;
  });
}
