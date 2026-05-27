# OMA-FORMAL-9A - Admin Phase 2 Read Workspace Implementation

Date: 2026-05-27
Status: **Complete - Admin typecheck PASS, Admin build PASS**

## Objective

Implement the admin Phase 2 read workspace for "Phase 2 - Demande formelle" so DN can see the formal request gate, document tracking, DG circuit state, formal meeting state, closure evidence, and close readiness.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/tasks/current-task.md`
- OMA-FORMAL-6/7/8 summaries

## Source files inspected

- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`
- `apps/admin/src/pages/dossiers/DossierCourriersTab.tsx`
- `apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx`
- `apps/admin/src/pages/dossiers/components/UploadDocumentDialog.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/lib/utils/blob.ts`
- `apps/admin/src/lib/utils/error.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`

## Files changed

- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `exploration-cache/tasks/current-task.md`

## Files created

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9a-admin-phase-2-read-workspace-implementation.md`
- `exploration-cache/tasks/history/2026-05-27-oma-formal-9a-admin-phase-2-read-workspace.md`

## Key decisions

- Reused the existing admin phase-stepper surface instead of adding a new top-level route.
- Kept the workspace read-oriented and API-backed; no fake data and no backend or portal changes.
- Supporting documents are explicitly presented as tracking, not blocking; the gate card carries the blocking explanation.
- Replaced document submissions are shown in a collapsed history area and are not treated as the active status.
- The closure CTA uses backend readiness (`canClosePhase`) for enablement; actual mutation wiring remains a later slice.

## Implementation details

- Added frontend response types for the Phase 2 read model:
  - `AdminFormalRequestPhaseState`
  - `AdminFormalRequestRequirement`
  - `AdminFormalRequestSubmission`
  - formal request status/source/requirement/submission helper types
- Added `getAdminFormalRequestPhase(dossierId)` for `GET /api/v1/admin/dossiers/:id/phases/formal-request`.
- Added `FormalRequestPhaseWorkspace.tsx` with:
  - loading, error, and empty states
  - header/status summary
  - formal request courrier gate card
  - document checklist with status/source/level labels
  - replaced-submission history
  - DG circuit block
  - formal meeting block
  - recevability/closure block
- Mounted the component in `DossierPhasesTab` for `selectedKey === "formal_request"`.

## Verification commands run

```
cd apps/admin
npx tsc --noEmit
npm run build
```

Results:

- `npx tsc --noEmit` - PASS
- First `npm run build` - failed in sandbox with known `@tailwindcss/oxide-win32-x64-msvc` / `spawn EPERM` issue.
- Escalated `npm run build` rerun - PASS.

## Manual checks run

Not run; no live admin/API server in this pass.

## Known risks / TODOs

- Browser/runtime validation against a live API is still pending.
- Phase 2 document download buttons were intentionally not added because the admin dossier document download allowlist for Phase 2 IDs was not confirmed.
- DG/meeting/upload/closure mutations are not wired in this slice.
- The backend read model does not expose DG review detail or official courrier reference, so the workspace only shows safely available read-state values.

## Next step

OMA-FORMAL-9B - wire supported Phase 2 admin mutations in the workspace, or run a live browser/API validation pass first.
