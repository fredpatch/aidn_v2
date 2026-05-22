# PORTAL-H1D Rendez-vous Calendar Implementation

Implemented read-only portal rendez-vous support:

- Backend `GET /api/v1/portal/meetings`
- Ownership guard through `Meeting.dossierId -> Dossier.postulantUserId === portal actor id`
- Portal `listPortalMeetings`
- Protected `/rendez-vous`
- Sidebar link
- `PortalCalendar`
- `RendezVousPage`
- Dashboard next rendez-vous card

Verification passed:

- API `npm run typecheck`
- API `npm run lint`
- API `npm run build`
- Portal `npm run typecheck`
- Portal `npm run lint`
- Portal `npm run build` after known outside-sandbox Tailwind/Vite native binary rerun

Runtime checks are pending for seeded meetings across two postulants.
