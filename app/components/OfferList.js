// Accessible way into the WebGL bubbles (scene mode). The panel is visually hidden
// until the visitor opens it with the skip-link style "Ver lista de propuestas"
// toggle or tabs into it. Real buttons named after each offer; ←/→ (and ↑/↓,
// Home/End) move focus, which glides the carousel; Enter/Space opens.
import { defineComponent, h, ref, computed } from 'vue';

const PANEL_ID = 'offer-list-panel';

export default defineComponent({
  name: 'OfferList',
  props: {
    offers: { type: Array, required: true },
  },
  emits: ['open', 'focus'],
  setup(props, { emit }) {
    const expanded = ref(false);
    const focusWithin = ref(false);
    const visible = computed(() => expanded.value || focusWithin.value);
    const panel = ref(null);

    function moveFocus(event) {
      const buttons = [...(panel.value?.querySelectorAll('[data-offer-id]') ?? [])];
      const index = buttons.indexOf(event.target);
      if (index < 0) return;
      const last = buttons.length - 1;
      const targets = {
        ArrowRight: index === last ? 0 : index + 1,
        ArrowDown: index === last ? 0 : index + 1,
        ArrowLeft: index === 0 ? last : index - 1,
        ArrowUp: index === 0 ? last : index - 1,
        Home: 0,
        End: last,
      };
      if (!(event.key in targets)) return;
      event.preventDefault();
      buttons[targets[event.key]].focus();
    }

    const onFocusOut = (event) => {
      if (!panel.value?.contains(event.relatedTarget)) focusWithin.value = false;
    };

    return () =>
      h('nav', { 'aria-label': 'Lista de propuestas', class: 'offer-list' }, [
        h(
          'button',
          {
            type: 'button',
            class: ['btn-pill settings-pill offer-list__toggle', { 'is-open': visible.value }],
            'aria-expanded': String(expanded.value),
            'aria-controls': PANEL_ID,
            onClick: () => (expanded.value = !expanded.value),
          },
          expanded.value ? 'Ocultar lista de propuestas' : 'Ver lista de propuestas',
        ),
        h(
          'ul',
          {
            id: PANEL_ID,
            ref: panel,
            class: ['offer-list__panel', { 'sr-only': !visible.value }],
            onKeydown: moveFocus,
            onFocusin: () => (focusWithin.value = true),
            onFocusout: onFocusOut,
          },
          props.offers.map((offer) =>
            h('li', { key: offer.id }, [
              h(
                'button',
                {
                  type: 'button',
                  class: 'offer-list__item',
                  'data-offer-id': offer.id,
                  onClick: () => emit('open', offer.id),
                  onFocus: () => emit('focus', offer.id),
                },
                offer.title,
              ),
            ]),
          ),
        ),
      ]);
  },
});
