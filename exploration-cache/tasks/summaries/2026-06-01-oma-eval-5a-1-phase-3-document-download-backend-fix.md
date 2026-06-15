# OMA-EVAL-5A-1 — Backend Phase 3 Document Download Support

Date: 2026-06-01
Type: implementation (backend correction)
Status: Complete

---

## Objective

Patch `downloadAdminDossierDocument` in `oma-phase.service.ts` so Phase 3 documents
(invoice, payment proof, corrected document) can be downloaded via the existing
`GET /api/v1/admin/dossiers/:id/documents/:documentId` route.

---

## Cache files read

- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-5a-admin-api-client-types.md`
- `exploration-cache/tasks/current-task.md`

---

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.service.ts` — downloadAdminDossierDocument
- `apps/api/src/modules/payments/phase-payment.model.ts` — confirmed dossierId + invoiceDocumentId + paymentProofDocumentId fields

---

## Files changed

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
  - Added import: `PhasePaymentModel` from `../payments/phase-payment.model.js`
  - Extended `downloadAdminDossierDocument` fallback with two new Phase 3 branches

---

## Key decisions

1. **Same route kept** — no new route added; authorization fallback extended in place
2. **Two new branches added inside the existing `!formalSubmission` block**:
   - Branch 1: `PhasePaymentModel.findOne({dossierId, $or:[invoiceDocumentId, paymentProofDocumentId]})` — covers study_fee_invoice and study_fee_payment_proof
   - Branch 2: `DocumentSubmissionModel.findOne({dossierId, documentId, phaseKey:"document_evaluation"})` — covers corrected_document uploads (which are created as DocumentSubmissions in OMA-EVAL-3)
3. **Existing Phase 1/2 logic untouched** — preliminary evidence fields array + formal_request submission check preserved as-is
4. **Fail-safe preserved** — only throws 403 after all three branches fail

---

## Implementation details

Authorization waterfall in `downloadAdminDossierDocument`:
1. Phase 1: doc is in `ADMIN_PRELIMINARY_DOWNLOAD_FIELDS` on the preliminary OmaPhase → allow
2. Phase 2: live DocumentSubmission with `phaseKey="formal_request"` → allow
3. Phase 3a: PhasePayment for same dossier references the documentId → allow (invoice / proof)
4. Phase 3b: live DocumentSubmission with `phaseKey="document_evaluation"` → allow (corrections)
5. Otherwise → 403

Security: all branches require `dossierId` match; no generic document lookup by ID alone.

---

## Verification commands run

```
npm run typecheck  →  0 errors (clean)
```

---

## Manual checks run

Not run — no runtime environment available.

---

## Known risks / TODOs

- Phase 3b correction lookup uses DocumentSubmission (`phaseKey="document_evaluation"`) —
  this relies on OMA-EVAL-3 creating a submission record for each correction upload, which
  is confirmed by the service implementation.
- Payment documents are linked via `PhasePaymentModel` fields, not via `DocumentSubmission`,
  because invoice/proof are stored with `ownerType=phase_payment` and are NOT added to
  a DocumentSubmission record.

---

## Next step

**OMA-EVAL-5B** — Admin Phase 3 workspace component (DocumentEvaluationPhaseWorkspace.tsx,
helpers, dialogs, labels). Download support now unblocked.
