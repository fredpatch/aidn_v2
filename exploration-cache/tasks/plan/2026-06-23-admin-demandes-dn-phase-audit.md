# Admin Demandes - DN Phase Preliminary Workflow Audit

Date: 2026-06-23
Status: Audit complete, plan ready for implementation
Scope: Admin "Demandes" page (RequestsPage.tsx) where DN agents start the preliminary phase ("Démarre la phase préliminaire").

## Objective

Refactor and harden the admin Demandes workflow to:

- Migrate from manual fetch + useState to structured React Query queries and mutations
- Replace axios-incompatible fetch with axios client (already standardized in dg-circuit module)
- Polish UI with shadcn components for consistency with DgCircuitPage hardening
- Implement proper mutation hooks for workflow actions (open dossier, request correction)
- Improve code maintainability through helpers/utils/types extraction
- Ensure DN agents have clear, responsive access to "ready for dossier" requests
- Introduce comments

## Current Architecture

### UI Surfaces

**Primary:** `apps/admin/src/pages/RequestsPage.tsx`

- Split-view orchestrator: left list panel, right detail panel
- Manual `useState` for items, selected request, filters (search, status, requestType, courrierSource)
- Manual `useEffect` load on mount; no query invalidation pattern
- Mix of direct API calls and component-level refresh logic

**Components:**

- `RequestsListPanel.tsx` - filter form, search, list rendering
- `RequestDetailPanel.tsx` - multi-tab detail view with request/postulant/org/courrier/verification/signature tabs
- `RequestsKpis.tsx` - statistics cards (submitted, portal uploads, physical deposits, awaiting DG, signed available, etc.)
- `ActionDialog.tsx` - modal for courrier actions (print, physical receipt, DG return) - now mostly replaced by `/circuit-dg` navigation
- `RequestListCard.tsx` - individual list item rendering
- `DetailField.tsx` - read-only detail display utility

### API Layer

**File:** `apps/admin/src/lib/api/requests/`

- `index.ts` - exports `listRequests()`, `getRequest()`, `downloadRequestOrientationDocument()`
- `types.ts` - AdminRequest, AdminRequestDetail, AdminRequestStats interfaces
- `utils.ts` - query string builders (not yet present; should centralize)
- Compatibility barrel at `requests.api.ts` for gradual migration

**Current Implementation:**

- Uses native `fetch` with manual error handling
- No axios integration (axios already in use by dg-circuit module)
- No query keys; manual refetch/refresh logic
- Manual form-data assembly for file uploads
- No mutation hooks; mutations called directly in dialogs/actions

### Helpers & Utilities

**File:** `apps/admin/src/pages/requests/requests.helpers.ts`

- Predicates: `canMarkPrinted()`, `canOpenDossier()`, `canRecordDgReturn()`, `canRegisterPhysical()`, `canRequestCorrection()`
- Status derivation: `getStatusLabel()`, `statusBadgeVariant()`, `isDgSignedAvailable()`, `isAwaitingDgAction()`, `isCancelledByDg()`
- Labels: `requestTypeLabels`, `sourceLabels`, `documentSummary`
- Formatting: `formatDate()`
- All helpers are present and well-structured; ready for export to utils

### Data Flow

1. Page load: `loadRequests()` fetches list via `listRequests({ search, status, requestType, courrierSource })`
2. Auto-select first item if present
3. User selects request: `openDetails()` fetches detail via `getRequest(id)`
4. User opens action dialog: ActionDialog handles mutation and calls `refreshAfterMutation()` → re-fetch list + detail
5. Downloads: `downloadRequestOrientationDocument()` opens preview window directly

**Issues:**

- No query keys means stale data across pages; switching away and back reloads unnecessarily
- Manual refetch after mutation; no invalidation pattern
- `listRequests` filter params re-fetch entire list on every filter change (no debounce)
- Filters are local state; selecting a request, going to `/circuit-dg`, and returning loses filter state
- No batch prefetch for common navigation (e.g., opening `/dossiers/:id` after "open dossier" action)
- Detail load happens after list selection; slow UX if getRequest is slow

