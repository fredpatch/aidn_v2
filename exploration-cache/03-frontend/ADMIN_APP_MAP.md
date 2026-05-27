# Admin App Map

Last reviewed: 2026-05-21
Source files inspected: `apps/admin/src/App.tsx`, `apps/admin/src/contexts/AuthContext.tsx`, `apps/admin/src/lib/api/*.ts`, `apps/admin/src/pages/*Page.tsx`, `apps/admin/src/config/nav.tsx`

## Confirmed facts
- Admin frontend uses React/Vite with routes in `apps/admin/src/App.tsx`.
- API mode is controlled by `VITE_DATA_MODE`; mock mode must remain available.
- API client reads `VITE_API_BASE_URL` and sends requests with `credentials: "include"` for HttpOnly cookie auth.
- API client reads `aidn_admin_csrf` and sends `X-CSRF-Token` on unsafe requests when the cookie exists.
- Admin frontend no longer reads localStorage auth tokens or sends `Authorization: Bearer`.
- Auth context supports bootstrap login, internal matricule/password login, `/auth/me` session restore, internal password change, and logout.
- Auth context stores user state only; session material is held by the backend-set `aidn_admin_session` HttpOnly cookie.
- On startup the auth context removes the legacy `${STORAGE_PREFIX}_token` key and restores via `GET /api/v1/auth/me`.
- Logout calls `POST /api/v1/auth/logout`, then clears local user state.
- Internal login redirects to `/changer-mot-de-passe` when the API returns `requiresPasswordChange=true`.
- Permission gating is minimal and uses `permissions` returned by `/auth/me`.
- Dossier preliminary action gating now uses returned capability permissions for the pre-evaluation DG circuit:
  - `PRE_EVAL_DG_CIRCUIT_HANDLE` shows completed-form transmission and DG annotated-return upload actions.
  - `PRE_EVAL_DG_RETURN_CONSULT` shows annotated-return download after it is registered.
  - DN users without the physical-circuit capability see waiting states during `pre_eval_form_submitted` and `pre_eval_sent_to_dg`.
- `/circuit-dg` is the focused DG circuit actor workspace. It is visible/protected by any of `DG_CIRCUIT_HANDLE`, `COURRIER_REGISTER_PHYSICAL`, or `PRE_EVAL_DG_CIRCUIT_HANDLE`.
- `/dossiers` and `/dossiers/:id` are now route-protected by `DOSSIER_VIEW_ALL`; `Dossiers DN` nav also requires `DOSSIER_VIEW_ALL`.
- Dossier Phase 2 (`formal_request`) admin workspace is API-backed:
  - Reads `GET /api/v1/admin/dossiers/:id/phases/formal-request`.
  - Registers the formal request courrier through multipart `POST /api/v1/admin/dossiers/:id/phases/formal-request/courrier` with field `file` and admin source `physical_deposit|internal_scan`.
  - Marks the physical DG/parapheur circuit through `POST /api/v1/admin/dossiers/:id/phases/formal-request/send-to-dg`.
  - Records DG return scan through multipart `POST /api/v1/admin/dossiers/:id/phases/formal-request/dg-return` with field `file`.
  - Records DG decision through `POST /api/v1/admin/dossiers/:id/phases/formal-request/dg-decision`.
  - Presents admin formal courrier upload only as the fallback `Scanner / enregistrer un courrier reçu hors portail`; portal-uploaded courriers display as `Téléversé par le postulant`.
  - Keeps supporting documents tracking-only; only the formal request courrier gates DG circuit placement.

## Admin Auth Routes
- `/login`: French login page with `Administrateur initial` and `Agent ANAC` modes.
- `/changer-mot-de-passe`: first-login password change; enforces minimum 8 characters and confirmation match.

## Admin Pages Added
- `/circuit-dg`: operational DG circuit task workspace.
  - Calls `GET /api/v1/admin/dg-circuit/tasks?bucket=&source=&search=`.
  - Calls `GET /api/v1/admin/dg-circuit/tasks/:taskId/documents/:documentId` for task-linked outgoing/annotated documents.
  - Reuses existing mutation APIs for mark transmitted, physical receipt, and DG return registration.
  - Groups work with filters for A transmettre, En attente retour, Retours a enregistrer, and Traites.
  - Does not link DG circuit actors into full dossier detail.
