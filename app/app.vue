<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useUiStore } from '~/stores/ui.js';
import { institution, offers } from '~/data/content.js';

const ui = useUiStore();

let motionQuery;
const syncMotion = () => ui.setReducedMotion(motionQuery.matches);

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  syncMotion();
  motionQuery.addEventListener('change', syncMotion);
});

onBeforeUnmount(() => motionQuery?.removeEventListener('change', syncMotion));
</script>

<template>
  <div class="bg-sky relative min-h-dvh overflow-hidden">
    <!-- Fullscreen three.js canvas behind the UI (static CSS sky when unavailable). -->
    <SceneCanvas />

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
      </section>

      <section
        v-else-if="ui.currentStep === 'intro'"
        aria-label="Introducción"
        class="fixed right-6 bottom-6 sm:right-10 sm:bottom-10"
      >
        <!-- The camera intro plays in the canvas; skipping jumps to the bubbles. -->
        <button type="button" class="btn-pill" @click="ui.skipIntro()">Saltar intro</button>
      </section>

      <section v-else-if="ui.currentStep === 'overworld'" aria-labelledby="overworld-title">
        <!-- T4 replaces this list with the WebGL bubbles (T6 keeps it as the accessible fallback). -->
        <h2 id="overworld-title" class="mb-6 text-4xl font-bold">Propuestas</h2>
        <ul class="flex max-w-3xl flex-wrap justify-center gap-3">
          <li v-for="offer in offers" :key="offer.id">
            <button type="button" class="btn-pill" @click="ui.openBubble(offer.id)">
              {{ offer.title }}
            </button>
          </li>
        </ul>
      </section>

      <section
        v-else-if="ui.currentStep === 'bubble' && ui.activeOffer"
        aria-labelledby="bubble-title"
        class="max-w-2xl"
      >
        <!-- T5 builds the inner bubble view here. -->
        <h2 id="bubble-title" class="text-5xl leading-none font-bold">{{ ui.activeOffer.title }}</h2>
        <p class="mt-6 text-lg leading-snug">{{ ui.activeOffer.summary }}</p>
        <button type="button" class="btn-pill mt-10" @click="ui.closeBubble()">
          Volver a las burbujas
        </button>
      </section>
    </main>
  </div>
</template>
