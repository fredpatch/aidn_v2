# Current Task

## Phase: PORTAL-H1D-2 — Convocation A4/ANAC Layout Hardening

Date: 2026-05-22
Status: **Complete — typecheck PASS, lint PASS, build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-22-PORTAL-H1D-2-convocation-a4-anac-layout-modification.md`

## Objective

Refine the printable convocation card into an A4-style institutional ANAC document using `public/header.png`.

## Completed deliverables

- `header.png` integrated as full-width document header (replaces text identity block).
- Layout uses `max-w-[210mm]` A4-width preview on screen.
- Toolbar separated from printable content (no-print bar above the article).
- Field table uses `divide-y` + `border-l` (lighter, more institutional than old grid-with-borders).
- `@page { size: A4 portrait; margin: 12mm; }` hardened.
- `.convocation-card` print rule adds `border: none`.
- All existing actions (Voir la convocation, Imprimer, close) preserved.

## Verification

- Portal `npm run typecheck`: PASS
- Portal `npm run lint`: PASS
- Portal `npm run build`: PASS (340 kB / 101 kB gzip)

## Next step

Runtime validate in browser. Awaiting next task from `prompt.md`.
