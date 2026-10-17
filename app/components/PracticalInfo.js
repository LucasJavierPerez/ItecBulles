// Persistent "Información práctica" footer: phone, email and WhatsApp are always on
// screen as selectable text + links; the drawer adds campuses with their published
// hours, socials and the links for current students (D-05: SiTec as a plain link,
// no login UI, D-01). The parent opens the drawer by default only on the desktop
// home screen (see data/layout.js). Its rendered height is published as the
// `--practical-info-height` CSS variable so the UI above can keep clear of it.
import { defineComponent, h, onBeforeUnmount, onMounted, ref } from 'vue';
import { campuses, contacts, links } from '../data/content.js';

const PANEL_ID = 'practical-info-panel';

const link = (href, text, external = false) =>
  h(
    'a',
    {
      href,
      class: 'practical-info__link',
      ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
    },
    text,
  );

const STUDENT_LINKS = [
  { label: 'Horarios de cursado', url: links.schedules },
  { label: 'Calendario académico', url: links.calendar },
  { label: 'SiTec', url: links.sitec },
];

export default defineComponent({
  name: 'PracticalInfo',
  props: {
    expanded: { type: Boolean, default: false },
  },
  emits: ['update:expanded'],
  setup(props, { emit }) {
    const footer = ref(null);
    let observer = null;
    const publishHeight = () => {
      const height = footer.value?.offsetHeight ?? 0;
      document.documentElement.style.setProperty('--practical-info-height', `${height}px`);
    };
    onMounted(() => {
      publishHeight();
      if (typeof ResizeObserver === 'function' && footer.value) {
        observer = new ResizeObserver(publishHeight);
        observer.observe(footer.value);
      }
    });
    onBeforeUnmount(() => {
      observer?.disconnect();
      document.documentElement.style.removeProperty('--practical-info-height');
    });

    // Phones keep the bar to two short lines: prefixes stay for screen readers only.
    const phoneHidden = (text) => h('span', { class: 'max-md:sr-only' }, text);

    const column = (title, children) =>
      h('div', { class: 'practical-info__column' }, [h('h3', { class: 'practical-info__subtitle' }, title), ...children]);

    return () =>
      h('footer', { ref: footer, class: 'practical-info', 'aria-labelledby': 'practical-info-title' }, [
        h(
          'div',
          {
            id: PANEL_ID,
            class: 'practical-info__panel',
            hidden: !props.expanded,
          },
          [
            ...campuses.map((campus) =>
              column(campus.name, [
                h('p', campus.address),
                h('ul', campus.hours.map((hours) => h('li', hours))),
              ]),
            ),
            column('WhatsApp', [
              h(
                'ul',
                contacts.whatsapp.map((line) => h('li', [`${line.label}: `, link(line.url, line.display, true)])),
              ),
              h(
                'p',
                { class: 'practical-info__socials' },
                contacts.socials.flatMap((social, i) => [i ? ' · ' : '', link(social.url, social.label, true)]),
              ),
            ]),
            column('Alumnos del iTec', [
              h('ul', STUDENT_LINKS.map((item) => h('li', [link(item.url, item.label, true)]))),
            ]),
          ],
        ),
        h('div', { class: 'practical-info__bar' }, [
          h(
            'h2',
            { id: 'practical-info-title', class: 'practical-info__title max-md:sr-only' },
            'Información práctica',
          ),
          h('p', { class: 'practical-info__contacts' }, [
            h('span', [phoneHidden('Tel. '), link(contacts.phone.href, contacts.phone.display)]),
            h('span', [link(contacts.email.href, contacts.email.address)]),
            ...contacts.whatsapp.map((line) => {
              const topic = line.label.replace('Informes de ', '');
              return h('span', [
                phoneHidden('WhatsApp '),
                `${topic.charAt(0).toUpperCase()}${topic.slice(1)}: `,
                link(line.url, line.display, true),
              ]);
            }),
          ]),
          h(
            'button',
            {
              type: 'button',
              class: 'btn-pill settings-pill',
              'aria-expanded': String(props.expanded),
              'aria-controls': PANEL_ID,
              onClick: () => emit('update:expanded', !props.expanded),
            },
            [
              h(
                'span',
                { class: 'max-md:sr-only' },
                props.expanded ? 'Ocultar sedes y horarios' : 'Sedes, horarios y alumnos',
              ),
              h('span', { class: 'md:hidden', 'aria-hidden': 'true' }, props.expanded ? 'Ocultar' : 'Sedes'),
            ],
          ),
        ]),
      ]);
  },
});
