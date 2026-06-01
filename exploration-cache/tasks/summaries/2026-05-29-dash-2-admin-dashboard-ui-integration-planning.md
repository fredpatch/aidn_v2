# DASH-2 Admin Dashboard UI Integration - Planning

Date: 2026-05-29
Status: Implemented after approval

## Objective

Plan frontend integration for the admin dashboard using `GET /api/v1/admin/dashboard`, replacing mock/demo dashboard data with real API-backed data while keeping React free of business-metric recalculation.

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
- `apps/admin/src/features/dashboard/hooks/useDashboard.ts`
- `apps/admin/src/features/aidn/hooks/use-aidn-dashboard.ts`
- `apps/admin/src/components/dashboard/*`
- `apps/api/src/modules/dashboard/dashboard.types.ts`
- `apps/api/src/modules/dashboard/dashboard.helpers.ts`
- `apps/api/src/modules/dashboard/dashboard.service.ts`

## Cache status

- Services explored: DASH-1 backend dashboard route/service; admin API client; admin auth context.
- App areas explored: admin dashboard page, admin dashboard primitives, navigation, API conventions.
- Packages explored: `apps/admin`, targeted `apps/api` dashboard contract.
- Patterns available: React Query, `apiGet`, shadcn-style card/button/badge/skeleton primitives, existing dashboard primitives, lucide icons.
- Last update: 2026-05-29.
- Pending gaps: runtime browser/API checks require live services; `OMA_FORMAL_REQUEST_WORKFLOW.md` remains missing; DASH-1 backend response does not yet fully match DASH-2 prompt contract.

## Frontend-design direction

Chosen anchor: Swiss.

Reason: the surface is an institutional operational dashboard where clarity, hierarchy, hairline separation, and real numeric information matter more than decorative narrative.

Differentiator: a compact "operational ledger" layout with hairline-bounded metric bands, an active period selector, and muted profile/status badges that make the dashboard feel like a live administrative control sheet.

Token approach: existing app neutral surfaces and sans typography, restrained red/blue emphasis only where existing design tokens support it, no fake content, no charts, no decorative texture.

## Key findings

- Current `DashboardPage.tsx` still reads mock/demo AIDN hooks for the DN dashboard.
- It sends courrier-only roles to `CourrierDashboard`; DASH-2 should instead use the new dashboard profile from the backend and keep one API-backed dashboard page.
- Admin API convention uses `apiGet<T>(path)` with explicit query strings, not an `apiClient.get(..., { params })` object.
- React Query is available and should use key `["admin-dashboard", preset, from, to]`.
- Existing `client.ts` does not expose a query-param helper; `dashboard.api.ts` should build `URLSearchParams` locally.
- DASH-1 backend currently returns:
  - `profile: { role, scope: "full" | "courrier" }`
  - `period.preset: "month" | "custom"`
  - `periodStats.initialDecisions.{orientedToDn,rejected,reoriented}`
  - no `phaseFocus`
  - no `priorityActions`
- DASH-2 prompt expects:
  - profile-like behavior `dn_full` / `courrier_dg`
  - presets `today`, `7d`, `month`, `year`, `custom`
  - `phaseFocus`
  - `priorityActions`
- Because the prompt forbids frontend-side business metric recalculation, these missing fields/presets need a narrow backend contract correction before or alongside frontend integration.

## Planned implementation

1. Narrow backend contract correction, only where needed for DASH-2 typing/data mismatch:
   - Extend dashboard presets to `today`, `7d`, `month`, `year`, `custom`.
   - Expose profile value or equivalent derivation that maps to `dn_full` / `courrier_dg`.
   - Add backend-computed `phaseFocus`.
   - Add backend-computed `priorityActions` derived from existing dashboard workload/alerts/domain timestamps.
   - Preserve read-only behavior and certificate unavailable metadata.
2. Create `apps/admin/src/lib/api/dashboard.api.ts`:
   - Define `DashboardPreset`.
   - Define `AdminDashboardResponse` matching actual backend response.
   - Add `getAdminDashboard(params)` using `apiGet` and `URLSearchParams`.
3. Rewrite `apps/admin/src/pages/DashboardPage.tsx`:
   - Replace mock/demo AIDN hooks with `useQuery`.
   - Default preset `month`.
   - Render period selector buttons: Aujourd'hui, 7 jours, Mois en cours, Annee.
   - Render loading skeletons with no fake numbers.
   - Render compact retry error card.
   - Render period stats by profile.
   - Render current workload by profile.
   - Render phase focus compact cards/table.
   - Render priority actions and recent activity without technical IDs.
   - Show certificate unavailable state as `A venir` when `meta.unavailableMetrics` includes `certificates`.
4. Update docs/cache:
   - `TASK.md`
   - `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
   - `exploration-cache/04-backend/API_ROUTES.md`
   - `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
   - `exploration-cache/tasks/current-task.md`
   - `exploration-cache/manifest.json`
   - implementation summary under `exploration-cache/tasks/summaries/`

## Files expected to change after approval

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

- Use the Swiss frontend-design anchor, but keep the app's existing component system and tokens.
- Do not use charts or large tables.
- Do not fabricate demo rows or dashboard numbers.
- Do not calculate business metrics in React.
- Permit minimal backend correction because the current DASH-1 response lacks fields/presets the DASH-2 UI is required to render.
- Keep certificate UI as unavailable/`A venir`.

## Verification commands planned

- API, if backend contract correction is applied:
  - `npm run typecheck`
  - `npm run build`
- Admin:
  - `npx tsc --noEmit`
  - `npm run build`

## Manual checks planned

Not run in planning. After implementation, check loading/error states and API-backed dashboard behavior in browser when live API/admin are available.

## Known risks / TODOs

- Admin build may need outside-sandbox rerun if Vite/Tailwind native Windows binary loading fails.
- Runtime checks need a configured live API plus database data.
- Backend profile names in DASH-1 are currently shape-based, not `dn_full` / `courrier_dg`; implementation must normalize this cleanly.
- Some UI labels in existing files have mojibake; DASH-2 should use proper French strings in touched code.

## Next step

Approve this DASH-2 plan, including the narrow backend contract correction, then implement.
