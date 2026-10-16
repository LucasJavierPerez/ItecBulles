import { describe, it, expect, vi } from 'vitest';
import { createEmitter, SCENE_EVENTS } from '../app/scene/events.js';

describe('scene events', () => {
  it('names the bubble lifecycle events', () => {
    expect(SCENE_EVENTS).toMatchObject({
      READY: 'scene:ready',
      BUBBLE_HOVER: 'bubble:hover',
      BUBBLE_CLICK: 'bubble:click',
      TRANSITION_START: 'transition:start',
      TRANSITION_END: 'transition:end',
    });
  });

  it('delivers payloads to listeners until they unsubscribe', () => {
    const bus = createEmitter();
    const fn = vi.fn();
    const off = bus.on('bubble:hover', fn);
    bus.emit('bubble:hover', { id: 'a' });
    off();
    bus.emit('bubble:hover', { id: 'b' });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith({ id: 'a' });
  });

  it('keeps emitting when a listener throws', () => {
    const bus = createEmitter();
    const ok = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    bus.on('x', () => {
      throw new Error('boom');
    });
    bus.on('x', ok);
    bus.emit('x');
    expect(ok).toHaveBeenCalled();
    warn.mockRestore();
  });
});
