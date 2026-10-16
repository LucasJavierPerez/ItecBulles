<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import { useUiStore } from '~/stores/ui.js';
import { institution, offers } from '~/data/content.js';
import StaticBubbleGrid from '~/components/StaticBubbleGrid.js';
import BubbleDetail from '~/components/BubbleDetail.js';
import TutorialHint from '~/components/TutorialHint.js';
import SoundToggle from '~/components/SoundToggle.js';
import { sceneEvents } from '~/scene/events.js';
import { createSoundManager } from '~/audio/soundManager.js';
import { connectSound } from '~/audio/connectSound.js';

const ui = useUiStore();

let motionQuery;
let disconnectSound = null;
let sound = null;
const syncMotion = () => ui.setReducedMotion(motionQuery.matches);

// One-time tutorials (Projet Bulles style), remembered in localStorage.
const tutorial = computed(() => {
  if (ui.currentStep === 'overworld' && ui.isTutorialPending('overworld')) {
    return {
      name: 'overworld',
      message: ui.sceneActive
        ? 'Arrastrá para explorar, tocá una burbuja para entrar.'
        : 'Tocá una burbuja para entrar y conocer cada propuesta.',
    };
  }
  if (ui.currentStep === 'bubble' && ui.isTutorialPending('bubble')) {
    return { name: 'bubble', message: 'Explorá la información y volvé cuando quieras.' };
  }
  return null;
});

// Closing the detail returns focus to the bubble (list button or static bubble)
// of the offer last shown; focusing a list button also glides the carousel to it.
watch(
  () => ui.activeBubbleId,
  async (id, previous) => {
    if (id || !previous) return;
    await nextTick();
    document.querySelector(`[data-offer-id="${previous}"]`)?.focus();
  },
);

onMounted(() => {
  ui.hydrateTutorials();
  ui.hydratePreferences();
  // Howls are created lazily on the first gesture (see soundManager.js).
  sound = createSoundManager();
  disconnectSound = connectSound({ ui, events: sceneEvents, manager: sound });
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  syncMotion();
  motionQuery.addEventListener('change', syncMotion);
});

onBeforeUnmount(() => {
  motionQuery?.removeEventListener('change', syncMotion);
  disconnectSound?.();
  sound?.dispose();
});
</script>

<template>
  <div class="bg-sky relative min-h-dvh overflow-hidden">
    <!-- Fullscreen three.js canvas behind the UI (static CSS sky when unavailable). -->
    <SceneCanvas />

    <!-- Always-visible settings (top-right). -->
    <div class="fixed top-4 right-4 z-50 flex gap-2 sm:top-6 sm:right-6">
      <SoundToggle :muted="ui.muted" @toggle="ui.toggleMute()" />
    </div>

    <!-- The UI layer lets pointer events through to the canvas; sections opt back in. -->
    <main
      class="pointer-events-none relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 text-center [&>section]:pointer-events-auto"
    >
      <section v-if="ui.currentStep === 'home'" aria-labelledby="home-title" class="max-w-2xl">
        <p class="mb-4 text-lg font-medium">{{ institution.name }} · {{ institution.motto }}</p>
        <h1 id="home-title" class="text-6xl leading-[0.9] font-bold sm:text-8xl">Elegí tu burbuja</h1>
        <p class="mx-auto mt-6 max-w-md text-lg leading-snug">
          Cada propuesta del iTec es una burbuja. Explorá las carreras y encontrá la tuya.
        </p>
        <button type="button" class="btn-pill mt-10 text-lg" @click="ui.startExperience()">
          Descubrir las propuestas
        </button>
        <p class="mt-4 text-sm opacity-80">Mejor con auriculares</p>
      </section>

      <section
        v-else-if="ui.currentStep === 'intro'"
        aria-label="Introducción"
        class="fixed right-6 bottom-6 sm:right-10 sm:bottom-10"
      >
        <!-- The camera intro plays in the canvas; skipping jumps to the bubbles. -->
        <button type="button" class="btn-pill" @click="ui.skipIntro()">Saltar intro</button>
      </section>

      <section
        v-else-if="ui.currentStep === 'overworld' && ui.sceneActive"
        aria-labelledby="overworld-title"
        class="fixed inset-x-0 top-8 px-6"
        style="pointer-events: none"
      >
        <!-- WebGL bubbles live in the canvas. This list is the visually hidden but
             accessible way in (T6 finalizes it); focusing a button glides the carousel. -->
        <h2 id="overworld-title" class="text-3xl font-bold sm:text-4xl">Propuestas</h2>
        <p class="mt-2 text-base">Arrastrá o usá la rueda para explorar. Tocá una burbuja para entrar.</p>
        <ul class="sr-only">
          <li v-for="offer in offers" :key="offer.id">
            <button
              type="button"
              :data-offer-id="offer.id"
              @click="ui.openBubble(offer.id)"
              @focus="ui.focusBubble(offer.id)"
            >
              {{ offer.title }}
            </button>
          </li>
        </ul>
      </section>

      <section v-else-if="ui.currentStep === 'overworld'" aria-labelledby="overworld-title" class="py-16">
        <!-- Static mode (no WebGL or reduced motion): CSS bubbles with the illustrations. -->
        <h2 id="overworld-title" class="mb-8 text-4xl font-bold">Propuestas</h2>
        <StaticBubbleGrid :offers="offers" @open="ui.openBubble" />
      </section>

      <!-- Inner bubble: offer detail over the (tinted) canvas. -->
      <BubbleDetail
        v-else-if="ui.currentStep === 'bubble' && ui.activeOffer"
        :offer="ui.activeOffer"
        :reduced-motion="ui.reducedMotion"
        @close="ui.closeBubble()"
        @navigate="ui.switchBubble"
      />

      <TutorialHint
        v-if="tutorial"
        :key="tutorial.name"
        :message="tutorial.message"
        @dismiss="ui.completeTutorial(tutorial.name)"
      />
    </main>
  </div>
</template>
