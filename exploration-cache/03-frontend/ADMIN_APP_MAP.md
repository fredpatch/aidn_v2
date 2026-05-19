# Admin App Map

Last reviewed: 2026-05-19
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

## Admin Auth Routes
- `/login`: French login page with `Administrateur initial` and `Agent ANAC` modes.
- `/changer-mot-de-passe`: first-login password change; enforces minimum 8 characters and confirmation match.

## Admin Pages Added
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
  - Portal-uploaded courrier cannot be visually sent to DG until the printed-for-DG marker exists.
  - No DG return/decision or dossier-opening action is exposed.
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

## Known gaps
- Runtime manual checks require a live API and configured Mongo/MariaDB.
- Temporary password delivery is still shown in the activation modal for local/dev; production needs a secure channel.
- Backend no longer accepts bearer tokens as of AUTH-2D; admin auth is cookie-only.
- CSRF protection is implemented for cookie-authenticated unsafe methods as of AUTH-2E.
- ADMIN-3B runtime browser validation was not run in this session.
