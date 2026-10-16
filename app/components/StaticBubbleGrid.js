// Static bubble grid for the no-WebGL / reduced-motion mode: circular CSS bubbles
// with the offer illustrations. Written as a render function so it can be unit
// tested without the Vue SFC compiler.
import { defineComponent, h } from 'vue';

export default defineComponent({
  name: 'StaticBubbleGrid',
  props: {
    offers: { type: Array, required: true },
  },
  emits: ['open'],
  setup(props, { emit }) {
    return () =>
      h(
        'ul',
        { class: 'grid w-full max-w-4xl grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4' },
        props.offers.map((offer) =>
          h('li', { key: offer.id, class: 'flex justify-center' }, [
            h(
              'button',
              {
                type: 'button',
                'data-offer-id': offer.id,
                class: 'static-bubble group flex flex-col items-center gap-3',
                onClick: () => emit('open', offer.id),
              },
              [
                h('span', { class: 'static-bubble__orb' }, [
                  h('img', {
                    src: offer.image,
                    alt: offer.imageAlt,
                    loading: 'lazy',
                    width: 160,
                    height: 160,
                    class: 'h-full w-full rounded-full object-cover',
                  }),
                ]),
                h('span', { class: 'bubble-label' }, offer.title),
              ],
            ),
          ]),
        ),
      );
  },
});
