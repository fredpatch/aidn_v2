# OMA-OPS-7B - Compact Historique Tab

Date: 2026-05-25
Status: Complete - admin typecheck/build PASS

## Summary

The admin dossier Historique tab now opens in a compact milestone-oriented mode. It keeps the existing frontend-only derived timeline from `AdminDossierDetail`, but adds event importance/group metadata, KPI cards, filter chips, and show-more pagination.

## Changed files

- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-7b-compact-historique-implementation.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/manifest.json`

## Behavior

- Default filter is `Jalons`.
- Filters are `Jalons`, `Tous`, `Reunions`, `Documents`, `Courriers`, `DG`.
- Timeline initially shows 6 events and `Afficher plus` adds 6 more.
- Meeting planned rows become detail rows when a held row exists, reducing duplicate noise in milestone mode.
- Ordinary document rows are detail rows; DG pre-evaluation return remains a milestone.
- Existing download helpers remain in use and no backend/audit/mutation/upload/DG/Outlook/email behavior was added.

## Verification

- Admin `npx tsc --noEmit`: PASS
- Admin `npm run build`: PASS after outside-sandbox rerun for the known Tailwind native Windows binary issue.

## Remaining follow-up

Manual browser validation with representative seeded dossiers.
