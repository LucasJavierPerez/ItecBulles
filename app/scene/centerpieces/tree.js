// "Árbol": the original pink low-poly tree (moved here unchanged from Experience.js).
import * as THREE from 'three';
import { mulberry32, jitter, flat, disposeObject3D } from '../lowPoly.js';

export function create() {
  const random = mulberry32(2027);
  const root = new THREE.Group();
  root.name = 'centerpiece:arbol';

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.9, 6), flat(0x7a4a6b));
  trunk.position.set(0.3, 0.55, -0.1);

  const canopy = new THREE.Group();
  canopy.position.set(0.3, 1.2, -0.1);
  const leaves = flat(0xff94b6);
  [
    [0, 0, 0, 0.5],
    [0.32, -0.12, 0.1, 0.36],
    [-0.3, -0.08, -0.05, 0.38],
    [0.05, 0.3, -0.05, 0.34],
  ].forEach(([x, y, z, r]) => {
    const blob = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(r, 1), 0.06, random), leaves);
    blob.position.set(x, y, z);
    canopy.add(blob);
  });

  root.add(trunk, canopy);
  return {
    object3D: root,
    // The tree is static; the island's float and spin already move it.
    update() {},
    dispose: () => disposeObject3D(root),
  };
}
