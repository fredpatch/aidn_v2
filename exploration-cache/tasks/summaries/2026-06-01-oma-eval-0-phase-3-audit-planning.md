# OMA-EVAL-0 — Phase 3 Audit & Planning Summary

Date: 2026-06-01
Type: planning
Status: Complete — no implementation

---

## Objective

Audit existing backend/frontend/cache patterns and produce a step-by-step implementation plan for Phase 3 (Évaluation approfondie des documents). No implementation in this pass.

---

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/05-data/DATA_MODELS.md`
- `exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`

Missing cache file: `exploration-cache/06-workflows/OMA_FORMAL_REQUEST_WORKFLOW.md` — still not created.

---

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.service.ts` (partial — portal labels, upload, notification helpers)
- `apps/api/src/modules/oma-phases/formal-request.service.ts` (full — close pattern, canClosePhase, Phase 3 unlock at line 1537)
- `apps/api/src/modules/oma-phases/oma-phase.model.ts` (full — schema fields)
- `apps/api/src/modules/dossiers/dossier.model.ts` (full — status enum)
- `apps/api/src/modules/documents/document-requirement.model.ts` (full — phaseKey enum)
- `apps/api/src/modules/documents/document-submission.model.ts` (full — status enum, phaseKey enum)
- `apps/api/src/shared/permissions/permissions.ts` (full — all permissions + role assignments)
- `apps/admin/src/pages/dossiers/components/UploadDocumentDialog.tsx` (full)
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx` (partial — Phase 3 placeholder at line 976)

---

## Files changed

None. Audit and planning only.

---

## Key decisions

1. **Phase 3 unlock already exists** — `closeFormalRequestPhase` creates `OmaPhase{phaseKey="document_evaluation", status="in_progress"}` and sets `dossier.status="document_evaluation_phase"`. No new unlock code needed.

2. **New models required**:
   - `PhasePaymentModel` (phase_payments collection) — invoice + payment proof + validation state
   - `DocumentEvaluationModel` (document_evaluations collection) — per-requirement evaluation with satisfaisant/non_satisfaisant + annotation + correction link
   - `OmaPhase.documentEvaluationStatus` sub-status field (nullable, non-breaking addition)

3. **No S5 role exists** — invoice upload will use `DOCUMENT_UPLOAD_INTERNAL` (dn_supervisor, dn_agent, admin). To clarify with PO.

4. **Document evaluation initializes from Phase 2 submissions** — Phase 3 evaluates Phase 2 `DocumentSubmission` records, not new requirements. Gate requirements (`requirementLevel="gate"`) excluded.

5. **DocumentRequirement `phaseKey="document_evaluation"` is unused** — no seed data needed for Phase 3, because Phase 3 has no new document requirements. Evaluations are based on Phase 2 requirements.

6. **Portal Phase 3 invoice download** — reuse `downloadPortalDossierDocument` or add Phase 3 download endpoint. Decide in OMA-EVAL-6.

7. **Slice ordering**: EVAL-1 (payment) → EVAL-2 (evaluation) → EVAL-3 (corrections) → EVAL-4 (close) → EVAL-5 (admin UI) → EVAL-6 (portal UI) → EVAL-7 (cross-tab).

---

## Implementation details

None. Planning only.

---

## Verification commands run

Not run — audit/planning only.

## Manual checks run

Not run — no implementation.

---

## Known risks / TODOs

- R1: S5 actor — no S5 role in permissions. Confirm with PO.
- R2: Payment rejection re-upload cycle — needs `proof_rejected` state in PhasePayment.
- R3: OmaPhase schema extension is non-breaking (nullable fields only).
- R4: Auto-initialize evaluations on Phase 3 activation or first admin GET (idempotent).
- R5: Unlimited correction iterations assumed.
- R6: Portal invoice download endpoint — decide between extending getPortalDossier or a dedicated endpoint.
- R7: Phase 4 unlock on Phase 3 close — follow exact pattern from formal-request.service.ts:1537.
- R8: Exclude gate requirements from evaluation initialization.

---

## Next step

Receive PO approval for the planning report, then implement **OMA-EVAL-1** (backend payment gate):
- `PhasePaymentModel`
- `document-evaluation.service.ts` (init, invoice upload, payment proof, validate, reject)
- `OmaPhase.documentEvaluationStatus` field
- Admin and portal routes for payment gate
