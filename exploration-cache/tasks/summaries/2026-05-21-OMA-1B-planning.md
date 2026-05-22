# OMA-1B - Admin UI wiring - Planning

Date: 2026-05-21
Status: Planning approved - implementation in progress

## Objective

Wire the admin UI to the already validated OMA-1A backend:

- Create `apps/admin/src/lib/api/dossiers.api.ts`
- Rewrite `apps/admin/src/pages/DossiersPage.tsx` (API-backed list)
- Rewrite `apps/admin/src/pages/DossierDetailPage.tsx` (API-backed detail + preliminary action panel)

## Cache files read

- `exploration-cache/manifest.json`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/tasks/current-task.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.service.ts` - response shapes for all sanitizers
- `apps/api/src/modules/dossiers/dossier.model.ts` - DossierStatus enum (9 values)
- `apps/api/src/modules/oma-phases/oma-phase.model.ts` - OmaPhaseKey enum, PreliminaryStatus enum
- `apps/admin/src/pages/DossiersPage.tsx` - current mock state
- `apps/admin/src/pages/DossierDetailPage.tsx` - current mock state
- `apps/admin/src/pages/RequestsPage.tsx` - established mutation pattern
- `apps/admin/src/lib/api/requests.api.ts` - API client layer pattern
- `apps/admin/src/lib/api/client.ts` - apiGet/apiPost/apiPostForm

## Key decisions

- **Pattern**: `useState` + `useEffect` + direct async handlers (matching `RequestsPage.tsx`) - no react-query mutations
- **Client-side filter**: load all dossiers once on mount, filter in `useMemo` (same as RequestsPage)
- **Phase key correction**: backend uses `formal_request` / `inspection`, NOT `formal_application` / `onsite_demonstration` from mock
- **DossierDetailsDialog removed**: was dead code (`selectedRow` was always null)
- **PreliminaryActionPanel inline**: single-use component, no separate file
- **No Phase II UI**: other phases read-only status display only
- **isMockMode() guard**: preserved in DossiersPage

## Deferred

- Phase II (demande formelle) actions
- Portal UI for dossiers
- Evidence checklists (mock-only, not in API)
- Certificate tracking (mock-only, not in API)
- History/timeline (mock-only, not in API)
