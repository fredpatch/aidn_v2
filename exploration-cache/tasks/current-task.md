# Current Task

## Phase: PORTAL-QUERY-REFAC - Portal API and TanStack Query Refactor

Date: 2026-06-17
Status: **In progress - Portal typecheck PASS, Portal build PASS outside sandbox**

## Summary file

- Plan: `exploration-cache/tasks/plan/2026-06-17-portal-api-query-refactor-plan.md`

## Objective

Improve the portal frontend data architecture by splitting API calls by domain, replacing fetch with Axios, grouping HTTP infrastructure, and migrating portal server state to TanStack Query workflow by workflow.

## Completed scope

- Split `apps/portal/src/lib/api/portal.api.ts` into domain modules:
  - `auth`
  - `account-requests`
  - `requests`
  - `dossiers`
  - `formal-request`
  - `meetings`
  - `notifications`
  - `document-evaluation`
- Reduced `portal.api.ts` to a compatibility barrel.
- Replaced portal fetch helpers with Axios.
- Grouped HTTP infrastructure under `apps/portal/src/lib/api/http/`.
- Added TanStack Query and wired `QueryClientProvider` in `apps/portal/src/main.tsx`.
- Grouped query architecture under:
  - `apps/portal/src/lib/query/client/`
  - `apps/portal/src/lib/query/keys/`
  - `apps/portal/src/lib/query/queries/`
- Added query key factories for auth, requests, dossiers, formal-request, meetings, notifications, and document-evaluation.
- Added `usePortalRequests`, `usePortalMeetings`, and `usePortalNotifications`.
- Migrated `MyRequestsPage` from manual `useEffect` server-state loading to `usePortalRequests`.
- Migrated `PortalDashboardPage` from manual `Promise.all` server-state loading to:
  - `usePortalRequests`
  - `usePortalNotifications`
  - `usePortalMeetings`

## Verification

- Portal: `npm run typecheck` PASS.
- Portal: `npm run build` PASS after outside-sandbox rerun for known Windows Tailwind/Vite native `spawn EPERM` issue.
- Current build has a known chunk-size warning over 500 kB; route-level lazy loading is deferred.

## Next step

Continue Phase 4 read workflow migration:

1. Convert `NotificationsPage` to use `usePortalNotifications`.
2. Add notification mutations for mark-one-read and mark-all-read.
3. Invalidate notification query keys after successful mutations.
