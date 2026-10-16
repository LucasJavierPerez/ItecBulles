// Inner bubble: the detail view of one offer, drawn as HTML over the canvas.
// Render function (no SFC) so it can be unit tested with plain Vitest + jsdom.
//
// Layout: one readable column (kind, title, summary, CTA, contact, then the info
// cards in a grid of wide cards) next to a visual stage. With the WebGL scene on,
// the stage is left empty for the opened 3D bubble, which the BUBBLE camera frames
// on the right (desktop) or at the top (phones); in static mode the stage holds
// the round HTML illustration instead, so there is only ever one bubble.
// Focus moves to the heading on open and whenever the offer changes; Escape and
// the back button emit `close`, prev / next emit `navigate` with the adjacent id.
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { KIND_LABELS, links } from '../data/content.js';
import { adjacentOffers, buildDetail, contactFor, tintFor } from '../data/detail.js';

const external = (href, text, extra = {}) =>
  h('a', { href, target: '_blank', rel: 'noopener noreferrer', ...extra }, text);

function renderItem(item, index, total) {
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
      class: 'detail-item',
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
    // The WebGL scene shows the opened bubble: no duplicate HTML illustration.
    sceneActive: { type: Boolean, default: false },
  },
  emits: ['close', 'navigate'],
  setup(props, { emit, slots }) {
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
      const stage = props.sceneActive
        ? h('div', { class: 'detail-stage', 'aria-hidden': 'true' })
        : h('div', { class: 'detail-stage' }, [
            h('div', { class: 'detail-orb' }, [
              h('img', {
                src: offer.image,
                alt: offer.imageAlt,
                width: 224,
                height: 224,
                class: 'h-full w-full rounded-full object-cover',
              }),
            ]),
          ]);
      return h(
        'section',
        {
          ref: region,
          'aria-labelledby': 'bubble-title',
          class: ['bubble-detail', { 'is-static': props.reducedMotion, 'has-scene': props.sceneActive }],
          style: { '--tint': tint.value },
        },
        h('div', { class: 'mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6' }, [
          h('div', { class: 'flex justify-start' }, [
            h(
              'button',
              { type: 'button', 'data-action': 'close', class: 'btn-pill', onClick: () => emit('close') },
              '← Volver a las burbujas',
            ),
          ]),
          slots.hint ? h('div', { class: 'mt-4' }, slots.hint()) : null,
          h('div', { class: 'detail-layout mt-6' }, [
            h('div', { class: 'detail-copy' }, [
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
              h('p', { class: 'detail-summary mt-4 text-lg leading-snug' }, offer.summary),
              external(links.cta.url, links.cta.label, {
                'data-cta': 'primary',
                class: 'btn-pill btn-primary mt-6 text-lg',
              }),
              h('ul', { class: 'mt-5 flex flex-col items-start gap-2 text-base' }, [
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
              h(
                'ul',
                { class: 'detail-items mt-8', 'aria-label': `Información de ${offer.title}` },
                list.map((item, index) => renderItem(item, index, list.length)),
              ),
            ]),
            stage,
          ]),
          h('nav', { 'aria-label': 'Otras propuestas', class: 'mt-10 flex flex-wrap justify-between gap-3' }, [
            navButton('prev', '← Anterior', adjacent.value.prev),
            navButton('next', 'Siguiente →', adjacent.value.next),
          ]),
        ]),
      );
    };
  },
});
