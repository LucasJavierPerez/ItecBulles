import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  CENTERPIECES,
  DEFAULT_CENTERPIECE,
  resolveCenterpiece,
  centerpieceFromSearch,
} from '../app/scene/centerpieces/index.js';

describe('centerpiece selection', () => {
  it('offers the tree and the three prototypes under their Spanish query values', () => {
    expect(CENTERPIECES.map((c) => c.id)).toEqual(['arbol', 'edificio', 'circuitos', 'isotipo']);
    for (const c of CENTERPIECES) {
      expect(typeof c.label).toBe('string');
      expect(typeof c.create).toBe('function');
    }
  });

  it('defaults to the iTec building (user decision D-09)', () => {
    expect(DEFAULT_CENTERPIECE).toBe('edificio');
    expect(resolveCenterpiece().id).toBe('edificio');
    expect(resolveCenterpiece(null).id).toBe('edificio');
    expect(resolveCenterpiece('').id).toBe('edificio');
  });

  it('resolves every known value', () => {
    expect(resolveCenterpiece('edificio').id).toBe('edificio');
    expect(resolveCenterpiece('circuitos').id).toBe('circuitos');
    expect(resolveCenterpiece('isotipo').id).toBe('isotipo');
    expect(resolveCenterpiece('arbol').id).toBe('arbol');
  });

  it('is forgiving with case, spaces and accents', () => {
    expect(resolveCenterpiece('  Edificio ').id).toBe('edificio');
    expect(resolveCenterpiece('ÁRBOL').id).toBe('arbol');
  });

  it('falls back to the building for unknown or malformed values', () => {
    expect(resolveCenterpiece('castillo').id).toBe('edificio');
    expect(resolveCenterpiece(42).id).toBe('edificio');
    expect(resolveCenterpiece({}).id).toBe('edificio');
  });

  it('takes the first value of a repeated query parameter', () => {
    expect(resolveCenterpiece(['isotipo', 'edificio']).id).toBe('isotipo');
  });

  it('reads ?centro= from a location search string', () => {
    expect(centerpieceFromSearch('?centro=arbol').id).toBe('arbol');
    expect(centerpieceFromSearch('?foo=1&centro=circuitos').id).toBe('circuitos');
    expect(centerpieceFromSearch('?centro=isotipo').id).toBe('isotipo');
    expect(centerpieceFromSearch('').id).toBe('edificio');
    expect(centerpieceFromSearch('?centro=nada').id).toBe('edificio');
    expect(centerpieceFromSearch(undefined).id).toBe('edificio');
  });

  it('keeps the building facing the camera at rest (no idle spin)', () => {
    const building = resolveCenterpiece('edificio').create();
    expect(building.idleSpin).toBe(false);
    building.dispose();
    const tree = resolveCenterpiece('arbol').create();
    expect(tree.idleSpin).not.toBe(false);
    tree.dispose();
  });
});

describe.each(CENTERPIECES.map((c) => [c.id, c]))('centerpiece %s', (_id, entry) => {
  it('builds an Object3D with meshes that fits the island top', () => {
    const piece = entry.create();
    expect(piece.object3D).toBeInstanceOf(THREE.Object3D);
    let meshes = 0;
    piece.object3D.traverse((o) => {
      if (o.isMesh) meshes += 1;
    });
    expect(meshes).toBeGreaterThan(3);
    // Same footprint as the tree: inside the grass disc (radius 1.7) and not taller
    // than ~1.9 units, so camera framing and the bubble row still work.
    piece.object3D.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(piece.object3D);
    expect(box.max.y).toBeLessThan(2);
    expect(box.min.y).toBeGreaterThan(-0.2);
    expect(Math.max(-box.min.x, box.max.x, -box.min.z, box.max.z)).toBeLessThan(1.7);
    piece.dispose();
  });

  it('animates without throwing and disposes cleanly', () => {
    const piece = entry.create();
    expect(() => {
      piece.update(0, 0);
      piece.update(1.5, 1 / 60);
      piece.update(10, 0.1);
    }).not.toThrow();
    expect(() => piece.dispose()).not.toThrow();
  });
});
