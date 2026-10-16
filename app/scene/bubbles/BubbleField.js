// Thin three.js layer for the bubble overworld: one bubble per offer laid out by the
// pure carousel (app/scene/carousel.js). Each bubble = circular photo plane +
// translucent noise-wobble shell with an iridescent fresnel rim.
//
// Modes (set from the ui step):
//   'idle'      home / intro: bubbles float, no input
//   'overworld' carousel input, hover ripple, click opens a bubble
//   'bubble'    detail view: the opened bubble stays, the others fade away
import * as THREE from 'three';
import gsap from 'gsap';
import { createCarousel, layoutFor } from '../carousel.js';
import { SCENE_EVENTS } from '../events.js';
import { IMAGE_FRAGMENT, IMAGE_VERTEX, SHELL_FRAGMENT, SHELL_VERTEX } from './shaders.js';
import { BUBBLE_COLORS, paletteUniforms, srgbVector } from './colors.js';
import { RippleTransition } from './RippleTransition.js';

// Matches the OVERWORLD camera target height.
const ROW_Y = 0.35;
const HOVER_SCALE = 1.08;
const HIT_RIPPLE = { duration: 2.25, ease: 'power4.out' };

export class BubbleField {
  constructor(experience, { offers, events, onOpen }) {
    this.experience = experience;
    this.offers = offers;
    this.events = events;
    this.onOpen = onOpen;
    this.mode = 'idle';
    this.hovered = -1;
    this.openedIndex = -1;
    this.pointer = new THREE.Vector2();
    this.pointerInside = false;
    this.raycaster = new THREE.Raycaster();
    this.textures = [];
    this.disposed = false;

    const { spacing, radius } = layoutFor(experience.camera.aspect);
    this.radius = radius;
    this.carousel = createCarousel({ count: offers.length, spacing });

    this.group = new THREE.Group();
    this.group.position.y = ROW_Y;
    experience.scene.add(this.group);

    this.shellGeometry = new THREE.SphereGeometry(1, 64, 48);
    this.imageGeometry = new THREE.PlaneGeometry(1, 1);
    this.hitGeometry = new THREE.IcosahedronGeometry(1, 2);
    this.hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
    this.bubbles = offers.map((offer, i) => this.createBubble(offer, i));

    this.transition = new RippleTransition(experience.scene);

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onResize = this.onResize.bind(this);
    const { canvas } = experience;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    canvas.addEventListener('wheel', this.onWheel, { passive: true });
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('resize', this.onResize);

    this.offTick = experience.onTick((tick) => this.update(tick));
  }

