# OMA-FORMAL-6 - DN Document Review for Phase 2 Demande formelle

Date: 2026-05-27
Status: **Complete - API typecheck PASS, API lint PASS, API build PASS**

---

## Objective

Implement DN/admin review for Phase 2 `DocumentSubmission` records.
DN can validate, reject, or request correction on a submitted supporting document.
Review is informative/workflow support only - does not block or unlock any phase gate.

---

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-5-supporting-document-uploads.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/modules/documents/document-submission.model.ts`
- `apps/api/src/modules/documents/document.model.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/shared/permissions/permissions.ts`

---

## Files changed

| File                                                        | Change                                                                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/oma-phases/formal-request.service.ts` | Added `DocumentModel` import; added `REVIEW_STATUSES` set; added `reviewFormalRequestDocumentSubmission` |
| `apps/api/src/modules/admin/admin.routes.ts`                | Added import; added `POST /document-submissions/:id/review`                                              |

---

## Route added

| Route                                         | Auth  | Permission        |
| --------------------------------------------- | ----- | ----------------- |
| `POST /admin/document-submissions/:id/review` | admin | `DOCUMENT_REVIEW` |

Payload:

```json
{
  "status": "validated" | "rejected" | "requires_correction",
  "comment": "string (required for requires_correction)"
}
```

---

## Key decisions

### Guard chain

1. `ensureInternalActor` - admin/internal only
2. `status` in `{validated, rejected, requires_correction}` - else 400
3. `requires_correction` requires non-empty `comment` - else 400
4. Submission exists - else 404
5. `submission.phaseKey === "formal_request"` - else 400
6. `submission.status` not in `{archived, replaced}` - else 409
7. Linked requirement `requirementLevel !== "gate"` (if set) - else 409 "La demande formelle est traitée via le circuit courrier dédié."
8. Linked document exists - else 404
9. Phase exists and not closed - else 409

### Review does NOT require

- Formal request courrier to exist
- DG decision to be recorded
- Meeting to be created or held

(Documents can be uploaded/analyzed progressively.)

### State mutations

| Model                | Fields updated                                          |
| -------------------- | ------------------------------------------------------- |
| `DocumentSubmission` | `status`, `reviewComment`, `reviewedById`, `reviewedAt` |
| `Document`           | `status`                                                |

### State NOT mutated

- `formalRequestStatus`
- `phase.status`
- `canSendToDg`
- `canInviteFormalMeeting`
- `canClosePhase`
- `formalRequestCourrierId`
- `formalRequestDgReviewId`
- `formalMeetingId`

### Notification

- `requires_correction` only: in-app notification to `dossier.postulantUserId`
- Title: "Correction demandée"
- relatedType: "document", relatedId: documentId

### Response

```json
{
  "submission": { "id", "status", "reviewComment", "reviewedAt", "reviewedById" },
  "document": { "id", "status" }
}
```

### Read state impact

`getAdminFormalRequestPhase` already reads `DocumentSubmission.status` via `computeRequirementStatus`.
`computeRequirementStatus` returns the latest active submission status: supports `validated`, `rejected`, `requires_correction` - all already in `ACTIVE_SUBMISSION_STATUSES`.

---

## Audit event

`formal_request.supporting_document_reviewed`

Metadata: `dossierId`, `phaseId`, `requirementId`, `documentId`, `submissionId`, `status`, `reviewerId`

---

## Known risks / TODOs

- `requires_correction` is included in `ACTIVE_SUBMISSION_STATUS_SET` (OMA-FORMAL-5), so non-repeatable duplicate guard still blocks re-upload after correction.
  - **TODO**: corrected re-upload/replacement flow must be implemented as a separate slice.
- No rejection notification added (spec says not required; correction is the only notifiable event).

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

## Next step

OMA-FORMAL-7 - Phase 2 closure: recevability courrier upload + closure courrier upload + close phase mutation.
