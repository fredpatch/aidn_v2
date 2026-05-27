# Current Task

## Phase: OMA-FORMAL-8 — Corrected Supporting Document Re-upload for Phase 2

Date: 2026-05-27
Status: **Complete — API typecheck PASS, API lint PASS, API build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-27-oma-formal-8-corrected-document-reupload.md`

## Files modified

- `apps/api/src/modules/oma-phases/formal-request.service.ts` — updated `uploadFormalRequestSupportingDocument`: replacement detection, archive/replace mutations, branched audit, extended portal response

## Key decisions

- `requires_correction` → allows corrected re-upload; all other active statuses still block
- Old document → `archived` (sets `replacedByDocumentId`)
- Old submission → `replaced`
- New upload → `submitted`; requirement status returns to `submitted`
- Audit: `supporting_document_reuploaded` for replacement path, `supporting_document_uploaded` for first upload
- Portal response extended with `replaced: boolean, previousSubmissionId?: string`
- No new routes, no schema changes, no phase gate changes

## Next step

Frontend Phase 2 cockpit or OMA-FORMAL-9 — TBD

---

## Previous task: OMA-FORMAL-7 — Recevability / Closure Courrier + Close Phase 2

Date: 2026-05-27
Status: **Complete — API typecheck PASS, API lint PASS, API build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-27-oma-formal-7-phase-closure.md`

## Files modified

- `apps/api/src/modules/oma-phases/formal-request.service.ts` — strengthened `canClosePhase` (loads DGReview), added `closure` block to read response; added `uploadFormalRecevabilityCourrier`, `uploadFormalClosureCourrier`, `closeFormalRequestPhase`
- `apps/api/src/modules/admin/admin.routes.ts` — added 3 imports + 3 routes

## Key decisions

- Recevability: `documentType = "other"`, `category = "decision"`; advances status to `formal_recevability_recorded`
- Closure courrier: `documentType = "phase_closure_letter"`, `category = "closure_letter"`; advances to `formal_ready_to_close` if IDs exist
- Close: full guard (DGReview.decision approved + meeting held + closure evidence); starts Phase 3 record; notifies postulant
- Phase 3 bootstrapped with `status = "in_progress"` (no Phase 3 business workflow)

## Next step

OMA-FORMAL-8 or frontend Phase 2 cockpit — TBD

---

## Previous task: OMA-FORMAL-6 — DN Document Review for Phase 2 Demande formelle

---

## Previous task: OMA-FORMAL-5 — Supporting Document Uploads for Phase 2 Demande formelle

Date: 2026-05-27
Status: **Complete — API typecheck PASS, API lint PASS, API build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-27-oma-formal-5-supporting-document-uploads.md`

## Files modified

- `apps/api/src/modules/oma-phases/formal-request.service.ts` — added `uploadFormalRequestSupportingDocument` + helpers
- `apps/api/src/modules/admin/admin.routes.ts` — added `POST /dossiers/:id/phases/formal-request/documents/:requirementId`
- `apps/api/src/modules/portal/portal.routes.ts` — added `POST /dossiers/:id/phases/formal-request/documents/:requirementId`

## Key decisions

- Gate requirement excluded from this endpoint (409).
- Non-repeatable requirements block duplicate active submissions.
- Repeatable requirements allow multiple submissions.
- Supporting docs never mutate workflow gates or formalRequestStatus.
- Document.documentType = "other" conservatively (semantic link via requirementId).

---

## Previous task: OMA-FORMAL-4 — Formal Meeting Mutations for Phase 2 Demande formelle

Date: 2026-05-27
Status: **Complete — API typecheck PASS, API lint PASS, API build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-27-oma-formal-4-formal-meeting.md`

## Files modified

- `apps/api/src/modules/oma-phases/formal-request.service.ts` — added `createFormalMeeting`, `markFormalMeetingHeld`, `uploadFormalMeetingReport`, 3 private helpers, `meeting` block in read state, `MeetingModel` + `NotificationModel` imports
- `apps/api/src/modules/admin/admin.routes.ts` — added 3 Phase 2 meeting routes

## Key decisions

- Meeting creation requires `formalRequestStatus="formal_dg_decision_recorded"`.
- In-app notification created for postulant on meeting creation.
- `meeting-report` does not require `meeting.status=held`.
- Phase 2 closure deferred to OMA-FORMAL-5.