  createBubble(offer, index) {
    const root = new THREE.Group();
    const fallback = new THREE.Color(BUBBLE_COLORS[index % BUBBLE_COLORS.length]).lerp(new THREE.Color(0xfffaed), 0.55);

    const imageMaterial = new THREE.ShaderMaterial({
      vertexShader: IMAGE_VERTEX,
      fragmentShader: IMAGE_FRAGMENT,
      transparent: true,
      uniforms: {
        uMap: { value: null },
        uHasMap: { value: 0 },
        uFallback: { value: fallback },
        uOpacity: { value: 1 },
      },
    });
    const image = new THREE.Mesh(this.imageGeometry, imageMaterial);
    image.scale.setScalar(1.72);
    image.renderOrder = 1;

    const shellMaterial = new THREE.ShaderMaterial({
      vertexShader: SHELL_VERTEX,
      fragmentShader: SHELL_FRAGMENT,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: index * 0.37 },
        uWobble: { value: 0.045 },
        uHitPoint: { value: new THREE.Vector3(0, 0, 1) },
        uHitProgress: { value: 0 },
        uOpacity: { value: 1 },
        uTint: { value: srgbVector(0xfffaed) },
        ...paletteUniforms(),
      },
    });
    const shell = new THREE.Mesh(this.shellGeometry, shellMaterial);
    shell.renderOrder = 2;

    const hit = new THREE.Mesh(this.hitGeometry, this.hitMaterial);
    hit.userData.index = index;

    root.add(image, shell, hit);
    root.scale.setScalar(this.radius);
    this.group.add(root);
    return { offer, root, image, shell, hit, imageMaterial, shellMaterial, phase: index * 1.7, opacity: 1 };
  }

  // Lazy: call once the scene is on screen. A failed texture keeps the fallback color.
  loadTextures() {
    const loader = new THREE.TextureLoader();
    for (const bubble of this.bubbles) {
      loader.load(
        bubble.offer.image,
        (texture) => {
          if (this.disposed) {
            texture.dispose();
            return;
          }
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = 4;
          this.textures.push(texture);
          bubble.imageMaterial.uniforms.uMap.value = texture;
          bubble.imageMaterial.uniforms.uHasMap.value = 1;
        },
        undefined,
        () => console.warn(`[bubbles] could not load ${bubble.offer.image}, using a flat color.`),
      );
    }
  }

  setMode(mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    if (mode !== 'overworld') this.setHovered(-1);
    if (mode !== 'bubble') this.openedIndex = -1;
  }

  // Detail view opened from the DOM (list, prev / next): keep that bubble centered.
  showOpened(id) {
    const index = this.offers.findIndex((offer) => offer.id === id);
    if (index < 0) return;
    this.openedIndex = index;
    this.carousel.focusIndex(index);
  }

  focusById(id) {
    const index = this.offers.findIndex((offer) => offer.id === id);
    if (index >= 0) this.carousel.focusIndex(index);
  }

  // ---------------------------------------------------------------- input

  updatePointer(event) {
    this.pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
  }

  pick() {
    this.raycaster.setFromCamera(this.pointer, this.experience.camera);
    const hits = this.raycaster.intersectObjects(
      this.bubbles.map((b) => b.hit),
      false,
    );
    return hits[0] ?? null;
  }

  onPointerDown(event) {
    if (this.mode !== 'overworld' || this.transition.playing) return;
    this.updatePointer(event);
    this.carousel.pointerDown(event.clientX);
  }

  onPointerMove(event) {
    this.pointerInside = event.target === this.experience.canvas;
    this.updatePointer(event);
    this.carousel.pointerMove(event.clientX);
  }

  onPointerUp(event) {
    const { click } = this.carousel.pointerUp(event.clientX);
    if (!click || this.mode !== 'overworld' || this.transition.playing) return;
    this.updatePointer(event);
    const hit = this.pick();
    if (hit) this.open(hit.object.userData.index);
  }

  onPointerLeave() {
    this.pointerInside = false;
  }

  onWheel(event) {
    if (this.mode !== 'overworld' || this.transition.playing) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    this.carousel.wheel(delta);
  }

  onResize() {
    const { spacing, radius } = layoutFor(this.experience.camera.aspect);
    this.carousel.setSpacing(spacing);
    this.radius = radius;
  }

  setHovered(index, point = null) {
    if (index === this.hovered) return;
    this.hovered = index;
    this.experience.canvas.style.cursor = index >= 0 ? 'pointer' : '';
    this.events?.emit(SCENE_EVENTS.BUBBLE_HOVER, { id: index >= 0 ? this.offers[index].id : null });
    if (index < 0 || !point) return;
    const bubble = this.bubbles[index];
    const u = bubble.shellMaterial.uniforms;
    u.uHitPoint.value.copy(bubble.hit.worldToLocal(point.clone())).normalize();
    gsap.killTweensOf(u.uHitProgress);
    gsap.fromTo(u.uHitProgress, { value: 0 }, { value: 1, ...HIT_RIPPLE });
  }

  // Click: center the bubble, ripple the whole screen, open the detail when covered.
  open(index) {
    const { id } = this.offers[index];
    this.events?.emit(SCENE_EVENTS.BUBBLE_CLICK, { id });
    this.carousel.focusIndex(index);
    this.openedIndex = index;
    this.setHovered(-1);

    const screen = this.bubbles[index].root.getWorldPosition(new THREE.Vector3()).project(this.experience.camera);
    const center = [screen.x * 0.5 + 0.5, screen.y * 0.5 + 0.5];
    this.events?.emit(SCENE_EVENTS.TRANSITION_START, { id, kind: 'enter' });
    this.transition.play({
      center,
      onCovered: () => this.onOpen?.(id),
      onDone: () => this.events?.emit(SCENE_EVENTS.TRANSITION_END, { id, kind: 'enter' }),
    });
  }

  // ---------------------------------------------------------------- frame

  update({ elapsed, delta }) {
    const interactive = this.mode === 'overworld' && !this.transition.playing;
    this.carousel.update(delta);

    if (interactive && this.pointerInside && !this.carousel.dragging) {
      const hit = this.pick();
      this.setHovered(hit ? hit.object.userData.index : -1, hit?.point);
    } else if (this.hovered >= 0 && !this.transition.playing) {
      this.setHovered(-1);
    }

    const ease = 1 - Math.pow(0.002, delta);
    this.bubbles.forEach((bubble, i) => {
      const t = this.carousel.itemTransform(i);
      bubble.root.position.set(t.x, Math.sin(elapsed * 0.9 + bubble.phase) * 0.05, t.z);
      bubble.root.rotation.y = t.rotationY;
      bubble.root.visible = Math.abs(t.x) < 7;

      const scale = this.radius * (i === this.hovered ? HOVER_SCALE : 1);
      bubble.root.scale.setScalar(THREE.MathUtils.lerp(bubble.root.scale.x, scale, ease));

      const hidden = this.mode === 'bubble' && this.openedIndex >= 0 && i !== this.openedIndex;
      bubble.opacity = THREE.MathUtils.lerp(bubble.opacity, hidden ? 0 : 1, ease);
      bubble.shellMaterial.uniforms.uTime.value = elapsed;
      bubble.shellMaterial.uniforms.uOpacity.value = bubble.opacity;
      bubble.imageMaterial.uniforms.uOpacity.value = bubble.opacity;
    });

    this.transition.update(elapsed, this.experience.camera.aspect);
  }

  // Screen anchor for the HTML title pill: hovered bubble, else the settled focus.
  getLabel() {
    if (this.mode !== 'overworld' || this.transition.playing) return null;
    let index = this.hovered;
    if (index < 0 && !this.carousel.dragging && Math.abs(this.carousel.velocity) < 0.01) {
      index = this.carousel.focusedIndex();
    }
    if (index < 0) return null;
    const { root } = this.bubbles[index];
    const anchor = root.getWorldPosition(new THREE.Vector3());
    anchor.y -= root.scale.x * 1.25;
    anchor.project(this.experience.camera);
    return {
      id: this.offers[index].id,
      title: this.offers[index].title,
      x: (anchor.x * 0.5 + 0.5) * window.innerWidth,
      y: (-anchor.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  dispose() {
    this.disposed = true;
    this.offTick?.();
    const { canvas } = this.experience;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointerleave', this.onPointerLeave);
    canvas.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('resize', this.onResize);
    canvas.style.cursor = '';

    this.transition.dispose();
    for (const bubble of this.bubbles) {
      gsap.killTweensOf(bubble.shellMaterial.uniforms.uHitProgress);
      bubble.shellMaterial.dispose();
      bubble.imageMaterial.dispose();
    }
    this.textures.forEach((texture) => texture.dispose());
    this.textures = [];
    this.shellGeometry.dispose();
    this.imageGeometry.dispose();
    this.hitGeometry.dispose();
    this.hitMaterial.dispose();
    this.experience.scene.remove(this.group);
  }
}
