# PORTAL-H1B — Portal API Hardening: Safe Sanitizers + Notifications

Date: 2026-05-22
Phase: IMPLEMENTATION
Status: **Complete — typecheck PASS, build PASS**

## Objective

Harden the portal backend contracts before the UI refactor:
1. Portal-safe request sanitizer
2. Portal-safe courrier sanitizer
3. Portal notification list/read endpoints
4. Backend portal status label fixes
5. Cache updates

## Cache files read

- `exploration-cache/tasks/audits/2026-05-22-portal-h1a-postulant-portal-audit.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/tasks/current-task.md`

## Source files inspected

- `apps/api/src/modules/requests/request.service.ts` (full read; sanitizers, portalStatusLabel, all portal functions)
- `apps/api/src/modules/portal/portal.routes.ts`
- `apps/api/src/modules/notifications/notification.model.ts`
- `apps/api/src/shared/guards/csrf.middleware.ts` (grep — CSRF applied globally at app.ts level)

## Files changed

### Modified
- `apps/api/src/modules/requests/request.service.ts`
- `apps/api/src/modules/portal/portal.routes.ts`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/tasks/current-task.md`

### Created
- `apps/api/src/modules/notifications/notification.service.ts`
- `exploration-cache/tasks/summaries/2026-05-22-PORTAL-H1B-api-hardening-implementation.md`

## Key decisions

### Sanitizer split
- `sanitizePortalRequest` — strips `intake` and `closedAt`; used in all 7 portal-facing request return paths: `createPortalRequest`, `listPortalRequests`, `getPortalRequest`, `updatePortalRequest`, `uploadPortalRequestCourrier`, `declarePortalPhysicalDeposit`, `submitPortalRequest`.
- `sanitizePortalCourrier` — strips `registeredById`, `officialReference`, `scannedAt`; used in portal responses that include a courrier object.
- `sanitizeRequest` and `sanitizeCourrier` unchanged — still used by `listAdminRequests`, `getAdminRequest`, and audit log diffs.

### Notification service
- Created `notification.service.ts` (new file) with 3 exported functions: `listPortalNotifications`, `markPortalNotificationRead`, `markAllPortalNotificationsRead`.
- All functions call `ensurePortalActor` to reject non-postulant actors.
- All queries scope by `recipientUserId === actor.id`.
- `read-all` route registered before `/:id/read` to avoid route-match ambiguity.
- CSRF applied automatically by global `app.use(csrfProtection)` — no per-route wiring needed.

### Status label fixes
`portalStatusLabel()` updated:
- `initial_dg_returned` → "En cours de traitement administratif" (new explicit case)
- `initial_dg_decision_recorded` → "En cours de traitement administratif" (new explicit case)
- `dossier_opened` → "Dossier en cours de traitement" (new explicit case)
- `submitted` + physical_deposit → "Demande reçue - dépôt physique prévu" (accent fixed)
- `rejected` → "Demande non retenue" (changed from "Demande annulée")
- `reoriented` → "Demande réorientée" (changed from "En traitement")

## Implementation details

### `sanitizePortalRequest` fields
```
id, organizationId, submittedById, requestType, subject, message,
status, portalStatusLabel, courrierSource, initialCourrierId,
initialDocumentId, dossierId, physicalDeposit, submittedAt, createdAt, updatedAt
```

### `sanitizePortalCourrier` fields
```
id, requestId, type, source, physicalDepositDate, uploadedAt, documentId, notes
```

### Notification endpoints
- `GET /api/v1/portal/notifications?status=all&limit=20` → `{ items: [...], unreadCount: N }`
- `POST /api/v1/portal/notifications/read-all` → `{ updatedCount: N }`
- `POST /api/v1/portal/notifications/:id/read` → `{ notification: {...} }`

Notification response shape per item:
```
{ id, title, message, relatedType, relatedId, status, createdAt, readAt? }
```

## Verification commands run

- `cd apps/api && npx tsc --noEmit` → **PASS**
- `cd apps/api && npm run build` → **PASS**

## Manual checks run

Not run (no live server). Runtime validation pending — see acceptance checklist in prompt.md.

## Known risks / TODOs

- `sanitizeDocument` (used in `getPortalRequest`) still returns `uploadedById` — admin-side field, minor. Not in scope for this pass.
- `listPortalRequests` mutates the sanitized array in-place (`item.portalStatusLabel = ...`) for dossier-phase labels. Works correctly since `sanitizePortalRequest` returns plain mutable objects.
- Frontend `RequestStatusBadge.tsx` has a local `statusLabels` map that still diverges on `initial_dg_returned`, `initial_dg_decision_recorded`, `reoriented`. The frontend relies on the `label` prop (from `portalStatusLabel` in API response) when present; local map only used as fallback. This is a PORTAL-H1C cleanup item.

## Next step

**PORTAL-H1C** — Portal UI redesign:
1. Two-panel `MyRequestsPage`
2. Tabbed `RequestDetailPage`
3. Wired notification count on `PortalDashboardPage`
4. Sonner toasts for success feedback
5. French accent sweep in portal UI strings