- `/demandes`: internal request intake before DG circuit.
  - Calls `GET /api/v1/admin/requests?status=&requestType=&courrierSource=&search=`.
  - Calls `GET /api/v1/admin/requests/:id` for request/courrier/document/intake detail.
  - Calls `POST /api/v1/admin/requests/:id/start-intake`.
  - Calls `POST /api/v1/admin/requests/:id/request-correction`.
  - Calls multipart `POST /api/v1/admin/requests/:id/register-physical-courrier`.
  - Calls `POST /api/v1/admin/requests/:id/mark-printed-for-dg`.
  - Calls `POST /api/v1/admin/requests/:id/send-to-dg`.
  - Route and the existing `Demandes` navigation item require `REQUEST_VIEW_ALL`.
  - Action buttons are shown only when the user has the needed permission and the request status/source allows the action.
  - KPI cards now appear above filters/table: Demandes soumises, Televersees portail, Depots physiques prevus, Courriers physiques recus, En attente DG, Orientees DN, and Annulees DG.
  - Request type labels use the corrected OMA wording: Certificat de reconnaissance OMA, Certificat d’agrément OMA, Renouvellement de Certificat OMA, and Modification de Certificat OMA.
  - The printed-for-DG action keeps the existing API route but the visible button/action label is simplified to `Imprimer`.
  - Printing now starts the DG physical circuit directly; the separate `Transmettre au DG` UI path is no longer exposed.
  - Request detail exposes `Enregistrer le retour DG` for requests awaiting DG orientation and calls `POST /api/v1/admin/requests/:id/record-dg-return`.
  - The DG return modal requires `Scan du retour DG annoté *` and blocks submission with `Le scan du retour DG est obligatoire.` if no file is selected.
  - Reorientation is deferred out of the MVP UI: reoriented/redirected compatibility values are not offered as normal filters/actions.
  - Physical-deposit demandes show `Depot physique prevu` until reception records the actual deposit date and mandatory scan.
  - Portal-uploaded courrier cannot be visually sent to DG until the printed-for-DG marker exists; physical-deposit courrier cannot enter the DG circuit until receipt scan is recorded.
  - No DN dossier-opening action is exposed.
- `/admin/demandes-comptes`: postulant account request review.
  - Calls `GET /api/v1/admin/account-requests?status=&search=&from=&to=`.
  - Calls `GET /api/v1/admin/account-requests/:id` for sanitized request details.
  - Calls `POST /api/v1/admin/account-requests/:id/approve` for existing-organization or create-organization approval.
  - Calls `POST /api/v1/admin/account-requests/:id/reject` for rejection with reason.
  - Uses `GET /api/v1/admin/organizations?search=&status=active` when linking to an existing canonical organization.
  - Route and navigation require `POSTULANT_ACCOUNT_REVIEW`.
  - Finalized requests disable approve/reject actions.
  - Passwords and `passwordHash` are never displayed.
- `/admin/personnel`: official personnel search and AIDN activation.
  - Calls `GET /api/v1/admin/personnel?search=&page=&limit=`.
  - Uses paginated metadata: `items`, `page`, `limit`, `total`.
  - Table hides email and emphasizes matricule, name, direction, fonction, AIDN status, and activation action.
  - Activation dialog posts `{ personnelId, role }` and displays the temporary password once.
- `/admin/internal-accounts`: internal account list.
  - Calls `GET /api/v1/admin/internal-accounts`.
  - Supports API filters when provided: `search`, `role`, `status`.
  - Table hides email and displays matricule, role, status, activation date, and last login.
- `/admin/audit-logs`: read-only audit list.
  - Calls `GET /api/v1/admin/audit-logs?page=&limit=`.
  - Uses paginated metadata: `items`, `page`, `limit`, `total`.
  - Actor column prefers populated `actor.fullName`; if missing, shows `Utilisateur non retrouve` plus technical ID.

## UI Pattern Notes
- Admin data tables use the shared shadcn-style table components in `apps/admin/src/components/ui/table.tsx`.
- Table headers use lucide icons for scanability.
- Status values use `Badge` where practical.
- Email is intentionally hidden in the personnel and internal-account operational screens because matricule + password are the login credentials.
- Postulant account review displays contact email because it is part of external request identity and review.
- Intake UI displays postulant email because it is part of the submitted request trace and admin review context.
- Uploaded files must be registered as document records; the Documents page remains the future GED surface, while OCR/search indexing is deferred.

## Known gaps
- Runtime manual checks require a live API and configured Mongo/MariaDB.
- OMA-FORMAL-9B1 browser/runtime checks are pending: register formal courrier, mark DG circuit placement, and record DG return/decision against a live dossier.
- OMA-FORMAL-9B1B browser/runtime checks are pending: missing-gate fallback wording, portal-upload source label, physical DG placement, separate DG return scan, and separate DG decision against a live dossier.
- OMA-1F browser/runtime role-matrix checks are still pending; static build/type checks pass.
- Temporary password delivery is still shown in the activation modal for local/dev; production needs a secure channel.
- Backend no longer accepts bearer tokens as of AUTH-2D; admin auth is cookie-only.
- CSRF protection is implemented for cookie-authenticated unsafe methods as of AUTH-2E.
- ADMIN-3B runtime browser validation was not run in this session.
