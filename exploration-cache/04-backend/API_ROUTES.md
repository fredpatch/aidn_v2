# API Routes

Last reviewed: 2026-05-18

## Implemented backend routes in repository
- `GET /health`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/bootstrap/login`
- `POST /api/v1/auth/internal/login`
- `POST /api/v1/auth/internal/change-password`
- `GET /api/v1/admin/si-users`
- `GET /api/v1/admin/personnel?search=&page=&limit=`
- `GET /api/v1/admin/internal-accounts`
- `POST /api/v1/admin/internal-accounts/activate`
- `GET /api/v1/admin/organizations`
- `GET /api/v1/admin/account-requests`
- `GET /api/v1/admin/audit-logs?page=&limit=`

## Route notes
- Admin routes use authentication plus capability middleware.
- `auth/internal/login` accepts `{ matricule, password }`, confirms the matricule still exists in the official personnel adapter, then validates only the local AIDN `passwordHash`.
- `auth/internal/change-password` requires a JWT, accepts `{ currentPassword, newPassword }`, enforces a minimum of 8 characters, clears `mustChangePassword`, and activates a `pending_first_login` internal account.
- `admin/internal-accounts/activate` returns `{ account, temporaryPassword }` for local/dev delivery. Production should send the temporary password through a secure channel instead of exposing it in the API response.
- `admin/personnel` reads through the selected personnel adapter. In official mode this is MariaDB via `employee_directory`; response shape is `{ items, page, limit, total }`.
- `admin/audit-logs` is guarded by `AUDIT_VIEW`, paginated with `{ items, page, limit, total }`, and enriches actors from `User` records when `actorId` resolves.
- The requested verification endpoints are intentionally read/scaffold-heavy; full request/dossier workflow endpoints are not implemented yet.

## Frontend-expected route patterns (generic/items only)
- /items
- /items/:id
(from apps/admin/src/features/items/api/items.api.ts)

## Admin frontend API wiring
- `apps/admin/src/lib/api/auth.api.ts` wires bootstrap login, internal login, current session, and password change.
- `apps/admin/src/lib/api/admin.api.ts` wires personnel search, internal account activation/listing, and audit logs.
- Legacy `apps/admin/src/features/aidn/api/aidn.api.ts` remains mock-only for request/dossier workflow screens; do not infer those workflows are API-backed yet.
