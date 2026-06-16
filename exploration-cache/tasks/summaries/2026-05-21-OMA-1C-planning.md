# OMA-1C - Portal UI wiring - Planning

Date: 2026-05-21
Status: Planning approved - implementation in progress

## Objective

Wire the portal postulant UI to the OMA-1A portal dossier endpoints:

- `GET /api/v1/portal/dossiers/:id`
- `POST /api/v1/portal/dossiers/:id/preliminary/upload-pre-evaluation-form`

## Cache files read

- `exploration-cache/manifest.json`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/tasks/current-task.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.service.ts` - getPortalDossier response shape (this session)
- `apps/api/src/modules/requests/request.service.ts:203` - dossierId in sanitized portal request response
- `apps/api/src/modules/portal/portal.routes.ts` - GET /requests/:id uses getPortalRequest
- `apps/portal/src/lib/api/portal.api.ts` - current state, no dossier types
- `apps/portal/src/pages/RequestDetailPage.tsx` - current state, no dossier section

## Key decisions

- `dossierId` is already returned by GET /portal/requests/:id; only TS type was missing
- No new portal route - dossier detail loaded lazily inside RequestDetailPage
- No download link - no document download endpoint exposed
- `portalPostForm` already handles multipart - same pattern as uploadRequestCourrier
- Portal routes are CSRF-exempt - no X-CSRF-Token needed
- Plain HTML/CSS portal classes used - no shadcn components
