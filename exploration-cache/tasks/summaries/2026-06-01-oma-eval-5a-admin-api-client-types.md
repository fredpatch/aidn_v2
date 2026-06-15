# OMA-EVAL-5A — Admin Phase 3 API Client + Types

Date: 2026-06-01
Type: implementation
Status: Complete

---

## Objective

Add TypeScript types and API methods for Phase 3 (Évaluation approfondie) to
`apps/admin/src/lib/api/dossiers.api.ts`. No visual changes, no new components.

---

## Cache files read

- `prompt.md`
- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-5-phase-3-ui-audit-planning.md`

---

## Source files inspected

- `apps/api/src/modules/document-evaluations/document-evaluation.model.ts` — confirmed backend enum values
- `apps/api/src/modules/oma-phases/document-evaluation.service.ts` — confirmed all 4 return shapes
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` (downloadAdminDossierDocument) — confirmed Phase 3 download gap
- `apps/admin/src/lib/api/client.ts` — confirmed apiPatch exists
- `apps/admin/src/lib/api/dossiers.api.ts` — confirmed existing patterns

---

## Files changed

- `apps/admin/src/lib/api/dossiers.api.ts`
  - Added `apiPatch` to imports
  - Added 10 types (DocumentEvaluationStatus through AdminDocumentEvaluationCloseResult)
  - Added 5 API methods (getDocumentEvaluationPaymentState, uploadStudyFeeInvoice,
    getDocumentEvaluations, reviewDocumentEvaluation, closeDocumentEvaluationPhase)
  - Added TODO comment for Phase 3 document download gap

---

## Key decisions

1. **French enum values preserved** — `DocumentEvaluationStatus` uses backend values
   (`pending`, `satisfaisant`, `non_satisfaisant`, `correction_submitted`) not English aliases.
2. **reviewDocumentEvaluation returns `AdminDocumentEvaluationReviewResult`** — backend returns
   only the updated evaluation + phase snapshot, not the full evaluations list.
3. **Progress fields match backend camelCase** — `satisfaisant`, `nonSatisfaisant` (not English).
4. **Download method NOT added** — `downloadDossierDocument` only covers Phase 1+2 documents;
   Phase 3 docs (ownerType=phase_payment/phase) would get 403. Documented as TODO for OMA-EVAL-5B.

---

## Implementation details

Types added:
- `DocumentEvaluationStatus` — `"pending" | "satisfaisant" | "non_satisfaisant" | "correction_submitted"`
- `DocumentEvaluationPhaseStatus` — 7-value enum matching backend OmaPhase field
- `PhasePaymentStatus` — `"invoice_pending" | "invoice_sent" | "payment_proof_submitted"`
- `AdminDocumentEvaluationPhase` — phase shape returned in all Phase 3 responses
- `AdminDocumentEvaluationPayment` — serialized payment record
- `AdminDocumentEvaluationPaymentState` — GET payment endpoint response
- `AdminDocumentEvaluationRequirement` — embedded in evaluation items
- `AdminDocumentEvaluationSubmission` — embedded in evaluation items
- `AdminDocumentEvaluationItem` — single evaluation row
- `AdminDocumentEvaluationProgress` — `{total, pending, satisfaisant, nonSatisfaisant}`
- `AdminDocumentEvaluationState` — GET evaluations endpoint response
- `AdminDocumentEvaluationReviewPayload` — PATCH review request body
- `AdminDocumentEvaluationReviewResult` — PATCH review response
- `AdminDocumentEvaluationCloseResult` — POST close response

Methods added:
- `getDocumentEvaluationPaymentState(dossierId)` — GET payment state
- `uploadStudyFeeInvoice(dossierId, formData)` — POST invoice upload
- `getDocumentEvaluations(dossierId)` — GET evaluations + auto-init
- `reviewDocumentEvaluation(dossierId, evaluationId, payload)` — PATCH review
- `closeDocumentEvaluationPhase(dossierId)` — POST close + Phase 4 unlock

---

## Verification commands run

```
npx tsc --noEmit  →  0 errors (clean)
```

---

## Manual checks run

Not applicable — no visual changes.

---

## Known risks / TODOs

- **R3 (from OMA-EVAL-5)**: `downloadAdminDossierDocument` on the backend is hardcoded to
  Phase 1 preliminary evidence + Phase 2 formal_request submissions. Phase 3 documents
  (invoice/proof: ownerType=phase_payment; corrections: ownerType=phase, phaseKey=document_evaluation)
  will return 403. A backend fix is needed before Phase 3 download buttons can work.
  Documented as TODO in dossiers.api.ts and tracked for OMA-EVAL-5B.

---

## Next step

**OMA-EVAL-5B** — Admin Phase 3 workspace component:
- `document-evaluation-progress.helpers.ts`
- `document-evaluation-dialogs.tsx`
- `DocumentEvaluationPhaseWorkspace.tsx`
- `dossier-detail.labels.ts` additions
