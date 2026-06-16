# AUTH_AND_ACCESS.md

Last reviewed: 2026-05-19
Source files inspected: apps/api/src/modules/auth, apps/api/src/modules/admin, apps/api/src/modules/personnel, apps/api/src/shared/guards, apps/api/src/shared/permissions

## Confirmed facts
- Bootstrap admin is only for initial setup and emergency access.
- Internal users are personnel-backed and cannot self-register in AIDN.
- The official ANAC personnel DB is the identity and legitimacy source only.
- `employee_directory` has no active-status field. The official personnel DB only confirms existence. AIDN account activity is determined by `AidnInternalAccount.status`.
- AIDN owns internal application credentials in MongoDB via `users.passwordHash`.
- Internal login confirms the matricule still exists through the personnel adapter, then checks the local AIDN internal account and local password hash.
- First login after activation returns `requiresPasswordChange: true`.
- `POST /api/v1/auth/internal/change-password` clears `mustChangePassword` and moves a pending internal account to `active`.
- Disabled internal accounts and inactive local users are rejected.
- Internal account activation only accepts internal roles: `admin`, `dn_supervisor`, `dn_agent`, `dg_secretariat`, `reception`, `bureau_courrier`.
- `postulant` cannot be assigned through internal personnel activation.
- Login and activation paths write audit logs without passwords.
- Approved postulants can authenticate through `POST /api/v1/portal/auth/login` using the contact email/password from the approved account request.
- Portal login is restricted to active users with `userType=postulant` and `role=postulant`; internal users cannot use the portal login path.
- Portal session restore uses `GET /api/v1/portal/auth/me`, which rejects internal, inactive, or non-postulant users.
- Portal auth responses are sanitized and never include `passwordHash`.
- AUTH-2A introduced RS256 JWT sessions. The API reads private/public keys from `JWT_PRIVATE_KEY_BASE64` and `JWT_PUBLIC_KEY_BASE64`; no key files should be committed.
- The JWT key variables accept either pasted base64-encoded PEM values or paths to `.pem`/`.b64` files relative to `apps/api`.
- Login endpoints now set HttpOnly cookies:
  - admin/internal: `aidn_admin_session` by default, configurable with `AUTH_COOKIE_NAME`
  - portal: `aidn_portal_session` by default, configurable with `PORTAL_AUTH_COOKIE_NAME`
- Auth middleware reads JWTs only from scoped HttpOnly cookies as of AUTH-2D.
- Admin-scoped routes require the admin/internal cookie `aidn_admin_session`.
- Portal-scoped routes require the portal cookie `aidn_portal_session`.
- `Authorization: Bearer` is no longer accepted.
- Logout endpoints clear cookies and do not require authentication.
- Cookie options are configured through `COOKIE_DOMAIN`, `COOKIE_SECURE`, `COOKIE_SAME_SITE`, and `JWT_EXPIRES_IN`.
- `COOKIE_SAME_SITE=none` requires `COOKIE_SECURE=true` in production.
- AUTH-2E added double-submit CSRF protection for cookie-authenticated unsafe methods.
- Admin unsafe requests require readable CSRF cookie `aidn_admin_csrf` plus matching `X-CSRF-Token`.
- Portal authenticated unsafe requests require readable CSRF cookie `aidn_portal_csrf` plus matching `X-CSRF-Token`.
- Session cookies remain HttpOnly; CSRF cookies are intentionally readable by frontend code.
- Login sets the scoped session cookie and scoped CSRF cookie; logout clears both.
- Public/login/logout/bootstrap routes and `POST /api/v1/portal/account-requests` are exempt from session CSRF.
- AUTH-2F added public account request abuse prevention: route-scoped rate limit, honeypot field, minimum form delay, duplicate pending request guard, and existing postulant email guard.

## Source files to inspect first
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/admin/admin.service.ts`
- `apps/api/src/modules/personnel/personnel.types.ts`
- `apps/api/src/modules/personnel/mock-personnel.adapter.ts`
- `apps/api/src/modules/audit/audit.service.ts`
- `apps/api/src/shared/permissions/permissions.ts`
- `apps/api/src/modules/portal/portal.routes.ts`

## Known gaps
- Official DB active/inactive status is not exposed in `employee_directory`; login and activation use AIDN account status for application activity.
- Temporary password delivery is local/dev only in the activation response; production needs a secure delivery channel.
- Password policy and account lockout are pending for bootstrap admin.
- Token revocation/session storage is not implemented yet.
- Portal frontend uses HttpOnly cookie auth as of AUTH-2C and no longer sends bearer headers.
- Legacy `aidn_portal_token` cleanup remains in the portal context only to remove old browser state.
- Public account request submission is rate-limited and has basic bot/duplicate guards; CAPTCHA and email verification remain deferred.
- Refresh token rotation is deferred.
- Admin frontend uses HttpOnly cookie auth as of AUTH-2B and no longer sends bearer headers.
- Phase preliminaire implementation is still pending and must not start in API-1.

## Local RS256 key generation

Linux/macOS:

```sh
openssl genrsa -out jwt_private.pem 2048
openssl rsa -in jwt_private.pem -pubout -out jwt_public.pem
base64 -w 0 jwt_private.pem
base64 -w 0 jwt_public.pem
```

PowerShell:

```powershell
openssl genrsa -out jwt_private.pem 2048
openssl rsa -in jwt_private.pem -pubout -out jwt_public.pem
[Convert]::ToBase64String([IO.File]::ReadAllBytes("jwt_private.pem"))
[Convert]::ToBase64String([IO.File]::ReadAllBytes("jwt_public.pem"))
```

Do not commit generated key files.

## Next update
- Runtime-validate admin and portal cookie login/restore/logout, bearer rejection, and CSRF rejection/acceptance paths.
