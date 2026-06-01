# Dashboard Implementation Planning

## Objective

Prepare the implementation plan for the admin dashboard now that Phase 1 and Phase 2 OMA flows are in place.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/05-data/DATA_MODELS.md`
- `exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`

## Source files inspected

- `apps/admin/src/pages/DashboardPage.tsx`
- `apps/admin/src/features/dashboard/hooks/useDashboard.ts`
- `apps/admin/src/features/dashboard/mocks/dashboard.mock.ts`
- `apps/admin/src/features/dashboard/types.ts`
- `apps/admin/src/features/dashboard/components/CourrierDashboard.tsx`
- `apps/admin/src/features/aidn/hooks/use-aidn-dashboard.ts`
- `apps/admin/src/features/aidn/mocks/aidn-dashboard.mock.ts`
- `apps/admin/src/features/aidn/api/aidn.api.ts`

## Files changed

- `exploration-cache/tasks/summaries/2026-05-29-dashboard-implementation-planning.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`

## Key decisions

- Do not add a backend dashboard API in this pass; the cache confirms no dashboard summary route exists yet.
- Keep the courrier-role dashboard intact because it is already API-backed through `listDgCircuitTasks`.
- Replace/refocus the default DN/admin dashboard around existing AIDN demo state using `useAidnDashboardSummary` and adjacent AIDN hooks/data.
- Prefer deriving dashboard content from current local demo state rather than the stale generic `mockDashboardData`.
- Keep the page operational and dense: KPI row, workflow focus cards, recent activity, Phase 1/2 attention list, and links to existing `/demandes`, `/dossiers`, `/workflow-oma`, `/reunions`, `/documents`, and `/certificats` surfaces.

## Implementation details

Planned frontend-only changes:

1. Update `DashboardPage.tsx` default dashboard to consume AIDN summary data instead of `useDashboard`.
2. Use existing dashboard primitives where they fit: `DashboardHeader`, `DashboardSection`, `MetricGrid`, `ActivityFeed`, `StatusDistributionCard`, and compact cards.
3. Add dashboard-specific derivations from existing AIDN hooks if needed:
   - next actions from `useAidnPhaseNextActions`
   - late/blocked phase attention from `useAidnOmaPhases`
   - recent meetings/documents/certificates from existing AIDN hooks
4. Keep loading/error states consistent with existing patterns.
5. Avoid broad refactors of shared dashboard components unless a small prop addition is necessary.

## Verification commands run

- None for this planning pass.

## Manual checks run or not run

- Not run. No product code was changed.

## Known risks / TODOs

- Existing AIDN dashboard data is mock/demo only outside `VITE_DATA_MODE=mock`; API mode still has no dashboard route.
- Some existing files contain mojibake text; this pass should avoid broad French accent cleanup unless touching visible dashboard strings.
- Previous unrelated working tree changes exist in `apps/admin/package.json`, `package-lock.json`, `.agents/`, and `.claude/`.
- Recent React Doctor cleanup files are also present in the working tree; keep dashboard implementation isolated from those.

## Next step

After approval, implement the frontend-only dashboard refresh in `apps/admin/src/pages/DashboardPage.tsx` and any tiny local helpers needed, then run admin typecheck/build.
