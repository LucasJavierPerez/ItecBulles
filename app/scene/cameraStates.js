// Named camera states, mirroring Projet Bulles (INTRO_HOME, HOME, SKY, OVERWORLD).
// Pure data + helpers: no three.js import, so the choreography is unit-testable.
// Vectors are plain [x, y, z] arrays; the three.js layer copies them into Vector3.

// Where the floating island sits; HOME frames it, the intro circles it.
export const ISLAND_FOCUS = [0, 3, -1];

export const CAMERA_STATES = Object.freeze({
  INTRO_HOME: { position: [0, 3.5, 5.5], target: [...ISLAND_FOCUS] },
  HOME: { position: [0, 3.5, 4], target: [...ISLAND_FOCUS] },
  SKY: { position: [0, 15, 15], target: [0, 0, 0] },
  OVERWORLD: { position: [0, 0.35, 5], target: [0, 0.35, 0] },
  // OVERWORLD pushed forward: the camera leans into the bubble that was opened.
  BUBBLE: { position: [0, 0.35, 3.2], target: [0, 0.35, 0] },
});

const STEP_PLANS = {
  home: { mode: 'tween', state: 'HOME' },
  intro: { mode: 'path', state: 'OVERWORLD' },
  overworld: { mode: 'tween', state: 'OVERWORLD' },
  bubble: { mode: 'tween', state: 'BUBBLE' },
};

// Must match the PerspectiveCamera in Experience.js.
const FOV_DEGREES = 45;

// Where the opened bubble (centered at the BUBBLE target: x = 0, row height y = 0.35) should land on screen in BUBBLE
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

// Without an aspect every state is the plain table entry; with one, BUBBLE is
// framed for that viewport.
export function getCameraState(name, aspect) {
  const state = CAMERA_STATES[name];
  if (!state) throw new Error(`Unknown camera state: ${name}`);
  if (name === 'BUBBLE' && Number.isFinite(aspect) && aspect > 0) return framedBubbleState(aspect);
  return { position: [...state.position], target: [...state.target] };
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
