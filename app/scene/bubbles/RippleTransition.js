// Full-screen ripple played when a bubble is chosen: an overlay quad drawn last,
// in clip space, so it needs no render target or post-processing pipeline.
import * as THREE from 'three';
import gsap from 'gsap';
import { RIPPLE_FRAGMENT, RIPPLE_VERTEX } from './shaders.js';
import { paletteUniforms, srgbVector } from './colors.js';

export const RIPPLE_DURATION = 1.1;

export class RippleTransition {
  constructor(scene) {
    this.scene = scene;
    this.material = new THREE.ShaderMaterial({
      vertexShader: RIPPLE_VERTEX,
      fragmentShader: RIPPLE_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uCenter: { value: new THREE.Vector2(0.5, 0.5) },
        uCream: { value: srgbVector(0xfffaed) },
        ...paletteUniforms(),
      },
    });
    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1000;
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.tween = null;
  }

  get playing() {
    return this.tween !== null;
  }

  // center: [0..1, 0..1] screen uv (y up). onCovered fires once the screen is hidden.
  play({ center = [0.5, 0.5], onCovered, onDone } = {}) {
    this.tween?.kill();
    const u = this.material.uniforms;
    u.uCenter.value.set(center[0], center[1]);
    u.uProgress.value = 0;
    this.mesh.visible = true;
    let covered = false;
    this.tween = gsap.to(u.uProgress, {
      value: 1,
      duration: RIPPLE_DURATION,
      ease: 'power1.inOut',
      onUpdate: () => {
        if (!covered && u.uProgress.value >= 0.5) {
          covered = true;
          onCovered?.();
        }
      },
      onComplete: () => {
        this.mesh.visible = false;
        this.tween = null;
        onDone?.();
      },
    });
  }

  update(elapsed, aspect) {
    this.material.uniforms.uTime.value = elapsed;
    this.material.uniforms.uAspect.value = aspect;
  }

  dispose() {
    this.tween?.kill();
    this.tween = null;
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}
