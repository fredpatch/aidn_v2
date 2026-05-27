# OMA-FORMAL-9A - Admin Phase 2 Read Workspace

Date: 2026-05-27
Status: Complete

## Outcome

Implemented a read-only admin workspace for Phase 2 - Demande formelle inside the existing dossier Phases tab.

## Product behavior

- Fetches the Phase 2 read model from `GET /api/v1/admin/dossiers/:id/phases/formal-request`.
- Shows formal request gate presence, source, received date, and DG readiness.
- Shows supporting document requirements as non-blocking tracking rows.
- Shows active statuses and replaced-submission history.
- Shows DG circuit state inferred from the available read model.
- Shows formal meeting state and report availability.
- Shows recevability/closure evidence and backend close readiness.

## Files changed

- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9a-admin-phase-2-read-workspace-planning.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9a-admin-phase-2-read-workspace-implementation.md`

## Verification

- `cd apps/admin && npx tsc --noEmit` - PASS
- `cd apps/admin && npm run build` - PASS after outside-sandbox rerun for the known Vite/Tailwind Windows native binary issue

## Deferred

- Live browser/API runtime validation.
- Phase 2 document downloads from the workspace.
- Mutation wiring for DG circuit, formal meeting, document uploads/review, closure courrier, and close phase.
