# OMA-FORMAL-7 - Recevability / Closure Courrier + Close Phase 2

Date: 2026-05-27
Status: **Complete - API typecheck PASS, API lint PASS, API build PASS**

---

## Objective

Implement final Phase 2 closure backend support:

- Upload courrier de recevabilité
- Upload courrier de clôture Phase II
- Close Phase 2: update dossier status, start Phase 3, notify postulant

---

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-6-document-review.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- `apps/api/src/modules/dossiers/dossier.model.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` (closePreliminaryPhase pattern)
- `apps/api/src/modules/admin/admin.routes.ts`

---

## Files changed

| File                                                        | Change                                                                                                                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/src/modules/oma-phases/formal-request.service.ts` | Added DGReview load to read model; strengthened `canClosePhase`; added `closure` block to response; added `uploadFormalRecevabilityCourrier`, `uploadFormalClosureCourrier`, `closeFormalRequestPhase` |
| `apps/api/src/modules/admin/admin.routes.ts`                | Added 3 new imports + 3 new routes                                                                                                                                                                     |

---

## Routes added

| Route                                                                  | Auth  | Permission                 | Multer                    |
| ---------------------------------------------------------------------- | ----- | -------------------------- | ------------------------- |
| `POST /admin/dossiers/:id/phases/formal-request/recevability-courrier` | admin | `DOCUMENT_UPLOAD_INTERNAL` | `handleOmaDocumentUpload` |
| `POST /admin/dossiers/:id/phases/formal-request/closure-courrier`      | admin | `DOCUMENT_UPLOAD_INTERNAL` | `handleOmaDocumentUpload` |
| `POST /admin/dossiers/:id/phases/formal-request/close`                 | admin | `PHASE_CLOSE`              | none                      |

---

## Key decisions

### Read model strengthening

`getAdminFormalRequestPhase` now loads `DGReviewModel` (if `formalRequestDgReviewId` exists) in addition to MeetingModel, and uses:

```ts
const dgDecisionApproved = formalDgReview
  ? String(formalDgReview.decision) === "approved"
  : false;
const meetingHeld = formalMeeting
  ? String(formalMeeting.status) === "held"
  : false;
const canClosePhase = !!(
  phase.formalRequestCourrierId &&
  dgDecisionApproved &&
  meetingHeld &&
  (phase.recevabilityCourrierDocumentId || phase.phaseClosureCourrierDocumentId)
);
```

Also added `closure` block to response (existing `phase.canClosePhase` preserved):

```ts
closure: {
  (recevabilityCourrierDocumentId,
    phaseClosureCourrierDocumentId,
    canClosePhase);
}
```

### Recevability upload

- `Document.category = "decision"`, `documentType = "other"` (conservative)
- Advances `formalRequestStatus` to `"formal_recevability_recorded"` only if current status is before that
- Does NOT auto-close

### Closure courrier upload

- `Document.category = "closure_letter"`, `documentType = "phase_closure_letter"` (enum already exists)
- Advances `formalRequestStatus` to `"formal_ready_to_close"` if `formalRequestCourrierId`, `formalRequestDgReviewId`, and `formalMeetingId` all exist (lightweight ID check; full guard enforced in close endpoint)
- Does NOT auto-close

### Phase 2 closure guards (strict enforcement in `closeFormalRequestPhase`)

1. Phase not already closed
2. `formalRequestCourrierId` exists
3. `formalRequestDgReviewId` exists AND `DGReview.status === "decision_recorded"` AND `DGReview.decision === "approved"`
4. `formalMeetingId` exists AND `Meeting.status === "held"`
5. `recevabilityCourrierDocumentId || phaseClosureCourrierDocumentId` exists

Supporting checklist is NOT required.

### Phase 2 close mutations

| Model                | Fields updated                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| `OmaPhase` (Phase 2) | `formalRequestStatus = "formal_closed"`, `status = "closed"`, `closedAt`, `closedById`, `formalClosedAt` |
| `Dossier`            | `status = "document_evaluation_phase"`                                                                   |

### Phase 3 start/unlock

Uses find-or-create pattern (not upsert, unlike preliminary):

- If no Phase 3 record → `OmaPhaseModel.create` with `status = "in_progress"`, `startedAt`, `startedById`
- If existing with `status = "not_started"` → set to `"in_progress"`, set `startedAt`/`startedById` if missing
- If already `in_progress` or further → no change

No Phase 3 business workflow fields added.

### Notification (close only)

In-app notification to `dossier.postulantUserId`:

- title: "Phase II clôturée"
- relatedType: "phase", relatedId: phase.\_id

### Audit events

- `formal_request.recevability_uploaded` - on recevability upload
- `formal_request.closure_uploaded` - on closure courrier upload
- `formal_request.phase_closed` - on close (includes `nextPhaseId`)

---

## Enum status confirmed in model

All enums already in `oma-phase.model.ts`:

- `"formal_recevability_recorded"` ✅
- `"formal_ready_to_close"` ✅
- `"formal_closed"` ✅

`dossier.status = "document_evaluation_phase"` ✅

---

## Verification

```
cd apps/api
npm run typecheck  → PASS
npm run lint       → PASS
npm run build      → PASS
```

## Manual runtime tests

Not run (no running server).

---

## Known risks / TODOs

- `uploadFormalRecevabilityCourrier` uses `documentType = "other"` conservatively. A `"formal_recevability_letter"` enum value could be added later for richer document classification.
- `uploadFormalClosureCourrier` advances status using only ID-level gate check (no DGReview.decision/meeting.status query). The close endpoint enforces the full guard.
- Phase 3 business workflow (document evaluation specific fields, checklist, etc.) is deferred - only the generic OmaPhase record is created/started.
- No email or Outlook notifications added.
- No document replacement/versioning added.

---

## Next step

OMA-FORMAL-8 or frontend Phase 2 cockpit - TBD based on PO prioritization.