## Key Findings

### API Issues

1. **Fetch vs Axios:** requests API still uses `fetch`; dg-circuit, dossiers, and account API already use axios via shared client. Inconsistent HTTP layer.
2. **No Query Caching:** Manual `useState` + `useEffect` means no cache reuse; list reloads on every tab return.
3. **Filter Params Not Preserved:** Filters disappear on navigation; users must re-filter after viewing related pages.
4. **No Mutation Hooks:** ActionDialog calls mutations directly; no React Query invalidation or loading state management.
5. **No Batch Operations:** Related entities (request detail, courrier, dossier, dgReview) fetched one at a time instead of batch.

### React Query Gaps

- No `useDemandes()` hook (DemandesPage uses mock AIDN hooks only)
- No mutation hooks for `openDossier`, `requestCorrection`, etc.
- No query keys defined for request list/detail
- No invalidation strategy when mutations complete

### UI/UX Issues

1. **Inconsistent Component Library:** RequestDetailPanel uses plain HTML structure and shadcn Tabs; RequestsKpis uses custom div cards. DgCircuitPage already hardened with Card/Separator/Alert. RequestsPage lags.
2. **No Visual Feedback for Primary Action:** "Demarrer la phase préliminaire" button not visually distinct; sits among other action buttons.
3. **Tab Organization:** Six tabs (demande, postulant, organisation, courrier, verification, orientation) are overwhelming for DN agent workflow. Should prioritize "ready for dossier" info.
4. **Split View Not Mobile-Responsive:** SplitView may hide detail on smaller screens; no modal fallback.
5. **No Empty State Guidance:** If no requests selected, shows generic placeholder; could show "getting started" checklist.
6. **Encoding Issues:** Same mojibake as DgCircuitPage (French accents, ellipses).

### Code Quality Issues

1. **helpers.ts Duplication:** `canOpenDossier()`, status checks duplicated with dg-circuit logic.
2. **No Centralized Types:** Request types live in requests API layer; no shared type barrel.
3. **No Error Boundaries:** Fetch errors set generic error string; no specific error recovery UX.
4. **Manual Loading State:** `isLoading` boolean hard to reason about during concurrent requests.

## Proposed Refactoring

### Phase 1: Migrate Fetch → Axios & Stabilize API Layer

**Files to update:**

- `apps/admin/src/lib/api/requests/index.ts`
- `apps/admin/src/lib/api/requests/utils.ts` (create if missing)

**Steps:**

1. Rewrite `listRequests()` to use axios client (import from `../client.ts`)
2. Rewrite `getRequest()` to use axios
3. Rewrite `downloadRequestOrientationDocument()` to use axios (keep imperative download pattern)
4. Update error handling to use shared `ApiError` pattern
5. Add query string builder to `utils.ts`: `buildRequestListParams()`, `buildDetailParams()`
6. Verify no breaking changes to existing callers

**Verification:** `npm run typecheck` in `apps/admin`

**Risk:** Low. API signatures remain unchanged; only internal HTTP layer changes.

### Phase 2: Extract Query Keys & Create React Query Hooks

**Files to create:**

- `apps/admin/src/lib/query/keys/requests.keys.ts`
- `apps/admin/src/lib/query/queries/requests.queries.ts`
- `apps/admin/src/lib/query/mutations/requests.mutations.ts`

**Query Keys:**

```typescript
export const requestKeys = {
  all: ["admin", "requests"] as const,
  lists: () => [...requestKeys.all, "list"] as const,
  list: (filters: RequestListFilter) =>
    [...requestKeys.lists(), filters] as const,
  details: () => [...requestKeys.all, "detail"] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
  stats: () => [...requestKeys.all, "stats"] as const,
};
```

**Queries:**

- `useRequests(filters)` - wraps `listRequests()`
- `useRequestDetail(id)` - wraps `getRequest()`
- `useRequestStats()` - computed from list query (no separate fetch)

