// Thin three.js layer: one fullscreen WebGL canvas behind the HTML UI.
// Choreography (camera states, intro curve, parallax) lives in pure modules next to
// this file; this class only turns that data into pixels.
//
// Extension API for later tasks (bubbles, detail view):
//   experience.scene            -> THREE.Scene, add your objects here
//   experience.camera           -> THREE.PerspectiveCamera
//   experience.renderer         -> THREE.WebGLRenderer
//   experience.onTick(fn)       -> fn({ elapsed, delta }) every frame; returns unsubscribe
//   experience.goTo(name, opts) -> tween the camera to a named state
//   experience.dispose()        -> frees everything still attached to the scene
import * as THREE from 'three';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { getCameraState, ISLAND_FOCUS } from './cameraStates.js';
import { createParallax } from './parallax.js';
import { INTRO_DURATION, pointAt, targetAt } from './introPath.js';
import { clampPixelRatio } from './renderSettings.js';

gsap.registerPlugin(CustomEase);
// Same curve as the CSS token --ease-bubble: cubic-bezier(.32,.94,.6,1).
const EASE_BUBBLE = CustomEase.create('bubble', 'M0,0 C0.32,0.94 0.6,1 1,1');

// World units the camera drifts at full parallax.
const PARALLAX_AMPLITUDE = 0.25;

const SKY_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

