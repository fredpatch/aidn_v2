# OMA-EVAL-3 — Backend Correction Upload Loop Implementation

Date: 2026-06-01
Type: implementation
Status: Complete — API typecheck PASS, build PASS

---

## Objective

Implement the portal correction upload loop for Phase 3 document evaluation:
- Postulant uploads corrected document for a non_satisfaisant evaluation
- Correction linked to existing DocumentEvaluation via correctionSubmissionId
- Evaluation status becomes correction_submitted
- DN is notified; DN re-reviews via existing PATCH endpoint
- documentEvaluationStatus synced after upload

---

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-2-document-evaluation-implementation.md`

---

## Source files inspected

- `apps/api/src/modules/document-evaluations/document-evaluation.model.ts` — confirmed missing fields
- `apps/api/src/modules/documents/document.model.ts` — confirmed documentType enum, ownerType enum, visibility enum, category enum
- `apps/api/src/modules/oma-phases/document-evaluation.service.ts` — existing structure + imports
- `apps/api/src/modules/portal/portal.routes.ts` — import pattern, handleCourrierUpload reuse

---

## Files changed

### Modified files

- `apps/api/src/modules/document-evaluations/document-evaluation.model.ts`
  - Added `"correction_submitted"` to status enum
  - Added `correctionRequestedAt: Date | null` (set when DN marks non_satisfaisant)
  - Added `correctionSubmittedAt: Date | null` (set when postulant uploads correction)
  - Added `correctionSubmittedById: ObjectId | null` (portal user id)

- `apps/api/src/modules/documents/document.model.ts`
  - Added `"corrected_document"` to documentType enum

- `apps/api/src/modules/oma-phases/document-evaluation.service.ts`
  - `syncEvaluationStatus`: now handles `correction_submitted` count; any correction_submitted → study_in_progress (not ready_to_close); requires all satisfaisant + no pending/correction_submitted for ready_to_close
  - `reviewDocumentEvaluation`: sets `correctionRequestedAt = now` each time status becomes non_satisfaisant
  - Added `uploadDocumentEvaluationCorrection` export

- `apps/api/src/modules/portal/portal.routes.ts`
  - Added import for `uploadDocumentEvaluationCorrection`
  - Added `POST /document-evaluations/:evaluationId/correction` route

---

## Key decisions

1. Ownership check via `getOwnedDossier(evaluation.dossierId, actor)` — evaluation loaded first to get dossierId, then ownership confirmed
2. `submissionId` on the evaluation is UPDATED to new correction submission (tracks latest), `correctionSubmissionId` also set to same value
3. Previous `annotation`, `reviewedById`, `reviewedAt` preserved — portal shows last DN annotation until re-review
4. `correctionRequestedAt` set/updated on each non_satisfaisant review (latest correction request timestamp)
5. `correctedDocument`: ownerType="phase", category="form", documentType="corrected_document", visibility="postulant_visible"
6. No new multer handler — reused `handleCourrierUpload` (multipart `file` field, existing size limit)
7. No new route under `/dossiers/:id/...` — route is `/document-evaluations/:evaluationId/correction` since dossierId is derived from evaluation record
8. DN re-review reuses existing PATCH endpoint — no status guard on current status in reviewDocumentEvaluation (correction_submitted → satisfaisant/non_satisfaisant works)
9. Notification gap documented: if no assignedDnAgentId, only audit event is written

---

## Implementation details

### uploadDocumentEvaluationCorrection

1. Load evaluation by evaluationId
2. getOwnedDossier(dossierId, actor) — ownership + portal user
3. Load Phase 3 OmaPhase (from evaluation.phaseId)
4. Guard: phase not closed, status === "non_satisfaisant", annotation exists, file present
5. saveDocument → corrected_document (phase-owned, postulant_visible)
6. DocumentSubmissionModel.create (phaseKey="document_evaluation", submittedByRole="postulant")
7. Update evaluation: submissionId, correctionSubmissionId, correctionSubmittedAt, correctionSubmittedById, status="correction_submitted"
8. syncEvaluationStatus → study_in_progress (if no other non_satisfaisant remain)
9. Notify assignedDnAgentId if present
10. writeAuditLog: document_evaluation.correction_submitted

### syncEvaluationStatus update

```
correction_submitted count included in "not all satisfaisant" check
any non_satisfaisant > 0 → waiting_corrections
pending === 0 && correctionSubmitted === 0 && satisfaisant === total → ready_to_close
otherwise → study_in_progress
```

---

## Verification commands run

- API: `npm run typecheck` — PASS
- API: `npm run build` — PASS

## Manual checks run

Not run — no portal UI yet. Deferred to OMA-EVAL-6.

---

## Known risks / TODOs

- R1: If dossier has no assignedDnAgentId, correction upload only produces an audit event (no notification). Documented gap.
- R2: Multiple correction loops supported: DN can re-mark non_satisfaisant after correction; postulant uploads again; cycle repeats.
- R3: "Ajouter ce document à l'évaluation" admin action deferred. Documented in API_ROUTES.md cache.
- R4: Portal invoice/correction document download: postulant may need to access uploaded correction documents. Deferred to OMA-EVAL-6 when portal UI is built.

---

## Next step

Implement **OMA-EVAL-4** (backend Phase 3 close):
- Admin endpoint to close Phase 3
- Guard: documentEvaluationStatus === "document_evaluation_ready_to_close"
- Set Phase 3 OmaPhase.status = "closed", documentEvaluationStatus = "document_evaluation_closed"
- Unlock Phase 4 (inspection): create/activate inspection OmaPhase, set dossier.status
- Notify postulant
- Write audit event
