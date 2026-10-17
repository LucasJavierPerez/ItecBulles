// Sound control, always visible (top-right pill).
// The pill is a disclosure button: it opens a small panel, on the same row and to
// its left (it never drops over the headings below), holding the "Volumen" slider
// and a separate mute button. Click / tap toggles the panel; with a mouse,
// hovering previews it. Escape, a click elsewhere or tabbing out closes it.
import { defineComponent, h, onBeforeUnmount, ref, watch } from 'vue';

const ICON_ON = 'M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z';
const ICON_OFF = 'M4 9v6h4l5 4V5L8 9H4zm12.6 0L15 10.6 16.4 12 15 13.4l1.6 1.6 1.4-1.4 1.4 1.4 1.6-1.6L19.6 12 21 10.6 19.4 9 18 10.4z';

const icon = (muted) =>
  h('svg', { viewBox: '0 0 24 24', width: 20, height: 20, 'aria-hidden': 'true', fill: 'currentColor' }, [
    h('path', { d: muted ? ICON_OFF : ICON_ON }),
  ]);

let uid = 0;

export default defineComponent({
  name: 'SoundToggle',
  props: {
    muted: { type: Boolean, default: false },
    // Master volume 0..1.
    volume: { type: Number, default: 0.7 },
  },
  emits: ['toggle', 'volume'],
  setup(props, { emit }) {
    const panelId = `sound-popover-${++uid}`;
    const root = ref(null);
    const pill = ref(null);
    // 'click' keeps the panel open; 'hover' is a mouse preview that closes on leave.
    const openedBy = ref(null);

    const close = () => (openedBy.value = null);

    const onDocumentPointer = (event) => {
      if (!root.value?.contains(event.target)) close();
    };
    watch(openedBy, (value) => {
      if (value) document.addEventListener('pointerdown', onDocumentPointer, true);
      else document.removeEventListener('pointerdown', onDocumentPointer, true);
    });
    onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointer, true));

    const percent = () => (props.muted ? 0 : Math.round(props.volume * 100));

    return () => {
      const open = openedBy.value !== null;
      const value = percent();
      return h(
        'div',
        {
          ref: root,
          class: 'sound-control',
          onMouseenter: () => (openedBy.value ??= 'hover'),
          onMouseleave: () => openedBy.value === 'hover' && close(),
          onFocusout: (event) => {
            if (!root.value?.contains(event.relatedTarget)) close();
          },
          onKeydown: (event) => {
            if (event.key !== 'Escape' || !open) return;
            close();
            pill.value?.focus();
          },
        },
        [
          h(
            'button',
            {
              ref: pill,
              type: 'button',
              class: 'btn-pill settings-pill',
              'aria-label': `Sonido, volumen ${value} %`,
              'aria-expanded': String(open),
              'aria-controls': panelId,
              onClick: () => (openedBy.value = openedBy.value === 'click' ? null : 'click'),
            },
            [icon(props.muted), h('span', { class: 'hidden sm:inline' }, props.muted ? 'Sin sonido' : 'Sonido')],
          ),
          h('div', { id: panelId, class: 'sound-popover', hidden: !open }, [
            h('div', { class: 'sound-popover__panel' }, [
              h(
                'button',
                {
                  type: 'button',
                  class: 'sound-popover__mute',
                  'aria-label': props.muted ? 'Activar sonido' : 'Silenciar sonido',
                  'aria-pressed': String(props.muted),
                  onClick: () => emit('toggle'),
                },
                [icon(props.muted)],
              ),
              h('span', { class: 'sound-popover__label', 'aria-hidden': 'true' }, 'Volumen'),
              h('input', {
                type: 'range',
                class: 'volume-slider',
                min: '0',
                max: '100',
                step: '5',
                value,
                'aria-label': 'Volumen',
                'aria-valuetext': `${value} %`,
                style: { '--fill': `${value}%` },
                onInput: (event) => emit('volume', Number(event.target.value) / 100),
              }),
              h('span', { class: 'sound-popover__value', 'aria-hidden': 'true' }, `${value} %`),
            ]),
          ]),
        ],
      );
    };
  },
});
