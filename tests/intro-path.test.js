import { describe, it, expect } from 'vitest';
import {
  INTRO_DURATION,
  INTRO_POINTS,
  catmullRom,
  introPointsFor,
  pointAt,
  targetAt,
} from '../app/scene/introPath.js';
import { CAMERA_STATES, getCameraState } from '../app/scene/cameraStates.js';

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe('intro path', () => {
  it('lasts about five seconds', () => {
    expect(INTRO_DURATION).toBeGreaterThanOrEqual(4);
    expect(INTRO_DURATION).toBeLessThanOrEqual(6);
  });

  it('starts at HOME and ends at OVERWORLD', () => {
    expect(pointAt(0)).toEqual(CAMERA_STATES.HOME.position);
    const end = pointAt(1);
    CAMERA_STATES.OVERWORLD.position.forEach((v, i) => expect(end[i]).toBeCloseTo(v, 9));
  });

  it('rises high above the island on the way', () => {
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => pointAt(i / 100)[1]));
    expect(peak).toBeGreaterThan(CAMERA_STATES.HOME.position[1] + 3);
  });

  it('passes through every control point', () => {
    const n = INTRO_POINTS.length - 1;
    INTRO_POINTS.forEach((p, i) => {
      const q = pointAt(i / n);
      p.forEach((v, k) => expect(q[k]).toBeCloseTo(v, 9));
    });
  });

  it('is continuous (no jumps between close samples)', () => {
    for (let i = 0; i < 500; i += 1) {
      expect(distance(pointAt(i / 500), pointAt((i + 1) / 500))).toBeLessThan(0.2);
    }
  });

  it('clamps t outside [0, 1]', () => {
    expect(pointAt(-1)).toEqual(pointAt(0));
    expect(pointAt(2)).toEqual(pointAt(1));
  });

  it('catmullRom returns the inner points at the segment ends', () => {
    const p0 = [0, 0, 0];
    const p1 = [1, 0, 0];
    const p2 = [2, 1, 0];
    const p3 = [3, 1, 0];
    expect(catmullRom(p0, p1, p2, p3, 0)).toEqual(p1);
    expect(catmullRom(p0, p1, p2, p3, 1)).toEqual(p2);
  });

  it('looks at HOME target at the start and OVERWORLD target at the end', () => {
    expect(targetAt(0)).toEqual(CAMERA_STATES.HOME.target);
    const end = targetAt(1);
    CAMERA_STATES.OVERWORLD.target.forEach((v, i) => expect(end[i]).toBeCloseTo(v, 9));
  });

  it('ends exactly at the aspect-framed OVERWORLD state (no jump on phones)', () => {
    for (const aspect of [1440 / 900, 390 / 844]) {
      const overworld = getCameraState('OVERWORLD', aspect);
      const end = pointAt(1, introPointsFor(aspect));
      overworld.position.forEach((v, i) => expect(end[i]).toBeCloseTo(v, 9));
      const look = targetAt(1, aspect);
      overworld.target.forEach((v, i) => expect(look[i]).toBeCloseTo(v, 9));
      expect(introPointsFor(aspect).slice(1, -1)).toEqual(INTRO_POINTS.slice(1, -1));
    }
  });

  it('starts exactly at the aspect-framed HOME state (no jump when the flight begins)', () => {
    for (const aspect of [1440 / 900, 390 / 844]) {
      const home = getCameraState('HOME', aspect);
      expect(pointAt(0, introPointsFor(aspect))).toEqual(home.position);
      targetAt(0, aspect).forEach((v, i) => expect(v).toBeCloseTo(home.target[i], 9));
    }
  });
});
