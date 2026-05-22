# PORTAL-H1D Rendez-vous Calendar Implementation

## Objective

Implement a read-only Rendez-vous section for postulants, backed by a portal-safe meetings endpoint scoped to dossiers owned by the authenticated portal user.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-22-PORTAL-H1D-rendez-vous-calendar-planning.md`

## Source files inspected

- `apps/api/src/shared/guards/auth-context.ts`
- `apps/api/src/modules/notifications/notification.service.ts`
- `apps/api/src/modules/requests/request.service.ts`
- `apps/api/package.json`
- `apps/portal/src/components/EmptyState.tsx`
- `apps/portal/src/pages/NotificationsPage.tsx`
- `apps/portal/src/pages/MyRequestsPage.tsx`

## Files changed

- `apps/api/src/modules/meetings/meeting.service.ts` (created)
- `apps/api/src/modules/portal/portal.routes.ts`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/lib/routes.ts`
- `apps/portal/src/App.tsx`
- `apps/portal/src/components/PortalSidebar.tsx`
- `apps/portal/src/components/PortalCalendar.tsx` (created)
- `apps/portal/src/pages/RendezVousPage.tsx` (created)
- `apps/portal/src/pages/PortalDashboardPage.tsx`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/manifest.json`

## Key decisions

- Used native `Date` and `Intl.DateTimeFormat`; no `date-fns` dependency was added.
- Kept the calendar portal-native with existing Tailwind utility classes and `btn` styles; no shadcn dependency was added.
- Returned `phaseKey: null` because `MeetingModel` does not store a phase key directly.
- Default backend date window is 30 days past through 180 days future. Unscheduled meetings are included last only for default-window queries; explicit `from` / `to` ranges only return meetings with `scheduledAt` inside the range.

## Implementation details

- `GET /api/v1/portal/meetings` uses portal auth and calls `listPortalMeetings`.
- Ownership guard resolves dossiers with `postulantUserId === actor.id`, then queries meetings by those owned dossier ids.
- Response includes only portal-safe meeting fields and dossier metadata from the ownership-scoped dossier set.
- Portal API adds `PortalMeeting`, `PortalMeetingStatus`, and `listPortalMeetings`.
- `/rendez-vous` is protected by the existing portal route shell and linked from the sidebar.
- `RendezVousPage` renders loading, error, empty, upcoming meetings, and calendar states.
- `PortalCalendar` is read-only, French-labeled, and responsive: desktop month grid; mobile compact grid plus selected-day list.
- `PortalDashboardPage` adds a `Prochain rendez-vous` card using the new endpoint without fetching dossier details.

## Verification commands run

- `npm run typecheck` in `apps/api`: PASS
- `npm run lint` in `apps/api`: PASS
- `npm run build` in `apps/api`: PASS
- `npm run typecheck` in `apps/portal`: PASS
- `npm run lint` in `apps/portal`: PASS
- `npm run build` in `apps/portal`: sandbox failed on known Tailwind/Vite native Windows binary, then PASS outside sandbox

## Manual checks run or not run

Not run. A live dataset with meetings for at least two postulants is needed to verify ownership isolation and calendar rendering in browser.

Pending:

- Login as a postulant.
- `/rendez-vous` loads.
- Only meetings for the logged-in postulant appear.
- Another postulant's meetings do not appear.
- Upcoming meetings are listed.
- Calendar displays meeting entries on correct dates.
- Empty state works when no meeting exists.
- Sidebar link works.
- Direct refresh on `/rendez-vous` works.
- Dashboard card/link works.

## Known risks / TODOs

- Runtime ownership validation is pending.
- Unscheduled meetings can appear in the default endpoint response but not in the calendar grid because the calendar needs a date.
- Dashboard card uses the default meeting window; meetings outside that default range will not drive the next-meeting display.

## Next step

Seed or identify meetings for two portal postulants and runtime-validate `/rendez-vous` plus the dashboard card.
