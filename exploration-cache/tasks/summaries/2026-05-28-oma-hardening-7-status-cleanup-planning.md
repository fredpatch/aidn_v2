# OMA-HARDENING-7 - Status Cleanup Planning

Date: 2026-05-28
Status: Planning complete - awaiting approval

## Objective

Clean up dead/ambiguous Phase 2 statuses before Phase 3: clarify `formal_documents_tracking` usage and restrict Phase 2 formal request document review semantics so `oma_approval_form` review uses only `validated`, `requires_correction`, and `incomplete`.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-15-consultation-only-documents-implementation.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-17-block-closure-until-documents-deposited.md`

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

- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-7-status-cleanup-planning.md`
- `exploration-cache/tasks/current-task.md`

## Findings

### `formal_documents_tracking`

- Present in `OmaPhase.formalRequestStatus` enum in `oma-phase.model.ts`.
- Present in `STATUSES_BEFORE_RECEVABILITY` in `formal-request.service.ts`.
- Present in admin `FormalRequestStatus` union in `dossiers.api.ts`.
- Present as a label in `FormalRequestPhaseWorkspace.tsx`.
- No inspected backend mutation writes `formal_documents_tracking`.
- Current cache audit already identified it as a dead enum value; current source confirms it still only appears as compatibility/label/status-set surface.

### `rejected`

- `DocumentSubmission.status` enum includes `rejected` globally.
- `formal-request.service.ts` currently includes `rejected` in `REVIEW_STATUSES` and in the formal request review payload type.
- `admin.routes.ts` currently accepts `rejected` for `POST /api/v1/admin/document-submissions/:id/review`.
- Admin API client for `adminReviewFormalRequestDocument` already restricts payload status to `validated | requires_correction | incomplete`.
- Admin Phase 2 review UI in `DossierDocumentsTab.tsx` exposes only `Valider`, `Demander correction`, and `Marquer incomplet`.
- Portal/admin labels still contain `rejected` as a defensive display fallback from OMA-HARDENING-2.

## Proposed implementation

### Formal phase status cleanup

- Keep DB compatibility by leaving `formal_documents_tracking` in the backend Mongoose enum for now.
- Remove `formal_documents_tracking` from active logic and UI/type surfaces:
  - remove it from `STATUSES_BEFORE_RECEVABILITY`;
  - remove it from admin `FormalRequestStatus`;
  - remove its normal label from `FormalRequestPhaseWorkspace`.
- Add a brief implementation note that existing persisted documents with this old value remain readable by the model but should no longer appear in active code paths.

### Rejected status cleanup

- Keep `rejected` in the global `DocumentSubmission.status` enum for future phases and legacy data compatibility.
- Remove `rejected` from the Phase 2 formal request review allowlist in `formal-request.service.ts`.
- Change the formal request review payload type to `validated | requires_correction | incomplete`.
- Update the backend validation error to: `Statut de revue non autorisé pour la demande formelle.`
- Update `admin.routes.ts` route validation/cast to the same allowed statuses.
- Keep admin/portal `rejected` labels and upload fallback handling defensively so historical/future data does not render raw status text.

## Verification planned

- `cd apps/api; npx tsc --noEmit`
- `cd apps/api; npm run build`
- `cd apps/admin; npx tsc --noEmit`
- `cd apps/admin; npm run build`
- Portal verification not planned unless portal files are changed.

## Manual checks planned

- Not run during planning.
- After implementation: route rejects `status=rejected`; admin UI still shows no reject action; validate/correction/incomplete still work; no active UI label for `formal_documents_tracking`; Phase 2 closure logic unchanged.

## Known risks / TODOs

- If production data already contains `formal_documents_tracking`, removing it from the Mongoose enum would be risky without a migration; this plan keeps DB compatibility.
- Defensive `rejected` labels may remain in admin/portal even though Phase 2 can no longer create the status.

## Next step

Await approval to implement the scoped backend/admin cleanup.