// CSS linear-gradient(108deg, #8da0fb 0%, #b88ff4 25%, #fbc77a 100%) rebuilt in a
// shader, with slow value noise bending the gradient line so the sky feels alive.
// Colors are mixed in sRGB and written without conversion, like the CSS version.
const SKY_FRAGMENT = /* glsl */ `
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec3 uBlue;
  uniform vec3 uPurple;
  uniform vec3 uYellow;
  uniform vec3 uTint;
  uniform float uTintAmount;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    float angle = radians(108.0);
    vec2 dir = vec2(sin(angle), cos(angle));
    vec2 p = (vUv - 0.5) * uResolution;
    float len = abs(uResolution.x * dir.x) + abs(uResolution.y * dir.y);
    float t = dot(p, dir) / len + 0.5;

    vec2 q = vUv * vec2(uResolution.x / uResolution.y, 1.0) * 1.6;
    float n = noise(q + vec2(uTime * 0.05, uTime * 0.03))
            + 0.5 * noise(q * 2.0 - vec2(uTime * 0.04, 0.0));
    t = clamp(t + (n - 0.75) * 0.12, 0.0, 1.0);

    vec3 color = t < 0.25
      ? mix(uBlue, uPurple, t / 0.25)
      : mix(uPurple, uYellow, (t - 0.25) / 0.75);

    // Inner-bubble ambiance: lean towards the offer's bubble color with a soft
    // cream glow in the middle, still breathing with the same noise.
    float glow = 1.0 - smoothstep(0.0, 0.75, length((vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0)));
    vec3 tinted = mix(color, uTint, 0.32 + (n - 0.75) * 0.1);
    tinted = mix(tinted, vec3(1.0, 0.98, 0.93), glow * 0.35);
    color = mix(color, tinted, uTintAmount);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const srgb = (hex) => {
  const c = new THREE.Color();
  c.setHex(hex, THREE.SRGBColorSpace);
  const out = { r: 0, g: 0, b: 0 };
  c.getRGB(out, THREE.SRGBColorSpace);
  return new THREE.Vector3(out.r, out.g, out.b);
};

// Small seeded PRNG so the island looks the same on every load.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function jitter(geometry, amount, random) {
  const pos = geometry.attributes.position;
  // Move shared vertices together so flat shading stays crack-free.
  const moved = new Map();
  for (let i = 0; i < pos.count; i += 1) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    if (!moved.has(key)) {
      moved.set(key, [(random() - 0.5) * amount, (random() - 0.5) * amount, (random() - 0.5) * amount]);
    }
    const [dx, dy, dz] = moved.get(key);
    pos.setXYZ(i, pos.getX(i) + dx, pos.getY(i) + dy, pos.getZ(i) + dz);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export class Experience {
  constructor(canvas) {
    this.canvas = canvas;
    this.tickHandlers = new Set();
    this.parallax = createParallax();
    this.parallaxEnabled = true;
    this.cameraBase = getCameraState('HOME');
    this.cameraTween = null;
    this.introTween = null;
    this.rafId = null;
    this.elapsed = 0;
    this.lastTime = null;
    this.random = mulberry32(2027);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.lookTarget = new THREE.Vector3();

    this.buildSky();
    this.buildLights();
    this.buildIsland();
    this.buildClouds();
    this.buildParticles();

    this.resize = this.resize.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
    this.frame = this.frame.bind(this);
    window.addEventListener('resize', this.resize);
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);

    this.resize();
    this.applyCamera();
  }

  // Compiles shaders and draws one frame synchronously, so readiness does not
  // depend on requestAnimationFrame (which never fires in hidden tabs).
  warmUp() {
    this.renderer.compile(this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    if (this.rafId === null && document.visibilityState !== 'hidden') {
      this.lastTime = null;
      this.rafId = requestAnimationFrame(this.frame);
    }
  }

  stop() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  onTick(fn) {
    this.tickHandlers.add(fn);
    return () => this.tickHandlers.delete(fn);
  }

  // ---------------------------------------------------------------- camera

  goTo(name, { duration = 1.6, immediate = false } = {}) {
    this.cancelIntro();
    this.cameraTween?.kill();
    const to = getCameraState(name);
    if (immediate) {
      this.cameraBase = to;
      this.applyCamera();
      return Promise.resolve();
    }
    const proxy = { t: 0 };
    const from = { position: [...this.cameraBase.position], target: [...this.cameraBase.target] };
    return new Promise((resolve) => {
      this.cameraTween = gsap.to(proxy, {
        t: 1,
        duration,
        ease: EASE_BUBBLE,
        onUpdate: () => {
          const k = proxy.t;
          this.cameraBase = {
            position: from.position.map((v, i) => v + (to.position[i] - v) * k),
            target: from.target.map((v, i) => v + (to.target[i] - v) * k),
          };
        },
        onComplete: resolve,
        onInterrupt: resolve,
      });
    });
  }

  // Flies the intro curve; resolves true when it finished, false when skipped.
  playIntro() {
    this.cameraTween?.kill();
    this.cancelIntro();
    const proxy = { t: 0 };
    return new Promise((resolve) => {
      this.resolveIntro = resolve;
      this.introTween = gsap.to(proxy, {
        t: 1,
        duration: INTRO_DURATION,
        ease: 'power1.inOut',
        onUpdate: () => {
          this.cameraBase = { position: pointAt(proxy.t), target: targetAt(proxy.t) };
        },
        onComplete: () => {
          this.introTween = null;
          this.resolveIntro = null;
          resolve(true);
        },
      });
    });
  }

  // Skip: stop the flight and jump straight to OVERWORLD.
  skipIntro() {
    if (!this.introTween) return;
    this.goTo('OVERWORLD', { immediate: true });
  }

  cancelIntro() {
    if (!this.introTween) return;
    this.introTween.kill();
    this.introTween = null;
    this.resolveIntro?.(false);
    this.resolveIntro = null;
  }

  applyCamera() {
    const { position, target } = this.cameraBase;
    const px = this.parallaxEnabled ? this.parallax.offset.x * PARALLAX_AMPLITUDE : 0;
    const py = this.parallaxEnabled ? this.parallax.offset.y * PARALLAX_AMPLITUDE : 0;
    this.camera.position.set(position[0] + px, position[1] + py, position[2]);
    this.lookTarget.set(target[0], target[1], target[2]);
    this.camera.lookAt(this.lookTarget);
  }

  // ----------------------------------------------------------------- scene

  // Tints the sky for the inner bubble; `null` fades back to the plain sky.
  setAmbiance(hex) {
    const uniforms = this.skyMaterial.uniforms;
    if (hex) uniforms.uTint.value.copy(srgb(parseInt(String(hex).replace('#', ''), 16)));
    gsap.killTweensOf(uniforms.uTintAmount);
    gsap.to(uniforms.uTintAmount, { value: hex ? 1 : 0, duration: 1.2, ease: 'power2.out' });
  }

  buildSky() {
    this.skyMaterial = new THREE.ShaderMaterial({
      vertexShader: SKY_VERTEX,
      fragmentShader: SKY_FRAGMENT,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uBlue: { value: srgb(0x8da0fb) },
        uPurple: { value: srgb(0xb88ff4) },
        uYellow: { value: srgb(0xfbc77a) },
        uTint: { value: srgb(0xffd333) },
        uTintAmount: { value: 0 },
      },
    });
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.skyMaterial);
    sky.frustumCulled = false;
    sky.renderOrder = -1;
    this.scene.add(sky);
  }

  buildLights() {
    this.scene.add(new THREE.HemisphereLight(0xe1e2fe, 0xfbc77a, 1.6));
    const sun = new THREE.DirectionalLight(0xfffaed, 1.8);
    sun.position.set(4, 8, 5);
    this.scene.add(sun);
  }

  buildIsland() {
    const island = new THREE.Group();
    island.position.set(...ISLAND_FOCUS);
    const flat = (color) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9 });

    const rock = new THREE.Mesh(
      jitter(new THREE.ConeGeometry(1.6, 2.2, 9, 3).rotateX(Math.PI), 0.35, this.random),
      flat(0x9b86e6),
    );
    rock.position.y = -1.15;

    const grass = new THREE.Mesh(
      jitter(new THREE.CylinderGeometry(1.7, 1.6, 0.25, 9, 1), 0.12, this.random),
      flat(0x9fe0bd),
    );

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.9, 6), flat(0x7a4a6b));
    trunk.position.set(0.3, 0.55, -0.1);

    const canopy = new THREE.Group();
    canopy.position.set(0.3, 1.2, -0.1);
    [
      [0, 0, 0, 0.5],
      [0.32, -0.12, 0.1, 0.36],
      [-0.3, -0.08, -0.05, 0.38],
      [0.05, 0.3, -0.05, 0.34],
    ].forEach(([x, y, z, r]) => {
      const blob = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(r, 1), 0.06, this.random), flat(0xff94b6));
      blob.position.set(x, y, z);
      canopy.add(blob);
    });

    for (let i = 0; i < 5; i += 1) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08 + this.random() * 0.08, 0), flat(0xe1e2fe));
      const a = this.random() * Math.PI * 2;
      stone.position.set(Math.cos(a) * 1.1, 0.15, Math.sin(a) * 1.1);
      island.add(stone);
    }

    island.add(rock, grass, trunk, canopy);
    this.scene.add(island);
    this.island = island;
    this.onTick(({ elapsed }) => {
      island.position.y = ISLAND_FOCUS[1] + Math.sin(elapsed * 0.6) * 0.08;
      island.rotation.y = elapsed * 0.05;
    });
  }

  buildClouds() {
    const material = new THREE.MeshStandardMaterial({
      color: 0xfffaed,
      emissive: 0xe1e2fe,
      emissiveIntensity: 0.35,
      flatShading: true,
      transparent: true,
      opacity: 0.92,
    });
    const puff = new THREE.IcosahedronGeometry(1, 1);
    const clouds = [];
    const spots = [
      [-4, 5, -4, 1],
      [4.5, 6.5, -3, 0.8],
      [-2.5, 1.2, -6, 1.2],
      [3.5, 1.8, -7, 1.1],
      [0, 9, -6, 1.3],
      [-5, 8, 2, 0.7],
    ];
    for (const [x, y, z, scale] of spots) {
      const cloud = new THREE.Group();
      for (let i = 0; i < 4; i += 1) {
        const p = new THREE.Mesh(puff, material);
        const s = 0.35 + this.random() * 0.3;
        p.scale.set(s * 1.4, s, s);
        p.position.set((i - 1.5) * 0.45, this.random() * 0.2, (this.random() - 0.5) * 0.3);
        cloud.add(p);
      }
      cloud.position.set(x, y, z);
      cloud.scale.setScalar(scale);
      cloud.userData.speed = 0.05 + this.random() * 0.08;
      cloud.userData.baseX = x;
      clouds.push(cloud);
      this.scene.add(cloud);
    }
    this.onTick(({ elapsed }) => {
      for (const cloud of clouds) {
        cloud.position.x = cloud.userData.baseX + Math.sin(elapsed * cloud.userData.speed) * 1.2;
      }
    });
  }

  buildParticles() {
    const count = 160;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [0xfffaed, 0xffd333, 0xff94b6, 0xe1e2fe].map((hex) => new THREE.Color(hex));
    for (let i = 0; i < count; i += 1) {
      positions.set([(this.random() - 0.5) * 16, this.random() * 10 - 1, (this.random() - 0.5) * 14 - 2], i * 3);
      const c = palette[i % palette.length];
      colors.set([c.r, c.g, c.b], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false }),
    );
    this.scene.add(points);
    this.onTick(({ elapsed }) => {
      points.rotation.y = elapsed * 0.02;
      points.position.y = Math.sin(elapsed * 0.3) * 0.15;
    });
  }

  // ------------------------------------------------------------ lifecycle

  onPointerMove(event) {
    this.parallax.setPointer(event.clientX, event.clientY, window.innerWidth, window.innerHeight);
  }

  onVisibility() {
    if (document.visibilityState === 'hidden') this.stop();
    else this.start();
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = clampPixelRatio(window.devicePixelRatio, width);
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.skyMaterial.uniforms.uResolution.value.set(width * ratio, height * ratio);
  }

  frame(now) {
    this.rafId = requestAnimationFrame(this.frame);
    // Cap the delta so a long pause does not make everything jump.
    const delta = this.lastTime === null ? 1 / 60 : Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.elapsed += delta;

    this.skyMaterial.uniforms.uTime.value = this.elapsed;
    this.parallax.update(delta);
    const tick = { elapsed: this.elapsed, delta };
    for (const fn of this.tickHandlers) fn(tick);
    this.applyCamera();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.stop();
    this.cameraTween?.kill();
    this.cancelIntro();
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.tickHandlers.clear();

    const materials = new Set();
    const geometries = new Set();
    this.scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) [].concat(object.material).forEach((m) => materials.add(m));
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => {
      Object.values(m).forEach((value) => value?.isTexture && value.dispose());
      m.dispose();
    });
    this.scene.clear();
    this.renderer.dispose();
  }
}
