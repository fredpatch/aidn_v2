# OMA-FORMAL-8 - Corrected Supporting Document Re-upload for Phase 2

Date: 2026-05-27
Status: **Complete - API typecheck PASS, API lint PASS, API build PASS**

---

## Objective

Allow corrected re-upload for Phase 2 non-repeatable supporting documents when the latest
active submission is `requires_correction`. Previous submission becomes `replaced`, previous
document becomes `archived`, new upload returns to `submitted`.

---

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-5-supporting-document-uploads.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/formal-request.service.ts` (full context)

---

## Files changed

| File                                                        | Change                                                                                                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/oma-phases/formal-request.service.ts` | Updated `uploadFormalRequestSupportingDocument`: replacement detection, replacement mutations, branched audit, extended portal response |

No new files. No new routes. No schema changes.

---

## Implementation details

### Replacement detection (non-repeatable path)

Old: flat 409 if any active submission exists.

New:

```ts
let submissionToReplace: GenericRecord | null = null;

if (!requirement.isRepeatable) {
  const existingActive = await DocumentSubmissionModel.findOne({...})
    .sort({ createdAt: -1 }).lean();
  if (existingActive) {
    if (String(existingActive.status) === "requires_correction") {
      submissionToReplace = existingActive; // allow replacement
    } else {
      throw new HttpError(409, "Un document est déjà déposé pour cette exigence.");
    }
  }
}
```

`ACTIVE_SUBMISSION_STATUS_SET` unchanged - still includes `requires_correction` so it's found. Now the response to finding it is conditional.

### Replacement mutations (after new document + submission created)

```ts
if (isReplacement) {
  await DocumentModel.findByIdAndUpdate(submissionToReplace!.documentId, {
    status: "archived",
    replacedByDocumentId: documentId, // Document.replacedByDocumentId already in schema
  });
  await DocumentSubmissionModel.findByIdAndUpdate(submissionToReplace!._id, {
    status: "replaced",
  });
}
```

### Audit events

- First upload: `formal_request.supporting_document_uploaded` (unchanged)
- Corrected re-upload: `formal_request.supporting_document_reuploaded` with `oldSubmissionId`, `oldDocumentId`, `newSubmissionId`, `newDocumentId`

### Portal response

Extended with `replaced: boolean` and optional `previousSubmissionId`:

```ts
{
  uploaded: true,
  replaced: isReplacement,
  previousSubmissionId: isReplacement ? submissionToReplace._id.toString() : undefined,
  documentId, submissionId, requirementId, requirementCode, source
}
```

Admin response unchanged - returns `getAdminFormalRequestPhase` which already reflects new state.

---

## Read-state behavior

`computeRequirementStatus` filters by `ACTIVE_SUBMISSION_STATUSES` (submitted/under_review/validated/requires_correction). After replacement:

- Old submission → `replaced` → NOT in active set → ignored
- New submission → `submitted` → IS in active set → becomes latest

Requirement status correctly returns to `submitted` after re-upload.

The `submissions[]` array in the read model includes all submissions (including `replaced`), but `status` computation ignores them.

---

## Guards preserved from OMA-FORMAL-5

- dossier exists + portal ownership enforced
- phase exists + not closed
- requirement exists, active, phaseKey = formal_request
- requirementLevel !== gate (409)
- file exists
- admin source ∈ {physical_deposit, internal_scan}
- portal source hardcoded portal_upload

Additional: replacement only allowed when latest active status = `requires_correction`

---

## Locked business rules confirmed

- Gate (`formalRequestCourrierId`) unchanged ✅
- `formalRequestStatus` NOT mutated ✅
- `canSendToDg`, `canInviteFormalMeeting`, `canClosePhase` NOT mutated ✅
- Repeatable requirements: no change in behavior ✅
- No notification on re-upload ✅
- No review auto-validation ✅
- No phase closure changes ✅

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

- No `replacedBySubmissionId` on `DocumentSubmission` (schema doesn't have it; not added to avoid schema bloat). Linkage is via audit metadata only.
- `replacedByDocumentId` on `Document` correctly links old → new.
- If multiple corrections happen in sequence, each re-upload replaces the previous submission. Historical chain is traceable via audit logs.

---

## Next step

Frontend Phase 2 cockpit - or OMA-FORMAL-9 if additional backend Phase 2 slices are needed.
