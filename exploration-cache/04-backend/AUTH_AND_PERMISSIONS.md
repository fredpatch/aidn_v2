# Auth And Permissions

Last reviewed: 2026-05-18

## Backend auth
- `apps/api` now has JWT auth middleware and capability middleware.
- JWT payload is minimal: user id, role, and user type. Permissions are recomputed server-side from the role mapping.
- `GET /api/v1/auth/me` loads the user fresh from MongoDB, rejects inactive users, and never returns `passwordHash`.
- Bootstrap login is available only for seeded bootstrap admin access: `POST /api/v1/auth/bootstrap/login`.
- Internal login uses official personnel only for existence/legitimacy, then validates the AIDN-owned local password hash: `POST /api/v1/auth/internal/login`.
- First-login password rotation is available at `POST /api/v1/auth/internal/change-password`.

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
- `employee_directory` has no active-status field. The official personnel DB only confirms existence. AIDN account activity is determined by `AidnInternalAccount.status`.
- AIDN stores local mirror identity, activation status, AIDN role, permissions by role, audit references, timestamps, and its own `passwordHash`.
- AIDN does not copy, validate, or store official DB passwords.
- Activation creates or updates the local user/account, sets `mustChangePassword`, stores a hash of the generated temporary password, and puts the account in `pending_first_login`.
- Activating an internal account requires matching official personnel data and cannot assign the `postulant` role.

## Audit events
- `auth.bootstrap_login_success`
- `auth.bootstrap_login_failed`
- `auth.internal_login_success`
- `auth.internal_login_failed`
- `auth.internal_password_change_success`
- `auth.internal_password_change_failed`
- `admin.internal_account_activated`
- `admin.internal_account_role_changed`
- `admin.internal_account_reactivated`
