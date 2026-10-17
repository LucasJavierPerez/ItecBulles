import { describe, it, expect } from 'vitest';
import { islandRotationFor, approachAngle } from '../app/scene/islandTurn.js';

describe('islandRotationFor', () => {
  it('is zero before browsing', () => {
    expect(islandRotationFor(0, 11)).toBeCloseTo(0, 12);
  });

  it('turns the island one full revolution per full carousel loop', () => {
    expect(islandRotationFor(11, 11)).toBeCloseTo(-2 * Math.PI, 9);
    expect(islandRotationFor(-11, 11)).toBeCloseTo(2 * Math.PI, 9);
  });

  it('turns one bubble slot per carousel step', () => {
    expect(islandRotationFor(1, 11)).toBeCloseTo((-2 * Math.PI) / 11, 9);
    expect(islandRotationFor(2.5, 10)).toBeCloseTo((-2 * Math.PI * 2.5) / 10, 9);
  });

  it('turns the same way the front bubbles slide, so they seem to orbit the tree', () => {
    // Positive carousel position = bubbles slide left = clockwise seen from above (negative Y).
    expect(islandRotationFor(0.3, 11)).toBeLessThan(0);
    expect(islandRotationFor(-0.3, 11)).toBeGreaterThan(0);
  });

  it('keeps turning past one loop instead of jumping back', () => {
    const a = islandRotationFor(10.9, 11);
    const b = islandRotationFor(11.1, 11);
    expect(Math.abs(b - a)).toBeLessThan(0.2);
  });

  it('returns 0 for an empty carousel', () => {
    expect(islandRotationFor(3, 0)).toBe(0);
  });
});

describe('approachAngle', () => {
  it('moves part of the way towards the target', () => {
    const next = approachAngle(0, 1, 1 / 60);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
  });

  it('is frame-rate independent', () => {
    const one = approachAngle(0, 1, 1 / 30);
    const two = approachAngle(approachAngle(0, 1, 1 / 60), 1, 1 / 60);
    expect(two).toBeCloseTo(one, 9);
  });

  it('settles on the target after a while', () => {
    let angle = 0;
    for (let i = 0; i < 300; i += 1) angle = approachAngle(angle, -2, 1 / 60);
    expect(angle).toBeCloseTo(-2, 4);
  });

  it('stays put when already on the target', () => {
    expect(approachAngle(0.5, 0.5, 1 / 60)).toBe(0.5);
  });
});
