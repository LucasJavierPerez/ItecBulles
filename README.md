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

## Island centerpiece (prototypes)

The object in the middle of the floating island can be swapped with the URL query
`?centro=`; it turns with the island while browsing the bubbles.

| Value | Centerpiece |
|-------|-------------|
| `arbol` (default) | The original pink low-poly tree. |
| `edificio` | "Edificio iTec": the real building front (stone facade, green metal band, window ribbon, sign, "iTec" letters, glass door, "783"), from `assets/photos/ingreso-2027.jpg`. |
| `circuitos` | "Árbol de circuitos": a tree of right-angle circuit traces on a chip, ending in pulsing glowing nodes. |
| `isotipo` | "La i de iTec": the logo's "i" with a red dot and five career icons orbiting it. |

Unknown values fall back to `arbol`. Code: `app/scene/centerpieces/` (one module per
centerpiece, each `create()` → `{ object3D, update(elapsed, delta), dispose() }`).

## Bubble images

Each bubble shows a real photo from the official site, cropped to a square and gently enhanced by a
deterministic `sharp` script (no image model, byte-identical output on re-run).

- `assets/photos/<offer-id>.<ext>` — the official photos (large PNGs re-encoded as JPEG q92).
- `assets/photos/sources.json` — per offer: photo `url`, the `page` it appears on, the square `crop` used
  (chosen to avoid the titles printed over the header photos), and a `note`. `generic: true` marks offers
  whose page has no photo of its own and reuse another official photo.
- `scripts/bubble-images.mjs` — writes `public/bubbles/<offer-id>.webp` (1024×1024):
  - `--mode photo` (default, used by the site): crop → resize → contrast restore (several headers carry a
    white wash) → mild saturation → slight sharpen. Crops under 400 source pixels (`capacitacion-continua`,
    `itec-labs`) cannot be sharp at 1024 px, so they get a soft upscale (light blur, no sharpening) instead.
  - `--mode illustration` (kept, not used): the earlier flat, stylized look (median simplification →
    palette gradient map → Sobel ink outlines → seeded grain).

```bash
npm run bubble-images                                # regenerate public/bubbles/*.webp from the photos
npm run illustrate                                   # same, stylized illustration mode (not used by the site)
node scripts/contact-sheet.mjs /tmp/contact-sheet.png  # review all images masked in circles
```

To change a photo, replace the file in `assets/photos/`, update its `sources.json` entry (url, page, crop),
run `npm run bubble-images`, and update the offer's `imageAlt` in `app/data/content.js` to describe the photo.
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

Volume: the "Sonido" pill (top-right) opens a small panel with a "Volumen" slider (0–100 %, steps of 5,
arrow keys work) and a separate mute button. Tap or click toggles the panel, a mouse hover previews it,
Escape or a click elsewhere closes it. On phones the panel sits on the same row, left of the pill; from
640 px it sits right under the settings row, so it never covers the headings. The slider sets a master
volume (default 70 %) through `Howler.volume()`, on top of each sound's own volume, so the ambience fades
keep their per-sound targets. It is stored in the ui store (`volume`, `setVolume`), persisted under
`itec-bulles:volume` and applied as soon as howler loads (also when changed before the first gesture).
Volume 0 shows as muted, moving the slider up unmutes, and unmuting at 0 restores the default 70 %.
