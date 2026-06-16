# DASH-2R Dashboard Correction Pass

Date: 2026-05-29
Status: Complete - API PASS, Admin PASS

## Objective

Correct dashboard runtime/UI issues from the browser check without redesigning the dashboard, adding charts, exports, certificate backend, or workflow actions.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`

## Source files inspected

- `apps/api/src/modules/dashboard/dashboard.helpers.ts`
- `apps/api/src/modules/dashboard/dashboard.service.ts`
- `apps/api/src/modules/dashboard/dashboard.types.ts`
- `apps/admin/src/pages/DashboardPage.tsx`
- `apps/admin/src/lib/api/dashboard.api.ts`

## Files changed

- `apps/api/src/modules/dashboard/dashboard.service.ts`
- `apps/admin/src/pages/DashboardPage.tsx`
- `TASK.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/history/2026-05-29-dash-2r-dashboard-correction-pass.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`

## Key decisions

- Kept the existing `frontend-design` Swiss direction: compact institutional ledger, no redesign.
- Kept dashboard metrics backend-owned.
- Did not change route shape or add frontend sections.
- Did not add charts, exports, certificate backend, or workflow actions.

## Implementation details

- Corrected official expected business-day constants:
  - Phase 1 preliminary: 30
  - Phase 2 formal request: 10
  - Phase 3 document evaluation: 30
  - Phase 4 inspection/demonstration: 25
  - Phase 5 delivery: 5
- Updated Phase 4 label to `Inspection / démonstration`.
- Improved placeholder phase badge logic:
  - implemented phase: `Actif`
  - not implemented and no active dossier: `À venir`
  - not implemented and active dossiers exist: `Phase ouverte`
- Improved certificate unavailable display:
  - value remains `À venir`
  - badge shows `Non disponible`
  - value uses muted styling
- Improved priority action document labels by enriching backend actions with document title, file name, requirement label, phase label, and dossier number when available.
- Made priority action secondary labels more visible in the UI.
- Cleaned French labels/accents in touched dashboard UI and backend labels.

## Verification commands run

- API: `npm run typecheck` PASS.
- API: `npm run build` PASS.
- Admin: `npx tsc --noEmit` PASS.
- Admin: `npm run build` failed in sandbox with the known Vite/Tailwind native Windows binary issue, then PASS after outside-sandbox rerun.

## Manual checks

- Browser/manual checks not run in this pass. They require live API data and role-specific admin sessions.

## Known risks / TODOs

- Runtime validation still needed for DN and courrier/DG profiles.
- Admin build still reports the existing large chunk warning.
- `exploration-cache/06-workflows/OMA_FORMAL_REQUEST_WORKFLOW.md` remains missing.

## Next step

Run a browser pass for DN and courrier/DG dashboard profiles, then proceed to reports only after the correction checklist is confirmed.
