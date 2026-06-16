# OMA-FORMAL-9C1 - Phase 2 Phase 1 Visual Sync Planning

Date: 2026-05-27
Status: **Planning complete - awaiting implementation approval**

## Objective

Plan a focused admin frontend pass to make Phase 2 - Demande formelle visually align with the Phase préliminaire guided UX template.

No implementation was performed in this pass.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b2-phase-2-workflow-cleanup.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9c-guided-action-card-phase2.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseChecklist.tsx`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`

## Files changed

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9c1-phase-2-phase-1-visual-sync-planning.md`

## Key decisions

- The screenshots do not match in UI/UX.
- Phase préliminaire is the better template: one guided workspace, compact inline groups, and one next-action/status card.
- Phase 2 should keep the guided `Prochaine action` card but stop making every detail area feel like an independent workflow block.
- The right panel should be details plus next action; the left panel should remain phase list plus progression.
- The `Démarrée le` display should not stay `Non renseigné` when the phase is active and a formal request received date is available.

## Planned implementation details

- Convert Phase 2 detail sections from full `Card`-based `WorkflowSection` blocks to a lighter Phase-1-like inline section pattern.
- Preserve final order:
  1. Header / metadata
  2. Courrier formel
  3. Réunion formelle
  4. Documents de demande formelle
  5. Prochaine action
- Use a responsive desktop grid to place `Réunion formelle` and `Documents de demande formelle` side by side when it improves density.
- Keep mobile stacked.
- Keep `Courrier formel` read-only and visible because it explains source and reception date.
- Keep compact documents only; do not reintroduce the full document checklist.
- Keep `Circuit officiel` as metadata only.
- Keep guided action card as final block.
- Add a display-date helper for Phase 2 start date:
  - `phaseRecord?.startedAt`
  - `state.gate.receivedAt`
  - otherwise `Non renseigné`

## Verification commands planned

```bash
cd apps/admin
npx tsc --noEmit
npm run build
```

## Manual checks

Not run; planning only.

## Known risks / TODOs

- A reusable phase workspace layout component should be considered later, but not in this narrow pass.
- If backend phase start dates are missing, this pass only improves UI display fallback.
- Runtime checks need a live browser/API session.

## Next step

Await approval, then implement the Phase 2 visual sync in the admin frontend.
