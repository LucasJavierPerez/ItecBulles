// Fullscreen "Cargando…" overlay over the canvas while the scene warms up.
// The fade-out is a CSS class plus a setTimeout instead of a Vue <Transition>:
// <Transition> advances on requestAnimationFrame, which never fires in a hidden
// tab, so the overlay could stay stuck after the loader resolved. When the tab is
// hidden at that moment the overlay is removed at once (nobody sees the fade).
import { defineComponent, h, onBeforeUnmount, ref, watch } from 'vue';

export const LOADER_FADE_MS = 700;

export default defineComponent({
  name: 'SceneLoader',
  props: {
    visible: { type: Boolean, default: false },
  },
  setup(props) {
    const rendered = ref(props.visible);
    const leaving = ref(false);
    let timer = null;

    const clear = () => {
      clearTimeout(timer);
      timer = null;
    };

    watch(
      () => props.visible,
      (visible) => {
        clear();
        if (visible) {
          rendered.value = true;
          leaving.value = false;
          return;
        }
        if (!rendered.value) return;
        if (document.visibilityState === 'hidden') {
          rendered.value = false;
          leaving.value = false;
          return;
        }
        leaving.value = true;
        timer = setTimeout(() => {
          rendered.value = false;
          leaving.value = false;
          timer = null;
        }, LOADER_FADE_MS);
      },
    );

    onBeforeUnmount(clear);

    return () =>
      rendered.value
        ? h(
            'div',
            {
              'data-scene-loader': '',
              class: [
                'scene-loader bg-sky fixed inset-0 z-30 flex flex-col items-center justify-center gap-4',
                { 'is-leaving': leaving.value },
              ],
              role: 'status',
              'aria-live': 'polite',
            },
            [
              h('span', { class: 'loader-dot', 'aria-hidden': 'true' }),
              h('p', { class: 'text-2xl font-medium' }, 'Cargando…'),
            ],
          )
        : null;
  },
});
