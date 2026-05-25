# Portal Request Workflow

Last reviewed: 2026-05-21

## Implemented In PORTAL-3

- Approved postulants can create an initial demande as a `Request` draft from the portal.
- The request uses the logged-in postulant user's canonical `organizationId`; raw account request organization names are not reused.
- The postulant can update request type, subject, and message only while the request is not submitted.
- Initial courrier evidence is selected inside the final submission flow, not through separate visible workflow actions.
- The only portal business action is `Soumettre la demande`.
- Portal upload during submission creates a local stored file, a `Document`, and an initial `Courrier`; replacing a pre-uploaded compatibility document before submission archives the previous document metadata.
- Physical deposit submission records only the postulant-side planned deposit date, deposit location, and optional notes; it does not record the real physical receipt date.
- Submission validates the selected courrier mode: portal upload requires a file; physical deposit requires planned date and location.
- Physical deposit requests submit with `courrierSource=physical_deposit` and planned status; admin/reception records actual receipt later.
- Submitted requests wait for the later DG physical circuit and remain simplified for the postulant.

## UI Added In PORTAL-3B

- `/demandes` lists the authenticated postulant's own requests.
- `/demandes/nouvelle` creates a draft request with request type, subject, and optional message.
- `/demandes/:id` shows the request status, dates, editable basic fields before submission, courrier evidence, and submit controls.
- The detail screen has one `Courrier initial` section with a mode selector: `Televersement portail` or `Depot physique a l'ANAC`.
- The old standalone `Televerser le courrier` and `Declarer le depot` buttons are no longer exposed.
- The submit button validates and sends the selected courrier mode and related data in the final submit request.
- After submission, edit, upload, deposit, and submit controls are hidden and the postulant sees that the request is waiting for administrative orientation.
- ADMIN-3 adds simplified portal-facing statuses for internal intake:
  - `intake_in_review`: En attente d’orientation administrative
  - `intake_requires_correction`: Action requise
  - `initial_sent_to_dg`: En attente d’orientation administrative
  - `oriented_to_dn`: Transmise à la Direction de la Navigabilité
  - `rejected`: Demande annulée
- Request type labels are corrected to the four visible OMA labels: Certificat de reconnaissance OMA, Certificat d’agrément OMA, Renouvellement de Certificat OMA, and Modification de Certificat OMA.
- Postulant-facing statuses stay simple: Demande reçue, En attente d’orientation administrative, Transmise à la Direction de la Navigabilité, Demande annulée, or Dossier en cours de traitement. Internal DG details such as printed-DG, scanned-return, and reorientation are not exposed.

## Notifications (PORTAL-H1B)

- `NotificationModel` records exist with `in_app` channel; backend creates them on: `request-correction`, `mark-printed-for-dg`, `record-dg-return`, `open-dossier-dn`, `oriented-to-dn` events.
- Portal can now list notifications via `GET /api/v1/portal/notifications` (scoped to current user, `status` filter, `limit` max 50, returns `{ items, unreadCount }`).
- Portal can mark a single notification read via `POST /api/v1/portal/notifications/:id/read`.
- Portal can mark all unread notifications read via `POST /api/v1/portal/notifications/read-all`.

## Rendez-vous (PORTAL-H1D)

- Portal can list read-only meetings via `GET /api/v1/portal/meetings`.
- Meeting visibility is scoped by dossier ownership: only meetings whose `dossierId` belongs to a dossier with `postulantUserId === current portal user id` are returned.
- Supported meeting status filters: `planned`, `invited`, `held`, `postponed`, `cancelled`, and query-only `all`.
- If no date range is supplied, the backend returns a conservative upcoming-and-recent window: 30 days past through 180 days future, with unscheduled meetings sorted last.
- Portal UI exposes `/rendez-vous` with upcoming meetings and a read-only calendar. Postulants cannot create, update, acknowledge, postpone, or cancel meetings.
- PORTAL-H1D-1 adds a portal-side printable convocation card for each meeting. It is a browser-print view only and does not create a document registry entry or official PDF.

## Portal Response Safety (PORTAL-H1B)

- `sanitizePortalRequest`: portal-facing sanitizer - strips `intake`, `closedAt`; no admin tracking fields.
- `sanitizePortalCourrier`: strips `registeredById`, `officialReference`, `scannedAt`.
- Admin endpoints (`listAdminRequests`, `getAdminRequest`) still use the full `sanitizeRequest` with `intake`.
- `portalStatusLabel()` now covers all statuses; accents fixed; `rejected` → "Demande non retenue"; `reoriented` → "Demande réorientée".

## Explicit Boundary

- A demande/courrier is not a DN dossier.
- PORTAL-3 never creates `Dossier` records.
- DN dossier opening is deferred until a later slice records DG orientation toward DN.
- ADMIN-3 still does not open a dossier. It tracks internal intake, print-to-DG physical circuit start, and DG return decision metadata only.
- DN verification cannot start from portal submission alone. It requires an admin-recorded DG return with decision `oriented_to_dn` and a linked annotated scan document.

## Audit Events

- `portal.request_created`
- `portal.request_updated`
- `portal.request_courrier_uploaded`
- `portal.request_physical_deposit_declared`
- `portal.request_submitted`
- `admin.request_viewed_optional`

## Deferred

- DN dossier opening.
- OMA phase lifecycle.
- Virus scanning for uploaded files.
- Runtime browser validation of the full PORTAL-3B flow.
- Runtime browser validation of PORTAL-H1D rendez-vous ownership across two postulants.
- Runtime browser validation of PORTAL-H1D-1 print preview behavior.
