# Feature: iTec landing (bubbles experience)

- Locator: `odd/tasks/landing-itec.md` · Engram mirror: `odd/landing-itec/tasks` (project `itecbulles`)
- Branch: `feat/landing-itec` · Base: `main` @ `9ce1a89`
- Delivery strategy: `single-pr` (student project, one reviewer; forecast ~1200 authored lines)
- RDD: off (global) → verification per Delegated Verification Gate

## Objective
Build the iTec Río Cuarto landing page using the real content from itecriocuarto.org.ar and the design concept in `docs/bitacora/bitacora.html`: every educational offer is a bubble, "Ingreso 2027" is the central bubble, living gradient background inspired by Projet Bulles.

## Problem / why
The current Google Sites page scatters information, has three enrollment paths, and no narrative. The audience (D-04) is prospective students.

## Scope
- In: single landing page, career/offer detail panels, practical info (campuses, hours, contact), footer links for current students, accessible bubble navigation, WebGL gradient with CSS fallback.
- Out: logins (D-01), CMS, backend, audio, multi-page site, deployment.

## Constraints
- D-01 no logins (SiTec only as a plain footer link).
- D-02 accessibility: keyboard, screen reader, `prefers-reduced-motion`, no-WebGL fallback, WCAG AA contrast.
- D-03 single primary CTA: "Quiero + Info" (existing Google Form). D-06 (assumption, pending user confirmation): WhatsApp as secondary contact.
- D-05 current-student links (horarios, calendario, SiTec) in footer only.
- Content only from the official site; no invented dates, durations or numbers.
- D-08 (user, 2026-10-16): each bubble shows an illustration derived from the current official-site photos. No image-generation model is available, so illustrations are produced by a reproducible build script (sharp) that stylizes the downloaded photos (posterize to the Bulles palette + ink outlines + paper grain). Originals and sources are recorded per offer.
- UI copy in Spanish (target audience); code, identifiers and comments in English.

## Stack (re-planned 2026-10-16 after Bulles teardown)
Mirror the reference: Nuxt + Vue 3 + Pinia + three.js (plain) + GSAP + Howler.js + Tailwind v4, Vitest for logic. Content stays local in `app/data/content.js` (moved from `src/content.js` in T2) (no DatoCMS). No submission form (CTA goes to the existing Google Form). Previous plan: Vite + vanilla JS (superseded; T1 data reused).

## Tasks
- [x] T1 Scaffold + content model: Vite/Vitest setup, `src/content.js` with real data scraped from the official site, content integrity tests. Route: delegated (writer; preparation reading of 10+ pages).
- [x] T2 Nuxt scaffold + UI state machine: migrate to Nuxt, Pinia store `ui` (home → intro → overworld → bubble), reuse content.js + tests, Tailwind tokens from the Bulles palette. Route: delegated.
- [x] T3 three.js scene: fullscreen canvas, sky gradient, camera states with GSAP, skippable intro along a curve, mouse parallax, loader with timeout. Route: delegated.
- [x] T4 Bubble overworld: pool of bubbles (one per offer), drag/wheel inertia (friction ~.92), edge arc, noise-wobble sphere + fresnel rim shell + circular inner image, hover ripple, click ripple transition. Route: delegated.
- [ ] T5 Inner bubble (offer detail): ambiance background, floating info items (modalidad, perfil, salida laboral, requisitos), CTA "Quiero + Info", back to bubbles; one-time tutorials. Route: delegated.
- [ ] T6 Sound + accessibility: Howler ambience/hover/click with mute and first-gesture unlock; DOM list fallback with keyboard, reduced-motion static mode, no-WebGL fallback, practical info always reachable. Route: delegated.
- [x] T8 Bubble illustrations (runs before T4): download official photos per offer, `scripts/illustrate.mjs` with sharp produces `public/bubbles/<offer-id>.webp` (square, circular-safe), `image` + `imageSource` fields in content.js, tests that every offer has an existing illustration. Route: delegated.
- [ ] T7 Verification + log: build, tests, visible-window browser check desktop/mobile, bitácora entry. Route: inline (parent).

## Acceptance criteria
- `npm test` and `npm run build` pass.
- Every offer from the official site appears as a bubble and opens a detail panel with its real data.
- All interactions work with keyboard only; bubbles are real buttons with accessible names.
- With reduced motion or without WebGL, the page is complete and static.
- Campuses, hours, phone, email and WhatsApp visible without opening anything.

## Checks
- `npm test`, `npm run build`, manual browser check (Claude in Chrome) at 1440px and 390px.

