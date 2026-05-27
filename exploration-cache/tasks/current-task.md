# Current Task

## Phase: OMA-FORMAL-9C0 — Phase 2 UI Alignment Cleanup

Date: 2026-05-27
Status: **Complete — Admin typecheck PASS, Admin build PASS**

## Summary files

- Implementation: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9c0-phase-2-ui-alignment-cleanup.md`

## Files modified

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
  - Removed `Circle`, `Send` from lucide imports
  - Removed `FormalRequestPhaseChecklist` import
  - Removed `StepLine` component
  - Consolidated header: `Circuit officiel` + `Retour DG` fields → single `Circuit officiel` field (4-step value)
  - Added `circuitOfficielStatus` computed variable
  - Removed WorkflowSection "Circuit officiel" (was block 3)
  - Removed WorkflowSection "Recevabilité et clôture" (was block 5)

## Final Phase 2 right-panel structure

1. Header / metadata (DefinitionGrid — 5 fields incl. consolidated Circuit officiel)
2. Courrier formel
3. Réunion formelle
4. Documents de demande formelle (compact)
5. Prochaine action (guided card)

## Verification completed

```bash
cd apps/admin
npx tsc --noEmit  # PASS
npm run build     # PASS (1.15s)
```

## Known risks / TODOs

- `FormalRequestPhaseChecklist` no longer rendered in workspace; full checklist via Documents tab only
- Phase 1 workspace unaffected

## Next step

OMA-FORMAL-9D or next product roadmap slice.
