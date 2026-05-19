# API Routes

Last reviewed: 2026-05-19

## Implemented backend routes in repository
- `GET /health`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/bootstrap/login`
- `POST /api/v1/auth/internal/login`
- `POST /api/v1/auth/internal/change-password`
- `POST /api/v1/auth/logout`
- `POST /api/v1/portal/auth/login`
- `GET /api/v1/portal/auth/me`
- `POST /api/v1/portal/auth/logout`
- `POST /api/v1/portal/account-requests`
- `POST /api/v1/portal/requests`
- `GET /api/v1/portal/requests`
- `GET /api/v1/portal/requests/:id`
- `PATCH /api/v1/portal/requests/:id`
- `POST /api/v1/portal/requests/:id/courrier`
- `POST /api/v1/portal/requests/:id/physical-deposit`
- `POST /api/v1/portal/requests/:id/submit`
- `GET /api/v1/admin/si-users`
- `GET /api/v1/admin/personnel?search=&page=&limit=`
- `GET /api/v1/admin/internal-accounts`
- `POST /api/v1/admin/internal-accounts/activate`
- `GET /api/v1/admin/organizations?search=&status=`
- `GET /api/v1/admin/account-requests?status=&search=&from=&to=`
- `GET /api/v1/admin/account-requests/:id`
- `POST /api/v1/admin/account-requests/:id/approve`
- `POST /api/v1/admin/account-requests/:id/reject`
- `GET /api/v1/admin/requests`
- `GET /api/v1/admin/requests/:id`
- `POST /api/v1/admin/requests/:id/start-intake`
- `POST /api/v1/admin/requests/:id/request-correction`
- `POST /api/v1/admin/requests/:id/register-physical-courrier`
- `POST /api/v1/admin/requests/:id/mark-printed-for-dg`
- `POST /api/v1/admin/requests/:id/send-to-dg`
- `GET /api/v1/admin/audit-logs?page=&limit=`

## Route notes
- Admin routes use authentication plus capability middleware.
- `auth/internal/login` accepts `{ matricule, password }`, confirms the matricule still exists in the official personnel adapter, then validates only the local AIDN `passwordHash`.
- `auth/bootstrap/login` and `auth/internal/login` set the HttpOnly admin/internal cookie and do not return JWTs in the response body.
- `auth/bootstrap/login` returns `{ user }`; `auth/internal/login` returns `{ user, requiresPasswordChange }`.
- `auth/internal/change-password` requires a JWT, accepts `{ currentPassword, newPassword }`, enforces a minimum of 8 characters, clears `mustChangePassword`, and activates a `pending_first_login` internal account.
- `auth/logout` clears the admin/internal cookie and returns `{ ok: true }`.
- `admin/internal-accounts/activate` returns `{ account, temporaryPassword }` for local/dev delivery. Production should send the temporary password through a secure channel instead of exposing it in the API response.
- `admin/personnel` reads through the selected personnel adapter. In official mode this is MariaDB via `employee_directory`; response shape is `{ items, page, limit, total }`.
- `portal/account-requests` is public and unauthenticated. It validates required fields, normalizes email, hashes the supplied password, stores raw requested organization data, returns sanitized request data, and does not create a user, organization, membership, session, or demande.
- `portal/account-requests` is protected by route-scoped rate limiting, a hidden `website` honeypot, a minimum `formStartedAt` submission delay, duplicate pending-request guard, and existing-postulant email guard as of AUTH-2F.
- Anti-abuse fields are accepted for validation only and are not stored on `account_requests`.
- `portal/auth/login` accepts `{ email, password }`, only authenticates active users with `userType=postulant` and `role=postulant`, compares the stored password hash, updates `lastLoginAt`, writes audit logs, sets the HttpOnly portal cookie, and returns `{ user }` without `passwordHash` or JWT.
- `portal/auth/me` requires a valid JWT from the portal cookie and rejects internal, inactive, or non-postulant users.
- `portal/auth/logout` clears the portal cookie and returns `{ ok: true }`.
- `portal/requests` routes require the portal cookie, require a postulant user with `organizationId`, and only expose requests where `submittedById` is the current user.
- `POST /portal/requests` creates a draft `Request` for the current user's canonical `organizationId`; it does not create a `Dossier`.
- `PATCH /portal/requests/:id`, courrier upload, and physical deposit declaration are allowed only before submission.
- `POST /portal/requests/:id/courrier` accepts multipart `file` plus optional notes, stores a local file, creates a `Document`, upserts initial `Courrier`, sets `courrier_uploaded`, and archives any previous uploaded document metadata.
- `POST /portal/requests/:id/physical-deposit` upserts initial `Courrier` with `source=physical_deposit`, stores declaration metadata, and sets `courrier_physical_declared`.
- `POST /portal/requests/:id/submit` requires initial uploaded courrier or physical deposit declaration, sets `submitted`, writes audit, and still does not create a DN dossier.
- `admin/requests` and `admin/requests/:id` are read-only, guarded by `REQUEST_VIEW_ALL`, and expose request/courrier/document summaries for internal users.
- `admin/requests/:id/start-intake` is guarded by `REQUEST_INTAKE_REVIEW`, moves `submitted` to `intake_in_review`, and records intake actor/date/notes.
- `admin/requests/:id/request-correction` is guarded by `REQUEST_INTAKE_REVIEW`, moves submitted/intake requests to `intake_requires_correction`, records reason/actor/date, and creates an in-app postulant notification.
- `admin/requests/:id/register-physical-courrier` is guarded by `COURRIER_REGISTER_PHYSICAL`, accepts optional multipart `file`, records physical reception or internal scan, and updates initial courrier/document refs before DG send.
- `admin/requests/:id/mark-printed-for-dg` is guarded by `DG_CIRCUIT_HANDLE`, records that a portal-uploaded courrier was printed for the physical DG circuit.
- `admin/requests/:id/send-to-dg` is guarded by `DG_CIRCUIT_HANDLE`, requires courrier evidence, requires portal uploads to be marked printed, sets `initial_sent_to_dg`, and does not create a DN dossier.
- JWTs are RS256-signed as of AUTH-2A. Middleware reads them only from scoped HttpOnly cookies as of AUTH-2D; `Authorization: Bearer` is no longer accepted.
- Unsafe authenticated routes require double-submit CSRF as of AUTH-2E: scoped readable CSRF cookie plus `X-CSRF-Token`.
- Public/login/logout/bootstrap routes and `POST /api/v1/portal/account-requests` are exempt from session CSRF.
- `apps/portal` `/demande-compte` is wired to `POST /api/v1/portal/account-requests` as of PORTAL-1.
- `apps/portal` `/connexion` is wired to `POST /api/v1/portal/auth/login` and uses the HttpOnly `aidn_portal_session` cookie as of AUTH-2C.
- `apps/portal` restores sessions through `GET /api/v1/portal/auth/me`, logs out through `POST /api/v1/portal/auth/logout`, and no longer stores or sends bearer JWTs.
- `admin/account-requests` is guarded by `POSTULANT_ACCOUNT_REVIEW` and supports `status`, `search`, `from`, and `to`. Search covers requested organization name, contact name, contact email, and requested organization email.
- `admin/account-requests/:id/approve` links to an existing active canonical organization or creates a new canonical organization, then creates the postulant user and active organization membership.
- `admin/account-requests/:id/reject` requires a reason and finalizes the request without creating user, organization, or membership records.
- `apps/admin` `/admin/demandes-comptes` is wired to the admin account request review endpoints as of ADMIN-2A.
- `admin/organizations` supports `search` and `status`; search covers canonical name, normalized name, aliases, and email.
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