## Progress / evidence
- T1 done · commit `a5ed2ca` (`feat: scaffold landing and content model`). Route: delegated writer.
  - RED observed: `npx vitest run` failed (missing `src/content.js`) before implementation.
  - `npm test`: 1 file, 10 tests passed. `npm run build`: built OK.
  - Content: 11 offers (ingreso, 5 carreras, trayecto, secundario, capacitación, iTec Labs, portal de trabajo), 2 campuses, contacts, links; each offer cites its official source page. Fields missing on the site were omitted.
  - Missing on official site: duration and formal title for all 5 careers (only Mecatrónica states "Técnico en Mecatrónica"), class schedule per career, costs, enrollment and cursillo dates, Ada Byron title/schedule.
- T2 done · commit `206a766` (`feat: migrate to Nuxt with ui state machine`). Route: delegated writer (2+ non-trivial files).
  - Nuxt 4.5.2 SPA (`ssr: false`), `nuxt generate` → `.output/public` (+ `dist` symlink, now ignored). Pinia 4.1 + @pinia/nuxt 1.0.3, Tailwind 4.3 via @tailwindcss/vite, three 0.186, gsap 3.15, howler 2.2.4 installed for later tasks. Standalone `vite` dev dependency removed.
  - Content moved to `app/data/content.js`; only the test import path changed.
  - RED observed: `npx vitest run` → ui-store suite failed to resolve `app/stores/ui.js` (content suite 10 passed).
  - GREEN: `npm test` → 2 files, 26 tests passed (10 content + 16 ui store). `npm run build` → generated `.output/public`, `<html lang="es">`, title "iTec Río Cuarto · Ingreso 2027".
  - Font substitute: Bricolage Grotesque (Google Fonts) with system fallback stack. Risk tier: medium (writer self-verification).
- T8 done · commit `f8006c0` (`feat: add bubble illustrations derived from official photos`). Route: delegated writer (2+ non-trivial files + photo research).
  - RED observed: `npx vitest run tests/illustrations.test.js` → 3 failed (no `image`/`imageAlt`, no files under `public/bubbles`), 1 passed (sources.json written first).
  - GREEN: `npm test` → 3 files, 30 tests passed. `npm run illustrate` → 11 webp, 70–97 KB each, byte-identical on re-run (deterministic). `npm run build` → OK, 11 files in `.output/public/bubbles`.
  - Pipeline: `assets/photos/<id>.(jpg|png)` + `sources.json` (url, page, crop, note, generic) → `scripts/illustrate.mjs` (sharp: crop, median 15, palette gradient map by per-image luminance quantiles, Sobel ink outlines, seeded grain) → `public/bubbles/<id>.webp` 1024×1024. `scripts/contact-sheet.mjs <out.png>` for review. README documents regeneration.
  - Photo sources: own-page photos for 10 offers (career pages use their header photo cropped to avoid baked-in titles; marketing uses an in-page desk photo; ingreso uses the home header building; Ada Byron uses the building photo on its page; capacitación uses the building photo inside the PCC flyer on cursos.itecriocuarto.org.ar, low-res source). Generic reuse: `itec-labs` (its page only has a logo) reuses the Desarrollo de Software header (hand-drawn flowchart crop).
  - Notes: Google Sites image URLs are signed per request and must be fetched with a browser User-Agent; recorded URLs may expire, committed originals are the reproducible input. Large PNG originals re-encoded to JPEG q92 (repo weight 2.4 MB). Three offers show the same building (ingreso, Ada Byron, capacitación) with different crops. Risk tier: medium (writer self-verification).
