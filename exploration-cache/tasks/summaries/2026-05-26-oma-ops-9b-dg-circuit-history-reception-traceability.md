# OMA-OPS-9B - DG Circuit History / Receptionist Traceability

Date: 2026-05-26
Status: **Complete - API typecheck PASS, API build PASS, Admin typecheck PASS, Admin build PASS**

---

## Objective

Fix the Courriers officiels page so completed DG circuit items remain visible as historical records instead of disappearing when a DG return is recorded. Show both active tasks and history in one workspace with proper filtering, KPI counts, and read-only traceability for completed items.

---

## Files Modified

| File                                                    | Change                                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/dg-circuit/dg-circuit.service.ts` | Rewritten `listDgCircuitTasks`: DGReview-first query, new buckets, new response fields, extended counts |
| `apps/admin/src/lib/api/dg-circuit.api.ts`              | New bucket values, new task fields, extended counts type                                                |
| `apps/admin/src/pages/DgCircuitPage.tsx`                | New tabs, KPI row, read-only traceability panel, improved empty state, updated labels/styles            |

No new files. No new models. No route contract changes.

---

## Backend Listing Changes

### Query strategy - initial_request

**Before**: query by request status → join to DGReviews.
**After**: query all `DGReviewModel` records with `targetType: "initial_request"` → join to RequestModel. Also fetches pending requests (no DGReview yet) with status `submitted | intake_in_review`.

This ensures historical records always appear regardless of request status.

### Bucket assignment - initial_request (DGReview status driven)

| DGReview status                               | Bucket              |
| --------------------------------------------- | ------------------- |
| `decision_recorded`                           | `decision_recorded` |
| `returned_scanned`                            | `returned_scanned`  |
| `awaiting_return` / `sent_to_dg_circuit`      | `awaiting_return`   |
| `created`                                     | `to_transmit`       |
| No review + portal_upload + initialDocumentId | `to_transmit`       |
| No review + physical_deposit + planned        | `to_transmit`       |

### Query strategy - pre_evaluation

**Before**: `preliminaryStatus in [pre_eval_form_submitted, pre_eval_sent_to_dg, pre_eval_dg_decision_recorded]`
**After**: same OR `preEvaluationSentToDgAt exists` - catches any edge case where status diverged from date field.

### Bucket assignment - pre_evaluation

| Condition                                                             | Bucket             |
| --------------------------------------------------------------------- | ------------------ |
| `pre_eval_form_submitted` + completedDocumentId                       | `to_transmit`      |
| `pre_eval_sent_to_dg`                                                 | `awaiting_return`  |
| `pre_eval_dg_decision_recorded` OR (sentToDgAt + annotatedDocumentId) | `returned_scanned` |

### New response fields (additive)

`sentToDgAt`, `returnedFromDgAt`, `decisionRecordedAt`, `decision`, `orientedDirection`, `observations`, `handledByRole`

### Counts (extended)

```ts
counts: {
  toTransmit: number;
  awaitingReturn: number;
  returnedScanned: number; // new
  decisionRecorded: number; // new
  processed: number; // = returnedScanned + decisionRecorded, backward compat
}
```

### Backward compatibility

- `bucket=processed` filter maps to `returned_scanned | decision_recorded`
- `bucket=returns_to_register` still maps to `awaiting_return`
- `counts.processed` kept
- No removal of existing response fields

---

## Pre-evaluation Row Derivation

OmaPhase has NO `preEvaluationDgDecision` field. Items with status `pre_eval_dg_decision_recorded` map to `returned_scanned` (closest available bucket). The `decision_recorded` bucket is not reachable for pre-eval items. This is documented as a known limitation - no new fields added per constraints.

---

## Frontend UI Changes

### Tabs

| Key                 | Label                        |
| ------------------- | ---------------------------- |
| `all`               | Tous                         |
| `to_transmit`       | À imprimer                   |
| `awaiting_return`   | En circuit                   |
| `returned_scanned`  | Retours enregistrés _(new)_  |
| `decision_recorded` | Décision enregistrée _(new)_ |

"Traités" tab removed; covered by the two new tabs.

### KPI Row

5-chip strip below error banner: Total / À imprimer / En circuit / Retours DG / Décisions saisies. Sourced from `data.counts`. Hidden while loading.

### Detail panel - completed items

When `bucket === 'returned_scanned' | 'decision_recorded' | 'processed'`:

- Read-only `<dl>` grid: Type, Organisation, Postulant, Envoi DG, Retour DG, Décision, Direction, Observations
- Download button for annotated return document if available
- No mutation buttons

### Labels updated

- `initial_request` → "Demande initiale" (was "Courrier initial")
- `awaiting_return` status badge → "En circuit DG"
- `returned_scanned` status badge → "Retour DG enregistré"
- `decision_recorded` status badge → "Décision saisie"

### Empty state

"Aucun courrier dans cette vue. Les courriers traités restent disponibles via les filtres Retours enregistrés ou Décision enregistrée."

---

## Permission Behavior

No permission changes. Existing permissions:

- `DG_CIRCUIT_HANDLE` - initial_request items (all buckets)
- `PRE_EVAL_DG_CIRCUIT_HANDLE` - pre_evaluation active items
- `PRE_EVAL_DG_RETURN_CONSULT` - pre_evaluation completed items (download only)
- `COURRIER_REGISTER_PHYSICAL` - physical deposit receipt

History is visible to anyone with any of the three `DG_TASK_PERMISSIONS` - same as before.

---

## Verification Commands Run

```
cd apps/api
npm run typecheck  → PASS
npm run build      → PASS

cd apps/admin
npx tsc --noEmit   → PASS
npm run build      → PASS
```

---

## Runtime Tests

Not runtime-tested. Expected manual checks:

1. Pending DG item appears in En circuit
2. Item with returned/scanned DGReview appears under Retours enregistrés
3. Item with decision_recorded DGReview appears under Décision enregistrée
4. Pre-evaluation DG return remains visible under Retours enregistrés after upload
5. Initial request DG return remains visible after upload (no longer disappears)
6. Search works by organization/applicant/reference
7. Detail panel shows traceability for completed items
8. Mutation buttons hidden for returned_scanned / decision_recorded items
9. KPI counts update after filter changes
10. Existing active-task flow (print + upload return) still works

---

## Known Limitations / TODOs

- **Pre-eval decision field gap**: OmaPhase has no `preEvaluationDgDecision` field. Pre-eval completed items always land in `returned_scanned`, never `decision_recorded`. Receptionist cannot distinguish "returned" from "decision recorded" for pre-eval. Resolution: add `preEvaluationDgDecision` field to OmaPhase in a future slice if needed.
- **transmittedAt for old initial_request records**: Before OMA-OPS-9B, `transmittedAt` was sourced from `request.intake.sentToDgAt`. Now it comes from `review.sentToDgAt`. Old DGReview records created before 9A may have `sentToDgAt = null` on the review - the timeline step "Imprimé / mis en circuit" may show `-` for those records.
- **Pre-eval `$nin: []` risk**: If no reviewed requests exist, the pending-requests query uses `$nin: []` which matches everything. Filtered by status and courrierSource, so manageable. Index on `status` + `courrierSource` recommended if collection grows large.

---

## Next Recommended Slice

OMA-OPS-10 / Phase 2 - Demande formelle:

- Create `formal-request-phase.service.ts` using `createDgReview`, `saveDocument`, shared helpers
- Extend `AdminDossierDetail` with `formalRequest` section
- Use `PRELIMINARY_EVIDENCE_REQUIREMENTS` pattern for checklist-driven closure guards
