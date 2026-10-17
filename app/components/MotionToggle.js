// "Reducir movimiento" toggle (always visible, next to the sound toggle).
// Pressed = static mode: no canvas, no drift, no intro.
import { defineComponent, h } from 'vue';

export default defineComponent({
  name: 'MotionToggle',
  props: {
    reduced: { type: Boolean, default: false },
  },
  emits: ['toggle'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          type: 'button',
          class: 'btn-pill settings-pill',
          'aria-label': 'Reducir movimiento',
          'aria-pressed': String(props.reduced),
          onClick: () => emit('toggle'),
        },
        [
          h('svg', { viewBox: '0 0 24 24', width: 20, height: 20, 'aria-hidden': 'true', fill: 'currentColor' }, [
            h('path', {
              d: props.reduced
                ? 'M7 5h4v14H7zm6 0h4v14h-4z'
                : 'M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0l-1.6 1c-1.4-2.8-2.4-2.8-3.8 0-2.8 5.2-5.4 5.2-8.2 0-1.4-2.8-2.4-2.8-3.8 0z',
            }),
          ]),
          h('span', { class: 'hidden sm:inline' }, 'Reducir movimiento'),
        ],
      );
  },
});
