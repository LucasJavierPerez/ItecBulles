// Persists the one-time tutorials the visitor already dismissed. Storage can be
// missing or throw (private mode, blocked site data): every access is guarded and
// the experience simply shows the tutorial again in that case.
export const TUTORIALS_STORAGE_KEY = 'itec-bulles:tutorials';

const browserStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

export function loadCompletedTutorials(storage = browserStorage()) {
  try {
    const raw = storage?.getItem(TUTORIALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((name) => typeof name === 'string' && name.trim() !== '');
  } catch {
    return [];
  }
}

export function saveCompletedTutorials(names, storage = browserStorage()) {
  try {
    storage?.setItem(TUTORIALS_STORAGE_KEY, JSON.stringify(names));
  } catch {
    // Not persisted: the tutorial may show again next visit, which is harmless.
  }
}