## Next step

OMA-FORMAL-5 — Phase 2 closure: recevability + closure courrier + close phase mutation

---

## Previous task: OMA-FORMAL-3 — DG Circuit for Phase 2 Demande formelle

Date: 2026-05-27
Status: **Complete — API typecheck PASS, API lint PASS, API build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-27-oma-formal-3-dg-circuit.md`

## Files created

_(none)_

## Files modified

- `apps/api/src/modules/oma-phases/formal-request.service.ts` — added `sendFormalRequestToDg`, `recordFormalRequestDgReturn`, `recordFormalRequestDgDecision` + 5 private helpers
- `apps/api/src/modules/admin/admin.routes.ts` — added 3 Phase 2 DG routes

## Key decisions

- DGReview reuses generic `createDgReview`/`recordDgReturn`/`recordDgDecision` from `dg-circuit.service.ts`; `targetType="formal_request"`.
- Only `approved` DG decision sets `formal_dg_decision_recorded` → unlocks `canInviteFormalMeeting`.
- Rejected/reoriented: stored as `formal_requires_correction`, no auto-close, no meeting unlock.
- Supporting checklist non-blocking at all stages.
- TODO: rejected/reoriented final flow pending PO validation.

## Next step

OMA-FORMAL-4 — Formal meeting mutations and phase closure

---

## Previous task: OMA-FORMAL-2 — Formal Request Courrier Registration API

Date: 2026-05-27
Status: **Complete — API typecheck PASS, API lint PASS, API build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-27-oma-formal-2-formal-courrier-registration.md`

## Files created

_(none)_

## Files modified

- `apps/api/src/modules/courriers/courrier.model.ts` — added `"formal_request_courrier"` to `type` enum
- `apps/api/src/modules/documents/document.model.ts` — added `"formal_request_letter"` to `documentType` enum
- `apps/api/src/modules/oma-phases/formal-request.service.ts` — added `registerFormalRequestCourrier`; exported `Actor` type; added `validateFile` helper; added imports (saveDocument, writeAuditLog, getOwnedDossier)
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` — exported `getOwnedDossier` (was private)
- `apps/api/src/modules/portal/portal.routes.ts` — added `POST /dossiers/:id/phases/formal-request/courrier`
- `apps/api/src/modules/admin/admin.routes.ts` — added `POST /dossiers/:id/phases/formal-request/courrier`

## Key decisions

- Gate = `formalRequestCourrierId` only; supporting checklist is non-blocking.
- Duplicate courrier returns 409; replacement/versioning deferred.
- Portal actors get a sanitized response; admin actors get the full `getAdminFormalRequestPhase` read state.
- Admin endpoint validates `source ∈ {physical_deposit, internal_scan}`; portal hardcodes `source=portal_upload`.
- `getOwnedDossier` exported from `oma-phase.service.ts` to avoid duplication.

## Next step

OMA-FORMAL-3 — DG send/return mutations for Phase 2 formal request

---

## Previous task: OMA-FORMAL-1 — API Foundation for Phase 2 Demande formelle

Date: 2026-05-26
Status: **Complete — API typecheck PASS, API lint PASS, API build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-26-oma-formal-1-api-foundation.md`

## Files created

- `apps/api/src/modules/documents/document-requirement.model.ts`
- `apps/api/src/modules/documents/document-submission.model.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/scripts/seed-document-requirements.ts`

## Files modified

- `apps/api/src/modules/oma-phases/oma-phase.model.ts` — 15 Phase 2 fields added
- `apps/api/src/modules/admin/admin.routes.ts` — GET /dossiers/:id/phases/formal-request

## Key decisions

- Gate = `formalRequestCourrierId` only; supporting checklist is non-blocking.
- `formal_request` OmaPhase always exists (created by `insertMany` in `openAdminDossierDn`).
- Service placed in new `formal-request.service.ts` to keep Phase 2 separate from Phase 1.
- `blockingMissing` only depends on gate; `completionRate` is informational.

## Next step

OMA-FORMAL-2 — Phase 2 upload mutations + DG circuit + formal meeting

---

## Previous task: OMA-OPS-9C — Frontend Primitive Refactor Before Phase 2

Date: 2026-05-26
Status: **Complete — Admin typecheck PASS, Admin build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-26-oma-ops-9c-frontend-primitive-refactor.md`
