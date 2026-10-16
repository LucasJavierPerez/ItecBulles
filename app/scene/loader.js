// Loader state with a timeout fallback. Projet Bulles' loader waits forever when
// requestAnimationFrame never fires (e.g. a hidden tab); here a plain timer forces
// "ready" after LOADER_TIMEOUT so the experience is always reachable.
export const LOADER_TIMEOUT = 8000;

export function createLoader({ timeout = LOADER_TIMEOUT, onChange = () => {} } = {}) {
  let timer = null;

  const clearTimer = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const loader = {
    status: 'loading',
    progress: 0,
    reason: null,

    start() {
      if (loader.status !== 'loading' || timer !== null) return;
      timer = setTimeout(() => finish('timeout'), timeout);
    },

    setProgress(value) {
      if (loader.status !== 'loading') return;
      const next = Math.min(1, Math.max(0, Number(value) || 0));
      if (next <= loader.progress) return;
      loader.progress = next;
      emit();
    },

    done() {
      finish('loaded');
    },

    dispose() {
      clearTimer();
    },
  };

  function emit() {
    onChange({ status: loader.status, progress: loader.progress, reason: loader.reason });
  }

  function finish(reason) {
    if (loader.status !== 'loading') return;
    clearTimer();
    loader.status = 'ready';
    loader.progress = 1;
    loader.reason = reason;
    emit();
  }

  return loader;
}
