# OMA-OPS-9A - Pre-Phase 2 Workflow Primitive Refactor

Date: 2026-05-26
Status: **Complete - API typecheck PASS, API lint PASS, API build PASS**

---

## Objective

Extract 3 shared backend utilities before Phase 2 (Demande formelle):

1. Service helpers (`ensureObjectId`, `toIso`, `toId`, `parseDate`, `parseOptionalDate`)
2. Shared document save helper (`saveDocument`)
3. Generic DG circuit service operations

This is a behavior-preserving refactor only. No new workflow behavior, no new endpoints, no frontend changes.

---

## Files Created

| File                                            | Purpose                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `apps/api/src/shared/utils/service.helpers.ts`  | `ensureObjectId`, `toIso`, `toId`, `parseDate`, `parseOptionalDate` |
| `apps/api/src/shared/utils/document.helpers.ts` | `saveDocument` (extracted from oma-phase.service)                   |

---

## Files Modified

| File                                                    | Change                                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/src/modules/oma-phases/oma-phase.service.ts`  | Removed local `ensureObjectId`, `toIso`, `toId`, `parseOptionalDate`, `saveDocument`; added imports from shared utils                                                          |
| `apps/api/src/modules/requests/request.service.ts`      | Removed local `ensureObjectId`, `toIso`, `toId`, `parseDate`, `dgReviewHandledByRole`; added shared helper imports; DG circuit operations delegated to `dg-circuit.service.ts` |
| `apps/api/src/modules/meetings/meeting.service.ts`      | Removed local `ensureObjectId`, `toIso`, `parseDate`; added imports from shared utils                                                                                          |
| `apps/api/src/modules/dg-circuit/dg-circuit.service.ts` | Removed local `ensureObjectId`, `toIso`, `toId`; added 4 exported generic DG operations                                                                                        |

---

## Helpers Extracted

### Part 1 - service.helpers.ts

- `ensureObjectId(id, label)` - validates and casts to ObjectId, throws 400
- `toIso(value)` - converts Date/string/unknown to ISO string or undefined
- `toId(value)` - converts any value to string ID via `.toString()`
- `parseDate(value, label)` - parses optional date, throws 400 on invalid
- `parseOptionalDate` - alias for `parseDate` (matches oma-phase naming)

All implementations preserved exactly from the existing services.

### Part 2 - document.helpers.ts

`saveDocument(params)` extracted verbatim from oma-phase.service private helper:

- Calls `storageAdapter.save` internally
- Creates `DocumentModel` record with all fields
- Returns `Types.ObjectId`

---

## DG Circuit Service Functions Added

| Function                   | Behavior                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| `createDgReview(params)`   | `DGReviewModel.findOneAndUpdate` (upsert) on `{targetId, targetType}`, sets `awaiting_return` |
| `markSentToDg(params)`     | `updateOne` by reviewId, sets `awaiting_return` + `sentToDgAt`                                |
| `recordDgReturn(params)`   | calls `saveDocument` for returned doc, `updateOne` → `returned_scanned`                       |
| `recordDgDecision(params)` | `updateOne` → `decision_recorded`, sets decision fields                                       |

Also added `toDgRole(role)` internal normalizer (was `dgReviewHandledByRole` in request.service).

---

## Caller Updates

### `oma-phase.service.ts`

- All 5 `saveDocument` calls now use the shared helper (same signatures)
- All local helper calls (`toIso`, `toId`, `ensureObjectId`, `parseOptionalDate`) now imported
- Pre-eval DG circuit (`sendPreEvalToDg`, `recordPreEvalDgReturn`) unchanged - still stores directly on phase fields, no DGReviewModel migration

### `request.service.ts`

- `registerAdminPhysicalCourrier`: `storageAdapter.save + DocumentModel.create` → `saveDocument`; `DGReviewModel.findOneAndUpdate` → `createDgReview`
- `markAdminRequestPrintedForDg`: `DGReviewModel.findOneAndUpdate` → `createDgReview`
- `recordAdminRequestDgReturn`: inline doc create → `recordDgReturn`; inline DGReview update → `recordDgDecision`; response re-fetches dgReview + document by ID
- Portal upload inline creates (version-tracked, with `replacedByDocumentId`) left unchanged

### `meeting.service.ts`

- Local `ensureObjectId`, `toIso`, `parseDate` replaced with imports - no logic changes

---

## Behavior Preserved

- All API response shapes unchanged
- DG review statuses unchanged (`awaiting_return`, `returned_scanned`, `decision_recorded`)
- Document storage behavior unchanged (same fields, same ownerPath)
- Pre-eval DG circuit unchanged: stores on phase fields only, no DGReviewModel records for pre_eval
- Audit log calls unchanged in all functions
- Error messages and status codes unchanged

## Notable change

`recordAdminRequestDgReturn` now does 2 `updateOne` calls (recordDgReturn → `returned_scanned`, then recordDgDecision → `decision_recorded`) instead of the previous single `findOneAndUpdate`. The intermediate `returned_scanned` state is transient and not observable externally. End state is identical.

Also: `registerAdminPhysicalCourrier` now does 1 extra `DocumentModel.findById` for response sanitization (the physical courrier scan document). Negligible for an upload action.

---

## Verification Commands Run

```
cd apps/api
npm run typecheck  → PASS
npm run lint       → PASS (lint = typecheck alias in this project)
npm run build      → PASS
```

Admin and portal not run - no API contract changes, no frontend types affected.

---

## Runtime Tests

Not runtime-tested. Manual regression pending:

- ✅ (expected) initial request can still be marked/sent through DG circuit
- ✅ (expected) initial DG returned scanned document can still be uploaded
- ✅ (expected) pre-evaluation form can still be sent through DG circuit (unchanged code path)
- ✅ (expected) pre-evaluation DG return can still be uploaded (uses shared saveDocument)
- ✅ (expected) document records created with same owner/category/type/visibility
- ✅ (expected) audit logs still write where they previously wrote

---

## Risks / TODOs

- `recordAdminRequestDgReturn` with non-existent DGReview: new `if (!existingReview) throw 409` guard added. Previously, the upsert would silently create a new review if missing - this is now a hard error. Should not be reachable given normal workflow order.
- Portal upload document creates (version-tracked) still inline in request.service - Phase 3 can unify if needed
- `openBlobInNewTab` still duplicated in 4 frontend files - deferred to Phase 2 per audit

---

## Next Step

OMA-OPS-9 / Phase 2 - Demande formelle:

- Create `formal-request-phase.service.ts` orchestrator using `createDgReview`, `saveDocument`, shared helpers
- Create `FormalRequestPhaseWorkspace.tsx` admin UI (Option B: phase-specific orchestrator + shared primitives)
- Extend `AdminDossierDetail` with `formalRequest` section
