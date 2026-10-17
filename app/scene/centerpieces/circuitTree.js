// "Árbol de circuitos": the tree metaphor rebuilt from circuit-board traces. A chip
// at the base, a trunk of parallel traces, branches that turn at right angles and
// end in glowing nodes; node clusters suggest the canopy. Nodes pulse and small
// signals travel up the traces.
import * as THREE from 'three';
import { mulberry32, flat, disposeObject3D } from '../lowPoly.js';

const BASE_Y = 0.12;
const TRACE = 0.034; // trace cross-section
const NODE_COLORS = [0xff94b6, 0x8da0fb, 0x9fe0bd, 0xffd333, 0xb88ff4];
const LIMIT_XZ = 0.95;
const LIMIT_Y = 1.72;

// One box per straight segment of an axis-aligned polyline.
function addTrace(group, points, material) {
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const len = a.distanceTo(b);
    if (len < 1e-4) continue;
    const size = [TRACE, TRACE, TRACE];
    const axis = Math.abs(b.x - a.x) > 1e-4 ? 0 : Math.abs(b.y - a.y) > 1e-4 ? 1 : 2;
    size[axis] = len + TRACE;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    group.add(mesh);
  }
}

// Point at fraction t (0..1) of a polyline's length.
function pointAlong(points, lengths, total, t, out) {
  let d = t * total;
  for (let i = 1; i < points.length; i += 1) {
    if (d <= lengths[i - 1] || i === points.length - 1) {
      const k = lengths[i - 1] > 0 ? Math.min(d / lengths[i - 1], 1) : 0;
      return out.copy(points[i - 1]).lerp(points[i], k);
    }
    d -= lengths[i - 1];
  }
  return out.copy(points[points.length - 1]);
}

export function create() {
  const random = mulberry32(404);
  const root = new THREE.Group();
  root.name = 'centerpiece:circuitos';

  const traceMat = flat(0xffe9a8, { emissive: 0xffd333, emissiveIntensity: 0.25, roughness: 0.5, metalness: 0.2 });
  const padMat = flat(0xfffaed, { emissive: 0xffd333, emissiveIntensity: 0.2 });
  const chipMat = flat(0x5b4b8a);
  const pinMat = flat(0xe1e2fe);

  // ---- chip at the base, the "roots"
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.46), chipMat);
  chip.position.y = BASE_Y + 0.035;
  root.add(chip);
  for (let i = 0; i < 5; i += 1) {
    const offset = -0.18 + i * 0.09;
    [
      [offset, 0.27],
      [offset, -0.27],
      [0.27, offset],
      [-0.27, offset],
    ].forEach(([x, z]) => {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.02, 0.035), pinMat);
      pin.position.set(x, BASE_Y + 0.01, z);
      root.add(pin);
    });
  }

  // ---- trunk + branches as right-angle polylines
  const paths = [];
  const nodes = [];
  const nodeGeometry = new THREE.IcosahedronGeometry(1, 1);
  const padGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.012, 8);
  const clamp = (v, lim) => Math.max(-lim, Math.min(lim, v));

  const addNode = (position, size) => {
    const color = NODE_COLORS[nodes.length % NODE_COLORS.length];
    const material = flat(color, { emissive: color, emissiveIntensity: 0.8, roughness: 0.4 });
    const mesh = new THREE.Mesh(nodeGeometry, material);
    mesh.position.copy(position);
    mesh.scale.setScalar(size);
    mesh.userData = { size, phase: random() * Math.PI * 2, speed: 1.4 + random() * 1.2 };
    root.add(mesh);
    nodes.push(mesh);
  };

  // A branch alternates horizontal runs (±x / ±z) and vertical rises, then ends in a node.
  const grow = (start, steps, spread) => {
    const points = [start.clone()];
    let p = start.clone();
    let horizontal = true;
    for (let s = 0; s < steps; s += 1) {
      const next = p.clone();
      if (horizontal) {
        const len = (0.16 + random() * 0.24) * spread;
        // Mostly run away from the trunk so the canopy opens up instead of tangling.
        const onX = random() < 0.5;
        const current = onX ? next.x : next.z;
        const outward = Math.abs(current) > 0.02 ? Math.sign(current) : random() < 0.5 ? -1 : 1;
        const sign = random() < 0.8 ? outward : -outward;
        if (onX) next.x = clamp(next.x + sign * len, LIMIT_XZ);
        else next.z = clamp(next.z + sign * len, LIMIT_XZ);
      } else {
        next.y = Math.min(next.y + 0.08 + random() * 0.18, LIMIT_Y);
      }
      points.push(next);
      p = next;
      horizontal = !horizontal;
    }
    return points;
  };

  const trunkTop = 0.72;
  const trunkXs = [-0.1, 0, 0.1];
  trunkXs.forEach((x, i) => {
    const top = trunkTop + (i === 1 ? 0.12 : 0);
    paths.push([new THREE.Vector3(x, BASE_Y + 0.07, 0), new THREE.Vector3(x, top, 0)]);
    const branches = i === 1 ? 3 : 2;
    for (let b = 0; b < branches; b += 1) {
      const start = new THREE.Vector3(x, top - b * 0.14, 0);
      const branch = grow(start, 4 + Math.floor(random() * 2), 1 + b * 0.2);
      paths.push(branch);
      addNode(branch[branch.length - 1], 0.08 + random() * 0.04);
      // A twig from the middle of the branch with a smaller node: canopy density.
      const mid = branch[2];
      const twig = grow(mid, 2 + Math.floor(random() * 2), 0.7);
      paths.push(twig);
      addNode(twig[twig.length - 1], 0.05 + random() * 0.03);
    }
  });
  // Crown: a cluster of small nodes on short leads above the middle trunk.
  for (let i = 0; i < 4; i += 1) {
    const lead = grow(new THREE.Vector3(0, trunkTop + 0.12, 0), 3, 0.8);
    paths.push(lead);
    addNode(lead[lead.length - 1], 0.05 + random() * 0.03);
  }

  for (const points of paths) {
    addTrace(root, points, traceMat);
    // Solder pads at every bend.
    points.slice(1, -1).forEach((pt) => {
      const pad = new THREE.Mesh(padGeometry, padMat);
      pad.position.copy(pt);
      root.add(pad);
    });
  }

  // ---- signals: bright dots flowing up a few traces
  const signalMat = new THREE.MeshBasicMaterial({ color: 0xfffaed });
  const signalGeometry = new THREE.IcosahedronGeometry(0.028, 0);
  const signals = paths
    .filter((_, i) => i % 3 === 1)
    .map((points) => {
      const lengths = points.slice(1).map((pt, i) => pt.distanceTo(points[i]));
      const mesh = new THREE.Mesh(signalGeometry, signalMat);
      mesh.position.copy(points[0]);
      root.add(mesh);
      return { mesh, points, lengths, total: lengths.reduce((a, b) => a + b, 0), phase: random() };
    });

  return {
    object3D: root,
    update(elapsed) {
      for (const node of nodes) {
        const { size, phase, speed } = node.userData;
        const pulse = (Math.sin(elapsed * speed + phase) + 1) / 2;
        node.material.emissiveIntensity = 0.45 + pulse * 0.75;
        node.scale.setScalar(size * (1 + pulse * 0.18));
      }
      for (const s of signals) {
        const t = (elapsed * 0.35 + s.phase) % 1;
        pointAlong(s.points, s.lengths, s.total, t, s.mesh.position);
      }
    },
    dispose: () => disposeObject3D(root),
  };
}
