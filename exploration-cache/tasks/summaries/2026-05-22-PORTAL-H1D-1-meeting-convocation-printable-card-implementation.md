# PORTAL-H1D-1 Meeting Convocation Printable Card Implementation

## Objective

Add a frontend-only printable convocation card for portal rendez-vous meetings.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`

## Source files inspected

- `apps/portal/src/pages/RendezVousPage.tsx`
- `apps/portal/src/components/PortalCalendar.tsx`
- `apps/portal/src/lib/auth/PortalAuthContext.tsx`
- `apps/portal/src/styles.css`

## Files changed

- `apps/portal/src/pages/RendezVousPage.tsx`
- `apps/portal/src/components/PortalCalendar.tsx`
- `apps/portal/src/styles.css`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/manifest.json`

## Key decisions

- Kept implementation frontend-only using existing `PortalMeeting` fields and current portal auth user name.
- Used a modal card with browser print instead of backend PDF generation.
- Added direct print buttons that open the convocation and trigger `window.print()` after render.
- Added print CSS to hide app chrome/buttons and reveal only `.print-area`.
- Did not add dependencies.

## Implementation details

- `RendezVousPage` now manages a selected meeting and renders `ConvocationCard`.
- Convocation fields include AIDN header, postulant name, dossier number/type, rendez-vous type, object/title, date/time, location, status, notes, reference, and print date.
- Missing optional values display `Non renseigné`.
- Upcoming meeting cards expose `Voir la convocation` and `Imprimer`.
- `PortalCalendar` accepts `onViewEvent` and `onPrintEvent` callbacks and exposes the same actions in selected-day meeting items.
- `styles.css` adds `@media print` rules to print only the convocation area.

## Verification commands run

- `npm run typecheck` in `apps/portal`: PASS
- `npm run lint` in `apps/portal`: PASS
- `npm run build` in `apps/portal`: sandbox failed on known Tailwind/Vite native Windows binary, then PASS outside sandbox

## Manual checks run or not run

Not run. Browser print preview requires an interactive portal session with a real rendez-vous.

Pending:

- Login as a postulant.
- Open `/rendez-vous`.
- Select a meeting.
- Click `Voir la convocation`.
- Confirm convocation card opens with correct meeting data.
- Confirm missing fields show `Non renseigné`.
- Click `Imprimer`.
- Confirm print preview hides app chrome/buttons as much as possible.
- Confirm calendar/list remains usable after closing.

## Known risks / TODOs

- Browser print behavior can vary slightly by browser.
- Organization name is not available in `PortalUser`; the card uses current postulant full name for `Organisation / postulant`.
- This is not an official PDF and does not create a document registry entry.

## Next step

Run the manual print-preview checklist in a browser with a seeded meeting.
