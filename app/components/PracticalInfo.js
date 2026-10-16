// Persistent "Información práctica" footer: phone, email and WhatsApp are always on
// screen as selectable text + links; the drawer adds campuses with their published
// hours, socials and the links for current students (D-05: SiTec as a plain link,
// no login UI, D-01). The parent opens the drawer by default on the home screen.
import { defineComponent, h } from 'vue';
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
    const column = (title, children) =>
      h('div', { class: 'practical-info__column' }, [h('h3', { class: 'practical-info__subtitle' }, title), ...children]);

    return () =>
      h('footer', { class: 'practical-info', 'aria-labelledby': 'practical-info-title' }, [
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
          h('h2', { id: 'practical-info-title', class: 'practical-info__title' }, 'Información práctica'),
          h('p', { class: 'practical-info__contacts' }, [
            h('span', ['Tel. ', link(contacts.phone.href, contacts.phone.display)]),
            h('span', [link(contacts.email.href, contacts.email.address)]),
            ...contacts.whatsapp.map((line) =>
              h('span', [`WhatsApp ${line.label.replace('Informes de ', '')}: `, link(line.url, line.display, true)]),
            ),
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
            props.expanded ? 'Ocultar sedes y horarios' : 'Sedes, horarios y alumnos',
          ),
        ]),
      ]);
  },
});
