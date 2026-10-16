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

## Bubble illustrations

Each bubble shows a flat illustration derived from a photo on the official site. There is no image model:
a deterministic `sharp` script stylizes the photos.

- `assets/photos/<offer-id>.<ext>` — the official photos (large PNGs re-encoded as JPEG q92).
- `assets/photos/sources.json` — per offer: photo `url`, the `page` it appears on, the square `crop` used
  (chosen to avoid text baked into banners), and a `note`. `generic: true` marks offers whose page has no
  photo of its own and reuse another official photo.
- `scripts/illustrate.mjs` — crop → median simplification → luminance bands mapped to the Bulles palette →
  Sobel ink outlines → seeded paper grain → `public/bubbles/<offer-id>.webp` (1024×1024).

```bash
npm run illustrate                                   # regenerate public/bubbles/*.webp
node scripts/contact-sheet.mjs /tmp/contact-sheet.png  # review all illustrations masked in circles
```

To change a photo, replace the file in `assets/photos/`, update its `sources.json` entry (url, page, crop),
run `npm run illustrate`, and update the offer's `imageAlt` in `app/data/content.js` to describe it.
The signed `googleusercontent.com` URLs may expire; the committed originals are the reproducible input.

## Sound

The sounds in `public/sounds/` are original and synthesized by `scripts/sounds.mjs` (no downloads, no
dependencies; deterministic, 16-bit mono WAV at 22050 Hz, ~590 KB in total): a seamless 10 s pad loop,
three hover "blops", two click pops with shimmer, a whoosh for the transition and a soft close.

```sh
npm run sounds   # regenerate public/sounds/*.wav
```

`app/audio/soundManager.js` imports howler and creates the Howls only after the first user gesture, rotates
variants per action, mutes globally (persisted in localStorage) and fades the ambience out while the tab is
hidden. `app/audio/connectSound.js` maps scene events and store changes to sounds.