- T3 done · commit `d444225` (`feat: add three.js scene with camera states and intro`). Route: delegated writer (2+ non-trivial files).
  - Pure modules in `app/scene/` (no three.js): `cameraStates.js` (INTRO_HOME, HOME, SKY, OVERWORLD + BUBBLE zoom; step → plan), `parallax.js` (.85/.04, frame-rate independent lerp), `introPath.js` (uniform Catmull-Rom through 7 points, HOME → sky → around island → OVERWORLD, 5 s), `loader.js` (8 s timeout → ready), `renderSettings.js` (DPR clamp 2 / 1.5 under 768 px, WebGL detection).
  - Thin layer `app/scene/Experience.js`: sky shader rebuilding the 108deg CSS gradient with value-noise drift, procedural low-poly island + pink tree, clouds, particles; GSAP camera tweens with CustomEase `cubic-bezier(.32,.94,.6,1)` (CustomEase ships in gsap 3.15); rAF paused on `visibilitychange`; `warmUp()` renders one frame synchronously so readiness never depends on rAF; `dispose()` frees geometries/materials/listeners. three.js is lazy-loaded (separate ~620 KB chunk; Vite size warning accepted).
  - `SceneCanvas.client.vue` + `SceneLoader.vue` ("Cargando…" overlay on the sky gradient); static mode (no canvas, CSS sky) without WebGL or with reduced motion; in static mode the intro step completes at once. `app.vue`: UI layer `pointer-events-none`, sections opt back in; "Saltar intro" pinned bottom-right.
  - RED observed: `npx vitest run` → 5 new suites failed to resolve `app/scene/*` (30 existing tests passed).
  - GREEN: `npm test` → 8 files, 68 tests passed. `npm run build` → generated `.output/public`. `npx nuxt dev` → `/` HTTP 200, `Experience.js` and `SceneCanvas.client.vue` modules HTTP 200.
  - Not verified: actual WebGL rendering/shader compilation (no visible browser in this run); pending T7 browser check. Risk tier: medium (writer self-verification).
- T4 done · commit `ee11520` (`feat: add bubble overworld with inertia carousel and shaders`). Route: delegated writer (2+ non-trivial files).
  - Pure `app/scene/carousel.js`: offset/velocity in world units per 60 fps frame, friction .92 with exact geometric integration (30/60 fps agree), max speed .4, drag (px × .0012) and wheel (× .0006) add velocity, grab stops, click vs drag at 6 px, auto-snap under .004, `snapNearest`, `focusIndex` (shortest way round), `setSpacing` keeps focus, arc z = -.09·x², rotationY = -.15·x; `layoutFor(aspect)` → spacing/radius (~4.5 visible desktop, ~2.3 phone; radius ≤ .55, .36 × spacing).
  - `app/scene/events.js`: `sceneEvents` bus (`scene:ready`, `bubble:hover`, `bubble:click`, `transition:start`, `transition:end`) for T5 detail and T6 sound hooks.
  - Three.js layer `app/scene/bubbles/`: `BubbleField` (11 bubbles: circular illustration plane with sRGB texture + fallback color, translucent shell with simplex wobble and fresnel iridescent rim in #FFD333 #8C00FF #FF94B6 #FF0090, idle float, raycast hover with `uHitPoint`/`uHitProgress` GSAP 2.25 s power4.out ripple + pointer cursor + 1.08 scale; click centers the bubble, plays `RippleTransition` (clip-space overlay quad, 1.1 s) and calls `ui.openBubble` when the screen is covered; in `bubble` mode the other bubbles fade out), textures lazy-loaded after warm-up, full dispose on unmount.
  - `SceneCanvas.client.vue` mounts the field, maps ui step → mode, positions a decorative title pill under the hovered/focused bubble, sets `ui.sceneActive`; `app.vue` overworld: hint + visually hidden list (click → `openBubble`, focus → `ui.focusBubble` → carousel glide) when the scene is active, `StaticBubbleGrid` (circular `<img>` bubbles with `imageAlt`) in static mode. Store: `sceneActive`/`setSceneActive`, `focusedBubbleId`/`focusBubble`.
  - RED observed: `npx vitest run tests/carousel.test.js` → suite failed to resolve `app/scene/carousel.js`; then store/grid/events tests failed (2 store tests, grid and events suites unresolved) before implementation.
  - GREEN: `npm test` → 11 files, 95 tests passed. `npm run build` → OK. `nuxt dev` → `/` 200, `/bubbles/mecatronica.webp` 200, `BubbleField.js` module 200.
  - Size: 1270 added lines, over the ~400 advisory heuristic (≈290 test lines, ≈230 shader lines incl. MIT simplex noise); kept as one work unit because the carousel, bubble layer and static fallback only make sense together.
  - Not verified: WebGL rendering, shader compilation and feel tuning (drag/wheel factors, spacing) — no browser in this run; pending T7 browser check. Risk tier: medium (writer self-verification).
- Scope change (user, 2026-10-16): T2–T4 paused; stack and UI to be re-planned after a deeper study of experience.projetbulles.com (likely Nuxt/Vue + WebGL). Minimal Vite scaffold from T1 may be replaced.

## Next step
T2, T3, T4 and T8 done. Delegate T5 (detail view: read `ui.activeOffer`, listen to `sceneEvents`) and T6 (sound on `bubble:hover`/`bubble:click`/`transition:*`, finalize the hidden list a11y), then T7 (browser check incl. shader compilation and carousel feel).
