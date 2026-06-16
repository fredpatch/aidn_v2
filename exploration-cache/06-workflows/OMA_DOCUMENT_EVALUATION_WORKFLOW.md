# OMA Document Evaluation Workflow (Phase 3)

Last reviewed: 2026-06-01

## Phase 3 Overview

Phase 3 (Évaluation approfondie des documents) starts after Phase 2 (Demande formelle) is closed.

The dossier status moves to `document_evaluation_phase`. An `OmaPhase` record with `phaseKey="document_evaluation"` is created/activated by `closeFormalRequestPhase` with `status="in_progress"` and `documentEvaluationStatus="document_evaluation_waiting_invoice"`.

## Payment Gate (OMA-EVAL-1 — Implemented)

Phase 3 has a mandatory payment gate before DN can start document study.

```txt
Gate condition: canStartDocumentEvaluation = invoiceDocumentId && paymentProofDocumentId
```

Flow:
```txt
1. S5/admin uploads study fee invoice via POST /admin/dossiers/:id/phases/document-evaluation/invoice
2. Postulant receives in-app notification
3. Postulant downloads invoice and uploads proof via POST /portal/dossiers/:id/phases/document-evaluation/payment-proof
4. DN/S5 can consult payment state via GET /admin/dossiers/:id/phases/document-evaluation/payment
5. canStartDocumentEvaluation = true → DN can begin document evaluation (OMA-EVAL-2)
```

No payment validation/rejection in this slice. Proof upload is sufficient to unlock study.

## documentEvaluationStatus Transitions (OMA-EVAL-1)

```txt
document_evaluation_waiting_invoice    → (invoice uploaded)        → document_evaluation_waiting_payment
document_evaluation_waiting_payment    → (proof uploaded)          → document_evaluation_payment_proof_submitted
document_evaluation_payment_proof_submitted → (eval starts)        → document_evaluation_study_in_progress [OMA-EVAL-2]
document_evaluation_study_in_progress  → (corrections needed)      → document_evaluation_waiting_corrections [OMA-EVAL-3]
document_evaluation_waiting_corrections → (all satisfaisant)       → document_evaluation_ready_to_close [OMA-EVAL-4]
document_evaluation_ready_to_close    → (Phase 3 close)            → document_evaluation_closed [OMA-EVAL-4]
```

## PhasePayment Model

Collection: `phase_payments`

Status enum: `invoice_pending` → `invoice_sent` → `payment_proof_submitted`

Invoice re-upload: blocked once payment proof is submitted.
Proof re-upload: allowed (overwrites previous proof document reference).

## Permissions

- `PAYMENT_INVOICE_UPLOAD`: s5_agent, reception, admin, bootstrap_admin
- `PAYMENT_VIEW`: s5_agent, reception, dn_agent, dn_supervisor, admin, bootstrap_admin

## Notifications

- Invoice upload → notifies `dossier.postulantUserId` in-app
- Proof upload → notifies `dossier.assignedDnAgentId` in-app (if set); otherwise audit-event only

## Audit Events

- `document_evaluation.study_fee_invoice_uploaded` — on admin invoice upload
- `document_evaluation.study_fee_payment_proof_uploaded` — on portal proof upload

## Deferred

- Document evaluation board (OMA-EVAL-2): create DocumentEvaluationModel, review satisfaisant/non_satisfaisant
- Correction loop (OMA-EVAL-3): portal correction upload for non-satisfaisant docs
- Phase 3 close (OMA-EVAL-4): all satisfaisant + proof → close + unlock Phase 4 + notify
- Admin Phase 3 workspace UI (OMA-EVAL-5)
- Portal Phase 3 UI (OMA-EVAL-6)
- Cross-tab integration (OMA-EVAL-7)
- Payment validation/rejection (not planned in current scope)
