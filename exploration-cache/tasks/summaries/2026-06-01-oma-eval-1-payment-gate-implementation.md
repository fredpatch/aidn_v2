# OMA-EVAL-1 — Backend Payment Gate Implementation

Date: 2026-06-01
Type: implementation
Status: Complete — API typecheck PASS, API lint PASS, API build PASS

---

## Objective

Implement the backend payment gate for Phase 3 (Évaluation approfondie):
- New `s5_agent` role + `PAYMENT_INVOICE_UPLOAD` / `PAYMENT_VIEW` permissions
- `PhasePaymentModel` for invoice + proof tracking
- Admin: upload study fee invoice
- Portal: view payment state + upload payment proof
- OmaPhase `documentEvaluationStatus` sub-status field

No document evaluation, correction loop, or admin/portal UI.

---

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-0-phase-3-audit-planning.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/05-data/DATA_MODELS.md`
- `exploration-cache/04-backend/AUTH_AND_PERMISSIONS.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`

---

## Source files inspected

- `apps/api/src/modules/documents/document.model.ts` — extended ownerType + documentType
- `apps/api/src/shared/permissions/permissions.ts` — extended with new role + permissions
- `apps/api/src/modules/oma-phases/oma-phase.model.ts` — extended with documentEvaluationStatus
- `apps/api/src/modules/oma-phases/formal-request.service.ts` — patched Phase 3 creation
- `apps/api/src/modules/audit/audit.service.ts` — confirmed `metadata` field name
- `apps/api/src/modules/notifications/notification.model.ts` — confirmed in_app + relatedType
- `apps/api/src/shared/utils/document.helpers.ts` — saveDocument signature
- `apps/api/src/shared/utils/service.helpers.ts` — ensureObjectId, toId, toIso
- `apps/api/src/shared/guards/auth.middleware.ts` — confirmed role→permissions flow
- `apps/api/src/shared/guards/auth-context.ts` — AuthUser type
- `apps/api/src/modules/admin/admin.routes.ts` — handleOmaDocumentUpload reuse pattern
- `apps/api/src/modules/portal/portal.routes.ts` — handleCourrierUpload reuse pattern

---

## Files changed

### New files
- `apps/api/src/modules/payments/phase-payment.model.ts` — PhasePayment Mongoose model
- `apps/api/src/modules/oma-phases/document-evaluation.service.ts` — service: getDocumentEvaluationPaymentState, getPortalDocumentEvaluationPaymentState, uploadStudyFeeInvoice, uploadStudyFeePaymentProof

### Modified files
- `apps/api/src/shared/permissions/permissions.ts` — added PAYMENT_INVOICE_UPLOAD, PAYMENT_VIEW, s5_agent; updated role assignments
- `apps/api/src/modules/documents/document.model.ts` — added phase_payment to ownerType; study_fee_invoice + study_fee_payment_proof to documentType
- `apps/api/src/modules/oma-phases/oma-phase.model.ts` — added documentEvaluationStatus field
- `apps/api/src/modules/oma-phases/formal-request.service.ts` — patched Phase 3 creation to set documentEvaluationStatus="document_evaluation_waiting_invoice"
- `apps/api/src/modules/admin/admin.routes.ts` — added GET+POST document-evaluation payment routes
- `apps/api/src/modules/portal/portal.routes.ts` — added GET+POST document-evaluation payment routes

---

## Key decisions

1. Invoice stored with `ownerType="phase_payment"` + `ownerId=payment._id` — clean separation from OmaPhase documents
2. Invoice re-upload blocked once payment proof submitted (one-way ratchet)
3. Payment proof re-upload allowed (overwrites reference) — no rejection mechanism in this slice
4. `canStartDocumentEvaluation = invoiceDocumentId && paymentProofDocumentId` (no validation required)
5. Internal notification for proof upload targets `dossier.assignedDnAgentId` only (no broadcast); audit event always written
6. Reused `handleOmaDocumentUpload` (admin) and `handleCourrierUpload` (portal) multer handlers — no new multer setup
7. `s5_agent` is an internal role — gets `DOSSIER_VIEW_ALL` so the admin payment state GET works without a separate endpoint

---

## Implementation details

### Payment gate logic

`getDocumentEvaluationPaymentState` (admin):
- Finds/creates PhasePayment for study_fee on Phase 3
- Returns phase + payment + canStartDocumentEvaluation

`uploadStudyFeeInvoice` (admin):
- Blocks if payment_proof_submitted (can't change invoice after proof received)
- saveDocument → PhasePayment.invoiceDocumentId
- OmaPhase.documentEvaluationStatus = "document_evaluation_waiting_payment"
- Notifies postulant in-app
- Writes audit event

`getPortalDocumentEvaluationPaymentState` (portal):
- Portal-safe: returns phaseStatus, payment.status, invoiceDocumentId, paymentProofDocumentId, canUploadPaymentProof

`uploadStudyFeePaymentProof` (portal):
- Requires invoiceDocumentId (409 otherwise)
- saveDocument → PhasePayment.paymentProofDocumentId
- OmaPhase.documentEvaluationStatus = "document_evaluation_payment_proof_submitted"
- Notifies assigned DN agent if dossier.assignedDnAgentId present
- Writes audit event

### Phase 3 creation patch

`closeFormalRequestPhase` now sets `documentEvaluationStatus: "document_evaluation_waiting_invoice"` when creating or activating the Phase 3 OmaPhase record.

---

## Verification commands run

- API: `npm run typecheck` — PASS
- API: `npm run lint` — PASS (same as typecheck)
- API: `npm run build` — PASS

---

## Manual checks run

Not run — no admin/portal UI yet. Runtime checks deferred to OMA-EVAL-5/6.

Manual checklist for future validation:
1. s5_agent role returns PAYMENT_INVOICE_UPLOAD + PAYMENT_VIEW in /auth/me permissions
2. reception gets payment permissions
3. dn_agent can call GET payment state but not POST invoice
4. Phase 3 OmaPhase created by Phase 2 close has documentEvaluationStatus="document_evaluation_waiting_invoice"
5. Admin invoice upload creates Document (study_fee_invoice, postulant_visible) + PhasePayment
6. documentEvaluationStatus → document_evaluation_waiting_payment after invoice
7. Portal GET returns invoice available, canUploadPaymentProof=true
8. Portal proof upload blocked when no invoice
9. Portal proof upload creates Document + updates PhasePayment
10. documentEvaluationStatus → document_evaluation_payment_proof_submitted after proof
11. canStartDocumentEvaluation = true after both exist
12. No validation/rejection endpoint exists

---

## Known risks / TODOs

- Portal invoice download: postulant needs to download the invoice. Current endpoint `GET /portal/dossiers/:id/documents/:documentId` may not exist or be scoped correctly. To verify in OMA-EVAL-6 when portal UI is built.
- Admin DOSSIER_VIEW_ALL guard: admin GET /payment uses PAYMENT_VIEW but s5_agent needs DOSSIER_VIEW_ALL to see dossier. Granted to s5_agent.
- `document_evaluation_study_in_progress` status: set by OMA-EVAL-2 when evaluation begins.
- No payment validation/rejection. If PO wants to add it later, it's additive (new endpoint + new status values).
- Internal broadcast notification gap: proof upload only notifies `assignedDnAgentId`. If not set, only audit event. Documented.

---

## Next step

Implement **OMA-EVAL-2** (backend document evaluation):
- `DocumentEvaluationModel` — per-requirement evaluation record
- Initialize evaluations from Phase 2 submissions
- Review endpoint: satisfaisant / non_satisfaisant + annotation
