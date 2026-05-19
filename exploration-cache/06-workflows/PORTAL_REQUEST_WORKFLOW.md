# Portal Request Workflow

Last reviewed: 2026-05-19

## Implemented In PORTAL-3
- Approved postulants can create an initial demande as a `Request` draft from the portal.
- The request uses the logged-in postulant user's canonical `organizationId`; raw account request organization names are not reused.
- The postulant can update request type, subject, and message only while the request is not submitted.
- Initial courrier evidence can be provided by portal upload or by declaring a physical deposit.
- Portal upload creates a local stored file, a `Document`, and an initial `Courrier`; replacing before submission archives the previous document metadata.
- Physical deposit creates or updates an initial `Courrier` without a document and stores declaration metadata on the request.
- Submission requires either uploaded initial courrier or a physical deposit declaration.
- Submitted requests wait for the later DG physical circuit and remain simplified for the postulant.

## UI Added In PORTAL-3B
- `/demandes` lists the authenticated postulant's own requests.
- `/demandes/nouvelle` creates a draft request with request type, subject, and optional message.
- `/demandes/:id` shows the request status, dates, editable basic fields before submission, courrier evidence, and submit controls.
- The detail screen supports both evidence paths: multipart initial courrier upload and physical deposit declaration.
- The submit button is blocked in the UI until uploaded courrier or physical deposit declaration exists.
- After submission, edit, upload, deposit, and submit controls are hidden and the postulant sees that the request is waiting for administrative orientation.
- ADMIN-3 adds simplified portal-facing statuses for internal intake:
  - `intake_in_review`: Demande en verification
  - `intake_requires_correction`: Action requise
  - `initial_sent_to_dg`: En attente d'orientation administrative

## Explicit Boundary
- A demande/courrier is not a DN dossier.
- PORTAL-3 never creates `Dossier` records.
- DN dossier opening is deferred until a later slice records DG orientation toward DN.
- ADMIN-3 still does not open a dossier. It only tracks internal intake and send-to-DG.

## Audit Events
- `portal.request_created`
- `portal.request_updated`
- `portal.request_courrier_uploaded`
- `portal.request_physical_deposit_declared`
- `portal.request_submitted`
- `admin.request_viewed_optional`

## Deferred
- DG decision endpoints.
- DN dossier opening.
- OMA phase lifecycle.
- Virus scanning for uploaded files.
- Runtime browser validation of the full PORTAL-3B flow.
