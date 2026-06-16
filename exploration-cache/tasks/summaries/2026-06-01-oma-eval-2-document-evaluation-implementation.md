# OMA-EVAL-2 — Backend Document Evaluation Implementation

Date: 2026-06-01
Type: implementation
Status: Complete — API typecheck PASS, build PASS

---

## Objective

Implement the backend document evaluation layer for Phase 3 (Évaluation approfondie):
- New `DocumentEvaluationModel` (document_evaluations collection)
- Auto-initialize evaluation records from Phase 2 submissions on first admin GET (idempotent)
- Admin review endpoint: satisfaisant / non_satisfaisant + required annotation
- `documentEvaluationStatus` sync after each review

---

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-0-phase-3-audit-planning.md`
- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-1-payment-gate-implementation.md`

---

## Source files inspected

- `apps/api/src/modules/documents/document-submission.model.ts` — fields, status enum, requirementId optional
- `apps/api/src/modules/documents/document-requirement.model.ts` — requirementLevel enum, gate value
- `apps/api/src/modules/oma-phases/document-evaluation.service.ts` — existing OMA-EVAL-1 structure
- `apps/api/src/modules/oma-phases/oma-phase.model.ts` — documentEvaluationStatus enum values
- `apps/api/src/shared/permissions/permissions.ts` — confirmed DOCUMENT_REVIEW assigned to dn_agent, dn_supervisor, admin
- `apps/api/src/modules/admin/admin.routes.ts` — import pattern + existing Phase 3 payment routes

---

## Files changed

### New files

- `apps/api/src/modules/document-evaluations/document-evaluation.model.ts` — DocumentEvaluation Mongoose model (collection: document_evaluations)

### Modified files

- `apps/api/src/modules/oma-phases/document-evaluation.service.ts` — added 3 exports + 2 internal helpers + updated imports
- `apps/api/src/modules/admin/admin.routes.ts` — added GET + PATCH evaluation routes + updated import

---

## Key decisions

1. One DocumentEvaluation per non-gate Phase 2 requirement (not per submission) — "per-requirement evaluation record" as specified
2. Initialization is idempotent via `updateOne($setOnInsert, upsert: true)` — safe to call on every GET
3. Gate requirements (requirementLevel="gate") excluded — join DocumentRequirement in init to filter
4. Latest non-replaced/archived submission per requirementId used as `submissionId` — ascending _id sort, last wins
5. Auto-init gate: only runs when `documentEvaluationStatus` is in PAYMENT_PASSED_STATUSES set
6. `syncEvaluationStatus` aggregates evaluation counts and updates documentEvaluationStatus atomically after each review:
   - any non_satisfaisant → `document_evaluation_waiting_corrections`
   - all satisfaisant (no pending) → `document_evaluation_ready_to_close`
   - otherwise → `document_evaluation_study_in_progress`
7. No new permissions needed — `DOCUMENT_REVIEW` already covers dn_agent, dn_supervisor, admin
8. TypeScript fix: `HydratedDocument<OmaPhase>` from mongoose import (not `ReturnType<typeof OmaPhaseModel.findOne>` which resolves to `{}`)

---

## Implementation details

### initializeDocumentEvaluations (internal)

- Finds Phase 2 OmaPhase (phaseKey="formal_request") for the dossier
- Queries Phase 2 submissions (requirementId set, status not in replaced/archived)
- Loads requirements to build gateReqIds set
- Deduplicates to latest submission per non-gate requirementId
- Upserts DocumentEvaluation records ($setOnInsert + upsert)
- Advances documentEvaluationStatus to `study_in_progress` if currently `payment_proof_submitted`

### syncEvaluationStatus (internal)

- Aggregates DocumentEvaluation counts by status for the phase
- Computes the next documentEvaluationStatus
- Only saves if the status actually changes (avoids unnecessary writes)

### getDocumentEvaluations (admin)

- Validates internal actor
- Calls loadDocEvalPhaseOrThrow
- Calls initializeDocumentEvaluations if payment gate passed
- Bulk-loads requirements and submissions for join
- Returns phase + evaluations (with joined requirement + submission) + progress counts

### reviewDocumentEvaluation (admin)

- Validates status is satisfaisant or non_satisfaisant
- Validates annotation required for non_satisfaisant
- Updates evaluation in DB
- Calls syncEvaluationStatus to recompute phase status
- Writes audit event: document_evaluation.evaluation_satisfaisant or document_evaluation.evaluation_non_satisfaisant

### Admin routes added

```
GET  /api/v1/admin/dossiers/:id/phases/document-evaluation/evaluations       [DOCUMENT_REVIEW]
PATCH /api/v1/admin/dossiers/:id/phases/document-evaluation/evaluations/:evaluationId  [DOCUMENT_REVIEW]
```

---

## Verification commands run

- API: `npm run typecheck` — PASS
- API: `npm run build` — PASS

## Manual checks run

Not run — no admin UI yet. Deferred to OMA-EVAL-5.

---

## Known risks / TODOs

- R1: Phase 2 submissions with no requirementId (non-requirement uploads) are excluded from evaluation. If any such submissions should be evaluated, they'd need an explicit override.
- R2: If Phase 2 had multiple submissions per requirement and the latest was "requires_correction" or "incomplete", the evaluation still initializes for it. The DN evaluates the best available document.
- R3: `document_evaluation_ready_to_close` is now set by syncEvaluationStatus, so OMA-EVAL-4 phase close guard just checks this status (not all evaluations).
- R4: Re-review is allowed (e.g., after correction upload in OMA-EVAL-3). Status can change from non_satisfaisant → satisfaisant.
- R5: correctionSubmissionId is set to null on init; OMA-EVAL-3 will update it when correction is uploaded.

---

## Next step

Implement **OMA-EVAL-3** (backend correction loop):
- Portal: upload corrected document for a non_satisfaisant evaluation
- Create DocumentSubmission (phaseKey="document_evaluation") for the correction
- Link to `DocumentEvaluation.correctionSubmissionId`
- Notify DN after correction uploaded
- Allow DN to re-review (re-use PATCH evaluations/:id endpoint)
