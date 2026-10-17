// Renderer helpers kept free of three.js so they can be unit-tested.
const SMALL_SCREEN = 768;

// Clamp the device pixel ratio: 2 at most, 1.5 on small (phone) screens.
export function clampPixelRatio(devicePixelRatio, viewportWidth) {
  const max = viewportWidth < SMALL_SCREEN ? 1.5 : 2;
  return Math.min(devicePixelRatio || 1, max);
}

export function isWebGLAvailable(doc = globalThis.document) {
  try {
    const canvas = doc.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
