// "La i de iTec": the logo's rounded "i" (cream stem, red dot) standing on the
// island, with one small low-poly icon per career area orbiting it slowly.
import * as THREE from 'three';
import { flat, disposeObject3D } from '../lowPoly.js';

const BASE_Y = 0.12;
const ORBIT_RADIUS = 1.05;
const ORBIT_Y = 0.85;

const mesh = (geometry, material, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  return m;
};

// Gear: mecatrónica / electromecánica.
function gear() {
  const g = new THREE.Group();
  const m = flat(0x9b86e6);
  g.add(mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 8).rotateX(Math.PI / 2), m));
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const tooth = mesh(new THREE.BoxGeometry(0.04, 0.04, 0.05), m, Math.cos(a) * 0.09, Math.sin(a) * 0.09);
    tooth.rotation.z = a;
    g.add(tooth);
  }
  g.add(mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.056, 8).rotateX(Math.PI / 2), flat(0xfffaed)));
  return g;
}

// "</>": desarrollo de software.
function codeBrackets() {
  const g = new THREE.Group();
  const m = flat(0x8da0fb);
  const bar = (x, y, angle, len = 0.08) => {
    const b = mesh(new THREE.BoxGeometry(len, 0.024, 0.03), m, x, y);
    b.rotation.z = angle;
    g.add(b);
  };
  bar(-0.1, 0.022, 0.6);
  bar(-0.1, -0.022, -0.6);
  bar(0.1, 0.022, -0.6);
  bar(0.1, -0.022, 0.6);
  bar(0, 0, 1.2, 0.17);
  return g;
}

// Chip: inteligencia artificial.
function chip() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.14, 0.14, 0.03), flat(0x5b4b8a)));
  g.add(mesh(new THREE.BoxGeometry(0.06, 0.06, 0.034), flat(0xffd333, { emissive: 0xffd333, emissiveIntensity: 0.4 })));
  const pin = flat(0xe1e2fe);
  for (let i = -1; i <= 1; i += 1) {
    const o = i * 0.04;
    g.add(mesh(new THREE.BoxGeometry(0.018, 0.03, 0.012), pin, o, 0.085));
    g.add(mesh(new THREE.BoxGeometry(0.018, 0.03, 0.012), pin, o, -0.085));
    g.add(mesh(new THREE.BoxGeometry(0.03, 0.018, 0.012), pin, 0.085, o));
    g.add(mesh(new THREE.BoxGeometry(0.03, 0.018, 0.012), pin, -0.085, o));
  }
  return g;
}

// Suitcase: turismo.
function suitcase() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.18, 0.13, 0.07), flat(0xfbc77a)));
  g.add(mesh(new THREE.BoxGeometry(0.03, 0.132, 0.072), flat(0xff94b6), -0.045));
  g.add(mesh(new THREE.BoxGeometry(0.03, 0.132, 0.072), flat(0xff94b6), 0.045));
  g.add(mesh(new THREE.TorusGeometry(0.03, 0.009, 4, 8, Math.PI), flat(0x7a4a6b), 0, 0.065));
  return g;
}

// Megaphone: marketing.
function megaphone() {
  const g = new THREE.Group();
  const horn = mesh(new THREE.CylinderGeometry(0.075, 0.03, 0.15, 8, 1, true).rotateZ(-Math.PI / 2), flat(0xff94b6, { side: THREE.DoubleSide }), 0.03);
  g.add(horn);
  g.add(mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), flat(0xfffaed), -0.065));
  const handle = mesh(new THREE.BoxGeometry(0.022, 0.06, 0.022), flat(0x7a4a6b), -0.04, -0.045);
  handle.rotation.z = 0.25;
  g.add(handle);
  return g;
}

export const ORBIT_ICONS = Object.freeze([
  { id: 'mecatronica', build: gear },
  { id: 'software', build: codeBrackets },
  { id: 'ia', build: chip },
  { id: 'turismo', build: suitcase },
  { id: 'marketing', build: megaphone },
]);

export function create() {
  const root = new THREE.Group();
  root.name = 'centerpiece:isotipo';

  // ---- the "i": capsule stem on a small plinth, red dot above
  const plinth = mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.08, 9), flat(0xe1e2fe), 0, BASE_Y + 0.02);
  const stemLength = 0.6;
  const stemRadius = 0.17;
  const stem = mesh(
    new THREE.CapsuleGeometry(stemRadius, stemLength, 3, 9),
    flat(0xfffaed),
    0,
    BASE_Y + 0.06 + stemRadius + stemLength / 2,
  );
  const dotMat = flat(0xff5a64, { emissive: 0xff5a64, emissiveIntensity: 0.25 });
  const dotY = BASE_Y + 0.06 + stemLength + stemRadius * 2 + 0.22;
  const dot = mesh(new THREE.IcosahedronGeometry(0.2, 1), dotMat, 0, dotY);
  root.add(plinth, stem, dot);

  // ---- orbit of career icons
  const orbit = new THREE.Group();
  orbit.position.y = ORBIT_Y;
  const icons = ORBIT_ICONS.map(({ id, build }, i) => {
    const icon = build();
    icon.name = `icon:${id}`;
    const a = (i / ORBIT_ICONS.length) * Math.PI * 2;
    icon.position.set(Math.cos(a) * ORBIT_RADIUS, 0, Math.sin(a) * ORBIT_RADIUS);
    icon.scale.setScalar(1.35);
    icon.userData.phase = i * 1.3;
    orbit.add(icon);
    return icon;
  });
  root.add(orbit);

  return {
    object3D: root,
    update(elapsed) {
      orbit.rotation.y = elapsed * 0.25;
      for (const icon of icons) {
        // Counter-rotate so each icon keeps facing roughly forward while it orbits,
        // with a gentle bob and wobble.
        icon.rotation.y = -orbit.rotation.y + Math.sin(elapsed * 0.8 + icon.userData.phase) * 0.4;
        icon.position.y = Math.sin(elapsed * 1.1 + icon.userData.phase) * 0.06;
      }
      dot.position.y = dotY + Math.sin(elapsed * 1.3) * 0.03;
      dot.rotation.y = elapsed * 0.4;
    },
    dispose: () => disposeObject3D(root),
  };
}
