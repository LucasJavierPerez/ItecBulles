import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useUiStore } from '../app/stores/ui.js';
import { createEmitter } from '../app/scene/events.js';
import { connectSound } from '../app/audio/connectSound.js';
import { MUTED_STORAGE_KEY, VOLUME_STORAGE_KEY } from '../app/audio/soundManager.js';
import SoundToggle from '../app/components/SoundToggle.js';
import { offers } from '../app/data/content.js';

function fakeManager() {
  return { unlock: vi.fn(async () => {}), play: vi.fn(), setMuted: vi.fn(), setVolume: vi.fn(), setHidden: vi.fn(), dispose: vi.fn() };
}

describe('connectSound', () => {
  let ui;
  let events;
  let manager;
  let disconnect;

  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    ui = useUiStore();
    events = createEmitter();
    manager = fakeManager();
    disconnect = connectSound({ ui, events, manager });
  });

  afterEach(() => disconnect());

  it('unlocks audio on the first gesture only', () => {
    document.dispatchEvent(new Event('pointerdown'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(manager.unlock).toHaveBeenCalledTimes(1);
  });

  it('plays the sounds of scene events', () => {
    events.emit('bubble:hover', { id: offers[0].id });
    events.emit('bubble:hover', { id: null });
    events.emit('bubble:click', { id: offers[0].id });
    events.emit('transition:start', { id: offers[0].id, kind: 'enter' });
    expect(manager.play.mock.calls.map((c) => c[0])).toEqual(['hover', 'click', 'whoosh']);
  });

  it('plays open, switch and close from the store', async () => {
    ui.startExperience();
    ui.completeIntro();
    ui.openBubble(offers[0].id);
    await nextTick();
    ui.switchBubble(offers[1].id);
    await nextTick();
    ui.closeBubble();
    await nextTick();
    expect(manager.play.mock.calls.map((c) => c[0])).toEqual(['click', 'click', 'close']);
  });

  it('plays a hover when the keyboard focuses an offer in the list', async () => {
    ui.focusBubble(offers[2].id);
    await nextTick();
    expect(manager.play).toHaveBeenCalledWith('hover');
  });

  it('forwards the mute state immediately and on change', async () => {
    expect(manager.setMuted).toHaveBeenLastCalledWith(false);
    ui.toggleMute();
    await nextTick();
    expect(manager.setMuted).toHaveBeenLastCalledWith(true);
  });

  it('forwards the master volume immediately and on change', async () => {
    expect(manager.setVolume).toHaveBeenLastCalledWith(0.7);
    ui.setVolume(0.25);
    await nextTick();
    expect(manager.setVolume).toHaveBeenLastCalledWith(0.25);
  });

  it('stops listening after disconnect', () => {
    disconnect();
    events.emit('bubble:click', { id: offers[0].id });
    document.dispatchEvent(new Event('pointerdown'));
    expect(manager.play).not.toHaveBeenCalled();
    expect(manager.unlock).not.toHaveBeenCalled();
    disconnect = () => {};
  });
});

describe('ui store mute persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('persists the mute toggle and restores it', () => {
    const ui = useUiStore();
    ui.toggleMute();
    expect(localStorage.getItem(MUTED_STORAGE_KEY)).toBe('1');
    setActivePinia(createPinia());
    const fresh = useUiStore();
    fresh.hydratePreferences();
    expect(fresh.muted).toBe(true);
  });
});

