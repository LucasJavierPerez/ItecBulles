import * as THREE from 'three';

// Projet Bulles bubble colors (docs/referencia/bulles-teardown.md).
export const BUBBLE_COLORS = [0xffd333, 0x8c00ff, 0xff94b6, 0xff0090];

// Raw sRGB components for shaders that write sRGB without conversion.
export function srgbVector(hex) {
  const c = new THREE.Color();
  c.setHex(hex, THREE.SRGBColorSpace);
  const out = { r: 0, g: 0, b: 0 };
  c.getRGB(out, THREE.SRGBColorSpace);
  return new THREE.Vector3(out.r, out.g, out.b);
}

export function paletteUniforms() {
  const [c0, c1, c2, c3] = BUBBLE_COLORS.map(srgbVector);
  return { uC0: { value: c0 }, uC1: { value: c1 }, uC2: { value: c2 }, uC3: { value: c3 } };
}
