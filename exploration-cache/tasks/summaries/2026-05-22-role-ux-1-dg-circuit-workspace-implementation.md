# ROLE-UX-1 DG Circuit Workspace - Implementation

Date: 2026-05-22

## Objective

Implement a focused DG circuit workspace for `dg_secretariat`, `reception`, and `bureau_courrier` so they can operate DG circuit tasks without full DN dossier visibility.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/04-backend/AUTH_AND_PERMISSIONS.md`
- `exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`

## Source files inspected

- `apps/admin/src/App.tsx`
- `apps/admin/src/config/nav.tsx`
- `apps/admin/src/layouts/Sidebar.tsx`
- `apps/admin/src/components/auth/ProtectedRoute.tsx`
- `apps/admin/src/lib/api/requests.api.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/modules/requests/request.service.ts`
- `apps/api/src/modules/requests/request.model.ts`
- `apps/api/src/modules/dg-reviews/dg-review.model.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/dossiers/dossier.model.ts`
- `apps/api/src/modules/organizations/postulant-organization.model.ts`

## Files changed

- `apps/api/src/modules/dg-circuit/dg-circuit.service.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/admin/src/lib/api/dg-circuit.api.ts`
- `apps/admin/src/pages/DgCircuitPage.tsx`
- `apps/admin/src/App.tsx`
- `apps/admin/src/config/nav.tsx`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/04-backend/AUTH_AND_PERMISSIONS.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-22-role-ux-1-dg-circuit-workspace-implementation.md`
- `exploration-cache/tasks/history/2026-05-22-role-ux-1-dg-circuit-workspace-implementation.md`
- `exploration-cache/manifest.json`

## Key decisions

- Did not grant `DOSSIER_VIEW_ALL` to DG circuit actors.
- Reused existing action permissions instead of adding a broad read permission.
- Implemented a task endpoint that returns task rows only, not full request/dossier detail payloads.
- Added a task-linked download route that validates the requested document belongs to the task.
- Reused existing mutation APIs from the page instead of duplicating workflow transitions.

## Implementation details

- Added `listDgCircuitTasks` and `downloadDgCircuitTaskDocument`.
- New task list aggregates:
  - initial request portal-upload print/transmit tasks;
  - initial request physical receipt tasks;
  - initial request awaiting/processed DG return tasks;
  - preliminary pre-evaluation submitted/sent/processed tasks.
- Added `/circuit-dg` with filters/cards for A transmettre, En attente retour, Retours a enregistrer, and Traites.
- Protected `/circuit-dg` by any of `DG_CIRCUIT_HANDLE`, `COURRIER_REGISTER_PHYSICAL`, or `PRE_EVAL_DG_CIRCUIT_HANDLE`.
- Moved `/dossiers` and `/dossiers/:id` behind a `DOSSIER_VIEW_ALL` protected route and nav permission.

## Verification commands run

- `npm run build` in `apps/api` - PASS.
- `npx tsc --noEmit` in `apps/admin` - PASS.
- `npm run build` in `apps/admin` - initial sandbox failure due known Tailwind native Windows binary / `spawn EPERM`; outside-sandbox rerun PASS.

## Manual checks run or not run

- Runtime browser/API role checks were not run; they require live users/data.

## Known risks / TODOs

- `returns_to_register` is represented by the same backend state as `awaiting_return`; the UI exposes it as a separate operational filter/count label using the awaiting-return count.
- Existing broader prototype pages such as Courriers / Workflow OMA remain outside this narrow pass and may need future permission cleanup.
- Runtime validation should confirm DG circuit actors can load `/circuit-dg` but are redirected away from `/dossiers`.

## Next step

Run role-matrix validation with one user from each role: `dg_secretariat`, `reception`, `bureau_courrier`, `dn_agent`, `dn_supervisor`, and `admin`.
