# PORTAL-H1D Rendez-vous Calendar Planning

## Objective

Add a read-only Rendez-vous section for portal postulants so they can see DN/admin-created meetings linked to their dossiers.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/05-data/DATA_MODELS.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`

## Source files inspected

- `apps/api/src/modules/meetings/meeting.model.ts`
- `apps/api/src/modules/dossiers/dossier.model.ts`
- `apps/api/src/modules/portal/portal.routes.ts`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/App.tsx`
- `apps/portal/src/components/PortalSidebar.tsx`
- `apps/portal/src/pages/PortalDashboardPage.tsx`
- `apps/portal/src/lib/routes.ts`
- `apps/portal/src/styles.css`
- `apps/portal/package.json`

## Current findings

- `MeetingModel` links meetings to dossiers via required `dossierId`; status enum already matches the target portal filter values except `all`, which should be query-only.
- `DossierModel` stores `postulantUserId`, `dossierNumber`, and `dossierType`, giving a direct ownership guard path for portal meetings.
- `portal.routes.ts` currently has no `/meetings` endpoint.
- `portal.api.ts` has request, dossier, and notification methods, but no meeting API method/types.
- Portal routes/sidebar/dashboard do not include `/rendez-vous`.
- Portal uses local Tailwind utility classes and lightweight components; no shadcn system is present.
- `apps/portal/package.json` does not include `date-fns`; implementation should avoid it unless genuinely needed.

## Planned backend changes

1. Create a small portal meeting service, likely `apps/api/src/modules/meetings/meeting.service.ts`.
2. Implement `listPortalMeetings(params, actor)`:
   - Require a portal actor.
   - Resolve dossiers where `postulantUserId === actor.id`.
   - Query `MeetingModel` by those dossier ids.
   - Apply `from` / `to` date filters to `scheduledAt` when provided.
   - If no dates are provided, use an upcoming-and-recent window.
   - Apply status filter for `planned|invited|held|postponed|cancelled`; `all` means no status filter.
   - Sort scheduled meetings ascending and put missing dates last.
   - Join dossier number/type from the ownership-scoped dossier set.
3. Add `GET /api/v1/portal/meetings` in `portal.routes.ts`, guarded by `requireAuth({ scope: "portal" })`.
4. Return only portal-safe fields: id, dossierId, dossierNumber, dossierType, meetingType, title, scheduledAt, location, status, notes, phaseKey if available/null, createdAt, updatedAt.
5. Do not add any create/update/cancel/postpone portal route.

## Planned frontend changes

1. Add meeting types and `listPortalMeetings(params?)` to `apps/portal/src/lib/api/portal.api.ts`.
2. Add `rendezVous: "/rendez-vous"` to `apps/portal/src/lib/routes.ts`.
3. Add protected route in `apps/portal/src/App.tsx`.
4. Add sidebar item `Rendez-vous` with a calendar icon in `PortalSidebar.tsx`.
5. Create `apps/portal/src/components/PortalCalendar.tsx`:
   - Read-only calendar.
   - French month/day labels.
   - No create/search controls.
   - Responsive CSS grid/list behavior using existing utility classes.
   - Use native `Date` / `Intl.DateTimeFormat` helpers instead of adding `date-fns`, unless implementation becomes unreasonably complex.
6. Create `apps/portal/src/pages/RendezVousPage.tsx`:
   - Header and helper text.
   - Upcoming meetings section.
   - Calendar section.
   - Loading, error, and empty states.
   - Map API meetings to `PortalCalendarEvent`.
7. Lightweight dashboard improvement:
   - Fetch `listPortalMeetings({ status: "all" })`.
   - Add a `Prochain rendez-vous` card linking to `/rendez-vous`.
   - Avoid dossier detail over-fetching.

## Verification plan

Run:

- `npm run typecheck` in `apps/api`
- `npm run lint` in `apps/api`
- `npm run build` in `apps/api`
- `npm run typecheck` in `apps/portal`
- `npm run lint` in `apps/portal`
- `npm run build` in `apps/portal`

Portal build may need outside-sandbox rerun if the known Tailwind native Windows binary error appears.

## Manual checks

Pending until implementation and a live seeded dataset:

- Login as a postulant.
- `/rendez-vous` loads.
- Only meetings for the logged-in postulant appear.
- Another postulant's meetings do not appear.
- Upcoming meetings are listed.
- Calendar displays meeting entries on correct dates.
- Empty state works when no meeting exists.
- Sidebar link works.
- Direct refresh on `/rendez-vous` works.
- Dashboard link/card works if implemented.

## Known risks / TODOs

- `phaseKey` is not stored directly on `MeetingModel`; implementation may return `null` or derive from `meetingType` only if useful and safe.
- Default date window should be conservative and documented in the implementation summary.
- Runtime ownership validation needs seeded data for at least two postulants.

## Next step

Await approval to implement this plan.
