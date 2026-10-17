// "Edificio iTec": stylized low-poly version of the real building's front
// (assets/photos/ingreso-2027.jpg). Facade measurements were taken from the photo:
// 1 unit ≈ 740 px of the original, x from the facade center, y from the ground.
//   - grey-green stone facade with a dark green corrugated metal band on top
//   - "INSTITUTO TECNOLOGICO RIO CUARTO" small above a ribbon of white-framed windows
//   - big "iTec" letters (red dot over the i) above a glass double door
//   - two large dark-framed windows, "783" written vertically left of the door
// The front faces +z, i.e. the camera at rest.
import * as THREE from 'three';
import { mulberry32, jitter, flat, canvasTexture, disposeObject3D } from '../lowPoly.js';

const WIDTH = 2.0;
const STONE_HEIGHT = 0.945; // stone part; the metal band sits above it
const BAND_HEIGHT = 0.225;
const DEPTH = 0.9;
const FRONT = 0.25; // z of the facade plane, island-local
const GROUND = 0.1; // grass top, slightly sunk so no gap shows

const COLORS = {
  stone: 0xa7b9b1,
  band: 0x4b6b5c,
  bandRidge: 0x3e5a4d,
  glass: 0xc6d4f2,
  frameDark: 0x3d4850,
  frameWhite: 0xfffaed,
  letters: 0xf4f1ea,
  dot: 0xe5484d,
  path: 0xe9e4f4,
  shrub: 0x8fcf9a,
};

// Stone blocks + the small sign + "783", painted once on a canvas for the front.
function paintFacade(ctx, w, h) {
  const random = mulberry32(783);
  const shades = ['#a9bcb3', '#9fb3ab', '#b3c4bb', '#97aaa4', '#adbdb2', '#c0cbc2'];
  const warm = ['#b8a091', '#a99a8c'];
  ctx.fillStyle = '#7f918b';
  ctx.fillRect(0, 0, w, h);
  const rowH = h / 20;
  for (let row = 0; row < 20; row += 1) {
    let x = -random() * 40;
    while (x < w) {
      const bw = 34 + random() * 46;
      ctx.fillStyle = random() < 0.08 ? warm[Math.floor(random() * warm.length)] : shades[Math.floor(random() * shades.length)];
      ctx.fillRect(x + 1.5, row * rowH + 1.5, bw - 3, rowH - 3);
      x += bw;
    }
  }
  // Sign: metal letters, condensed, centered slightly right like the original.
  const signX = ((0.055 + WIDTH / 2) / WIDTH) * w;
  const signY = (1 - 0.865 / STONE_HEIGHT) * h;
  ctx.fillStyle = '#2f3b40';
  ctx.font = 'bold 26px "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = 'INSTITUTO TECNOLOGICO RIO CUARTO';
  const target = 0.64 * (w / WIDTH);
  const scaleX = target / ctx.measureText(text).width;
  ctx.save();
  ctx.translate(signX, signY);
  ctx.scale(scaleX, 1);
  ctx.fillText(text, 0, 0);
  ctx.restore();
  [signX - target / 2 - 14, signX + target / 2 + 14].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, signY, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  // House number, one digit under the other.
  ctx.fillStyle = '#f7f4ec';
  ctx.font = 'bold 30px "Helvetica Neue", Arial, sans-serif';
  const numX = ((-0.278 + WIDTH / 2) / WIDTH) * w;
  ['7', '8', '3'].forEach((digit, i) => {
    ctx.fillText(digit, numX, (1 - (0.33 - i * 0.05) / STONE_HEIGHT) * h);
  });
}

// Vertical ribs of the corrugated metal band.
function paintBand(ctx, w, h) {
  ctx.fillStyle = '#4b6b5c';
  ctx.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 8) {
    ctx.fillStyle = '#3c5749';
    ctx.fillRect(x, 0, 3, h);
    ctx.fillStyle = '#5a7c6b';
    ctx.fillRect(x + 4, 0, 1, h);
  }
}

