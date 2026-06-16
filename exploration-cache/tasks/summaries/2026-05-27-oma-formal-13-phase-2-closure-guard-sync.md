# OMA-FORMAL-13 - Fix Phase 2 Closure Guard Mismatch

Date: 2026-05-27
Status: Complete

## Objective

Align `canClosePhase` (read path) and `closeFormalRequestPhase` (write path) so they use the same DG evidence rule.

## Root cause

`canClosePhase` in `getAdminFormalRequestPhase` checked `phase.formalRequestStatus` against a set of DG-evidence statuses → correctly returned `true` after DG return scan.

`closeFormalRequestPhase` checked `DGReview.status === "decision_recorded"` → always 409 because in the collapsed DG flow, `dg-circuit.service.ts::recordDgReturn` sets `DGReview.status = "returned_scanned"`, never `"decision_recorded"`. That value is only set by the explicit `recordDgDecision` step which no longer exists in the Phase 2 MVP flow.

## Files changed

| File                                                        | Change                                                                                                                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/src/modules/oma-phases/formal-request.service.ts` | Extract `FORMAL_DG_EVIDENCE_STATUSES` as module-level constant; use it in `canClosePhase`; replace DGReview-status block in `closeFormalRequestPhase` with same constant check |

## Change detail

### Before

`getAdminFormalRequestPhase`:

```typescript
const DG_EVIDENCE_STATUSES = new Set([...]); // local
const dgEvidenceReady = DG_EVIDENCE_STATUSES.has(phase.formalRequestStatus);
```

`closeFormalRequestPhase`:

```typescript
const dgReview = await DGReviewModel.findById(phase.formalRequestDgReviewId);
if (dgReview.status !== "decision_recorded") throw 409; // always fails in collapsed flow
```

### After

Module-level:

```typescript
const FORMAL_DG_EVIDENCE_STATUSES = new Set([
  "formal_dg_returned", "formal_dg_decision_recorded",
  "formal_meeting_invited", "formal_meeting_held", ...
]);
```

Both functions use:

```typescript
FORMAL_DG_EVIDENCE_STATUSES.has(phase.formalRequestStatus);
```

DGReview document is still loaded in `getAdminFormalRequestPhase` for reading data, but the status field is no longer used as a closure gate.

## Verification

```
cd apps/api
npm run typecheck  → PASS
npm run build      → PASS
```

## Manual checks

Not run; fix is minimal and targeted.

## Next step

Manual browser validation: Phase 2 with DG return scanned + compte rendu uploaded should now close without 409.