describe('ui store volume', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('starts at 70 % and clamps, persists and restores the volume', () => {
    const ui = useUiStore();
    expect(ui.volume).toBe(0.7);
    ui.setVolume(1.8);
    expect(ui.volume).toBe(1);
    ui.setVolume(0.45);
    expect(localStorage.getItem(VOLUME_STORAGE_KEY)).toBe('0.45');
    setActivePinia(createPinia());
    const fresh = useUiStore();
    fresh.hydratePreferences();
    expect(fresh.volume).toBe(0.45);
  });

  it('shows volume 0 as muted and unmutes when the volume goes back up', () => {
    const ui = useUiStore();
    ui.setVolume(0);
    expect(ui.muted).toBe(true);
    expect(localStorage.getItem(MUTED_STORAGE_KEY)).toBe('1');
    ui.setVolume(0.3);
    expect(ui.muted).toBe(false);
    expect(localStorage.getItem(MUTED_STORAGE_KEY)).toBe('0');
  });

  it('moving the slider while muted brings the sound back', () => {
    const ui = useUiStore();
    ui.toggleMute();
    ui.setVolume(0.6);
    expect(ui.muted).toBe(false);
    expect(ui.volume).toBe(0.6);
  });

  it('unmuting at volume 0 restores the default volume', () => {
    const ui = useUiStore();
    ui.setVolume(0);
    ui.toggleMute();
    expect(ui.muted).toBe(false);
    expect(ui.volume).toBe(0.7);
  });

  it('restores a stored volume of 0 as muted', () => {
    localStorage.setItem(VOLUME_STORAGE_KEY, '0');
    const ui = useUiStore();
    ui.hydratePreferences();
    expect(ui.volume).toBe(0);
    expect(ui.muted).toBe(true);
  });
});

describe('SoundToggle', () => {
  let app;
  let root;
  afterEach(() => {
    app?.unmount();
    root?.remove();
  });

  function mount(props) {
    root = document.createElement('div');
    document.body.appendChild(root);
    app = createApp({ render: () => h(SoundToggle, props) });
    app.mount(root);
    return root.querySelector('.sound-control > button');
  }

  const panel = () => root.querySelector('.sound-popover');

  it('is a disclosure pill that reveals the volume control', async () => {
    const pill = mount({ muted: false, volume: 0.7 });
    expect(pill.getAttribute('aria-expanded')).toBe('false');
    expect(panel().hidden).toBe(true);
    expect(document.getElementById(pill.getAttribute('aria-controls'))).toBe(panel());
    pill.click();
    await nextTick();
    expect(pill.getAttribute('aria-expanded')).toBe('true');
    expect(panel().hidden).toBe(false);
    pill.click();
    await nextTick();
    expect(panel().hidden).toBe(true);
  });

  it('renders a labelled 0-100 slider and emits the new volume', async () => {
    const onVolume = vi.fn();
    const pill = mount({ muted: false, volume: 0.7, onVolume });
    pill.click();
    await nextTick();
    const slider = root.querySelector('input[type="range"]');
    expect(slider.getAttribute('aria-label')).toBe('Volumen');
    expect(slider.min).toBe('0');
    expect(slider.max).toBe('100');
    expect(slider.step).toBe('5');
    expect(slider.value).toBe('70');
    expect(slider.getAttribute('aria-valuetext')).toBe('70 %');
    slider.value = '35';
    slider.dispatchEvent(new Event('input'));
    expect(onVolume).toHaveBeenLastCalledWith(0.35);
  });

  it('shows 0 % when muted and keeps a separate mute button', async () => {
    const onToggle = vi.fn();
    const pill = mount({ muted: true, volume: 0.7, onToggle });
    pill.click();
    await nextTick();
    expect(root.querySelector('input[type="range"]').getAttribute('aria-valuetext')).toBe('0 %');
    const mute = panel().querySelector('button');
    expect(mute.getAttribute('aria-label')).toBe('Activar sonido');
    expect(mute.getAttribute('aria-pressed')).toBe('true');
    mute.click();
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('offers to mute while sound is on', async () => {
    const pill = mount({ muted: false, volume: 0.5 });
    pill.click();
    await nextTick();
    const mute = panel().querySelector('button');
    expect(mute.getAttribute('aria-label')).toBe('Silenciar sonido');
    expect(mute.getAttribute('aria-pressed')).toBe('false');
  });

  it('closes on Escape and returns focus to the pill', async () => {
    const pill = mount({ muted: false, volume: 0.7 });
    pill.click();
    await nextTick();
    const slider = root.querySelector('input[type="range"]');
    slider.focus();
    slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();
    expect(panel().hidden).toBe(true);
    expect(document.activeElement).toBe(pill);
  });

  it('closes when the visitor clicks elsewhere', async () => {
    const pill = mount({ muted: false, volume: 0.7 });
    pill.click();
    await nextTick();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await nextTick();
    expect(panel().hidden).toBe(true);
  });
});
