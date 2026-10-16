<script setup>
// Mounts the three.js Experience behind the HTML UI and drives its camera from the
// ui store. Without WebGL, or with reduced motion, nothing is mounted: the CSS sky
// gradient on the page wrapper stays visible and the HTML steps keep working.
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useUiStore } from '~/stores/ui.js';
import { cameraPlanForStep } from '~/scene/cameraStates.js';
import { createLoader } from '~/scene/loader.js';
import { isWebGLAvailable } from '~/scene/renderSettings.js';
import SceneLoader from '~/components/SceneLoader.vue';

const ui = useUiStore();
const canvas = ref(null);
const enabled = ref(false);
const loading = ref(true);

let experience = null;
let loader = null;
let webgl = false;

function syncCamera(step, prev, { initial = false } = {}) {
  if (!experience) return;
  const plan = cameraPlanForStep(step);
  if (plan.mode === 'path') {
    experience.playIntro().then((finished) => {
      if (finished) ui.completeIntro();
    });
    return;
  }
  if (prev === 'intro' && step === 'overworld') {
    // Skipped: jump to OVERWORLD. Finished naturally: the camera is already there.
    experience.skipIntro();
    return;
  }
  if (initial && step === 'home') {
    // Opening shot, as in Bulles: ease in from INTRO_HOME to HOME after loading.
    experience.goTo('INTRO_HOME', { immediate: true });
    experience.goTo('HOME', { duration: 2.4 });
    return;
  }
  experience.goTo(plan.state, { immediate: initial });
}

async function mountScene() {
  enabled.value = true;
  loading.value = true;
  loader = createLoader({
    onChange: ({ status }) => {
      if (status === 'ready') loading.value = false;
    },
  });
  loader.start();
  await nextTick();
  try {
    const { Experience } = await import('~/scene/Experience.js');
    if (!enabled.value || !canvas.value) return;
    experience = new Experience(canvas.value);
    experience.warmUp();
    experience.start();
    syncCamera(ui.currentStep, null, { initial: true });
  } catch (error) {
    console.warn('[scene] WebGL scene unavailable, using the static sky.', error);
    teardown();
  }
  loader?.done();
}

function teardown() {
  experience?.dispose();
  experience = null;
  enabled.value = false;
  loading.value = false;
  loader?.dispose();
}

function syncMode() {
  const wantsScene = webgl && !ui.reducedMotion;
  if (wantsScene && !enabled.value) mountScene();
  else if (!wantsScene) teardown();
}

watch(
  () => ui.currentStep,
  (step, prev) => {
    // Static mode has no camera flight: the intro completes at once.
    if (step === 'intro' && !enabled.value) {
      ui.completeIntro();
      return;
    }
    syncCamera(step, prev);
  },
);

watch(() => ui.reducedMotion, syncMode);

onMounted(async () => {
  webgl = isWebGLAvailable();
  // Wait one tick so the parent has synced prefers-reduced-motion into the store.
  await nextTick();
  syncMode();
});

onBeforeUnmount(teardown);
</script>

<template>
  <div>
    <canvas v-if="enabled" ref="canvas" class="fixed inset-0 z-0 block h-full w-full" aria-hidden="true" />
    <SceneLoader :visible="enabled && loading" />
  </div>
</template>
