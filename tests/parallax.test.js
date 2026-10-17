import { describe, it, expect } from 'vitest';
import { PARALLAX, createParallax, normalizePointer } from '../app/scene/parallax.js';

describe('parallax', () => {
  it('uses the Projet Bulles constants', () => {
    expect(PARALLAX.strength).toBe(0.85);
    expect(PARALLAX.smoothing).toBe(0.04);
  });

  it('normalizes pointer coordinates to [-1, 1] with y up', () => {
    expect(normalizePointer(0, 0, 200, 100)).toEqual({ x: -1, y: 1 });
    expect(normalizePointer(100, 50, 200, 100)).toEqual({ x: 0, y: 0 });
    expect(normalizePointer(200, 100, 200, 100)).toEqual({ x: 1, y: -1 });
  });

  it('clamps pointer positions outside the viewport', () => {
    expect(normalizePointer(-50, 500, 200, 100)).toEqual({ x: -1, y: -1 });
  });

  it('starts at rest', () => {
    expect(createParallax().offset).toEqual({ x: 0, y: 0 });
  });

  it('scales the target by strength', () => {
    const p = createParallax();
    p.setPointer(200, 50, 200, 100);
    expect(p.target).toEqual({ x: 0.85, y: 0 });
  });

  it('moves by the smoothing factor each 60 fps frame', () => {
    const p = createParallax();
    p.setPointer(200, 50, 200, 100);
    p.update(1 / 60);
    expect(p.offset.x).toBeCloseTo(0.85 * 0.04, 6);
    p.update(1 / 60);
    expect(p.offset.x).toBeCloseTo(0.85 * (1 - 0.96 ** 2), 6);
  });

  it('is frame-rate independent', () => {
    const fast = createParallax();
    const slow = createParallax();
    fast.setPointer(200, 0, 200, 100);
    slow.setPointer(200, 0, 200, 100);
    fast.update(1 / 120);
    fast.update(1 / 120);
    slow.update(1 / 60);
    expect(fast.offset.x).toBeCloseTo(slow.offset.x, 6);
    expect(fast.offset.y).toBeCloseTo(slow.offset.y, 6);
  });

  it('converges to the target', () => {
    const p = createParallax();
    p.setPointer(0, 100, 200, 100);
    for (let i = 0; i < 600; i += 1) p.update(1 / 60);
    expect(p.offset.x).toBeCloseTo(-0.85, 3);
    expect(p.offset.y).toBeCloseTo(-0.85, 3);
  });

  it('reset returns to rest', () => {
    const p = createParallax();
    p.setPointer(0, 0, 200, 100);
    p.update(1 / 60);
    p.reset();
    expect(p.offset).toEqual({ x: 0, y: 0 });
    expect(p.target).toEqual({ x: 0, y: 0 });
  });
});