**Mutations:**

- `useOpenDossierDn()` - opens preliminary phase
- `useRequestCorrection()` - requests correction
- Both invalidate `requestKeys.lists()` and `requestKeys.detail(id)` on success

**Invalidation Logic:**

- `openDossierDn` mutation → invalidate request detail, refresh list stats
- `requestCorrection` mutation → invalidate request detail, refresh list

**Verification:** `npm run typecheck` in `apps/admin`

**Risk:** Medium. Query keys must be consistent; invalidation order matters for UX.

### Phase 3: Update RequestsPage to Use Query Hooks

**File:** `apps/admin/src/pages/RequestsPage.tsx`

**Changes:**

1. Replace `useState([])` + `useEffect` with `useRequests(filters)` query hook
2. Replace manual `selected` refresh with `useRequestDetail(selectedId)` hook
3. Replace manual `loadRequests()` with query hook methods: `refetch()`, `invalidateQueries()`
4. Add mutation hooks: `const openDossier = useOpenDossierDn()`, `const requestCorrection = useRequestCorrection()`
5. Pass mutation hooks to ActionDialog
6. Update error/loading/success states to use query hook states
7. Preserve filter state across navigation using `useNavigationState` or URL params

**Key Pattern:**

```typescript
const filters = useMemo(() => ({ search, status, requestType, courrierSource }), [...]);
const query = useRequests(filters);
const detailQuery = useRequestDetail(selected?.id);

// Mutations
const openDossierMutation = useOpenDossierDn();
const handleOpenDossier = async (id: string) => {
  await openDossierMutation.mutateAsync(id);
  // Query invalidation happens in mutation hook
};
```

**Verification:** `npm run build && npm run typecheck` in `apps/admin`

**Risk:** High. Affects user interaction; must preserve selection logic and filter behavior.

### Phase 4: Polish UI with shadcn Components

**Files to update:**

- `RequestsPage.tsx` - main layout
- `RequestDetailPanel.tsx` - tabs, buttons, status display
- `RequestsKpis.tsx` - KPI cards (already using Card from shadcn)
- `RequestsListPanel.tsx` - filters, search

**Changes:**

1. **RequestsPage:**
   - Wrap error/success messages in shadcn Alert with destructive/success variant
   - Replace custom button with shadcn Button (already imported)
   - Apply consistent spacing/padding using shadcn patterns

2. **RequestDetailPanel:**
   - Replace custom Card structure with shadcn Card/CardHeader/CardContent
   - Add CardHeader with title + status badge
   - Use Separator between sections
   - Improve tab styling with consistent padding
   - Make "Demarrer la phase préliminaire" button `variant="default"` and visually prominent

3. **RequestsKpis:**
   - Already uses Card; add consistent CardHeader/CardContent structure
   - Ensure dark mode support with `dark:` utilities

4. **RequestsListPanel:**
   - Replace form elements with shadcn equivalents where not already present
   - Use shadcn Input for search
   - Use shadcn Select for filter dropdowns (already in code)

5. **ActionDialog:**
   - Already uses shadcn Dialog; ensure all internal forms use shadcn Field primitives
   - Add validation feedback UI

**Typography & Encoding:**

- Audit all copy for mojibake (French accents, ellipses); normalize to UTF-8
- Use consistent terminology: "Demandes", "Courrier DG", "Dossier DN", "Phase préliminaire"
- Avoid internal jargon in user-facing labels

**Verification:** `npm run build` in `apps/admin`; manual test in browser for dark mode, responsive design

**Risk:** Low. UI-only changes; can be reverted easily. Verify no copy regressions.

### Phase 5: Extract Helpers, Utils, Types

**Files to create/update:**

- `apps/admin/src/pages/requests/requests.helpers.ts` - already well-structured
- `apps/admin/src/pages/requests/requests.utils.ts` - new, for non-pure utilities
- `apps/admin/src/pages/requests/requests.constants.ts` - new, for request-specific enums/labels

