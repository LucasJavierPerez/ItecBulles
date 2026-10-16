// One-time tutorial card (overworld and bubble), as in Projet Bulles. The parent
// decides when it shows and records the dismissal (ui.completeTutorial).
import { defineComponent, h } from 'vue';

export default defineComponent({
  name: 'TutorialHint',
  props: {
    message: { type: String, required: true },
  },
  emits: ['dismiss'],
  setup(props, { emit }) {
    return () =>
      h(
        'section',
        {
          'aria-label': 'Sugerencia',
          class: 'tutorial-hint fixed inset-x-4 bottom-6 z-40 mx-auto flex max-w-md items-center gap-4',
        },
        [
          h('p', { role: 'status', 'aria-live': 'polite', class: 'flex-1 text-left leading-snug' }, props.message),
          h('button', { type: 'button', class: 'btn-pill shrink-0', onClick: () => emit('dismiss') }, 'Entendido'),
        ],
      );
  },
});
