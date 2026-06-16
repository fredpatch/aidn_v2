# OMA-HARDENING-5 - Portal Status Labels

Date: 2026-05-28
Status: Complete - API PASS, Portal PASS

## Result

Portal-facing Phase 1 and Phase 2 dossier labels are now harmonized with simple ANAC/postulant wording. Phase 2 formal request labels now progress by formal status instead of freezing at `Demande formelle déposée` after the formal request courrier exists.

## Files changed

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/manifest.json`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-5-portal-status-labels-planning.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-5-portal-status-labels.md`

## Verification

- API `npx tsc --noEmit` PASS
- API `npm run build` PASS
- Portal `npx tsc --noEmit` PASS
- Portal `npm run build` PASS after outside-sandbox rerun for the known Vite/Tailwind Windows native binary issue

## Notes

- No admin, workflow, upload/review, closure, or Phase 3 changes were made.
- Existing initial request physical-deposit location choices were left unchanged.
