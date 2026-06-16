# OMA-FORMAL-2 - Formal Request Courrier Registration API

Date: 2026-05-27
Status: **Complete - API typecheck PASS, API lint PASS, API build PASS**

---

## Objective

Implement formal request courrier registration for Phase 2 (Demande formelle).
This is the main Phase 2 gate: only `formalRequestCourrierId` blocks `canSendToDg`.

---

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-26-oma-formal-1-api-foundation.md`
- `exploration-cache/04-backend/API_ROUTES.md`

## Source files inspected

- `apps/api/src/modules/courriers/courrier.model.ts`
- `apps/api/src/modules/documents/document.model.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` (getOwnedDossier, uploadCompletedPreEvaluationForm pattern)
- `apps/api/src/modules/portal/portal.routes.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/modules/audit/audit.service.ts`
- `apps/api/src/shared/permissions/permissions.ts`
- `apps/api/src/shared/utils/document.helpers.ts`

---

## Files changed

| File                                                        | Change                                                                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/courriers/courrier.model.ts`          | Added `"formal_request_courrier"` to `type` enum                                                         |
| `apps/api/src/modules/documents/document.model.ts`          | Added `"formal_request_letter"` to `documentType` enum                                                   |
| `apps/api/src/modules/oma-phases/formal-request.service.ts` | Added `registerFormalRequestCourrier`; exported `Actor` type; added `validateFile` helper; added imports |
| `apps/api/src/modules/oma-phases/oma-phase.service.ts`      | Exported `getOwnedDossier` (was private `const`)                                                         |
| `apps/api/src/modules/portal/portal.routes.ts`              | Added `POST /dossiers/:id/phases/formal-request/courrier`                                                |
| `apps/api/src/modules/admin/admin.routes.ts`                | Added `POST /dossiers/:id/phases/formal-request/courrier`                                                |

---

## Routes added

- `POST /api/v1/admin/dossiers/:id/phases/formal-request/courrier`
  - Permission: `DOCUMENT_UPLOAD_INTERNAL`
  - Multer: `handleOmaDocumentUpload` (existing, `physicalCourrierUpload.single("file")`)
  - Payload: `source` (physical_deposit|internal_scan), `officialReference?`, `physicalDepositDate?`, `notes?`
  - Rejects `source=portal_upload` with 400

- `POST /api/v1/portal/dossiers/:id/phases/formal-request/courrier`
  - Auth: `requireAuth({ scope: "portal" })`
  - Multer: `handleCourrierUpload` (existing)
  - Hardcodes `source=portal_upload`
  - Payload: `officialReference?`, `notes?`
  - Verifies postulant owns the dossier via `getOwnedDossier`

---

## Key decisions

### Enum updates

- `Courrier.type` enum: added `"formal_request_courrier"` - separate from `initial_request_courrier` (intake flow)
- `Document.documentType` enum: added `"formal_request_letter"`

### Document creation

- `saveDocument()` called with `ownerType="phase"`, `ownerId=phase._id`, `category="courrier"`, `documentType="formal_request_letter"`, `visibility="internal_only"`, `status="uploaded"`

### Courrier creation

- `CourrierModel.create({ dossierId, requestId?, type="formal_request_courrier", source, documentId, uploadedAt (portal) | physicalDepositDate (admin), officialReference?, notes?, registeredById })`

### DocumentSubmission creation

- Linked to gate requirement (`formal_request_letter`, `requirementLevel=gate`)
- `status="submitted"`, `submittedByRole` = "postulant" for portal or actor.role for admin

### OmaPhase update

- `formalRequestCourrierId = courrier._id`
- `formalRequestStatus = "formal_request_received"`
- `status = "in_progress"`
- `formalRequestReceivedAt = now`

### Duplicate protection

- If `phase.formalRequestCourrierId` already set: reject with 409 `"La demande formelle est déjà enregistrée pour cette phase."`

### Gate/progress after upload

- `gate.exists = true`
- `blockingMissing = false`
- `canSendToDg = true`
- Supporting checklist does NOT block `canSendToDg`

### Response shape

- Admin path: returns full `getAdminFormalRequestPhase` read state
- Portal path: returns sanitized subset `{ phase: { id, phaseKey, status, formalRequestStatus, canSendToDg }, gate: { exists, formalRequestCourrierId, source, receivedAt }, progress: { blockingMissing, completionRate: null } }`

### Audit

- Action: `formal_request.courrier_registered`
- Metadata: dossierId, phaseId, courrierId, documentId, source, officialReference?

---

## Permissions / guards used

- Portal: `requireAuth({ scope: "portal" })` + ownership via `getOwnedDossier`
- Admin: `requireAuth({ scope: "admin" })` (global router middleware) + `requirePermission(Permissions.DOCUMENT_UPLOAD_INTERNAL)`

---

## Verification commands run

```
cd apps/api
npm run typecheck  → PASS
npm run lint       → PASS
npm run build      → PASS
```

## Manual runtime tests run

Not run (no running server).

---

## Known risks / TODOs

- `getOwnedDossier` exported from `oma-phase.service.ts` - if the file ever splits into smaller modules, this export may need relocation.
- `physicalDepositDate` is accepted but no validation on date format (relies on `new Date()` coercion).
- Duplicate protection is intentionally simple (409 only); replacement/versioning deferred to a later slice.
- No DG mutation added (OMA-FORMAL-3 deferred).
- No meeting mutation added (deferred).
- No frontend UI added.
- Seed script (`seed-document-requirements.ts`) must be run before the gate requirement query will resolve; otherwise 500 with a clear message.

---

## Next step

OMA-FORMAL-3 - Phase 2 DG send/return mutations (`POST /admin/dossiers/:id/phases/formal-request/send-to-dg`, `POST /admin/dossiers/:id/phases/formal-request/record-dg-return`).
