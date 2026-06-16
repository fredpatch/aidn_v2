# OMA-FORMAL-9A Adjustment - Phase 1 UI Alignment

Date: 2026-05-27
Status: Complete

## Outcome

Adjusted the Phase 2 admin workspace to follow the same layout principles as the existing Phase préliminaire workflow UI.

## Product behavior

- The left Phases OMA list remains unchanged.
- The left "Progression phase active" card now supports Phase 2 when `formal_request` is selected.
- Phase 2 progress uses seven chronological steps from the formal request read model only.
- The right Phase 2 panel is now chronological:
  - header metadata
  - Courrier formel
  - Circuit DG
  - Réunion formelle
  - Documents de demande formelle
  - Recevabilité et clôture
  - Statut
- Supporting documents are displayed as tracking only and do not visually block DG progression.

## Files changed

- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseChecklist.tsx`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9a-phase-1-alignment-planning.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9a-phase-1-alignment-implementation.md`

## Verification

- `cd apps/admin && npx tsc --noEmit` - PASS
- `cd apps/admin && npm run build` - PASS after outside-sandbox rerun for the known Vite/Tailwind Windows native binary issue

## Deferred

- Live browser/API validation.
- Mutation wiring for Phase 2 actions.
- Exact DG send/return date rendering, pending read-model exposure.
