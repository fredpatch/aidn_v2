# Current Task

## Phase: OMA-FORMAL-2 — Formal Request Courrier Registration API

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