export function create() {
  const random = mulberry32(1986);
  const root = new THREE.Group();
  root.name = 'centerpiece:edificio';
  const building = new THREE.Group();
  building.scale.setScalar(1.05);
  root.add(building);

  const mat = {
    stone: flat(COLORS.stone),
    band: flat(COLORS.band),
    glass: flat(COLORS.glass, { roughness: 0.25, metalness: 0.1, emissive: 0x8da0fb, emissiveIntensity: 0.12 }),
    frameDark: flat(COLORS.frameDark),
    frameWhite: flat(COLORS.frameWhite),
    letters: flat(COLORS.letters, { emissive: 0xfffaed, emissiveIntensity: 0.15 }),
    dot: flat(COLORS.dot, { emissive: COLORS.dot, emissiveIntensity: 0.2 }),
    frosted: flat(0xf3f6fb, { transparent: true, opacity: 0.6 }),
    path: flat(COLORS.path),
    shrub: flat(COLORS.shrub),
  };

  // Places a box by facade coordinates: x from center, y from the ground (bottom
  // edge), z as distance in front of the facade plane (box center).
  const box = (w, h, d, material, x, y, z = d / 2) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, GROUND + y + h / 2, FRONT + z);
    building.add(mesh);
    return mesh;
  };
  // Same, with left/right/bottom/top edges.
  const rect = (x0, x1, y0, y1, d, material, z = d / 2) => box(x1 - x0, y1 - y0, d, material, (x0 + x1) / 2, y0, z);

  // ---- body: stone volume (textured front) and the metal band on top
  const facadeMap = canvasTexture(1024, 484, paintFacade);
  const front = facadeMap ? flat(0xffffff, { map: facadeMap }) : mat.stone;
  box(WIDTH, STONE_HEIGHT, DEPTH, [mat.stone, mat.stone, mat.stone, mat.stone, front, mat.stone], 0, 0, -DEPTH / 2);
  const bandMap = canvasTexture(512, 64, paintBand);
  const bandFront = bandMap ? flat(0xffffff, { map: bandMap }) : mat.band;
  box(WIDTH + 0.04, BAND_HEIGHT, DEPTH + 0.04, [mat.band, mat.band, mat.band, mat.band, bandFront, mat.band], 0, STONE_HEIGHT, -DEPTH / 2 + 0.02);
  // Thin dark ledge under the band and the sill under the window ribbon.
  rect(-WIDTH / 2, WIDTH / 2, STONE_HEIGHT - 0.012, STONE_HEIGHT + 0.004, 0.05, mat.frameDark);
  rect(-WIDTH / 2, WIDTH / 2, 0.6, 0.618, 0.035, mat.frameDark);
  if (!facadeMap) {
    // No canvas: hint the stone joints with a few slightly darker courses.
    for (let i = 1; i < 6; i += 1) rect(-WIDTH / 2, WIDTH / 2, i * 0.1, i * 0.1 + 0.006, 0.006, mat.frameDark);
  }

  // ---- upper floor: long ribbon of white-framed windows
  rect(-0.84, 0.89, 0.618, 0.8, 0.02, mat.frameWhite);
  const panes = [0.13, 0.25, 0.1, 0.1, 0.25, 0.1, 0.1, 0.13, 0.25, 0.13];
  const total = panes.reduce((a, b) => a + b, 0);
  let px = -0.84 + 0.018;
  const usable = 0.89 - -0.84 - 0.018 * (panes.length + 1);
  for (const share of panes) {
    const pw = (share / total) * usable;
    rect(px, px + pw, 0.636, 0.782, 0.012, mat.glass, 0.026);
    px += pw + 0.018;
  }

  // ---- big "iTec" letters above the door (white relief, red dot over the i)
  const letters = new THREE.Group();
  letters.position.set(-0.07, GROUND + 0.445, FRONT + 0.02);
  const T = 0.022; // stroke
  const piece = (geometry, material, x, y) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, 0);
    letters.add(mesh);
    return mesh;
  };
  piece(new THREE.BoxGeometry(T, 0.085, 0.025), mat.letters, 0, 0.0425); // i stem
  piece(new THREE.CylinderGeometry(0.018, 0.018, 0.025, 10).rotateX(Math.PI / 2), mat.dot, 0, 0.113);
  piece(new THREE.TorusGeometry(0.02, 0.004, 3, 12), mat.letters, 0, 0.113).position.z = 0.002;
  piece(new THREE.BoxGeometry(0.085, T, 0.025), mat.letters, 0.075, 0.115); // T bar
  piece(new THREE.BoxGeometry(T, 0.125, 0.025), mat.letters, 0.075, 0.0625); // T stem
  // e: open ring with the gap at the lower right, plus the middle bar.
  piece(new THREE.TorusGeometry(0.036, T / 2, 4, 14, Math.PI * 1.72), mat.letters, 0.165, 0.04);
  piece(new THREE.BoxGeometry(0.07, T * 0.8, 0.025), mat.letters, 0.165, 0.042);
  // c: ring open to the right.
  piece(new THREE.TorusGeometry(0.036, T / 2, 4, 14, Math.PI * 1.5).rotateZ(Math.PI / 4), mat.letters, 0.252, 0.04);
  letters.scale.setScalar(1.05);
  building.add(letters);

  // ---- ground floor: two big dark-framed windows and the glass entrance
  const bigWindow = (x0, x1) => {
    rect(x0, x1, 0.06, 0.42, 0.03, mat.frameDark);
    rect(x0 + 0.028, x1 - 0.028, 0.088, 0.392, 0.01, mat.glass, 0.034);
    rect(x0 + 0.028, x1 - 0.028, 0.17, 0.2, 0.004, mat.frosted, 0.041);
  };
  bigWindow(-0.905, -0.34);
  bigWindow(0.445, 0.975);
  // Entrance block: dark frame, side glass, white double door in the middle.
  rect(-0.216, 0.34, 0, 0.425, 0.03, mat.frameDark);
  rect(-0.19, -0.075, 0.02, 0.4, 0.01, mat.glass, 0.034);
  rect(0.21, 0.315, 0.02, 0.4, 0.01, mat.glass, 0.034);
  rect(-0.065, 0.2, 0.01, 0.405, 0.012, mat.frameWhite, 0.036);
  rect(-0.05, 0.06, 0.025, 0.39, 0.008, mat.glass, 0.044);
  rect(0.075, 0.185, 0.025, 0.39, 0.008, mat.glass, 0.044);
  // Wall lamps between the openings.
  [-0.36, -0.235, 0.36, 0.43].forEach((x) => box(0.018, 0.026, 0.02, mat.frameWhite, x, 0.47, 0.01));

  // ---- path to the door and two shrubs by the left window (as in the photo)
  const path = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.62), mat.path);
  path.position.set(0.07, GROUND + 0.005, FRONT + 0.31);
  building.add(path);
  [
    [-0.78, 0.13],
    [-0.47, 0.11],
  ].forEach(([x, r]) => {
    const shrub = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(r, 0), 0.04, random), mat.shrub);
    shrub.scale.y = 0.8;
    shrub.position.set(x, GROUND + r * 0.6, FRONT + 0.13);
    building.add(shrub);
  });

  // Center the volume on the island (footprint ≈ 2.1 × 1.2) and seat it on the grass.
  building.position.z = -0.12;

  return {
    object3D: root,
    // Wide footprint: the island leaves its pebbles out of it.
    blocksPebbles: true,
    // A building does not move; only the red dot glows softly.
    update(elapsed) {
      mat.dot.emissiveIntensity = 0.2 + Math.sin(elapsed * 1.6) * 0.12;
    },
    dispose: () => disposeObject3D(root),
  };
}
