import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useUiStore, STEPS } from '../app/stores/ui.js';
import { offers } from '../app/data/content.js';

const validId = offers[1].id;

function storeAt(step) {
  const ui = useUiStore();
  if (step === 'home') return ui;
  ui.startExperience();
  if (step === 'intro') return ui;
  ui.completeIntro();
  if (step === 'overworld') return ui;
  ui.openBubble(validId);
  return ui;
}

describe('ui store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts at home with default flags', () => {
    const ui = useUiStore();
    expect(ui.currentStep).toBe('home');
    expect(ui.introComplete).toBe(false);
    expect(ui.activeBubbleId).toBeNull();
    expect(ui.completedTutorials).toEqual([]);
    expect(ui.muted).toBe(false);
    expect(ui.reducedMotion).toBe(false);
  });

  it('exposes the four steps', () => {
    expect(STEPS).toEqual(['home', 'intro', 'overworld', 'bubble']);
  });

  it('startExperience goes home -> intro', () => {
    const ui = useUiStore();
    ui.startExperience();
    expect(ui.currentStep).toBe('intro');
  });

  it('startExperience skips the intro when reduced motion is on', () => {
    const ui = useUiStore();
    ui.setReducedMotion(true);
    ui.startExperience();
    expect(ui.currentStep).toBe('overworld');
    expect(ui.introComplete).toBe(true);
  });

  it('startExperience is a no-op outside home', () => {
    const ui = storeAt('overworld');
    ui.startExperience();
    expect(ui.currentStep).toBe('overworld');
  });

  it('completeIntro and skipIntro go intro -> overworld', () => {
    const a = storeAt('intro');
    a.completeIntro();
    expect(a.currentStep).toBe('overworld');
    expect(a.introComplete).toBe(true);

    setActivePinia(createPinia());
    const b = storeAt('intro');
    b.skipIntro();
    expect(b.currentStep).toBe('overworld');
    expect(b.introComplete).toBe(true);
  });

  it('completeIntro is a no-op outside intro', () => {
    const ui = useUiStore();
    ui.completeIntro();
    ui.skipIntro();
    expect(ui.currentStep).toBe('home');
    expect(ui.introComplete).toBe(false);
  });

  it('openBubble goes overworld -> bubble with a valid offer id', () => {
    const ui = storeAt('overworld');
    ui.openBubble(validId);
    expect(ui.currentStep).toBe('bubble');
    expect(ui.activeBubbleId).toBe(validId);
  });

  it('openBubble ignores unknown ids', () => {
    const ui = storeAt('overworld');
    ui.openBubble('not-an-offer');
    expect(ui.currentStep).toBe('overworld');
    expect(ui.activeBubbleId).toBeNull();
  });

  it('openBubble is a no-op outside overworld', () => {
    const ui = storeAt('intro');
    ui.openBubble(validId);
    expect(ui.currentStep).toBe('intro');
    expect(ui.activeBubbleId).toBeNull();
  });

  it('closeBubble goes bubble -> overworld and clears the active id', () => {
    const ui = storeAt('bubble');
    ui.closeBubble();
    expect(ui.currentStep).toBe('overworld');
    expect(ui.activeBubbleId).toBeNull();
  });

  it('closeBubble is a no-op outside bubble', () => {
    const ui = storeAt('intro');
    ui.closeBubble();
    expect(ui.currentStep).toBe('intro');
  });

  it('completeTutorial records each tutorial once', () => {
    const ui = useUiStore();
    ui.completeTutorial('overworld');
    ui.completeTutorial('overworld');
    ui.completeTutorial('bubble');
    expect(ui.completedTutorials).toEqual(['overworld', 'bubble']);
  });

  it('completeTutorial ignores empty names', () => {
    const ui = useUiStore();
    ui.completeTutorial('');
    ui.completeTutorial(undefined);
    expect(ui.completedTutorials).toEqual([]);
  });

  it('toggleMute flips muted', () => {
    const ui = useUiStore();
    ui.toggleMute();
    expect(ui.muted).toBe(true);
    ui.toggleMute();
    expect(ui.muted).toBe(false);
  });

  it('setReducedMotion coerces to boolean', () => {
    const ui = useUiStore();
    ui.setReducedMotion(1);
    expect(ui.reducedMotion).toBe(true);
    ui.setReducedMotion(0);
    expect(ui.reducedMotion).toBe(false);
  });
});
