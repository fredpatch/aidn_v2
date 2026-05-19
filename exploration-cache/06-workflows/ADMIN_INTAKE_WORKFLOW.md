# Admin Intake Workflow

Last reviewed: 2026-05-19

## Implemented In ADMIN-3
- Internal users can start intake for a submitted request.
- Internal users can request a correction while a request is submitted or under intake review.
- Reception/bureau courrier/DG-capable users can register physical courrier reception or upload an internal scan before DG send.
- Internal users can mark portal-uploaded courrier as printed for the physical DG circuit.
- Internal users can send an eligible request to the physical DG circuit.

## UI Added In ADMIN-3B
- `/demandes` lists submitted/intake requests with filters for status, request type, courrier source, and search.
- A detail drawer shows demande, postulant, organization, courrier, and intake metadata.
- The page exposes only allowed actions according to permission and request state:
  - `REQUEST_INTAKE_REVIEW`: start intake, request correction.
  - `COURRIER_REGISTER_PHYSICAL`: register physical courrier and optional scan.
  - `DG_CIRCUIT_HANDLE`: mark portal-uploaded courrier printed and send eligible request to DG.
- Every mutation refreshes list/detail from the API.
- The UI does not fake status transitions and does not create dossiers.

## Status Transitions
- `submitted` -> `intake_in_review`
- `submitted` or `intake_in_review` -> `intake_requires_correction`
- `submitted`, `intake_in_review`, or `intake_requires_correction` -> `initial_sent_to_dg`

## Evidence Rules
- Send-to-DG requires courrier evidence.
- Portal-uploaded courrier must be marked printed before send-to-DG.
- Physical-deposit requests can be sent when a physical deposit declaration or registered courrier exists.
- Physical courrier registration may be reception-only or may attach a scanned document.

## Explicit Boundary
- A submitted request is not a DN dossier.
- ADMIN-3 never creates `Dossier` records.
- DG decision recording and DN dossier opening remain deferred.

## Audit Events
- `admin.request_intake_started`
- `admin.request_correction_requested`
- `admin.physical_courrier_registered`
- `admin.request_printed_for_dg`
- `admin.request_sent_to_dg`

## Notifications
- Correction request creates an in-app notification for the postulant.
- Send-to-DG creates an in-app notification for the postulant.

## Deferred
- Portal correction upload flow.
- DG decision/return recording.
- DN dossier opening after DG orientation.
- Runtime validation of the admin intake UI.
