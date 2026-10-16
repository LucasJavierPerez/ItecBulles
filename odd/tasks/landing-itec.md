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
- UI copy in Spanish (target audience); code, identifiers and comments in English.

## Stack
Vite + vanilla JS (ES modules) + Vitest/jsdom. No framework.

## Tasks
- [x] T1 Scaffold + content model: Vite/Vitest setup, `src/content.js` with real data scraped from the official site, content integrity tests. Route: delegated (writer; preparation reading of 10+ pages).
- [ ] T2 Page structure + practical info: semantic layout, hero with Ingreso 2027 CTA, campuses/hours/contact, footer. Tests for rendered landmarks and CTA. Route: delegated (same writer).
- [ ] T3 Bubble field + detail dialog: accessible bubble buttons, floating motion (disabled under reduced motion), `<dialog>` with offer detail and CTA, list fallback. Tests for render, open/close, focus return, Escape. Route: delegated.
- [ ] T4 Living gradient background: WebGL shader canvas with CSS gradient fallback, pauses when hidden/reduced motion. Route: delegated.
- [ ] T5 Verification + log: build, tests, browser check desktop/mobile, bitácora entry 003. Route: inline (parent).

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
Study experience.projetbulles.com in depth, then re-plan T2–T4 (stack and UI).