**Export from helpers:**

- `canMarkPrinted()`, `canOpenDossier()`, `canRecordDgReturn()`, `canRegisterPhysical()`, `canRequestCorrection()`
- `isAwaitingDgAction()`, `isDgSignedAvailable()`, `isCancelledByDg()`
- `getStatusLabel()`, `statusBadgeVariant()`, `documentSummary()`, `formatDate()`

**Create in constants:**

```typescript
export const requestTypeLabels = { ... };
export const sourceLabels = { ... };
export const requestStatuses = [...];
```

**Create in utils:**

- `filterRequests()` - client-side filter logic (reusable for testing)
- `computeRequestStats()` - derive stats from list (memoizable)
- `buildRequestListParams()` - query string builder

**Verification:** All exports typed, no circular dependencies

**Risk:** Low. Extraction only; no behavior changes.

## Implementation Timeline

```
Phase 1 (Fetch → Axios):         2–3 hours
  - Rewrite API calls
  - No behavioral changes
  - Verification: typecheck

Phase 2 (Query Keys & Hooks):    3–4 hours
  - Define query keys
  - Create hooks
  - Test invalidation logic
  - Verification: typecheck

Phase 3 (Update RequestsPage):   4–6 hours
  - Integrate hooks
  - Preserve filter state
  - Test selection logic
  - Verify UX (no regressions)

Phase 4 (UI Polishing):          3–4 hours
  - Apply shadcn components
  - Fix encoding issues
  - Responsive design check
  - Verification: build + browser test

Phase 5 (Extract Helpers):       1–2 hours
  - Move helpers, constants, utils
  - Update imports
  - Verification: typecheck

Total estimate: 13–19 hours (1–2 days)
```

## Workflow Actions (For Reference)

Actions currently in RequestsPage (some now navigate to `/circuit-dg`):

1. **Print** → navigates to `/circuit-dg?source=initial_request&bucket=to_transmit`
2. **Register physical receipt** → navigates to `/circuit-dg?source=initial_request&bucket=to_transmit`
3. **Record DG return** → navigates to `/circuit-dg?source=initial_request&bucket=awaiting_return`
4. **Demarrer la phase préliminaire (Open dossier)** → calls `openDossierDn()` mutation (stays in Demandes)
5. **Request correction** → calls `requestCorrection()` mutation (stays in Demandes)

## Risk Mitigation

| Risk                            | Mitigation                                                                 |
| ------------------------------- | -------------------------------------------------------------------------- |
| Query keys inconsistent         | Define once in `keys/` file; use consistently across hooks                 |
| Stale selection on refetch      | Use `useQueryClient().getQueryData()` to check if selected still exists    |
| Filter state lost on nav        | Store filters in URL params or sessionStorage; restore on mount            |
| Mutation side effects wrong     | Test each mutation's invalidation in isolation before integrating          |
| UI regression                   | Screenshot baseline before Phase 4; manual test all tabs, filters, actions |
| Encoding breaks during refactor | Audit copy at end of Phase 4; commit separately if needed                  |

## Verification Plan

After each phase:

```bash
npm run typecheck   # Phase 1-3, 5
npm run build       # Phase 4
npm run test        # Optional; add integration tests after Phase 3
```

Manual acceptance:

1. **Phase 1:** API responses unchanged; network tab shows axios calls
2. **Phase 2:** Query DevTools shows cache hits; filters trigger queries once
3. **Phase 3:** Select request → detail loads; switch filter → list updates + detail stays
4. **Phase 4:** Dark mode works; Demarrer button visually stands out; all copy renders correctly
5. **Phase 5:** Imports still resolve; helpers can be tested independently

## Next Steps

1. Proceed with Phase 1 (Fetch → Axios migration)
2. After Phase 1 verification, move to Phase 2 (Query hooks)
3. Phases 3–5 follow in order
4. After completion, coordinate with upcoming preliminary phase hardening in dossier workflow
