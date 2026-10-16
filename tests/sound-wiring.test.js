import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useUiStore } from '../app/stores/ui.js';
import { createEmitter } from '../app/scene/events.js';
import { connectSound } from '../app/audio/connectSound.js';
import { MUTED_STORAGE_KEY } from '../app/audio/soundManager.js';
import SoundToggle from '../app/components/SoundToggle.js';
import { offers } from '../app/data/content.js';

function fakeManager() {
  return { unlock: vi.fn(async () => {}), play: vi.fn(), setMuted: vi.fn(), setHidden: vi.fn(), dispose: vi.fn() };
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
    return root.querySelector('button');
  }

  it('offers to mute while sound is on', () => {
    const button = mount({ muted: false });
    expect(button.getAttribute('aria-label')).toBe('Silenciar sonido');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('offers to unmute while muted and emits toggle', () => {
    const onToggle = vi.fn();
    const button = mount({ muted: true, onToggle });
    expect(button.getAttribute('aria-label')).toBe('Activar sonido');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    button.click();
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
