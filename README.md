# ItecBulles

Landing page for iTec Río Cuarto prospective students: every educational offer is a bubble, built with
real content from <https://www.itecriocuarto.org.ar/>. Design log: `docs/bitacora/bitacora.html`.

## Run

```bash
npm install
npm run dev      # local dev server
npm test         # Vitest (jsdom)
npm run build    # production build in dist/
npm run preview  # serve the build
```

## Structure

- `src/content.js` — content model; every offer cites its official source page. Missing facts are omitted, never invented.
- `tests/` — Vitest specs.
