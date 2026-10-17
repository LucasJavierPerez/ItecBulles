// One-time tutorial card (overworld and bubble), as in Projet Bulles. The parent
// decides when it shows and records the dismissal (ui.completeTutorial).
// It sits in the document flow where the parent places it (under the overworld
// header, under the detail's back button), so it never floats over a primary
// action such as "Quiero + Info" or the bubble title pill.
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
          class: 'tutorial-hint pointer-events-auto mx-auto flex w-full max-w-md items-center gap-4 text-left',
        },
        [
          h('p', { role: 'status', 'aria-live': 'polite', class: 'flex-1 text-left leading-snug' }, props.message),
          h('button', { type: 'button', class: 'btn-pill shrink-0', onClick: () => emit('dismiss') }, 'Entendido'),
        ],
      );
  },
});
