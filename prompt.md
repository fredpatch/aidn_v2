## CACHE-FIRST PROTOCOL - ALWAYS FOLLOW

When processing this task, you MUST:

### 1. Read Cache First

Always start by reading:

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md` if relevant
- `exploration-cache/archive/summaries/**` only when needed as source material

### 2. Answer From Cache When Possible

If the answer exists in cache:

- cite the cache source
- answer from cache
- stop there unless the current task explicitly requires implementation

Format:
FROM CACHE: [file path] - [finding]

### 3. Only Explore Gaps

If cache is incomplete, state:

CACHE GAP: [specific missing info]

Then:

- explore only the missing path(s)
- never re-explore cached paths without reason
- keep exploration narrow

4. Update Cache After Each Discovery
   - After any meaningful new finding:
   - update the relevant `exploration/pattern/task file`
   - update `QUICK-REFERENCE.md` if the finding is cross-cutting
   - update `manifest.json` only if the pass requires manifest changes
   - update `exploration-cache/tasks/current-task.md`

5. Token Saving Rules
   - Do not repeat large cached content in the response
   - Use file references instead
   - Do not re-read files already read this session unless needed
   - Keep responses brief and grounded
   - Do not broaden scope silently
   - One task only

### SESSION START PROCEDURE

At the beginning of the task:

1. Read this prompt.md
2. Read exploration-cache/manifest.json
3. Read exploration-cache/QUICK-REFERENCE.md
4. Check whether relevant answer/state already exists in:
   `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
   `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
   `exploration-cache/04-backend/API_ROUTES.md`
   `exploration-cache/05-data/DATA_MODELS.md`
   `exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md`
   `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
   `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
   `exploration-cache/tasks/current-task.md`
5. State cache status briefly.
6. Proceed only with the current objective.

Expected cache status block:

## CACHE STATUS

- Services explored: [brief list]
- App areas explored: [brief list]
- Packages explored: [brief list]
- Patterns available: [brief list]
- Last update: [timestamp]
- Pending gaps: [brief list]

## CRITICAL RULES

NEVER re-explore a path already sufficiently covered in cache unless a real gap exists.
ALWAYS keep scope narrow.
ALWAYS separate planning from implementation.
ALWAYS update task state in cache.
USE exploration-cache/tasks/history/ for completed-pass memory.
ALWAYS update cache after discovering something new.
KEEP responses concise and point to cache files.
ASK before large explorations over 10 files.
Do not implement before returning the planning report and receiving approval.

## QUICK COMMANDS

[STATUS] Show current cache coverage for this objective
[GAPS] List missing info for current objective
[UPDATE] Force cache update with recent findings
[VERIFY] Check if answer exists in cache before exploring
[NEXT] Propose the next narrow pass

## TASK COMPLETION CHECKLIST

Before marking a pass complete:

- all listed deliverables exist
- content is grounded in cache or explicitly explored gaps
- no unrelated files were changed
- exploration-cache/tasks/current-task.md is updated
- create a brief summary-implementation.md with related implementation notes
- next step is clearly stated
- a summary file was created under `exploration-cache/tasks/summaries/`

## Summary Tracking Rule

For every planning, implementation, correction, or modification pass, create a short summary file in:

`exploration-cache/tasks/summaries/`

Use this naming format:

YYYY-MM-DD-<phase-name>-planning.md
YYYY-MM-DD-<phase-name>-implementation.md
YYYY-MM-DD-<phase-name>-modification.md
YYYY-MM-DD-<phase-name>-correction.md

## Each summary must include:

- Objective
- Cache files read
- Source files inspected
- Files changed, if any
- Key decisions
- Implementation details, if any
- Verification commands run
- Manual checks run or not run
- Known risks / TODOs
- Next step

## Also update:

- exploration-cache/tasks/current-task.md
- exploration-cache/tasks/history/ when the pass is completed

# CURRENT OBJECTIVE

# OMA-FORMAL-2 — Formal Request Courrier Registration API

You are working inside the existing `AIDN_V2` repository.

## Current validated state

OMA-FORMAL-1 is complete.

Implemented:

- `DocumentRequirement` model
- `DocumentSubmission` model
- Phase 2 requirements seed
- `OmaPhase` Phase 2 fields
- `GET /api/v1/admin/dossiers/:id/phases/formal-request`
- Gate/progress computation

Verified:

- API typecheck PASS
- API lint PASS
- API build PASS

Important current limitation:

- `formalRequestCourrierId` is still always null because no Phase 2 formal courrier mutation exists yet.
- Therefore `gate.exists = false` and `canSendToDg = false`.

Now implement OMA-FORMAL-2.

This task is API/backend only.

Do not implement frontend UI.
Do not implement DG send/return mutations.
Do not implement supporting document uploads.
Do not implement document review.
Do not implement formal meeting mutations.
Do not implement phase close mutation.

---

## Objective

Implement formal request courrier registration for Phase 2.

This is the main Phase 2 gate.

The system must support:

1. Portal upload of formal request courrier.
2. Admin/internal registration of formal request courrier.
3. Creation of central `Document`.
4. Creation of `Courrier`.
5. Creation of `DocumentSubmission` linked to the `formal_request_letter` gate requirement.
6. Update of `OmaPhase.formalRequestCourrierId`.
7. Update of `OmaPhase.formalRequestStatus`.
8. Update of generic phase status to `in_progress`.
9. Audit logging.
10. Updated Phase 2 read state reflecting `gate.exists = true`.

---

## Locked business rule

Only the formal request courrier blocks Phase 2 progression.

Correct:

```ts
canSendToDg = Boolean(phase.formalRequestCourrierId) && !phase.formalRequestDgReviewId;

Wrong:

canSendToDg = allExpectedSupportingDocumentsUploaded;

Supporting documents remain non-blocking.

The CDC describes Phase 2 as beginning with the postulant submitting the formal application dossier, then DG receiving/instructing DN before the formal meeting and closure evidence. The broader document checklist must be tracked, but it must not block DG progression.

Explore first

Read cache first:

exploration-cache/manifest.json
exploration-cache/QUICK-REFERENCE.md
exploration-cache/04-backend/API_ROUTES.md
exploration-cache/05-data/DATA_MODELS.md
exploration-cache/06-workflows/OMA_FORMAL_REQUEST_WORKFLOW.md
exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md
exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md
exploration-cache/tasks/current-task.md

Then inspect:

apps/api/src/modules/oma-phases/formal-request.service.ts
apps/api/src/modules/oma-phases/oma-phase.model.ts
apps/api/src/modules/documents/document.model.ts
apps/api/src/modules/documents/document-requirement.model.ts
apps/api/src/modules/documents/document-submission.model.ts
apps/api/src/modules/courriers/courrier.model.ts
apps/api/src/modules/dossiers/dossier.model.ts
apps/api/src/modules/admin/admin.routes.ts
apps/api/src/modules/portal/portal.routes.ts
apps/api/src/shared/storage/storage.adapter.ts
apps/api/src/modules/audit/audit.service.ts
apps/api/src/shared/permissions/permissions.ts

Follow existing upload/storage conventions from previous request/courrier/preliminary flows.

Required enum/model update

Update Courrier.type enum to include:

"formal_request_courrier"

Use this type for the Phase 2 formal request courrier.

Do not reuse initial_request_courrier.

Reason:

initial request courrier belongs to pre-DN dossier/request intake;
formal request courrier belongs to Phase 2 inside an opened DN dossier.
API endpoints
1. Portal upload formal request courrier

Add:

POST /api/v1/portal/dossiers/:id/phases/formal-request/courrier

Auth:

portal authenticated postulant
must own the dossier / belong to dossier organization using existing portal ownership rules

Permission:

portal user only; use existing portal auth guard conventions

Payload:

multipart/form-data
file required
optional metadata:
officialReference
notes

Source:

source = "portal_upload"

Expected behavior:

Validate dossier ownership.
Resolve or create/read Phase 2 OmaPhase using existing conventions.
Find active DocumentRequirement:
phaseKey = "formal_request"
code = "formal_request_letter"
requirementLevel = "gate"
Store file using existing storage adapter.
Create Document:
ownerType = "phase"
ownerId = phase._id
category = "courrier"
documentType = "formal_request_letter" or closest compatible existing enum
visibility = "internal_only" or existing convention; if portal should also see own uploaded file, preserve current portal behavior
status = "uploaded"
Create Courrier:
dossierId
requestId if dossier has requestId
type = "formal_request_courrier"
source = "portal_upload"
documentId
uploadedAt
registeredById = portal user id
officialReference
notes
Create DocumentSubmission:
dossierId
phaseId
phaseKey = "formal_request"
requirementId = gate requirement id
documentId
submittedById = portal user id
submittedByRole = "postulant"
source = "portal_upload"
status = "submitted"
Update OmaPhase:
formalRequestCourrierId = courrier._id
formalRequestStatus = "formal_request_received"
status = "in_progress"
formalRequestReceivedAt = now
preserve existing fields
Audit:
formal_request.courrier_registered
Return updated Phase 2 state using the same read model from OMA-FORMAL-1.
2. Admin/internal register formal request courrier

Add:

POST /api/v1/admin/dossiers/:id/phases/formal-request/courrier

Auth:

admin/internal auth

Permission:

use DOCUMENT_UPLOAD_INTERNAL
also require dossier visibility permission if existing route conventions require it

Payload:

multipart/form-data
file required
metadata:
source: "physical_deposit" or "internal_scan"
officialReference?
physicalDepositDate?
notes?

Validation:

reject source = "portal_upload" on admin endpoint
accept only:
physical_deposit
internal_scan

Expected behavior:
Same as portal endpoint, except:

submittedByRole = actor.role;
source = payload.source;
registeredById = actor.id;

For physicalDepositDate, set it on Courrier if the model supports it.

Return updated Phase 2 state.

Duplicate / replacement behavior

For OMA-FORMAL-2, keep it simple and safe.

If phase.formalRequestCourrierId already exists:

reject with 409
message: La demande formelle est déjà enregistrée pour cette phase.

Do not implement replacement/versioning yet.

Replacement will be a later slice.

Phase safety guards

Reject if:

- dossier not found
- formal_request phase not found and existing architecture does not auto-create it
- dossier is closed/cancelled/suspended if existing conventions block mutations
- Phase 2 is already closed
- file missing
- gate requirement not seeded
- formalRequestCourrierId already exists

Do not require all checklist documents.

Do not require preliminary documents here, unless existing phase sequencing already enforces Phase 1 closed before Phase 2.

If phase sequencing guard exists, respect it.

Response shape

Return the same shape as:

GET /api/v1/admin/dossiers/:id/phases/formal-request

For portal endpoint, either:

return the same full state if safe; or
return a sanitized portal-safe subset if existing portal conventions require limited data.

At minimum, return:

{
  phase: {
    id: string;
    phaseKey: "formal_request";
    status: string;
    formalRequestStatus: "formal_request_received";
    canSendToDg: true;
  },
  gate: {
    exists: true;
    formalRequestCourrierId: string;
    source: "portal_upload" | "physical_deposit" | "internal_scan";
    receivedAt: string;
  },
  progress: {
    blockingMissing: false;
    completionRate: number;
  }
}
Audit events

Add/use:

formal_request.courrier_registered

Metadata should include:

dossierId
phaseId
courrierId
documentId
source
officialReference if provided

Do not log file contents.

Documentation updates

Update:

TASK.md
exploration-cache/04-backend/API_ROUTES.md
exploration-cache/05-data/DATA_MODELS.md
exploration-cache/06-workflows/OMA_FORMAL_REQUEST_WORKFLOW.md
exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md
exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md
exploration-cache/tasks/current-task.md
exploration-cache/manifest.json

Create:

exploration-cache/tasks/summaries/2026-05-26-oma-formal-2-formal-courrier-registration.md

Document clearly:

Phase 2 formal request courrier registration implemented.
Formal request courrier is the only Phase 2 blocking gate.
Supporting checklist remains non-blocking.
Duplicate formal request courrier is blocked for now.
Replacement/versioning deferred.
DG mutation deferred.
Meeting mutation deferred.
Verification

Run:

cd apps/api
npm run typecheck
npm run lint
npm run build

Manual runtime checks if possible:

Admin upload
curl -X POST http://localhost:4000/api/v1/admin/dossiers/<DOSSIER_ID>/phases/formal-request/courrier \
  -H "Cookie: <ADMIN_COOKIE>" \
  -F "file=@/path/to/formal-request.pdf" \
  -F "source=internal_scan" \
  -F "officialReference=REF-FORMAL-001" \
  -F "notes=Demande formelle scannée"

Expected:

200/201
gate.exists = true
blockingMissing = false
canSendToDg = true
formalRequestStatus = formal_request_received
formalRequestCourrierId set
Document created
Courrier created with type = formal_request_courrier
DocumentSubmission created for formal_request_letter
Duplicate upload

Call same endpoint again.

Expected:

409
no duplicate courrier created
Portal upload
curl -X POST http://localhost:4000/api/v1/portal/dossiers/<DOSSIER_ID>/phases/formal-request/courrier \
  -H "Cookie: <PORTAL_COOKIE>" \
  -F "file=@/path/to/formal-request.pdf" \
  -F "officialReference=REF-P-001"

Expected:

works only for owned dossier
rejects non-owned dossier
Expected implementation report

Return:

Files created
Files modified
Routes added
Courrier enum changes
Document creation behavior
Courrier creation behavior
DocumentSubmission creation behavior
OmaPhase update behavior
Gate/progress behavior after upload
Duplicate protection behavior
Permissions/guards used
Verification commands run
Manual runtime tests run or not run
Risks/TODOs
Next recommended slice
Acceptance checklist
✅ Admin can register formal request courrier
✅ Portal can upload formal request courrier for owned dossier
✅ Non-owned portal dossier is rejected
✅ File creates Document
✅ Registration creates Courrier with type formal_request_courrier
✅ Registration creates DocumentSubmission linked to gate requirement
✅ OmaPhase.formalRequestCourrierId is set
✅ formalRequestStatus becomes formal_request_received
✅ phase.status becomes in_progress
✅ gate.exists becomes true
✅ progress.blockingMissing becomes false
✅ canSendToDg becomes true
✅ Supporting checklist still does not block canSendToDg
✅ Duplicate formal courrier registration returns 409
✅ No DG mutation added
✅ No meeting mutation added
✅ No frontend added
✅ Typecheck/lint/build pass
```
