// Mute toggle, always visible (top-right pill). The label states the action.
import { defineComponent, h } from 'vue';

const ICON_ON = 'M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z';
const ICON_OFF = 'M4 9v6h4l5 4V5L8 9H4zm12.6 0L15 10.6 16.4 12 15 13.4l1.6 1.6 1.4-1.4 1.4 1.4 1.6-1.6L19.6 12 21 10.6 19.4 9 18 10.4z';

export default defineComponent({
  name: 'SoundToggle',
  props: {
    muted: { type: Boolean, default: false },
  },
  emits: ['toggle'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          type: 'button',
          class: 'btn-pill settings-pill',
          'aria-label': props.muted ? 'Activar sonido' : 'Silenciar sonido',
          'aria-pressed': String(props.muted),
          onClick: () => emit('toggle'),
        },
        [
          h('svg', { viewBox: '0 0 24 24', width: 20, height: 20, 'aria-hidden': 'true', fill: 'currentColor' }, [
            h('path', { d: props.muted ? ICON_OFF : ICON_ON }),
          ]),
          h('span', { class: 'hidden sm:inline' }, props.muted ? 'Sin sonido' : 'Sonido'),
        ],
      );
  },
});
