# PORTAL-H1D-2 — Convocation A4/ANAC Layout Hardening

Date: 2026-05-22
Status: **Complete — typecheck PASS, lint PASS, build PASS**

## Objective

Refine the printable convocation card into an A4-style, institutional ANAC document using `public/header.png` as the header image.

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-22-PORTAL-H1D-1-meeting-convocation-printable-card-implementation.md`

## Source files inspected

- `apps/portal/src/pages/RendezVousPage.tsx` — ConvocationCard location
- `apps/portal/src/styles.css` — existing print CSS, @page rule, .print-area, .no-print, .convocation-card
- `apps/portal/public/header.png` — confirmed present

## Files modified

### `apps/portal/src/styles.css`
- `@page` rule: added `size: A4 portrait;`, changed `margin: 16mm` → `margin: 12mm`
- `.convocation-card` print rule: added `border: none !important` to suppress the card border on print

### `apps/portal/src/pages/RendezVousPage.tsx` — `ConvocationCard` component
- **Wrapper**: `fixed inset-0 z-50 overflow-y-auto bg-slate-950/60` (was: `flex items-start … bg-slate-950/50`)
- **Inner centering**: new `flex min-h-full items-start justify-center px-4 py-10` div
- **Sheet container**: `max-w-[210mm]` (A4-width preview on screen, was `max-w-3xl`), no rounded corners
- **Toolbar**: moved to its own bar above the article (`border-b border-slate-200 px-6 py-3`), no margin inside article
- **Header image**: replaced text-based `AIDN` / `Direction de la Navigabilité` / `h1` with `<img src="/header.png" alt="ANAC" className="mb-6 w-full object-contain" />`
- **H1**: smaller (`text-base`), uppercase, wide letter-spacing, thin bottom border → institutional heading
- **Field table**: changed from `border border-slate-300` grid with `bg-slate-50` label cells to a `divide-y divide-slate-200` list with `border-l border-slate-200` vertical separator; labels use `text-slate-500 font-bold`, values use `font-medium text-slate-950`
- **Footer**: `mt-8 border-t border-slate-100 pt-4 text-center text-xs text-slate-400`; prints black

## Key decisions

- `max-w-[210mm]` gives a real A4-width preview on screen without any extra dependency
- No `rounded-lg` on the print-area section — institutional documents have no rounded corners
- Replaced text identity block with actual `header.png` image at full width (`object-contain`)
- `divide-y` + `border-l` produces a cleaner, lighter table than the old `border border-slate-300` box-in-box
- `bg-slate-50` label cells removed — makes the table look less like a UI component, more like a form

## Verification

- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm run build` — PASS (340 kB JS / 101 kB gzip)

## Manual checks pending

- Open `/rendez-vous` → "Voir la convocation" on a meeting
- Header image renders at full width with correct proportions
- Table rows are clean and readable
- Print preview: only convocation content visible, A4 orientation, 12mm margins
- Buttons/sidebar/app chrome hidden in print
- "Non renseigné" fallback still correct for empty fields
- "Imprimer" button triggers browser print dialog

## Known risks / TODOs

- `header.png` is loaded via `/header.png` (Vite public dir) — works in dev and after build
- If browser does not honour `@page { size: A4 portrait }` (Safari), output still looks clean on Letter
- The 190px label column may clip on very narrow viewports; acceptable since convocation is intended for desktop/print

## Next step

Runtime validate in browser. Awaiting next task from `prompt.md`.
