import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  CAMERA_STATES,
  BUBBLE_ROW,
  ISLAND_FOCUS,
  getCameraState,
  cameraPlanForStep,
  lerpCameraState,
  overworldRowDistance,
} from '../app/scene/cameraStates.js';
import { layoutFor } from '../app/scene/carousel.js';
import { STEPS } from '../app/stores/ui.js';

describe('camera states', () => {
  it('defines the Projet Bulles named states with their positions', () => {
    expect(CAMERA_STATES.INTRO_HOME.position).toEqual([0, 3.5, 5.5]);
    expect(CAMERA_STATES.HOME.position).toEqual([0, 3.5, 4]);
    expect(CAMERA_STATES.SKY.position).toEqual([0, 15, 15]);
    expect(CAMERA_STATES.OVERWORLD.position).toEqual([0, 5, 10]);
  });

  it('gives every state a lookAt target', () => {
    for (const state of Object.values(CAMERA_STATES)) {
      expect(state.target).toHaveLength(3);
      expect(state.target.every(Number.isFinite)).toBe(true);
    }
  });

  it('returns copies so callers cannot mutate the table', () => {
    const home = getCameraState('HOME');
    home.position[0] = 99;
    expect(CAMERA_STATES.HOME.position[0]).toBe(0);
  });

  it('throws on unknown state names', () => {
    expect(() => getCameraState('NOPE')).toThrow(/unknown camera state/i);
  });

  it('maps every ui step to a camera plan', () => {
    for (const step of STEPS) {
      const plan = cameraPlanForStep(step);
      expect(['tween', 'path']).toContain(plan.mode);
      expect(CAMERA_STATES[plan.state]).toBeDefined();
    }
  });

  it('maps home to HOME, intro to a path flight ending at OVERWORLD', () => {
    expect(cameraPlanForStep('home')).toEqual({ mode: 'tween', state: 'HOME' });
    expect(cameraPlanForStep('intro')).toEqual({ mode: 'path', state: 'OVERWORLD' });
    expect(cameraPlanForStep('overworld')).toEqual({ mode: 'tween', state: 'OVERWORLD' });
  });

  it('maps bubble to a state that leans into the bubble row', () => {
    const plan = cameraPlanForStep('bubble');
    expect(plan.mode).toBe('tween');
    const zoomed = getCameraState(plan.state);
    const overworld = getCameraState('OVERWORLD');
    expect(zoomed.target).toEqual(BUBBLE_ROW);
    expect(zoomed.position).toEqual([BUBBLE_ROW[0], BUBBLE_ROW[1], BUBBLE_ROW[2] + 3.2]);
    expect(zoomed.position[2]).toBeLessThan(overworld.position[2]);
  });

  it('falls back to HOME for unknown steps', () => {
    expect(cameraPlanForStep('whatever')).toEqual({ mode: 'tween', state: 'HOME' });
  });

  it('interpolates position and target linearly', () => {
    const a = { position: [0, 0, 0], target: [0, 0, 0] };
    const b = { position: [10, 20, -10], target: [2, 4, 6] };
    expect(lerpCameraState(a, b, 0.5)).toEqual({ position: [5, 10, -5], target: [1, 2, 3] });
    expect(lerpCameraState(a, b, 0)).toEqual(a);
    expect(lerpCameraState(a, b, 1)).toEqual(b);
  });
});

// Projects a world point with the camera a state describes (fov 45, like Experience.js).
function project(state, aspect, point) {
  const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
  camera.position.set(...state.position);
  camera.lookAt(...state.target);
  camera.updateMatrixWorld();
  const v = new THREE.Vector3(...point).project(camera);
  return { x: v.x, y: v.y };
}

describe('OVERWORLD composition', () => {
  const CANOPY = [ISLAND_FOCUS[0] + 0.3, ISLAND_FOCUS[1] + 1.2, ISLAND_FOCUS[2]];
  const ROCK_TIP = [ISLAND_FOCUS[0], ISLAND_FOCUS[1] - 2.25, ISLAND_FOCUS[2]];
  const ISLAND_EDGE = [ISLAND_FOCUS[0] + 1.7, ISLAND_FOCUS[1], ISLAND_FOCUS[2]];
  const viewports = { desktop: 1440 / 900, phone: 390 / 844 };

  it('puts the bubble row between the camera and the island', () => {
    const state = getCameraState('OVERWORLD');
    expect(BUBBLE_ROW[2]).toBeGreaterThan(ISLAND_FOCUS[2]);
    expect(BUBBLE_ROW[2]).toBeLessThan(state.position[2]);
  });

  it('pulls the camera back on portrait screens so the island still fits', () => {
    const wide = getCameraState('OVERWORLD', viewports.desktop);
    const tall = getCameraState('OVERWORLD', viewports.phone);
    expect(wide).toEqual(getCameraState('OVERWORLD'));
    expect(tall.position[2]).toBeGreaterThan(wide.position[2]);
    expect(overworldRowDistance(viewports.phone)).toBeGreaterThan(overworldRowDistance(viewports.desktop));
  });

  it('measures the camera distance to the bubble row', () => {
    const { position } = getCameraState('OVERWORLD', viewports.desktop);
    const expected = Math.hypot(position[1] - BUBBLE_ROW[1], position[2] - BUBBLE_ROW[2]);
    expect(overworldRowDistance(viewports.desktop)).toBeCloseTo(expected, 9);
  });

  for (const [name, aspect] of Object.entries(viewports)) {
    it(`${name}: bubbles in the upper middle, tree centered below them, island on screen`, () => {
      const state = getCameraState('OVERWORLD', aspect);
      const { radius } = layoutFor(aspect, { distance: overworldRowDistance(aspect) });
      const row = project(state, aspect, BUBBLE_ROW);
      const rowTop = project(state, aspect, [BUBBLE_ROW[0], BUBBLE_ROW[1] + radius, BUBBLE_ROW[2]]);
      const rowBottom = project(state, aspect, [BUBBLE_ROW[0], BUBBLE_ROW[1] - radius, BUBBLE_ROW[2]]);
      const canopy = project(state, aspect, CANOPY);
      const tip = project(state, aspect, ROCK_TIP);
      const edge = project(state, aspect, ISLAND_EDGE);

      // Row: upper middle, clear of the overworld heading.
      expect(row.y).toBeGreaterThan(0.15);
      expect(rowTop.y).toBeLessThan(0.55);
      // Tree: horizontally centered, under the bubble row.
      expect(Math.abs(canopy.x)).toBeLessThan(0.2);
      expect(canopy.y).toBeLessThan(rowBottom.y);
      expect(canopy.y).toBeGreaterThan(-0.3);
      // Whole island above the practical-info bar and inside the screen width.
      expect(tip.y).toBeGreaterThan(-0.88);
      expect(edge.x).toBeLessThan(0.85);
    });
  }
});

