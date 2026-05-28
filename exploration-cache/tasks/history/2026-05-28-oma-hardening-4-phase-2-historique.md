# OMA-HARDENING-4 - Phase 2 Historique

Date: 2026-05-28
Status: Complete - Admin PASS

## Result

Admin `DossierHistoriqueTab` now loads optional Phase 2 formal request state and adds formal request, DG circuit, formal meeting, meeting report, Phase 2 closure, and Phase 2 document submission/review events to the existing compact timeline model.

## Files changed

- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/manifest.json`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-4-phase-2-historique-planning.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-4-phase-2-historique.md`

## Verification

- Admin `npx tsc --noEmit` PASS
- Admin `npm run build` PASS after outside-sandbox rerun for the known Vite/Tailwind Windows native binary issue

## Notes

- No backend, portal, Phase 1, Documents/Reunions/Courriers tab, closure logic, or Phase 3 changes were made.
- Phase 2 DG and closure milestones rely on status inference because exact timestamps are not currently exposed in `AdminFormalRequestPhaseState`.
