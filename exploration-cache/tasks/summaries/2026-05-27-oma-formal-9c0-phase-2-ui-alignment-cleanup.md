# OMA-FORMAL-9C0 — Phase 2 UI Alignment Cleanup

Date: 2026-05-27
Status: Complete

## Objective

Align Phase 2 admin workspace with Phase 1 visual pattern.
Remove duplicated checklist blocks from the right panel.
Make the right panel shorter and focused on operational detail + guided action.

## Cache files read

- `exploration-cache/tasks/current-task.md` (OMA-FORMAL-9C complete)
- `FormalRequestPhaseWorkspace.tsx` (already in context from previous session)

## Source files inspected

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx` (in-context)

## Files changed

| File | Change |
|------|--------|
| `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx` | Remove 2 blocks, consolidate header field, remove unused imports/component |

## Blocks removed

1. **WorkflowSection "Circuit officiel"** — step-list (Non mis en circuit / Mis en circuit DG/parapheur / Retour DG scanné / Décision DG enregistrée). Reason: duplicates left progression card and top metadata.

2. **WorkflowSection "Recevabilité et clôture"** — AvailabilityBadge row + FormalRequestPhaseChecklist. Reason: duplicates left progression checklist.

## Header consolidation

Replaced two metadata fields:
```
Circuit officiel: "Mis en circuit" / "Non mis en circuit"
Retour DG: "Scan enregistré" / "Non enregistré"
```
With one combined field:
```
Circuit officiel: "Non mis en circuit" | "Mis en circuit" | "Retour scanné" | "Décision enregistrée"
```
Computed as `circuitOfficielStatus` from `sentToDg`, `dgReturned`, `dgDecisionRecorded`.

## Removed code

- `import { Circle, Send }` from lucide-react
- `import { FormalRequestPhaseChecklist }` from FormalRequestPhaseChecklist
- `StepLine` component function

## Final right-panel order

1. Header / metadata (DefinitionGrid — 5 fields)
2. Courrier formel (source, date, waiting state)
3. Réunion formelle (status badges, date, lieu)
4. Documents de demande formelle (compact summary only)
5. Prochaine action (guided card — interactive)

## Variables retained (still used by guided card)

- `sentToDg`, `dgReturned`, `dgDecisionRecorded` — used in `circuitOfficielStatus` and guided card
- `state.phase.canClosePhase`, `state.closure.canClosePhase` — used in guided card
- `correctionsCount`, `gateRequirement`, `correctionRequirements` — used in Documents section

## Verification results

```
cd apps/admin
npx tsc --noEmit   → PASS (no output)
npm run build      → PASS (built in 1.15s)
```

## Manual checks

Not run; no live browser session in this pass.

## Known risks / TODOs

- `FormalRequestPhaseChecklist` is no longer rendered in the workspace — if admins need the full checklist they must go to the Documents tab
- `AvailabilityBadge` for recevability/closure courriers is no longer rendered — state is still tracked but not shown in Phase 2 workspace (acceptable: shown in left progression)
- Phase 1 workspace is unaffected

## Next step

OMA-FORMAL-9D or next product roadmap slice.
