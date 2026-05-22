# OMA-1F Responsibility / DN Visibility Correction - Implementation

Date: 2026-05-22

## Objective

Implement the approved correction so completed pre-evaluation forms are routed through reception / bureau courrier / DG secretariat before DG annotation, while DN users wait and only consult the DG-annotated return after it is registered.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md` was missing at planning start; created during implementation
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/05-data/DATA_MODELS.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`

## Source files inspected

- `apps/api/src/shared/permissions/permissions.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- `apps/api/src/modules/documents/document.model.ts`
- `apps/api/src/modules/portal/portal.routes.ts`
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/lib/api/client.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/lib/auth/permissions.ts`
- `apps/admin/src/contexts/AuthContext.tsx`

## Files changed

- `apps/api/src/shared/permissions/permissions.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/admin/src/lib/api/client.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/contexts/AuthContext.tsx`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/04-backend/AUTH_AND_PERMISSIONS.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/05-data/DATA_MODELS.md`
- `exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-22-oma-1f-responsibility-correction-implementation.md`
- `exploration-cache/manifest.json`

## Key decisions

- Used capability permissions, not direct role checks.
- Added `PRE_EVAL_DG_CIRCUIT_HANDLE` for physical circuit actions.
- Added `PRE_EVAL_DG_RETURN_CONSULT` for downloading the DG-annotated return.
- Left the completed postulant pre-evaluation form internal-only and did not expose a DN download path for it.
- Added a narrow admin download route that validates the requested document is exactly the phase's linked `preEvaluationDgAnnotatedDocumentId`.

## Implementation details

- `send-pre-eval-to-dg` and `record-pre-eval-dg-return` now require `PRE_EVAL_DG_CIRCUIT_HANDLE`.
- `reception`, `bureau_courrier`, and `dg_secretariat` receive the new physical-circuit permission.
- `dn_agent` and `dn_supervisor` receive `PRE_EVAL_DG_RETURN_CONSULT` but not `PRE_EVAL_DG_CIRCUIT_HANDLE`.
- Admin dossier phase serialization includes `preEvaluationDgAnnotatedDocumentId`.
- Admin UI checks returned permissions and renders waiting states for DN during pre-DG and DG-return steps.
- Admin UI only allows preliminary meeting continuation after the annotated DG return id is present.
- Admin client now has `apiGetBlob` and `downloadDossierDocument` for the annotated-return download.

## Verification commands run

- `npm run build` in `apps/api` - PASS.
- `npx tsc --noEmit` in `apps/admin` - PASS.
- `npm run build` in `apps/admin` - initial sandbox failure due known Tailwind native Windows binary / `spawn EPERM`; outside-sandbox rerun PASS.

## Manual checks run or not run

- Runtime browser role-matrix validation not run; requires live API/admin setup and test users for DN, reception, bureau courrier, and DG secretariat.

## Known risks / TODOs

- Existing worktree had many pre-existing modified/untracked files; this pass avoided unrelated files.
- Admin UI strings in `DossierDetailPage.tsx` already contain mixed encoding in the worktree; new fallback messages use ASCII where practical.
- Runtime validation should confirm DN cannot call the physical-circuit endpoints and cannot see those buttons before DG annotated return registration.

## Next step

Run live role-matrix validation for the preliminary phase:

1. Postulant uploads completed pre-evaluation form.
2. DN sees only waiting state and cannot transmit/register DG return.
3. Reception / bureau courrier / DG secretariat can transmit to DG and upload annotated return.
4. DN can download the annotated return and invite the preliminary meeting only after registration.
