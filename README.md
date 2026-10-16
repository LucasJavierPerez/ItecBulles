# ItecBulles

Landing page for iTec Río Cuarto prospective students: every educational offer is a bubble, built with
real content from <https://www.itecriocuarto.org.ar/>. Design log: `docs/bitacora/bitacora.html`.
Visual and technical reference: `docs/referencia/bulles-teardown.md` (Projet Bulles).

## Run

```bash
npm install      # also runs `nuxt prepare`
npm run dev      # Nuxt dev server
npm test         # Vitest (jsdom), content model + UI store
npm run build    # static site in .output/public (nuxt generate)
npm run preview  # serve the build
```

## Stack

Nuxt 4 + Vue 3, Pinia, Tailwind CSS v4, three.js, GSAP, Howler.js, Vitest. Same stack as Projet Bulles,
minus the CMS: content lives in a local file.

**SPA mode (`ssr: false`).** The experience is a client-only WebGL canvas with an HTML layer on top, so
server rendering adds nothing. `nuxt generate` still produces a static site that any static host can serve.

## Structure

- `app/data/content.js` — content model; every offer cites its official source page. Missing facts are omitted, never invented.
- `app/stores/ui.js` — UI state machine: `home → intro → overworld ⇄ bubble`. Invalid transitions are no-ops; reduced motion skips the intro.
- `app/app.vue` — app shell; one section per step (the 3D scene arrives in later tasks).
- `app/assets/css/main.css` — Tailwind v4 tokens (`@theme`): Bulles palette, sky gradient, easings, `btn-pill`.
- `tests/` — Vitest specs.
