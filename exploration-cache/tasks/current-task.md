# Current Task

## Phase: OMA-FORMAL-13 — Fix Phase 2 Closure Guard Mismatch

Date: 2026-05-27
Status: **Complete — API typecheck PASS, API build PASS**

## Summary files

- Implementation: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-13-phase-2-closure-guard-sync.md`

## Files modified

- `apps/api/src/modules/oma-phases/formal-request.service.ts`
  - Added `FORMAL_DG_EVIDENCE_STATUSES` module-level constant
  - `canClosePhase`: uses constant (was local Set)
  - `closeFormalRequestPhase`: replaced DGReview.status check with constant check

## Fix

The DGReview document's `status` field stays `"returned_scanned"` in the collapsed DG flow
(set by `dg-circuit.service.ts::recordDgReturn`). The old close guard checked
`status === "decision_recorded"` which was always 409.

Both read and write paths now use `FORMAL_DG_EVIDENCE_STATUSES.has(phase.formalRequestStatus)`.

## Next step

Manual browser validation of Phase 2 full close flow.
