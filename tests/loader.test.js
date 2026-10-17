import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLoader, LOADER_TIMEOUT } from '../app/scene/loader.js';

describe('loader', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('defaults to an 8 s timeout', () => {
    expect(LOADER_TIMEOUT).toBe(8000);
  });

  it('starts loading with zero progress', () => {
    const loader = createLoader();
    expect(loader.status).toBe('loading');
    expect(loader.progress).toBe(0);
    expect(loader.reason).toBeNull();
  });

  it('becomes ready when done is called', () => {
    const onChange = vi.fn();
    const loader = createLoader({ onChange });
    loader.start();
    loader.done();
    expect(loader.status).toBe('ready');
    expect(loader.reason).toBe('loaded');
    expect(loader.progress).toBe(1);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'ready', reason: 'loaded' }),
    );
  });

  it('falls back to ready after the timeout', () => {
    const loader = createLoader({ timeout: 8000 });
    loader.start();
    vi.advanceTimersByTime(7999);
    expect(loader.status).toBe('loading');
    vi.advanceTimersByTime(1);
    expect(loader.status).toBe('ready');
    expect(loader.reason).toBe('timeout');
  });

  it('ignores done after the timeout already fired', () => {
    const onChange = vi.fn();
    const loader = createLoader({ timeout: 100, onChange });
    loader.start();
    vi.advanceTimersByTime(100);
    const calls = onChange.mock.calls.length;
    loader.done();
    expect(loader.reason).toBe('timeout');
    expect(onChange.mock.calls.length).toBe(calls);
  });

  it('clears the timer once done', () => {
    const loader = createLoader({ timeout: 100 });
    loader.start();
    loader.done();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clamps progress to [0, 1] and never goes backwards', () => {
    const loader = createLoader();
    loader.setProgress(0.5);
    loader.setProgress(0.2);
    expect(loader.progress).toBe(0.5);
    loader.setProgress(4);
    expect(loader.progress).toBe(1);
    expect(loader.status).toBe('loading');
  });

  it('dispose stops the timer without changing state', () => {
    const loader = createLoader({ timeout: 100 });
    loader.start();
    loader.dispose();
    vi.advanceTimersByTime(1000);
    expect(loader.status).toBe('loading');
  });
});
