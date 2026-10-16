// Visitor preferences persisted in localStorage. Storage can be missing or throw
// (private mode, blocked site data): every access is guarded and falls back to
// "no preference".
export const REDUCED_MOTION_STORAGE_KEY = 'itec-bulles:reduced-motion';

const browserStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

/** true / false when the visitor chose with the toggle, null otherwise. */
export function loadReducedMotionPreference(storage = browserStorage()) {
  try {
    const raw = storage?.getItem(REDUCED_MOTION_STORAGE_KEY);
    if (raw === '1') return true;
    if (raw === '0') return false;
    return null;
  } catch {
    return null;
  }
}

export function saveReducedMotionPreference(value, storage = browserStorage()) {
  try {
    storage?.setItem(REDUCED_MOTION_STORAGE_KEY, value ? '1' : '0');
  } catch {
    // Not persisted: the system setting applies again next visit.
  }
}
