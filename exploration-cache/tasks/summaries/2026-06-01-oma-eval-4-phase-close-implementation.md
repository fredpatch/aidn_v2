# OMA-EVAL-4 — Backend Phase 3 Close + Unlock Phase 4

Date: 2026-06-01
Type: implementation
Status: Complete — API typecheck PASS, build PASS

---

## Objective

Implement backend closure for Phase 3 (Évaluation approfondie des documents):
- Admin endpoint to close Phase 3
- Server-side readiness guard (aggregate from DB, not stored status)
- Phase 3 closed → Phase 4 (inspection) unlocked → dossier.status = inspection_phase
- Postulant notified, audit event written

---

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-3-correction-loop-implementation.md`

---

## Source files inspected

- `apps/api/src/modules/oma-phases/formal-request.service.ts` (lines 1400–1588) — Phase 2 close/unlock pattern
- `apps/api/src/modules/dossiers/dossier.model.ts` — confirmed `inspection_phase` in status enum
- `apps/api/src/modules/oma-phases/oma-phase.model.ts` — confirmed closedAt, closedById, startedAt, startedById fields

---

## Files changed

### Modified files

- `apps/api/src/modules/oma-phases/document-evaluation.service.ts`
  - Added `closeDocumentEvaluationPhase` export

- `apps/api/src/modules/admin/admin.routes.ts`
  - Added import for `closeDocumentEvaluationPhase`
  - Added `POST /dossiers/:id/phases/document-evaluation/close` [PHASE_CLOSE]

---

## Key decisions

1. Guard is a direct DB aggregate (not trusting stored `documentEvaluationStatus`) — prevents race conditions / stale state
2. Guard fails if total evaluations === 0 (study never started / payment gate not passed)
3. Guard fails if any pending / non_satisfaisant / correction_submitted exists
4. Phase 4 creation follows exact Phase 2→Phase 3 unlock pattern from formal-request.service.ts
5. No closure courrier required — official Phase 3 closure communication handled outside AIDN
6. `loadDocEvalPhaseOrThrow` already handles "not found" (404) and "already closed" (409) — no duplicate guards needed
7. Audit metadata uses "document_evaluation_closed" as newStatus (set on phase just before audit)

---

## Implementation details

### closeDocumentEvaluationPhase

1. ensureInternalActor
2. Load dossier (404 if missing)
3. loadDocEvalPhaseOrThrow (404 if no Phase 3; 409 if already closed)
4. Aggregate DocumentEvaluation counts for phaseId
5. Guard: total === 0 || any pending/non_satisfaisant/correction_submitted → 409
6. Set phase: status=closed, documentEvaluationStatus=document_evaluation_closed, closedAt, closedById → save
7. Set dossier.status = inspection_phase → save
8. OmaPhaseModel.findOne(phaseKey="inspection"): create if missing; activate if not_started
9. NotificationModel.create for postulantUserId (if set)
10. writeAuditLog: document_evaluation.phase_closed
11. Return { phase, nextPhase, dossier }

### Admin route

```
POST /api/v1/admin/dossiers/:id/phases/document-evaluation/close  [PHASE_CLOSE]
```

---

## Verification commands run

- API: `npm run typecheck` — PASS
- API: `npm run build` — PASS

## Manual checks run

Not run — no admin UI yet. Deferred to OMA-EVAL-5.

---

## Known risks / TODOs

- R1: Phase 4 (inspection) workflow is not implemented — only the OmaPhase record is created. Phase 4 planning is a separate task.
- R2: `inspectionStatus` sub-status field is not added — will be added in Phase 4 planning (OMA-EVAL-5+).
- R3: Phase close does not require a closure courrier by design — if PO later requires one, it's additive (new guard + upload endpoint).

---

## Next step

Implement **OMA-EVAL-5** (admin Phase 3 workspace UI):
- `DocumentEvaluationPhaseWorkspace.tsx`
- Payment state display + invoice download
- Evaluation board: satisfaisant/non_satisfaisant review controls
- Correction indicator per evaluation
- Phase close button (guard: ready_to_close)
