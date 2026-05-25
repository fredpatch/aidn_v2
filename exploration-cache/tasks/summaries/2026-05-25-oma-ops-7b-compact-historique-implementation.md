# OMA-OPS-7B - Compact Historique Implementation

## Objective

Compact the admin dossier Historique tab by default while preserving access to the full derived timeline.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/components/ui/*`

## Files changed

- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-7b-compact-historique-implementation.md`
- `exploration-cache/tasks/history/2026-05-25-oma-ops-7b-compact-historique.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/manifest.json`

## Key decisions

- Kept OMA-OPS-7B frontend-only.
- Kept the existing derived-event source from `AdminDossierDetail`.
- Added local event metadata for `importance` and `group` instead of changing API types.
- Defaulted the tab to milestone-only `Jalons` to reduce timeline noise.
- Kept document downloads available in `Tous`, `Documents`, `Courriers`, and `DG` filters where linked documents exist.

## Implementation details

- Added compact KPI cards for:
  - duration since dossier opening, using `closedAt` when present or today otherwise;
  - active phase, derived from open `detail.phases` with dossier status fallback;
  - total event count;
  - latest dated event.
- Added filters: `Jalons`, `Tous`, `Reunions`, `Documents`, `Courriers`, `DG`.
- Added pagination with 6 visible events by default and `Afficher plus` increments of 6.
- Reset visible count to 6 when filters change.
- Marked meeting planned events as detail when the meeting was later held, so milestone mode shows the held event without the duplicate planned row.
- Kept ordinary document events as detail; kept DG pre-evaluation return as a milestone.

## Verification commands run

- `cd apps/admin && npx tsc --noEmit` - PASS
- `cd apps/admin && npm run build` - sandbox failed on known Tailwind native Windows binary / `spawn EPERM`
- `cd apps/admin && npm run build` outside sandbox - PASS

## Manual checks

- Not run in browser during this pass.

## Known risks / TODOs

- Browser runtime checks are still needed with seeded dossiers to verify filter interactions, show-more behavior, and document popup/download behavior.
- KPI duration is calendar-day based and intentionally has no SLA threshold logic yet.

## Next step

Runtime/manual validation of the Historique tab with seeded dossiers containing held meetings, pending meetings, documents, courriers, DG orientation, dated events, and undated events.
