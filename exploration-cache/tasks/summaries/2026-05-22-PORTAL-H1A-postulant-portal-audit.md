# PORTAL-H1A - Postulant Portal Audit

Date: 2026-05-22
Phase: AUDIT (read-only)
Status: **Complete**

## Objective

Audit the existing Postulant Portal implementation and prepare the API-first hardening plan.

## Cache files read

- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`

## Source files inspected

- `apps/portal/src/pages/PortalDashboardPage.tsx`
- `apps/portal/src/pages/MyRequestsPage.tsx`
- `apps/portal/src/pages/RequestDetailPage.tsx`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/components/RequestStatusBadge.tsx`
- `apps/api/src/modules/portal/portal.routes.ts`
- `apps/api/src/modules/requests/request.service.ts` (partial)
- `apps/api/src/modules/notifications/notification.model.ts`
- `apps/api/src/modules/meetings/meeting.model.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` (partial)

## Files changed

None - audit only.

## Key decisions / findings

1. **Notifications: backend creates them, no portal read endpoint** - HIGH risk. `NotificationModel` exists, 4+ events create records, but no `GET /portal/notifications` route exists. Dashboard shows hardcoded 0.

2. **`intake` object overexposed to portal** - HIGH risk. `sanitizeRequest` includes internal admin tracking fields (`correctionReason`, `startedBy`, `printedForDgBy`, `sentToDgBy`) in the portal response. Must be stripped.

3. **Status label divergence** - frontend `RequestStatusBadge` local map differs from backend `portalStatusLabel()` for `initial_dg_returned`, `initial_dg_decision_recorded`, `reoriented`. Backend missing explicit cases.

4. **Meetings: partial** - exposed via `getPortalDossier` as `firstMeeting`/`preliminaryMeeting`. No standalone meetings endpoint needed for MVP.

5. **Ownership: properly enforced** - all portal endpoints scope to `submittedById` / `postulantUserId`.

6. **Document visibility: properly enforced** - `downloadPortalDossierDocument` checks `visibility === "postulant_visible"` → 403 otherwise.

7. **Missing accent strings** - multiple portal UI strings lack proper French accents (`reçue`, `soumise`, etc.).

8. **Actions requises count is incomplete** - dashboard only counts `intake_requires_correction` requests, misses dossiers where `canSubmitForm=true`.

## Implementation details

None - see full audit at `exploration-cache/tasks/audits/2026-05-22-portal-h1a-postulant-portal-audit.md`.

## Verification commands run

None - read-only audit.

## Manual checks run

Not run (no live server). Code review only.

## Known risks / TODOs

- `PortalCourrier` also returns `registeredById`, `officialReference`, `scannedAt` - admin-only fields, minor overexposure.
- `submitted` with `physical_deposit` has label "Demande recue - depot physique prevu" (missing accent in backend).
- No Sonner installed in portal app.

## Next step

**PORTAL-H1B** (backend hardening):

1. Strip `intake` from portal-facing `sanitizeRequest`
2. Add `GET /api/v1/portal/notifications` + `POST /api/v1/portal/notifications/:id/read`
3. Fix backend status label coverage and accent

**PORTAL-H1C** (UI redesign - after H1B):

1. Two-panel `MyRequestsPage`
2. Tabbed `RequestDetailPage`
3. Wired notifications count on dashboard
4. Sonner for success feedback
5. French accent sweep
