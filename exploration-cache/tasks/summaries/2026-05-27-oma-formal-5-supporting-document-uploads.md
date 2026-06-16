# OMA-FORMAL-5 - Supporting Document Uploads for Phase 2 Demande formelle

Date: 2026-05-27
Status: **Complete - API typecheck PASS, API lint PASS, API build PASS**

---

## Objective

Implement portal and admin upload endpoints for Phase 2 supporting documents.
Supporting docs update checklist progress only - they do NOT block or unlock any workflow gate.

---

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/04-backend/API_ROUTES.md`

## Source files inspected

_(all patterns from this session - no new files needed)_

---

## Files changed

| File                                                        | Change                                                                                                                                       |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/oma-phases/formal-request.service.ts` | Added `uploadFormalRequestSupportingDocument`, `mapRequirementToDocumentCategory`, `SUPPORTING_DOC_CATEGORY`, `ACTIVE_SUBMISSION_STATUS_SET` |
| `apps/api/src/modules/admin/admin.routes.ts`                | Added `POST /dossiers/:id/phases/formal-request/documents/:requirementId`                                                                    |
| `apps/api/src/modules/portal/portal.routes.ts`              | Added `POST /dossiers/:id/phases/formal-request/documents/:requirementId`                                                                    |

---

## Routes added

| Route                                                                      | Auth   | Permission                      | Multer                    |
| -------------------------------------------------------------------------- | ------ | ------------------------------- | ------------------------- |
| `POST /admin/dossiers/:id/phases/formal-request/documents/:requirementId`  | admin  | `DOCUMENT_UPLOAD_INTERNAL`      | `handleOmaDocumentUpload` |
| `POST /portal/dossiers/:id/phases/formal-request/documents/:requirementId` | portal | ownership via `getOwnedDossier` | `handleCourrierUpload`    |

---

## Key decisions

### Gate exclusion

- `requirementLevel === "gate"` → 409 `"La demande formelle doit être déposée via l'action dédiée."`

### Non-repeatable duplicate check

- Query existing active submission (`status ∈ {submitted, under_review, validated, requires_correction}`)
- If found → 409 `"Un document est déjà déposé pour cette exigence."`

### Repeatable requirements

- No duplicate check - multiple submissions allowed
- Applies to: management_personnel_acceptance, cv, management_qualifications, subcontractor_contracts, technical_structure_documents

### Document type mapping

- `Document.documentType = "other"` for all supporting docs (conservative - avoids exploding enum)
- Semantic link via `DocumentSubmission.requirementId`
- `Document.category` mapped: form → oma_approval_form, management_personnel_acceptance, compliance_statement; other → everything else

### State immutability guarantee

- `formalRequestStatus` NOT mutated
- `phase.status` NOT mutated
- `canSendToDg`, `canInviteFormalMeeting`, `canClosePhase` unchanged
- Only `requirements[].status`, `requirements[].submissions`, and `progress.*` update via existing read computation

### Response

- Admin: full `getAdminFormalRequestPhase` state
- Portal: minimal `{ uploaded, documentId, submissionId, requirementId, requirementCode, source }`

### Source validation

- Portal hardcodes `source=portal_upload`
- Admin validates `source ∈ {physical_deposit, internal_scan}`, rejects `portal_upload`

---

## Audit event

`formal_request.supporting_document_uploaded` with: `dossierId`, `phaseId`, `requirementId`, `requirementCode`, `documentId`, `submissionId`, `source`

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

- `Document.documentType = "other"` is generic - future document review UI may need richer typing. Can be extended later without breaking current behavior.
- No notification created for supporting doc uploads (per spec).
- Document review (approve/reject submissions) deferred.
- Phase 2 closure deferred to OMA-FORMAL-6.

---

## Next step

OMA-FORMAL-6 - Phase 2 closure: recevability courrier upload + closure courrier upload + close phase mutation.
