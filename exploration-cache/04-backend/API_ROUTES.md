# API Routes

Last reviewed: 2026-05-18

## Implemented backend routes in repository
- `GET /health`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/bootstrap/login`
- `POST /api/v1/auth/internal/login`
- `POST /api/v1/auth/internal/change-password`
- `GET /api/v1/admin/si-users`
- `GET /api/v1/admin/personnel?search=`
- `GET /api/v1/admin/internal-accounts`
- `POST /api/v1/admin/internal-accounts/activate`
- `GET /api/v1/admin/organizations`
- `GET /api/v1/admin/account-requests`
- `GET /api/v1/admin/audit-logs`

## Route notes
- Admin routes use authentication plus capability middleware.
- `auth/internal/login` accepts `{ matricule, password }`, confirms the matricule still exists in the official personnel adapter, then validates only the local AIDN `passwordHash`.
- `auth/internal/change-password` requires a JWT, accepts `{ currentPassword, newPassword }`, enforces a minimum of 8 characters, clears `mustChangePassword`, and activates a `pending_first_login` internal account.
- `admin/internal-accounts/activate` returns `{ account, temporaryPassword }` for local/dev delivery. Production should send the temporary password through a secure channel instead of exposing it in the API response.
- `admin/personnel` reads through the selected personnel adapter. In official mode this is MariaDB via `employee_directory`.
- `admin/audit-logs` is guarded by `AUDIT_VIEW` and intended for API-1 auth/admin audit verification.
- The requested verification endpoints are intentionally read/scaffold-heavy; full request/dossier workflow endpoints are not implemented yet.

## Frontend-expected route patterns (generic/items only)
- /items
- /items/:id
(from apps/admin/src/features/items/api/items.api.ts)

## AIDN API adapter state
- apps/admin/src/features/aidn/api/aidn.api.ts uses assertMockOnly() when not in mock mode.
- Error message: "AIDN API is not configured. Phase B provides mock data only."
- The admin frontend has not yet been wired to `apps/api`.
