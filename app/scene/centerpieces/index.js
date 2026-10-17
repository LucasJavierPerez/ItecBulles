// Centerpiece prototypes for the middle of the island. Chosen with the URL query
// `?centro=arbol|edificio|circuitos|isotipo`; anything else falls back to the tree.
// Every module exports create() -> { object3D, update(elapsed, delta), dispose() },
// built in island-local space (grass top at y ≈ 0.12, inside a radius of ~1.6).
import { create as createTree } from './tree.js';
import { create as createBuilding } from './building.js';
import { create as createCircuitTree } from './circuitTree.js';
import { create as createIsotype } from './isotype.js';

export const DEFAULT_CENTERPIECE = 'arbol';

export const CENTERPIECES = Object.freeze([
  Object.freeze({ id: 'arbol', label: 'Árbol', create: createTree }),
  Object.freeze({ id: 'edificio', label: 'Edificio iTec', create: createBuilding }),
  Object.freeze({ id: 'circuitos', label: 'Árbol de circuitos', create: createCircuitTree }),
  Object.freeze({ id: 'isotipo', label: 'La i de iTec', create: createIsotype }),
]);

const normalize = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// Accepts a raw query value (string, repeated-param array, null...) and always
// returns a CENTERPIECES entry.
export function resolveCenterpiece(query) {
  const raw = Array.isArray(query) ? query[0] : query;
  const fallback = CENTERPIECES.find((c) => c.id === DEFAULT_CENTERPIECE);
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  const id = normalize(raw);
  return CENTERPIECES.find((c) => c.id === id) ?? fallback;
}

// Reads `centro` from a `location.search`-style string.
export function centerpieceFromSearch(search) {
  const params = new URLSearchParams(typeof search === 'string' ? search : '');
  return resolveCenterpiece(params.get('centro'));
}
