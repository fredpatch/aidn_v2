# DASH-2 Admin Dashboard UI Integration - Implementation

Date: 2026-05-29
Status: Complete - API PASS, Admin PASS

## Objective

Replace the generated/mock admin dashboard with an API-backed dashboard using `GET /api/v1/admin/dashboard`.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-29-dash-1-backend-dashboard-foundation.md`
- `exploration-cache/tasks/summaries/2026-05-29-dash-1-backend-dashboard-foundation-implementation.md`

## Source files inspected

- `apps/admin/src/pages/DashboardPage.tsx`
- `apps/admin/src/lib/api/client.ts`
- `apps/admin/src/lib/api/requests.api.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/contexts/AuthContext.tsx`
- `apps/admin/src/components/ui/card.tsx`
- `apps/admin/src/components/ui/button.tsx`
- `apps/admin/src/components/ui/badge.tsx`
- `apps/admin/src/components/ui/skeleton.tsx`
- `apps/admin/src/config/nav.tsx`
- `apps/admin/src/components/dashboard/*`
- `apps/api/src/modules/dashboard/dashboard.types.ts`
- `apps/api/src/modules/dashboard/dashboard.helpers.ts`
- `apps/api/src/modules/dashboard/dashboard.service.ts`

## Files changed

- `apps/api/src/modules/dashboard/dashboard.types.ts`
- `apps/api/src/modules/dashboard/dashboard.helpers.ts`
- `apps/api/src/modules/dashboard/dashboard.service.ts`
- `apps/admin/src/lib/api/dashboard.api.ts`
- `apps/admin/src/pages/DashboardPage.tsx`
- `TASK.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/manifest.json`

## Key decisions

- Used the `frontend-design` Swiss anchor: compact institutional ledger, hairline-bounded metric bands, restrained badges, and real data only.
- Kept the frontend presentation-only for dashboard business metrics.
- Applied a narrow backend contract correction so React does not compute required sections.
- Kept certificates unavailable and displayed as `À venir`.
- Kept the endpoint read-only: no workflow mutations, notification sends, status updates, or fake records.

## Implementation details

- Added dashboard presets: `today`, `7d`, `month`, `year`, and `custom`.
- Normalized backend profile to `dn_full` or `courrier_dg`.
- Added backend-computed `phaseFocus` and `priorityActions`.
- Added flattened period stats for oriented and rejected/reoriented requests.
- Added typed frontend API client `getAdminDashboard`.
- Replaced mock/demo dashboard hooks in `DashboardPage.tsx` with React Query:
  - key: `["admin-dashboard", preset, undefined, undefined]`
  - default preset: `month`
- Added period selector buttons:
  - Aujourd'hui
  - 7 jours
  - Mois en cours
  - Année
- Added loading skeletons and compact retry error card.
- Added profile-aware period stats and workload sections.
- DN profile shows phase focus, priority actions, and recent activity.
- Courrier/DG profile hides DN-only phase focus and workload sections.

## Verification commands run

- API: `npm run typecheck` PASS.
- API: `npm run build` PASS.
- Admin: `npx tsc --noEmit` PASS.
- Admin: `npm run build` PASS after outside-sandbox rerun for known Vite/Tailwind native Windows binary issue.

## Manual checks

- Browser/runtime checks not run; live API, authenticated admin session, and database data are required.

## Known risks / TODOs

- Runtime validation is still needed for real DN and courrier/DG users.
- Admin production build still reports the existing large chunk warning.
- `exploration-cache/06-workflows/OMA_FORMAL_REQUEST_WORKFLOW.md` remains a known missing cache document.

## Next step

Run a browser pass with live API data for DN and courrier/DG profiles.
