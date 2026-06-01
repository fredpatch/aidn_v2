# Auth And Permissions

Last reviewed: 2026-05-19

## Backend auth
- `apps/api` now has JWT auth middleware and capability middleware.
- JWTs are signed and verified with RS256 as of AUTH-2A.
- RS256 keys come from `JWT_PRIVATE_KEY_BASE64` and `JWT_PUBLIC_KEY_BASE64`.
- JWT payload is minimal: user id, role, and user type. Permissions are recomputed server-side from the role mapping.
- Auth middleware accepts JWTs only from scoped HttpOnly cookies.
- Admin-scoped routes require `aidn_admin_session`; portal-scoped routes require `aidn_portal_session`.
- `Authorization: Bearer` is no longer accepted.
- Admin/internal cookie name defaults to `aidn_admin_session`; portal cookie name defaults to `aidn_portal_session`.
- `GET /api/v1/auth/me` loads the user fresh from MongoDB, rejects inactive users, and never returns `passwordHash`.
- Bootstrap login is available only for seeded bootstrap admin access: `POST /api/v1/auth/bootstrap/login`.
- Internal login uses official personnel only for existence/legitimacy, then validates the AIDN-owned local password hash: `POST /api/v1/auth/internal/login`.
- Login endpoints set HttpOnly cookies and do not return JWTs in JSON response bodies.
- First-login password rotation is available at `POST /api/v1/auth/internal/change-password`.
- Portal postulant login is available at `POST /api/v1/portal/auth/login`.
- Portal session restore is available at `GET /api/v1/portal/auth/me`.
- Portal auth accepts only active `postulant` users with the `postulant` role and rejects internal users.
- `POST /api/v1/auth/logout` clears the admin/internal auth cookie.
- `POST /api/v1/portal/auth/logout` clears the portal auth cookie.
- Unsafe cookie-authenticated methods are protected by double-submit CSRF as of AUTH-2E.
- Admin unsafe requests require `aidn_admin_csrf` and matching `X-CSRF-Token`.
- Portal authenticated unsafe requests require `aidn_portal_csrf` and matching `X-CSRF-Token`.
- CSRF cookies are frontend-readable; auth/session cookies remain HttpOnly.
- Login/logout/bootstrap and public `POST /api/v1/portal/account-requests` are exempt from session CSRF.

## Frontend auth behavior
- `apps/admin` uses HttpOnly cookie auth, sends `credentials: "include"`, stores only user state, and removes old localStorage token state for cleanup.
- `apps/portal` uses HttpOnly cookie auth, sends `credentials: "include"`, stores only user state, and removes old `aidn_portal_token` state for cleanup.
- Admin and portal clients add `X-CSRF-Token` from their scoped CSRF cookie on unsafe requests when present.
- `apps/portal` protects `/tableau-de-bord`, `/demandes`, and `/demandes/:id`, restores sessions on refresh through `/api/v1/portal/auth/me`, and logs out through `/api/v1/portal/auth/logout`.
- `apps/admin` rejects restored sessions whose current user is not `userType=internal`.
- Frontends no longer send `Authorization: Bearer`, and the backend no longer accepts bearer tokens.

