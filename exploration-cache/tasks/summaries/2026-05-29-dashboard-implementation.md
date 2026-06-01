# Dashboard Implementation

## Objective

Implement the approved frontend-only admin dashboard refresh for DASHBOARD-1.

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
- `exploration-cache/tasks/summaries/2026-05-29-dashboard-implementation-planning.md`

## Source files inspected

- `apps/admin/src/pages/DashboardPage.tsx`
- `apps/admin/src/components/dashboard/MetricCard.tsx`
- `apps/admin/src/components/dashboard/RecentRecordsCard.tsx`
- `apps/admin/src/components/dashboard/ActivityFeed.tsx`
- `apps/admin/src/components/dashboard/StatusDistributionCard.tsx`
- `apps/admin/src/components/dashboard/DashboardSection.tsx`
- `apps/admin/src/components/dashboard/MetricGrid.tsx`
- `apps/admin/src/components/dashboard/types.ts`
- `apps/admin/src/features/aidn/types/aidn.types.ts`
- `apps/admin/src/features/aidn/types/aidn.enums.ts`
- `apps/admin/src/features/aidn/hooks/use-dossiers.ts`

## Files changed

- `apps/admin/src/pages/DashboardPage.tsx`
- `exploration-cache/tasks/summaries/2026-05-29-dashboard-implementation.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/history/2026-05-29-dashboard-implementation.md`

## Key decisions

- Kept `CourrierDashboard` unchanged for courrier-only users.
- Kept implementation frontend-only; no backend route or API contract added.
- Replaced generic `useDashboard`/`mockDashboardData` usage in the default admin dashboard with existing AIDN demo-state hooks.
- Used navigation links into existing work surfaces instead of adding mutations.

## Implementation details

- `AdminDnDashboard` now reads:
  - `useAidnDashboardSummary`
  - `useDossiers`
  - `useAidnOmaPhases`
  - `useAidnDocuments`
  - `useAidnPhaseNextActions`
- KPI metrics now reflect current AIDN demo state: demandes, DG circuit count, active/open dossiers, documents to verify, late phases, and delivered certificates.
- Added derived status distribution percentages from `AidnDashboardSummary.statusDistribution`.
- Recent activity now maps `AidnTimelineEvent` records into existing `ActivityFeed`.
- Next actions now map pending/simulated phase actions into `RecentRecordsCard` and navigate to `/workflow-oma`.
- Added a compact Phase 1 / Phase 2 focus card with phase counts and links to dossiers, documents, and reunions.

## Verification commands run

- `npx tsc --noEmit` in `apps/admin` - PASS.
- `npm run build` in `apps/admin` - failed inside sandbox with known `@tailwindcss/oxide-win32-x64-msvc` / `spawn EPERM`.
- `npm run build` in `apps/admin` outside sandbox - PASS.

## Manual checks run or not run

- Browser manual check not run.

## Known risks / TODOs

- Dashboard remains mock/demo-state backed when the general dashboard backend API is absent.
- Build still emits the existing large chunk warning.
- Runtime behavior in API mode will still surface the existing AIDN mock-only API error if `VITE_DATA_MODE` is not mock.
- UI text intentionally avoids broad French accent cleanup in this pass.

## Next step

Run a browser pass in mock mode to confirm the dashboard scan layout and navigation links.
