<script setup>
// Mounts the three.js Experience behind the HTML UI and drives its camera from the
// ui store. Without WebGL, or with reduced motion, nothing is mounted: the CSS sky
// gradient on the page wrapper stays visible and the HTML steps keep working
// (app.vue then renders the static bubble grid, keyed on `ui.sceneActive`).
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useUiStore } from '~/stores/ui.js';
import { cameraPlanForStep } from '~/scene/cameraStates.js';
import { createLoader } from '~/scene/loader.js';
import { isWebGLAvailable } from '~/scene/renderSettings.js';
import { sceneEvents, SCENE_EVENTS } from '~/scene/events.js';
import { offers } from '~/data/content.js';
import { tintFor } from '~/data/detail.js';
import SceneLoader from '~/components/SceneLoader.js';

const ui = useUiStore();
const canvas = ref(null);
const enabled = ref(false);
const loading = ref(true);
const label = ref(null);
const labelText = ref('');

let experience = null;
let bubbles = null;
let offLabelTick = null;
let loader = null;
let webgl = false;

// ui step -> BubbleField mode ('home' hides the bubbles behind the hero copy).
const bubbleModeFor = (step) => (['home', 'overworld', 'bubble'].includes(step) ? step : 'idle');

// Positions the title pill under the hovered / focused bubble. Writes the DOM
// directly each frame; only the text goes through Vue, and only when it changes.
function updateLabel() {
  const el = label.value;
  if (!el) return;
  const anchor = bubbles?.getLabel();
  if (!anchor) {
    el.style.opacity = '0';
    return;
  }
  if (labelText.value !== anchor.title) labelText.value = anchor.title;
  el.style.opacity = '1';
  el.style.transform = `translate(${anchor.x}px, ${anchor.y}px) translate(-50%, 0)`;
}

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
    const [{ Experience }, { BubbleField }] = await Promise.all([
      import('~/scene/Experience.js'),
      import('~/scene/bubbles/BubbleField.js'),
    ]);
    if (!enabled.value || !canvas.value) return;
    // `?centro=arbol|circuitos|isotipo` swaps in a prototype centerpiece (resolved
    // inside the lazy scene chunk; no or unknown value -> the iTec building).
    experience = new Experience(canvas.value, {
      centerpiece: new URLSearchParams(window.location.search).get('centro'),
      animate: !ui.reducedMotion,
    });
    bubbles = new BubbleField(experience, {
      offers,
      events: sceneEvents,
      onOpen: (id) => ui.openBubble(id),
    });
    bubbles.setMode(bubbleModeFor(ui.currentStep));
    offLabelTick = experience.onTick(updateLabel);
    experience.warmUp();
    experience.start();
    ui.setSceneActive(true);
    syncCamera(ui.currentStep, null, { initial: true });
    // Textures are lazy: the bubbles show their fallback color until they arrive.
    bubbles.loadTextures();
    sceneEvents.emit(SCENE_EVENTS.READY, { experience });
  } catch (error) {
    console.warn('[scene] WebGL scene unavailable, using the static sky.', error);
    teardown();
  }
  loader?.done();
}

function teardown() {
  offLabelTick?.();
  offLabelTick = null;
  bubbles?.dispose();
  bubbles = null;
  experience?.dispose();
  experience = null;
  ui.setSceneActive(false);
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
    bubbles?.setMode(bubbleModeFor(step));
    syncCamera(step, prev);
  },
);

// Keyboard focus in the accessible list glides the carousel to that offer.
watch(
  () => ui.focusedBubbleId,
  (id) => bubbles?.focusById(id),
);

// Inner bubble: keep the opened bubble centered (also for list / prev-next opens)
// and tint the sky with its color; back in the overworld the sky returns.
watch(
  () => ui.activeBubbleId,
  (id) => {
    if (id) bubbles?.showOpened(id);
    experience?.setAmbiance(id ? tintFor(id) : null);
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
    <canvas
      v-if="enabled"
      ref="canvas"
      class="fixed inset-0 z-0 block h-full w-full touch-none"
      aria-hidden="true"
    />
    <!-- Decorative: the accessible names live in the overworld list in app.vue. -->
    <p
      v-if="enabled"
      ref="label"
      class="bubble-label pointer-events-none fixed top-0 left-0 z-20 opacity-0 transition-opacity duration-300"
      aria-hidden="true"
    >
      {{ labelText }}
    </p>
    <SceneLoader :visible="enabled && loading" />
  </div>
</template>