## Permission model
- Capability checks are enforced with `requirePermission(...)`.
- `bootstrap_admin` and `admin` receive the full permission set.
- `POSTULANT_ACCOUNT_REVIEW` guards admin review of external account requests. `bootstrap_admin`, `admin`, and `dn_supervisor` currently have this capability through the role permission map.
- `REQUEST_INTAKE_REVIEW` guards request intake start and correction request.
- `COURRIER_REGISTER_PHYSICAL` guards physical courrier reception/scan registration.
- `DG_CIRCUIT_HANDLE` guards printed-for-DG and send-to-DG actions.
- `PRE_EVAL_DG_CIRCUIT_HANDLE` guards completed pre-evaluation form transmission to the physical DG/parapheur circuit and registration of the scanned DG-annotated return.
- `PRE_EVAL_DG_RETURN_CONSULT` guards consultation/download of the registered DG-annotated pre-evaluation return.
- `GET /admin/dg-circuit/tasks` uses an any-of capability check across `DG_CIRCUIT_HANDLE`, `COURRIER_REGISTER_PHYSICAL`, and `PRE_EVAL_DG_CIRCUIT_HANDLE`; it intentionally does not require `DOSSIER_VIEW_ALL`.
- `bootstrap_admin` and `admin` have all ADMIN-3 permissions.
- `dn_supervisor` has `REQUEST_INTAKE_REVIEW`, `COURRIER_REGISTER_PHYSICAL`, `DG_CIRCUIT_HANDLE`, and `PRE_EVAL_DG_RETURN_CONSULT`; it does not receive `PRE_EVAL_DG_CIRCUIT_HANDLE` by default.
- `dn_agent` has `REQUEST_INTAKE_REVIEW`, `DG_CIRCUIT_HANDLE`, and `PRE_EVAL_DG_RETURN_CONSULT`; it does not receive `PRE_EVAL_DG_CIRCUIT_HANDLE` by default.
- `dg_secretariat` has `DG_CIRCUIT_HANDLE`, `COURRIER_REGISTER_PHYSICAL`, `PRE_EVAL_DG_CIRCUIT_HANDLE`, and `PRE_EVAL_DG_RETURN_CONSULT`.
- `reception` and `bureau_courrier` have `COURRIER_REGISTER_PHYSICAL`, `DG_CIRCUIT_HANDLE`, `PRE_EVAL_DG_CIRCUIT_HANDLE`, and `PRE_EVAL_DG_RETURN_CONSULT`.
- Internal account activation is limited to users with `AIDN_USER_ACTIVATE`.
- `dn_supervisor` no longer receives internal account activation/role-assignment capability by default.

## OMA-EVAL-1 Role and Permission Changes (2026-06-01)

- New permissions: `PAYMENT_INVOICE_UPLOAD`, `PAYMENT_VIEW`
- New role: `s5_agent` — receives `DOSSIER_VIEW_ALL`, `DOCUMENT_UPLOAD_INTERNAL`, `PAYMENT_INVOICE_UPLOAD`, `PAYMENT_VIEW`, `REPORT_VIEW`
- `reception` gains `PAYMENT_INVOICE_UPLOAD` and `PAYMENT_VIEW`
- `dn_agent` gains `PAYMENT_VIEW`
- `dn_supervisor` gains `PAYMENT_VIEW`
- `admin` and `bootstrap_admin` receive all permissions automatically
- `bureau_courrier` does NOT receive payment permissions

## Internal personnel rule
- Internal ANAC users must come from the official personnel adapter.
- `employee_directory` has no active-status field. The official personnel DB only confirms existence. AIDN account activity is determined by `AidnInternalAccount.status`.
- AIDN stores local mirror identity, activation status, AIDN role, permissions by role, audit references, timestamps, and its own `passwordHash`.
- AIDN does not copy, validate, or store official DB passwords.
- Activation creates or updates the local user/account, sets `mustChangePassword`, stores a hash of the generated temporary password, and puts the account in `pending_first_login`.
- Activating an internal account requires matching official personnel data and cannot assign the `postulant` role.
- Postulant account creation is separate from internal personnel activation. It happens only after an admin/DN reviewer approves a public account request and resolves the canonical organization.
- Public account request submission has no authentication requirement for now and never returns or logs the submitted password or `passwordHash`.
- Approved postulant users authenticate separately from internal personnel auth; unapproved/rejected account requests have no user account and cannot log in.

## Audit events
- `auth.bootstrap_login_success`
- `auth.bootstrap_login_failed`
- `auth.internal_login_success`
- `auth.internal_login_failed`
- `auth.internal_password_change_success`
- `auth.internal_password_change_failed`
- `auth.portal_login_success`
- `auth.portal_login_failed`
- `admin.internal_account_activated`
- `admin.internal_account_role_changed`
- `admin.internal_account_reactivated`
- `portal.account_request_submitted`
- `admin.account_request_approved`
- `admin.account_request_rejected`
- `admin.organization_created_from_account_request`
- `admin.organization_linked_from_account_request`
- `admin.request_intake_started`
- `admin.request_correction_requested`
- `admin.physical_courrier_registered`
- `admin.request_printed_for_dg`
- `admin.request_sent_to_dg`
