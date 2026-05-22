# Admin Intake Workflow

Last reviewed: 2026-05-21

## Implemented In ADMIN-3
- Internal users can start DN verification/intake only after DG return proof is complete.
- Internal users can request a correction while a request is submitted or under intake review.
- Reception/bureau courrier users can record actual physical courrier receipt after the postulant-submitted planned deposit.
- Internal users can mark a courrier as printed (portal-upload only); this immediately starts the DG physical circuit.
- For physical-deposit requests, physical reception + scan sets status directly to `initial_sent_to_dg`; no print step is required or allowed.
- Internal users can record the DG return with decision metadata and a mandatory scanned/annotated returned courrier.
- DN verification/intake cannot start until the DG return is complete: request status `oriented_to_dn`, DG review decision `oriented_to_dn`, and `returnedScannedDocumentId` present.

## UI Added In ADMIN-3B
- `/demandes` lists submitted/intake requests with filters for status, request type, courrier source, and search.
- KPI cards above the filters/table summarize Demandes soumises, Televersees portail, Depots physiques prevus, Courriers physiques recus, En attente DG, Orientees DN, and Annulees DG from the current list data.
- A detail drawer shows demande, postulant, organization, courrier, and intake metadata.
- The page exposes only allowed actions according to permission and request state:
  - `REQUEST_INTAKE_REVIEW`: start DN verification only after oriented DG return proof exists; request correction during review.
  - `COURRIER_REGISTER_PHYSICAL`: record actual physical receipt with mandatory scan (physical-deposit only).
  - `DG_CIRCUIT_HANDLE`: print/start the DG physical circuit (portal-upload only) and record the DG return.
- The visible print action `Imprimer` is shown only for `courrierSource=portal_upload`. Physical-deposit requests never show `Imprimer`.
- After physical reception + scan, the request jumps directly to `initial_sent_to_dg`; the next action is `Enregistrer le retour DG`.
- The backend endpoint `mark-printed-for-dg` now rejects physical-deposit requests with HTTP 409.
- The backend endpoint `register-physical-courrier` now also sets status to `initial_sent_to_dg`, creates the initial DG review, and creates a postulant notification.
- The separate `Transmettre au DG` UI path is hidden. The compatibility endpoint may remain, but the current UI no longer uses it.
- After printing (portal-upload), the next visible action is `Enregistrer le retour DG`; `Demarrer la verification` stays hidden until the oriented DG return scan is registered.
- The DG return modal requires `Scan du retour DG annoté`; client-side validation blocks submission with `Le scan du retour DG est obligatoire.` when no file is selected.
- Reorientation is out of the MVP workflow UI. Existing backend/data enum values may remain for compatibility, but the admin filters/actions no longer present reorientation as a normal path.
- Every mutation refreshes list/detail from the API.
- The UI does not fake status transitions.
- ADMIN-4: `Ouvrir le dossier DN` creates Dossier (status=preliminary_phase) + 5 OMA phases (preliminary=in_progress, rest=not_started), sets `request.dossierId` and `request.status=dossier_opened`.

## Status Transitions
- `submitted` or `intake_in_review` -> `intake_requires_correction`
- `submitted` or `intake_in_review` (portal_upload) -> `initial_sent_to_dg` via `Imprimer`
- `submitted` (physical_deposit, planned) -> `initial_sent_to_dg` directly via `Enregistrer réception courrier` (no print step)
- `initial_sent_to_dg` -> `oriented_to_dn` via DG return decision `oriented_to_dn`
- `initial_sent_to_dg` -> `rejected` via DG return decision `cancelled_by_dg`
- `oriented_to_dn` -> `dossier_opened` via `Ouvrir le dossier DN` (ADMIN-4); creates Dossier + 5 OMA phases

## Evidence Rules
- Printing/DG circuit start requires courrier evidence.
- Portal-upload requests use the `Imprimer` step to start the DG circuit.
- Physical-deposit requests enter the DG circuit directly via `Enregistrer réception courrier`; no print step.
- Physical courrier registration requires actual deposit date and scan file.
- DG return recording accepts `decision`, `returnedAt`, optional `observations`, and mandatory `returnedScannedDocument`.
- A DG decision cannot be recorded without scanned documentary proof.
- Oriented status alone is insufficient for DN verification; the returned annotated DG scan must be linked in the DG review.
- Rejected/cancelled DG requests cannot enter DN verification.
- Every uploaded file must be persisted in the `documents` registry. Portal uploads use `documentType=initial_courrier`; physical receipt scans use `documentType=initial_courrier_scan`; DG return scans use `documentType=dg_annotated_courrier`.
- Physical-deposit requests cannot enter the DG circuit until admin/reception records the received scan.

## Explicit Boundary
- A submitted request is not a DN dossier.
- ADMIN-3 never creates `Dossier` records.
- DN dossier opening remains deferred.
- Simple DG outcomes for this MVP pass are waiting for DG action, annulled/rejected by DG, and accepted/oriented toward DN.

## Audit Events
- `admin.request_intake_started`
- `admin.request_correction_requested`
- `admin.physical_courrier_registered`
- `admin.request_printed_for_dg`
- `admin.dg_return_recorded`

## Notifications
- Correction request creates an in-app notification for the postulant.
- Printing/DG circuit start creates an in-app notification for the postulant.

## Deferred
- Portal correction upload flow.
- DN dossier opening after DG orientation.
- Runtime validation of the admin intake UI.
- Future option: a dedicated DG screen could allow DG to validate/refuse directly in AIDN. That would automatically update the global request status and allow DN to continue. For the MVP/prototype, the official physical circuit remains: print -> DG physical review -> scan/upload DG response.
- Documents is the future GED surface for uploaded files; OCR and search indexing are deferred.

## OMA-1F Preliminary Form Responsibility Correction
- After a postulant submits the completed pre-evaluation form, DN does not handle or consult that completed form before DG annotation.
- `PRE_EVAL_DG_CIRCUIT_HANDLE` is the capability for reception / bureau courrier / DG secretariat to mark the completed form as transmitted through the physical DG/parapheur circuit and register the scanned annotated DG return.
- `dn_agent` and `dn_supervisor` do not receive `PRE_EVAL_DG_CIRCUIT_HANDLE` by default.
- DN sees waiting/status messages at `pre_eval_form_submitted` and `pre_eval_sent_to_dg`.
- DN receives the next preliminary meeting action only after `pre_eval_dg_decision_recorded` and a linked `preEvaluationDgAnnotatedDocumentId`.
- DN can consult/download only the DG-annotated return through `PRE_EVAL_DG_RETURN_CONSULT`; the completed postulant form remains hidden before annotation.

## ROLE-UX-1 DG Circuit Workspace
- DG circuit actors use `/circuit-dg` instead of `/dossiers`.
- The workspace aggregates initial request DG circuit tasks and preliminary pre-evaluation DG circuit tasks.
- It exposes task-level rows/actions only and avoids full dossier details.
- Supported task groups are A transmettre, En attente retour, Retours a enregistrer, and Traites.
- `/dossiers` remains the DN/admin workflow surface and requires `DOSSIER_VIEW_ALL`.
