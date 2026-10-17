// Named camera states, mirroring Projet Bulles (INTRO_HOME, HOME, SKY, OVERWORLD).
// Pure data + helpers: no three.js import, so the choreography is unit-testable.
// Vectors are plain [x, y, z] arrays; the three.js layer copies them into Vector3.

// Where the floating island sits; HOME frames it, the intro circles it.
export const ISLAND_FOCUS = [0, 3, -1];

// Center of the bubble row (BubbleField group position): in front of the island and a
// bit above its tree, so in OVERWORLD the bubbles float in the upper middle of the
// screen with the island and tree centered below and behind them.
export const BUBBLE_ROW = Object.freeze([0, 5.6, 2.5]);

// The overworld title pill hangs this many bubble radii below the focused bubble's
// center (BubbleField.getLabel); the OVERWORLD framing keeps it clear of the roof.
export const BUBBLE_LABEL_OFFSET = 1.25;

// How far BUBBLE sits in front of the opened bubble.
const BUBBLE_DISTANCE = 3.2;

export const CAMERA_STATES = Object.freeze({
  // Home (wide screens): the camera looks at the sky above the island, so the iTec
  // building sits low in the frame, under the hero copy and above the practical-info
  // drawer; the text keeps calm sky behind it. INTRO_HOME starts a bit further back
  // with the building lower and eases up into HOME.
  INTRO_HOME: { position: [0, 4, 12], target: [0, 6.4, ISLAND_FOCUS[2]] },
  HOME: { position: [0, 4, 11], target: [0, 6.1, ISLAND_FOCUS[2]] },
  SKY: { position: [0, 15, 15], target: [0, 0, 0] },
  // Wide screens: far enough to keep the whole island in view and a bit below the
  // bubble row, so the focused bubble's title pill clears the building roof.
  OVERWORLD: { position: [0, 4.4, 10], target: [0, 4.6, ISLAND_FOCUS[2]] },
  // The camera leans into the bubble that was opened (framed per viewport below).
  BUBBLE: {
    position: [BUBBLE_ROW[0], BUBBLE_ROW[1], BUBBLE_ROW[2] + BUBBLE_DISTANCE],
    target: [...BUBBLE_ROW],
  },
});

// Portrait screens are narrow: pull back so the island still fits across, and sit
// lower than the row so the title pill stays above the roof.
const OVERWORLD_PORTRAIT = Object.freeze({ position: [0, 4.3, 12], target: [0, 5.15, ISLAND_FOCUS[2]] });

// Portrait home: the hero copy wraps into a taller block, so the building goes lower.
const HOME_PORTRAIT = Object.freeze({ position: [0, 4.3, 11], target: [0, 7, ISLAND_FOCUS[2]] });
const INTRO_HOME_PORTRAIT = Object.freeze({ position: [0, 4.3, 12], target: [0, 7.3, ISLAND_FOCUS[2]] });

// States that have their own framing on portrait screens (aspect < 1).
const PORTRAIT_STATES = Object.freeze({
  OVERWORLD: OVERWORLD_PORTRAIT,
  HOME: HOME_PORTRAIT,
  INTRO_HOME: INTRO_HOME_PORTRAIT,
});

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
// framed for that viewport and OVERWORLD / HOME / INTRO_HOME switch to their
// portrait framing on portrait screens.
export function getCameraState(name, aspect) {
  const state = CAMERA_STATES[name];
  if (!state) throw new Error(`Unknown camera state: ${name}`);
  const hasAspect = Number.isFinite(aspect) && aspect > 0;
  if (name === 'BUBBLE' && hasAspect) return framedBubbleState(aspect);
  if (hasAspect && aspect < 1 && PORTRAIT_STATES[name]) return copyState(PORTRAIT_STATES[name]);
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
