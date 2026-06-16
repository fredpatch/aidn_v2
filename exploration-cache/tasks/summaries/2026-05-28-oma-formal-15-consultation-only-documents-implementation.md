# OMA-FORMAL-15 - Consultation-only documents + single reviewable form - Implementation

Date: 2026-05-28
Status: **Complete - API PASS, Admin PASS, Portal PASS**

## Objective

Adjust Phase 2 document review semantics: only `oma_approval_form` (DN-AIR-R2-3-F-E-010) gets DN review actions; all other Phase 2 documents are consultation-only. Introduce `incomplete` as a third review status alongside `validated` and `requires_correction`.

## Cache files read

- `prompt.md`, `QUICK-REFERENCE.md`, `current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-14-portal-phase-2-documents-implementation.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/modules/documents/document-requirement.model.ts`
- `apps/api/src/modules/documents/document-submission.model.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/scripts/seed-document-requirements.ts`
- `apps/api/src/shared/permissions/permissions.ts`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/contexts/AuthContext.tsx`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`

## Files changed

- `apps/api/src/modules/documents/document-submission.model.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/admin/src/contexts/AuthContext.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`

## Key decisions

- Added `incomplete` to `DocumentSubmission.status` enum (additive, low-risk).
- Backend consultation-only guard: in `reviewFormalRequestDocumentSubmission`, after gate check, reject with 400 `"Cette pièce est consultative et ne nécessite pas de validation."` if `requirement.code !== "oma_approval_form"`.
- `reviewComment` field added to `getAdminFormalRequestPhase` submission serialization (was missing from admin API shape).
- `DOCUMENT_REVIEW` added to admin frontend known permissions in `AuthContext.tsx`.
- Closure dialog `isComplete` now based on `oma_approval_form` status === `"validated"` and no missing docs - not all-validated aggregate.
- `CloseFormalRequestPhaseDialog` receives `omaApprovalFormRequirement?: AdminFormalRequestRequirement` as new prop.
- Portal `submitted` label shows "Déposé - disponible pour consultation" for non-`oma_approval_form` requirements.
- Portal shows correction/incomplete note with `reviewComment` only for `oma_approval_form`.
- `hasFormalDocRequired` extended to include `incomplete` status.

## Implementation details

### Backend

- `document-submission.model.ts`: added `"incomplete"` to status enum.
- `formal-request.service.ts`:
  - `REVIEW_STATUSES` extended to include `"incomplete"`.
  - Comment required for `requires_correction` and `incomplete`.
  - Consultation-only guard added after gate check.
  - `reviewComment` now serialized in `getAdminFormalRequestPhase` submission map.
- `admin.routes.ts`: route-level status validation extended with `"incomplete"`.

### Admin

- `AuthContext.tsx`: `DOCUMENT_REVIEW` added to mock permission list.
- `dossiers.api.ts`: `FormalSubmissionStatus` extended; `reviewComment` on `AdminFormalRequestSubmission`; `adminReviewFormalRequestDocument` function added; `ReviewFormalDocumentResult` type added.
- `FormalRequestPhaseWorkspace.tsx`:
  - Imports: `Label`, `Textarea`, `AdminFormalRequestRequirement`, `adminReviewFormalRequestDocument`, `extractError`.
  - `onRefreshPhase` prop no longer aliased as `_onRefreshPhase`.
  - Review state: `reviewPending`, `reviewComment`, `reviewBusy`, `reviewError`.
  - `omaApprovalFormReq` and `consultationOnlyReqs` derived from `state.requirements`.
  - `latestOmaSubmission` finds latest active submission for the reviewable form.
  - `handleReviewSubmit` calls `adminReviewFormalRequestDocument` then `onRefreshPhase`.
  - Supporting documents section split into: gate row / reviewable form row with inline actions / consultation-only list.
  - `StatusBadge` extended with amber `incomplete` style.
  - `CloseFormalRequestPhaseDialog` call passes `omaApprovalFormRequirement={omaApprovalFormReq}`.
- `formal-request-dialogs.tsx`:
  - Imports `AdminFormalRequestRequirement`.
  - `CloseFormalRequestPhaseDialog` accepts `omaApprovalFormRequirement?` prop.
  - `isComplete` = `omaFormValidated && !hasMissingDocs`.
  - Summary block shows deposited + missing + `oma_approval_form` status line.
  - Partial warning is context-specific (both missing, only form, only docs).

### Portal

- `portal.api.ts`: `incomplete` added to `PortalFormalRequestRequirement.status` union.
- `RequestDetailPage.tsx`:
  - `REQ_STATUS_LABELS`/`REQ_STATUS_CLASSES` extended with `incomplete`.
  - `hasFormalDocRequired` includes `incomplete`.
  - `canUpload` includes `incomplete`.
  - `uploadLabel` treats `incomplete` same as `requires_correction`.
  - Progress summary removes "validées" count.
  - Status label for `submitted` on non-`oma_approval_form` shows "Déposé - disponible pour consultation".
  - Correction/incomplete note with `reviewComment` shown for `oma_approval_form` only.

## Verification commands run

```
cd apps/api && npx tsc --noEmit   → PASS
cd apps/api && npm run build       → PASS
cd apps/admin && npx tsc --noEmit  → PASS
cd apps/admin && npm run build     → PASS
cd apps/portal && npx tsc --noEmit → PASS
cd apps/portal && npm run build    → PASS
```

## Manual checks run

Not run - no live session.

## Known risks / TODOs

- `DOCUMENT_REVIEW` in `AuthContext.tsx` is the mock list used during auth-stub mode. Actual token-based permissions come from the backend - dn_supervisor and dn_agent already have this permission in `permissions.ts`.
- Closure dialog `isComplete` now also requires zero missing docs. If the PO decides missing consultation docs should not block "complete" status, remove the `hasMissingDocs` guard from `isComplete`.

## Next step

Manual browser validation:

1. Admin reviews `oma_approval_form` submission → Valider / Demander correction / Marquer incomplet
2. Backend rejects review attempt on consultation-only requirement (400)
3. Portal shows "Déposé - disponible pour consultation" for non-form documents
4. Portal shows correction/incomplete note for `oma_approval_form` with DN comment
5. Closure dialog shows `oma_approval_form` status line and correct partial warning
6. Phase 1 review behavior unchanged
