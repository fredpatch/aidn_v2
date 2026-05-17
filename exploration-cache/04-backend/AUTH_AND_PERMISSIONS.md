# Auth And Permissions

Last reviewed: 2026-05-17

## Backend auth
- `apps/api` now has JWT auth middleware and capability middleware.
- JWT payload is minimal: user id, role, and user type. Permissions are recomputed server-side from the role mapping.
- `GET /api/v1/auth/me` loads the user fresh from MongoDB, rejects inactive users, and never returns `passwordHash`.
- Bootstrap login is available only for seeded bootstrap admin access: `POST /api/v1/auth/bootstrap/login`.
- Internal login uses the personnel adapter only: `POST /api/v1/auth/internal/login`.

## Frontend auth behavior
- LocalStorage token key: ${STORAGE_PREFIX}_token (from config/app.ts and AuthContext)
- Demo login token: aidn-demo-token (LoginPage)
- Route guards: AuthRoute + ProtectedRoute
- Frontend remains mock/demo-oriented and is not wired to the backend API in API-1.

## Permission model
- Capability checks are enforced with `requirePermission(...)`.
- `bootstrap_admin` and `admin` receive the full permission set.
- Internal account activation is limited to users with `AIDN_USER_ACTIVATE`.
- `dn_supervisor` no longer receives internal account activation/role-assignment capability by default.

## Internal personnel rule
- Internal ANAC users must come from the official personnel adapter.
- AIDN stores only a local mirror identity, activation status, AIDN role, permissions by role, audit references, and timestamps.
- Internal staff passwords are never stored locally.
- Activating an internal account requires matching official personnel data and cannot assign the `postulant` role.

## Audit events
- `auth.bootstrap_login_success`
- `auth.bootstrap_login_failed`
- `auth.internal_login_success`
- `auth.internal_login_failed`
- `admin.internal_account_activated`
- `admin.internal_account_role_changed`
- `admin.internal_account_reactivated`
