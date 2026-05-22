# OMA-1F Responsibility / DN Visibility Correction - Planning

Date: 2026-05-22

## Objective

Plan the correction so completed pre-evaluation forms are handled by reception / bureau courrier / DG secretariat before DG annotation, while DN users wait and cannot consult the completed form before the annotated DG return is registered.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md` attempted; file is missing
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
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/lib/auth/permissions.ts`
- `apps/admin/src/contexts/AuthContext.tsx`

## Files changed

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-22-oma-1f-responsibility-correction-planning.md`

## Key decisions

- Use capability permissions rather than role checks.
- Add narrowly named preliminary physical-circuit permissions instead of reusing `DG_CIRCUIT_HANDLE`, because DN currently has `DG_CIRCUIT_HANDLE` for other existing flows.
- Keep DN progression controlled by status plus proof: the next DN action should appear only after `pre_eval_dg_decision_recorded` and the annotated DG return document is linked.
- Do not expose the completed postulant form to DN before DG return; expose only the annotated DG return id after registration.

## Implementation details

Planned changes:

1. Add permissions such as `PRE_EVAL_DG_CIRCUIT_HANDLE` and `PRE_EVAL_DG_RETURN_CONSULT`.
2. Assign `PRE_EVAL_DG_CIRCUIT_HANDLE` to reception, bureau courrier, DG secretariat, admin, and bootstrap admin only by default.
3. Assign `PRE_EVAL_DG_RETURN_CONSULT` to DN, physical-circuit roles, admin, and bootstrap admin.
4. Guard `send-pre-eval-to-dg` and `record-pre-eval-dg-return` with `PRE_EVAL_DG_CIRCUIT_HANDLE`.
5. Add `preEvaluationDgAnnotatedDocumentId` to the sanitized admin phase response and admin API type.
6. Update `DossierDetailPage` to import/use `useAuth` and `hasPermission`, showing action controls only to users with the matching capability and waiting messages otherwise.

## Verification commands run

- None during planning.

## Manual checks run or not run

- Manual runtime checks not run; planning only.

## Known risks / TODOs

- There is no general admin document download endpoint visible in the inspected slice; exposing annotated download may require either using an existing route if found during implementation or adding a narrow route.
- `exploration-cache/QUICK-REFERENCE.md` is missing, so the required protocol file could not be read.
- The worktree has many pre-existing modified/untracked files; implementation must avoid unrelated changes.

## Next step

Await approval, then implement the narrow permission/API/UI correction and update cache plus verification results.
