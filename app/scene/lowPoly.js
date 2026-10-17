// Small helpers shared by the island and its centerpieces: seeded randomness,
// crack-free vertex jitter, flat-shaded materials, canvas textures and disposal.
import * as THREE from 'three';

// Small seeded PRNG so procedural shapes look the same on every load.
export function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function jitter(geometry, amount, random) {
  const pos = geometry.attributes.position;
  // Move shared vertices together so flat shading stays crack-free.
  const moved = new Map();
  for (let i = 0; i < pos.count; i += 1) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    if (!moved.has(key)) {
      moved.set(key, [(random() - 0.5) * amount, (random() - 0.5) * amount, (random() - 0.5) * amount]);
    }
    const [dx, dy, dz] = moved.get(key);
    pos.setXYZ(i, pos.getX(i) + dx, pos.getY(i) + dy, pos.getZ(i) + dz);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export const flat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, ...extra });

// Paints a CanvasTexture, or returns null where 2D canvas is unavailable (jsdom in
// tests, very old browsers): callers then keep a plain color.
export function canvasTexture(width, height, draw) {
  if (typeof document === 'undefined') return null;
  // jsdom implements <canvas> without a 2D context and logs a noisy "not implemented".
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) return null;
  let ctx = null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    ctx = null;
  }
  if (!ctx) return null;
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// Frees every geometry, material and texture under `root`.
export function disposeObject3D(root) {
  const geometries = new Set();
  const materials = new Set();
  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) [].concat(object.material).forEach((m) => materials.add(m));
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => {
    Object.values(m).forEach((value) => value?.isTexture && value.dispose());
    m.dispose();
  });
}
