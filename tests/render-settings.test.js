import { describe, it, expect } from 'vitest';
import { clampPixelRatio, isWebGLAvailable } from '../app/scene/renderSettings.js';

describe('render settings', () => {
  it('caps the pixel ratio at 2 on large screens', () => {
    expect(clampPixelRatio(3, 1440)).toBe(2);
    expect(clampPixelRatio(1, 1440)).toBe(1);
  });

  it('caps the pixel ratio at 1.5 on small screens', () => {
    expect(clampPixelRatio(3, 390)).toBe(1.5);
  });

  it('treats missing ratios as 1', () => {
    expect(clampPixelRatio(undefined, 1440)).toBe(1);
  });

  it('detects WebGL through a canvas context', () => {
    const doc = (ctx) => ({ createElement: () => ({ getContext: (name) => ctx(name) }) });
    expect(isWebGLAvailable(doc((n) => (n === 'webgl2' ? {} : null)))).toBe(true);
    expect(isWebGLAvailable(doc((n) => (n === 'webgl' ? {} : null)))).toBe(true);
    expect(isWebGLAvailable(doc(() => null))).toBe(false);
    expect(isWebGLAvailable(doc(() => { throw new Error('blocked'); }))).toBe(false);
  });
});
