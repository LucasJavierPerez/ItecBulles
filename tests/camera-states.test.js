import { describe, it, expect } from 'vitest';
import {
  CAMERA_STATES,
  getCameraState,
  cameraPlanForStep,
  lerpCameraState,
} from '../app/scene/cameraStates.js';
import { STEPS } from '../app/stores/ui.js';

describe('camera states', () => {
  it('defines the Projet Bulles named states with their positions', () => {
    expect(CAMERA_STATES.INTRO_HOME.position).toEqual([0, 3.5, 5.5]);
    expect(CAMERA_STATES.HOME.position).toEqual([0, 3.5, 4]);
    expect(CAMERA_STATES.SKY.position).toEqual([0, 15, 15]);
    expect(CAMERA_STATES.OVERWORLD.position).toEqual([0, 0.35, 5]);
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

  it('maps bubble to a zoomed-in OVERWORLD state', () => {
    const plan = cameraPlanForStep('bubble');
    expect(plan.mode).toBe('tween');
    const zoomed = getCameraState(plan.state);
    const overworld = getCameraState('OVERWORLD');
    expect(zoomed.position[2]).toBeLessThan(overworld.position[2]);
    expect(zoomed.target).toEqual(overworld.target);
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
