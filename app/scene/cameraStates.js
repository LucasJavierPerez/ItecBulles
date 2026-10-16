// Named camera states, mirroring Projet Bulles (INTRO_HOME, HOME, SKY, OVERWORLD).
// Pure data + helpers: no three.js import, so the choreography is unit-testable.
// Vectors are plain [x, y, z] arrays; the three.js layer copies them into Vector3.

// Where the floating island sits; HOME frames it, the intro circles it.
export const ISLAND_FOCUS = [0, 3, -1];

// Center of the bubble row (BubbleField group position): in front of the island and a
// bit above its tree, so in OVERWORLD the bubbles float in the upper middle of the
// screen with the island and tree centered below and behind them.
export const BUBBLE_ROW = Object.freeze([0, 5.6, 2.5]);

// How far BUBBLE sits in front of the opened bubble.
const BUBBLE_DISTANCE = 3.2;

export const CAMERA_STATES = Object.freeze({
  INTRO_HOME: { position: [0, 3.5, 5.5], target: [...ISLAND_FOCUS] },
  HOME: { position: [0, 3.5, 4], target: [...ISLAND_FOCUS] },
  SKY: { position: [0, 15, 15], target: [0, 0, 0] },
  // Wide screens: high and far enough to keep the whole island in view, looking down
  // slightly past the bubble row at the island.
  OVERWORLD: { position: [0, 5, 10], target: [0, 4.5, ISLAND_FOCUS[2]] },
  // The camera leans into the bubble that was opened (framed per viewport below).
  BUBBLE: {
    position: [BUBBLE_ROW[0], BUBBLE_ROW[1], BUBBLE_ROW[2] + BUBBLE_DISTANCE],
    target: [...BUBBLE_ROW],
  },
});

// Portrait screens are narrow: pull back so the island still fits across.
const OVERWORLD_PORTRAIT = Object.freeze({ position: [0, 5.5, 12], target: [0, 4.75, ISLAND_FOCUS[2]] });

const STEP_PLANS = {
  home: { mode: 'tween', state: 'HOME' },
  intro: { mode: 'path', state: 'OVERWORLD' },
  overworld: { mode: 'tween', state: 'OVERWORLD' },
  bubble: { mode: 'tween', state: 'BUBBLE' },
};

// Must match the PerspectiveCamera in Experience.js.
const FOV_DEGREES = 45;

// Where the opened bubble (centered at the BUBBLE target, the BUBBLE_ROW center) should land on screen in BUBBLE
// mode, in normalized device coordinates (-1..1, y up): on the right half on wide
// screens, so the detail text gets its own column on the left; in the upper part
// on portrait screens, with the text below it.
export function bubbleScreenAnchor(aspect) {
  return aspect >= 1 ? { x: 0.5, y: 0 } : { x: 0, y: 0.4 };
}

// BUBBLE framing for a viewport aspect: shift camera and target together so the
// bubble at the table target projects onto bubbleScreenAnchor(aspect).
function framedBubbleState(aspect) {
  const { position, target } = CAMERA_STATES.BUBBLE;
  const distance = position[2] - target[2];
  const halfHeight = distance * Math.tan(((FOV_DEGREES / 2) * Math.PI) / 180);
  const anchor = bubbleScreenAnchor(aspect);
  const x = target[0] - anchor.x * halfHeight * aspect;
  const y = target[1] - anchor.y * halfHeight;
  return { position: [x, y, position[2]], target: [x, y, target[2]] };
}

const copyState = ({ position, target }) => ({ position: [...position], target: [...target] });

// Without an aspect every state is the plain table entry; with one, BUBBLE is
// framed for that viewport and OVERWORLD pulls back on portrait screens.
export function getCameraState(name, aspect) {
  const state = CAMERA_STATES[name];
  if (!state) throw new Error(`Unknown camera state: ${name}`);
  const hasAspect = Number.isFinite(aspect) && aspect > 0;
  if (name === 'BUBBLE' && hasAspect) return framedBubbleState(aspect);
  if (name === 'OVERWORLD' && hasAspect && aspect < 1) return copyState(OVERWORLD_PORTRAIT);
  return copyState(state);
}

// Camera-to-row distance in OVERWORLD; the carousel sizes its spacing from it.
export function overworldRowDistance(aspect) {
  const { position } = getCameraState('OVERWORLD', aspect);
  return Math.hypot(position[0] - BUBBLE_ROW[0], position[1] - BUBBLE_ROW[1], position[2] - BUBBLE_ROW[2]);
}

// How the camera reaches the state that belongs to a ui step:
// 'tween' eases straight to the state, 'path' flies the intro curve that ends there.
export function cameraPlanForStep(step) {
  return { ...(STEP_PLANS[step] ?? STEP_PLANS.home) };
}

const lerp = (a, b, t) => a + (b - a) * t;
const lerpVec = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

export function lerpCameraState(from, to, t) {
  return {
    position: lerpVec(from.position, to.position, t),
    target: lerpVec(from.target, to.target, t),
  };
}
