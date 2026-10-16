// Inner bubble: the detail view of one offer, drawn as HTML over the canvas.
// Render function (no SFC) so it can be unit tested with plain Vitest + jsdom.
//
// Layout: the offer (kind, title, summary, illustration, contact) sits in the
// middle; its info items float around it on desktop and stack below it on phones.
// Focus moves to the heading on open and whenever the offer changes; Escape and
// the back button emit `close`, prev / next emit `navigate` with the adjacent id.
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { KIND_LABELS, links } from '../data/content.js';
import { adjacentOffers, buildDetail, contactFor, tintFor } from '../data/detail.js';

const external = (href, text, extra = {}) =>
  h('a', { href, target: '_blank', rel: 'noopener noreferrer', ...extra }, text);

function renderItem(item, index, total) {
  // Alternate around the center column on desktop; rows fill top-down.
  const side = index % 2 === 0 ? 'lg:col-start-1' : 'lg:col-start-3';
  const body =
    item.values.length === 1
      ? h('p', { class: 'mt-1 leading-snug' }, item.values[0])
      : h(
          'ul',
          { class: 'mt-1 list-disc space-y-1 pl-5 leading-snug' },
          item.values.map((value) => h('li', { key: value }, value)),
        );
  return h(
    'li',
    {
      key: item.key,
      'data-detail-item': item.key,
      class: `detail-item ${side}`,
      style: { animationDelay: `${-((index * 1.7) % 7)}s`, zIndex: total - index },
    },
    [h('h3', { class: 'text-sm font-bold tracking-wide uppercase' }, item.label), body],
  );
}

export default defineComponent({
  name: 'BubbleDetail',
  props: {
    offer: { type: Object, required: true },
    reducedMotion: { type: Boolean, default: false },
  },
  emits: ['close', 'navigate'],
  setup(props, { emit }) {
    const heading = ref(null);
    const region = ref(null);

    const items = computed(() => buildDetail(props.offer));
    const adjacent = computed(() => adjacentOffers(props.offer.id));
    const contact = computed(() => contactFor(props.offer));
    const tint = computed(() => tintFor(props.offer.id));

    const focusHeading = () => heading.value?.focus();

    const onKeydown = (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented) emit('close');
    };

    onMounted(() => {
      document.addEventListener('keydown', onKeydown);
      focusHeading();
    });
    onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));

    watch(
      () => props.offer.id,
      async () => {
        await nextTick();
        if (region.value) region.value.scrollTop = 0;
        focusHeading();
      },
    );

    const navButton = (action, label, target) =>
      target &&
      h(
        'button',
        {
          type: 'button',
          'data-action': action,
          class: 'btn-pill flex-col !items-start gap-1 text-left',
          onClick: () => emit('navigate', target.id),
        },
        [h('span', { class: 'text-xs uppercase' }, label), h('span', { class: 'text-sm' }, target.title)],
      );

    return () => {
      const { offer } = props;
      const list = items.value;
      const rows = Math.max(1, Math.ceil(list.length / 2));
      return h(
        'section',
        {
          ref: region,
          'aria-labelledby': 'bubble-title',
          class: ['bubble-detail', { 'is-static': props.reducedMotion }],
          style: { '--tint': tint.value },
        },
        h('div', { class: 'mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-6' }, [
          h('div', { class: 'flex justify-start' }, [
            h(
              'button',
              { type: 'button', 'data-action': 'close', class: 'btn-pill', onClick: () => emit('close') },
              '← Volver a las burbujas',
            ),
          ]),
          h(
            'div',
            {
              class:
                'mt-8 grid grid-cols-1 gap-6 lg:grid-flow-row-dense lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)_minmax(0,1fr)] lg:items-center lg:gap-8',
            },
            [
              h(
                'div',
                {
                  class: 'flex flex-col items-center text-center lg:col-start-2 lg:row-start-1',
                  style: { gridRowEnd: `span ${rows}` },
                },
                [
                  h('p', { class: 'bubble-label' }, KIND_LABELS[offer.kind] ?? ''),
                  h(
                    'h2',
                    {
                      id: 'bubble-title',
                      ref: heading,
                      tabindex: '-1',
                      class: 'mt-4 text-4xl leading-none font-bold outline-none sm:text-5xl',
                    },
                    offer.title,
                  ),
                  h('p', { class: 'mt-4 text-lg leading-snug' }, offer.summary),
                  h('div', { class: 'detail-orb mt-6' }, [
                    h('img', {
                      src: offer.image,
                      alt: offer.imageAlt,
                      width: 224,
                      height: 224,
                      class: 'h-full w-full rounded-full object-cover',
                    }),
                  ]),
                  external(links.cta.url, links.cta.label, {
                    'data-cta': 'primary',
                    class: 'btn-pill btn-primary mt-8 text-lg',
                  }),
                  h('ul', { class: 'mt-5 flex flex-col items-center gap-2 text-base' }, [
                    h('li', [
                      external(contact.value.url, `WhatsApp · ${contact.value.label}: ${contact.value.display}`, {
                        class: 'detail-link',
                      }),
                    ]),
                    ...(offer.extraLinks ?? []).map((link) =>
                      h('li', { key: link.url }, [external(link.url, link.label, { class: 'detail-link' })]),
                    ),
                    h('li', [external(offer.source, 'Ver en el sitio oficial', { class: 'detail-link' })]),
                  ]),
                ],
              ),
              h(
                'ul',
                { class: 'detail-items', 'aria-label': `Información de ${offer.title}` },
                list.map((item, index) => renderItem(item, index, list.length)),
              ),
            ],
          ),
          h('nav', { 'aria-label': 'Otras propuestas', class: 'mt-10 flex flex-wrap justify-between gap-3' }, [
            navButton('prev', '← Anterior', adjacent.value.prev),
            navButton('next', 'Siguiente →', adjacent.value.next),
          ]),
        ]),
      );
    };
  },
});
