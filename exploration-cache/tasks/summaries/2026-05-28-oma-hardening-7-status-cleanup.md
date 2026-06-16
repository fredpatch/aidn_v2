# OMA-HARDENING-7 - Status Cleanup Implementation

Date: 2026-05-28
Status: Complete - API PASS, Admin PASS

## Objective

Clean up dead/ambiguous Phase 2 statuses before Phase 3 by removing `formal_documents_tracking` from active logic/UI/type surfaces and preventing the formal request review endpoint from accepting `rejected`.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-15-consultation-only-documents-implementation.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-17-block-closure-until-documents-deposited.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-7-status-cleanup-planning.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/modules/documents/document-submission.model.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`

## Files changed

- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-7-status-cleanup.md`
- `exploration-cache/tasks/history/2026-05-28-oma-hardening-7-status-cleanup.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/manifest.json`

## Key decisions

- Kept `formal_documents_tracking` in the Mongoose enum for database compatibility.
- Removed `formal_documents_tracking` from active service logic, admin type union, and normal admin workspace label.
- Kept `rejected` in the global `DocumentSubmission.status` enum for legacy/future phases.
- Kept existing admin/portal `rejected` display handling as defensive fallback.
- Removed `rejected` from the Phase 2 formal request review allowlist.

## Implementation details

- `formal-request.service.ts`:
  - removed `formal_documents_tracking` from `STATUSES_BEFORE_RECEVABILITY`;
  - removed `rejected` from `REVIEW_STATUSES`;
  - narrowed the formal request review payload type to `validated | requires_correction | incomplete`;
  - changed invalid formal review status errors to a formal-request-specific rejection message.
- `admin.routes.ts`:
  - route validation now accepts only `validated`, `requires_correction`, and `incomplete` for formal request document review.
- `dossiers.api.ts`:
  - removed `formal_documents_tracking` from `FormalRequestStatus`.
- `FormalRequestPhaseWorkspace.tsx`:
  - removed the normal label for `formal_documents_tracking`.

## Verification commands run

- `cd apps/api; npx tsc --noEmit` - PASS
- `cd apps/api; npm run build` - PASS
- `cd apps/admin; npx tsc --noEmit` - PASS
- `cd apps/admin; npm run build` - sandbox failed on known Windows Tailwind/Vite native binary loading, outside-sandbox rerun PASS

## Manual checks run

- Not run in browser/API runtime.
- Source-level check confirmed `formal_documents_tracking` remains only in the model enum among the inspected H7 files.
- Source-level check confirmed `rejected` is no longer accepted by the formal request review service/route.

## Known risks / TODOs

- Existing persisted `formal_documents_tracking` values, if any, remain valid at the database/model layer but no longer have a normal admin label.
- Portal/admin still contain defensive `rejected` display/re-upload handling for legacy/future data.

## Next step

Manual API check with `status=rejected` against the formal request review route should return 400, while `validated`, `requires_correction`, and `incomplete` should continue to work.
