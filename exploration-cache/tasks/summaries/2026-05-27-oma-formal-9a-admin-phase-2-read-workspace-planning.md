# OMA-FORMAL-9A - Admin Phase 2 Read Workspace Planning

Date: 2026-05-27
Status: **Planning complete - awaiting implementation approval**

## Objective

Plan the admin Phase 2 read workspace for "Phase 2 - Demande formelle" so DN can see the formal request gate, document tracking, DG circuit state, formal meeting state, closure evidence, and close readiness.

No implementation was performed in this pass.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-6-document-review.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-7-phase-closure.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-8-corrected-document-reupload.md`

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

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9a-admin-phase-2-read-workspace-planning.md`

## Cache gap

- `exploration-cache/06-workflows/OMA_FORMAL_REQUEST_WORKFLOW.md` is referenced by the prompt but does not exist.
- Required route and read-model facts were available from `API_ROUTES.md`, OMA-FORMAL summaries, and `formal-request.service.ts`.

## Key decisions

- Add a focused frontend API function for `GET /api/v1/admin/dossiers/:id/phases/formal-request`.
- Create `FormalRequestPhaseWorkspace.tsx` and mount it from `DossierPhasesTab` for `selectedKey === "formal_request"`.
- Keep this slice read-oriented: no backend changes, no portal changes, no new mutation dialogs, no fake data.
- Use existing admin card/badge/table-ish row patterns.
- Keep supporting documents visibly non-blocking; the formal request courrier/gate is the only blocking element.
- Show replaced submissions as secondary history under each requirement when returned by the read model.

## Implementation details planned

- Define TypeScript types for the formal request phase read state in `dossiers.api.ts`.
- Handle loading, error, and empty states in the workspace:
  - "Chargement de la phase 2..."
  - "Impossible de charger la phase 2"
  - "Aucune donnée de phase 2 disponible"
- Render sections:
  - Header/status card
  - Formal request courrier gate card
  - Document checklist
  - DG circuit block
  - Formal meeting block
  - Recevability/closure block
- Add local French label maps for formal statuses, submission statuses, requirement levels, sources, meeting statuses, and DG states inferred from the read model.

## Verification commands run

Not run; planning only.

## Manual checks

Not run; planning only.

## Known risks / TODOs

- The read model exposes `formalRequestDgReviewId` only indirectly via status/booleans; DG block should avoid inventing unavailable details.
- Admin document download for Phase 2 documents is not confirmed in the allowlist; OMA-FORMAL-9A should avoid adding active download buttons unless the existing route supports those IDs.
- Mutation actions can be represented as disabled/read-only affordances unless later slices wire supported endpoints.
- Several existing files show mojibake in cached output; implementation should use correct UTF-8 French labels in edited files.

## Next step

Await user approval, then implement OMA-FORMAL-9A in the admin frontend and run `npx tsc --noEmit` plus `npm run build` in `apps/admin`.
