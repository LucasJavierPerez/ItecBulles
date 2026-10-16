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
Mirror the reference: Nuxt + Vue 3 + Pinia + three.js (plain) + GSAP + Howler.js + Tailwind v4, Vitest for logic. Content stays local in `src/content.js` (no DatoCMS). No submission form (CTA goes to the existing Google Form). Previous plan: Vite + vanilla JS (superseded; T1 data reused).

## Tasks
- [x] T1 Scaffold + content model: Vite/Vitest setup, `src/content.js` with real data scraped from the official site, content integrity tests. Route: delegated (writer; preparation reading of 10+ pages).
- [ ] T2 Nuxt scaffold + UI state machine: migrate to Nuxt, Pinia store `ui` (home → intro → overworld → bubble), reuse content.js + tests, Tailwind tokens from the Bulles palette. Route: delegated.
- [ ] T3 three.js scene: fullscreen canvas, sky gradient, camera states with GSAP, skippable intro along a curve, mouse parallax, loader with timeout. Route: delegated.
- [ ] T4 Bubble overworld: pool of bubbles (one per offer), drag/wheel inertia (friction ~.92), edge arc, noise-wobble sphere + fresnel rim shell + circular inner image, hover ripple, click ripple transition. Route: delegated.
- [ ] T5 Inner bubble (offer detail): ambiance background, floating info items (modalidad, perfil, salida laboral, requisitos), CTA "Quiero + Info", back to bubbles; one-time tutorials. Route: delegated.
- [ ] T6 Sound + accessibility: Howler ambience/hover/click with mute and first-gesture unlock; DOM list fallback with keyboard, reduced-motion static mode, no-WebGL fallback, practical info always reachable. Route: delegated.
- [ ] T8 Bubble illustrations (runs before T4): download official photos per offer, `scripts/illustrate.mjs` with sharp produces `public/bubbles/<offer-id>.webp` (square, circular-safe), `image` + `imageSource` fields in content.js, tests that every offer has an existing illustration. Route: delegated.
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
- Scope change (user, 2026-10-16): T2–T4 paused; stack and UI to be re-planned after a deeper study of experience.projetbulles.com (likely Nuxt/Vue + WebGL). Minimal Vite scaffold from T1 may be replaced.

## Next step
D-08 resolved (illustrations from official photos). Delegate T2, then T8, then T3–T6, then T7.
