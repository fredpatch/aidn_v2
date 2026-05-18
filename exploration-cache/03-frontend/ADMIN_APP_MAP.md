# Admin App Map

Last reviewed: 2026-05-18
Source files inspected: `apps/admin/src/App.tsx`, `apps/admin/src/contexts/AuthContext.tsx`, `apps/admin/src/lib/api/*.ts`, `apps/admin/src/pages/*Page.tsx`, `apps/admin/src/config/nav.tsx`

## Confirmed facts
- Admin frontend uses React/Vite with routes in `apps/admin/src/App.tsx`.
- API mode is controlled by `VITE_DATA_MODE`; mock mode must remain available.
- API client reads `VITE_API_BASE_URL`, attaches `Authorization: Bearer <aidn_token>`, and avoids logging JWTs.
- Auth context supports bootstrap login, internal matricule/password login, `/auth/me` session restore, internal password change, and logout.
- Internal login redirects to `/changer-mot-de-passe` when the API returns `requiresPasswordChange=true`.
- Permission gating is minimal and uses `permissions` returned by `/auth/me`.

## Admin Auth Routes
- `/login`: French login page with `Administrateur initial` and `Agent ANAC` modes.
- `/changer-mot-de-passe`: first-login password change; enforces minimum 8 characters and confirmation match.

## Admin Pages Added
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

## Known gaps
- Runtime manual checks require a live API and configured Mongo/MariaDB.
- Temporary password delivery is still shown in the activation modal for local/dev; production needs a secure channel.
