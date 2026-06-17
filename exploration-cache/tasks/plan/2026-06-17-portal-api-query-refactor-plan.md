# Portal API and Query Refactor Plan

Date: 2026-06-17
Status: In progress

## Objective

Improve the portal frontend data architecture so API calls, HTTP infrastructure, query keys, and query hooks are split by responsibility. The target is a portal codebase that is easier to debug, easier to extend with TanStack Query, and ready for workflow-by-workflow UI hardening.

## Guiding principles

- Move in small workflow slices and typecheck after each one.
- Keep public barrels while migrating so pages do not break during intermediate steps.
- Keep server state in TanStack Query.
- Keep local component state only for UI-only choices such as selected row, open dialog, form draft, and temporary file input state.
- Do not add Zustand until a real cross-page client-state need appears.
- Preserve current behavior while improving structure.

## Phase 1 - API domain split

Status: Complete

Split `apps/portal/src/lib/api/portal.api.ts` into domain folders:

- `auth/`
- `account-requests/`
- `requests/`
- `dossiers/`
- `formal-request/`
- `meetings/`
- `notifications/`
- `document-evaluation/`

Each domain follows:

```txt
types.ts
utils.ts
index.ts
```

`portal.api.ts` remains only as a compatibility barrel.

## Phase 2 - Axios HTTP layer

Status: Complete

Replace fetch internals with Axios while preserving public helpers:

- `portalGet`
- `portalPost`
- `portalPatch`
- `portalPostForm`
- `portalGetBlob`
- `PortalApiError`

Final structure:

```txt
apps/portal/src/lib/api/http/
  client.ts
  constants.ts
  errors.ts
  formatters.ts
  functions.ts
  utils.ts
apps/portal/src/lib/api/http.ts
```

`http.ts` remains the public barrel.

## Phase 3 - TanStack Query infrastructure

Status: Complete

Add `@tanstack/react-query`, wire `QueryClientProvider`, and split query infrastructure:

```txt
apps/portal/src/lib/query/
  index.ts
  client/
    index.ts
    query-client.ts
  keys/
    index.ts
    auth.keys.ts
    document-evaluation.keys.ts
    dossiers.keys.ts
    formal-request.keys.ts
    meetings.keys.ts
    notifications.keys.ts
    requests.keys.ts
  queries/
    index.ts
    requests.queries.ts
    meetings.queries.ts
    notifications.queries.ts
```

## Phase 4 - Convert read workflows to Query

Status: In progress

Recommended order:

1. `MyRequestsPage`
   - Status: Complete
   - Uses `usePortalRequests`.
   - Keeps only selected request id as local UI state.

2. `PortalDashboardPage`
   - Status: Complete
   - Uses `usePortalRequests`, `usePortalNotifications`, and `usePortalMeetings`.
   - Derives KPI stats from query data.

3. `NotificationsPage`
   - Status: Next
   - Use `usePortalNotifications({ status: "all", limit: 50 })`.
   - Convert read/read-all actions to mutations.
   - Invalidate notification queries after success.

4. `RendezVousPage`
   - Status: Pending
   - Use `usePortalMeetings({ status: "all" })`.
   - Keep selected meeting and print state local.

5. `RequestDetailPage`
   - Status: Later
   - Convert last because it spans requests, dossiers, formal-request, uploads, and phase 3 document evaluation.

## Phase 5 - Convert mutations to Query

Status: Pending

Convert workflow mutations one page/domain at a time:

- Notifications: mark one read, mark all read.
- Requests: create, update, submit with courrier.
- Dossiers: upload pre-evaluation form.
- Formal request: upload courrier, upload document.
- Document evaluation: upload payment proof, upload correction.

Each mutation should invalidate or update the narrowest useful query keys.

## Phase 6 - Optional client store

Status: Deferred

Do not add Zustand yet. Candidate future needs:

- request draft wizard state across pages
- upload queue state
- UI preferences

Authentication remains in `PortalAuthContext` for now.

## Phase 7 - Bundle/lazy loading

Status: Deferred

The portal build warns that the main JS chunk is over 500 kB. After the Query migration stabilizes, consider route-level lazy loading:

- `RequestDetailPage`
- `RendezVousPage`
- `NotificationsPage`
- `MyRequestsPage`

## Verification pattern

After each slice:

```txt
npm run typecheck
npm run build
```

On this Windows sandbox, `npm run build` may fail inside the sandbox with the known Tailwind/Vite native `spawn EPERM` issue. Rerun outside the sandbox when that happens.
