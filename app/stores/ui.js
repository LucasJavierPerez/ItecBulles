import { defineStore } from 'pinia';
import { offers } from '../data/content.js';

// UI state machine, mirroring the Projet Bulles `ui` store:
//   home -> intro -> overworld <-> bubble
// Every action guards its source step; invalid transitions are silent no-ops so the
// 3D scene and the DOM can fire events freely without corrupting the flow.
export const STEPS = ['home', 'intro', 'overworld', 'bubble'];

const OFFER_IDS = new Set(offers.map((offer) => offer.id));

export const useUiStore = defineStore('ui', {
  state: () => ({
    currentStep: 'home',
    introComplete: false,
    activeBubbleId: null,
    completedTutorials: [],
    muted: false,
    reducedMotion: false,
  }),

  getters: {
    activeOffer: (state) => offers.find((offer) => offer.id === state.activeBubbleId) ?? null,
  },

  actions: {
    startExperience() {
      if (this.currentStep !== 'home') return;
      if (this.reducedMotion) {
        // Reduced motion: no camera fly-through, go straight to the bubbles.
        this.introComplete = true;
        this.currentStep = 'overworld';
        return;
      }
      this.currentStep = 'intro';
    },

    completeIntro() {
      if (this.currentStep !== 'intro') return;
      this.introComplete = true;
      this.currentStep = 'overworld';
    },

    skipIntro() {
      this.completeIntro();
    },

    openBubble(id) {
      if (this.currentStep !== 'overworld' || !OFFER_IDS.has(id)) return;
      this.activeBubbleId = id;
      this.currentStep = 'bubble';
    },

    closeBubble() {
      if (this.currentStep !== 'bubble') return;
      this.activeBubbleId = null;
      this.currentStep = 'overworld';
    },

    completeTutorial(name) {
      if (typeof name !== 'string' || name.trim() === '') return;
      if (!this.completedTutorials.includes(name)) this.completedTutorials.push(name);
    },

    toggleMute() {
      this.muted = !this.muted;
    },

    setReducedMotion(value) {
      this.reducedMotion = Boolean(value);
    },
  },
});
