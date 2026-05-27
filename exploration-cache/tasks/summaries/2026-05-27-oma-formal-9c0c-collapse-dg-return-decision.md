# OMA-FORMAL-9C0C — Collapse DG Return Scan and DG Decision for Phase 2

Date: 2026-05-27
Status: Complete

## Objective

Collapse the Phase 2 formal request DG return + DG decision into one operational step.
After scanning the DG-returned document, DN can immediately schedule the formal meeting.
No second "Enregistrer la décision DG" step is required for formal_request.

## Business rule

Scanned DG return = decision evidence for Phase 2 MVP.
Phase 1 (pre_evaluation) is unaffected.
The `POST /phases/formal-request/dg-decision` route is preserved but deferred.

## Files changed

| File | Change |
|------|--------|
| `apps/api/src/modules/oma-phases/formal-request.service.ts` | `recordFormalRequestDgReturn` sets `formal_dg_decision_recorded` (was `formal_dg_returned`); `canInviteFormalMeeting` includes `formal_dg_returned` for existing data |
| `apps/api/src/modules/dg-circuit/dg-circuit.service.ts` | `returned_scanned` → `bucket = "decision_recorded"` for formal_request; remove `record_dg_decision` action; `processedAt` covers `returned_scanned` |
| `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts` | `DECISION_OR_AFTER` includes `formal_dg_returned` |
| `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx` | Remove dead `!dgDecisionRecorded` wait branch; `circuitOfficielStatus` shows "Retour DG scanné" for both; status labels unified to "Retour DG / Décision disponible" |
| `apps/admin/src/pages/DgCircuitPage.tsx` | Remove `record_dg_decision` button for formal_request; remove orphaned `submitDecision` function |

## Backend detail

### formal-request.service.ts — recordFormalRequestDgReturn
```typescript
// Before
phase.formalRequestStatus = "formal_dg_returned" as never;

// After (MVP: scan = evidence)
phase.formalRequestStatus = "formal_dg_decision_recorded" as never;
```

### formal-request.service.ts — canInviteFormalMeeting
```typescript
// Before
const canInviteFormalMeeting = phase.formalRequestStatus === "formal_dg_decision_recorded";

// After (includes legacy formal_dg_returned data)
const canInviteFormalMeeting =
  phase.formalRequestStatus === "formal_dg_decision_recorded" ||
  phase.formalRequestStatus === "formal_dg_returned";
```

### dg-circuit.service.ts — returned_scanned branch (formal_request only)
```typescript
// Before: returned_scanned bucket + record_dg_decision action
// After: decision_recorded bucket + download_annotated_return only
bucket = "decision_recorded";
// No record_dg_decision pushed
```

## Frontend detail

### formal-request-progress.helpers.ts
`DECISION_OR_AFTER` now includes `"formal_dg_returned"` so `hasFormalDgDecision` returns true for legacy data.

### FormalRequestPhaseWorkspace.tsx
- `circuitOfficielStatus`: `dgReturned || dgDecisionRecorded` → `"Retour DG scanné"` (no separate "Décision enregistrée")
- `formalStatusLabels`: both `formal_dg_returned` and `formal_dg_decision_recorded` → `"Retour DG / Décision disponible"`
- Removed `!dgDecisionRecorded` WaitingState branch (was: "En attente de l'enregistrement de la décision DG")
- After `dgReturned`: show "Planifier la réunion formelle" button directly

### DgCircuitPage.tsx
- Removed `record_dg_decision` button block for formal_request
- Removed orphaned `submitDecision` function
- `formal-dg-decision` modal kind still exists in type (preserved, deferred)

## Verification results

```
cd apps/api
npm run typecheck  → PASS
npm run build      → PASS

cd apps/admin
npx tsc --noEmit   → PASS (no errors)
npm run build      → PASS (built in 1.21s)
```

## Manual checks

Not run; no live browser session in this pass.

## Business rules preserved

- Portal uploads formal request → gate exists
- Courriers officiels: print + put in physical DG circuit → mark_transmitted
- Courriers officiels: scan DG return → record_annotated_return
- After scan: item shows as "Décision saisie" in Courriers officiels (decision_recorded bucket)
- After scan: DN sees "Planifier la réunion formelle" in Phase 2 workspace
- Phase 1 preliminary workflow: unaffected
- POST /phases/formal-request/dg-decision route: preserved but no longer required for MVP flow

## Known risks / TODOs

- Existing records with `formal_dg_returned` status are handled by `canInviteFormalMeeting` safety net and `DECISION_OR_AFTER` update
- `formal-dg-decision` modal in DgCircuitPage.tsx still exists in the modal union type — can be removed in a future cleanup if dg-decision route is formally deprecated for formal_request
- No data migration needed: new scans will write `formal_dg_decision_recorded` directly

## Next step

OMA-FORMAL-9D or manual browser validation of Phase 2 collapsed flow.
