# TASK

## Current Phase

Phase DASH-2R - Dashboard UI / runtime correction pass: completed.

## Completed Output

- Phase DASH-2 replaced the admin dashboard mock/demo data with real `GET /api/v1/admin/dashboard` data:
  - added `apps/admin/src/lib/api/dashboard.api.ts`
  - rewrote `apps/admin/src/pages/DashboardPage.tsx`
  - added period selector for today, 7 days, current month, and current year
  - added profile-aware DN vs courrier/DG dashboard sections
  - added loading skeletons and retry error state
  - displays certificate metrics as `À venir` until certificate backend exists
  - applied a narrow backend dashboard contract correction for presets, profile names, phase focus, and priority actions
  - verification passed: API typecheck/build and admin typecheck/build
- Phase DASH-2R corrected the API-backed dashboard after browser review:
  - official OMA expected business-day durations are now 30 / 10 / 30 / 25 / 5
  - not-implemented phases with active dossiers show `Phase ouverte` instead of `À venir`
  - unavailable certificate metrics show `À venir` plus `Non disponible`
  - priority document actions include more useful entity labels
  - French dashboard labels and accents were cleaned in touched code
  - verification passed: API typecheck/build and admin typecheck/build
- Phase O1 created `docs/aidn-oma-revised-workflow-blueprint-v1.md`.
- Phase O2 added explicit internal DN/Admin status and simplified postulant-facing status layers.
- Phase O3 reworked `/dossiers/:id` into a read-only Dossier DN workspace.
- Phase O4 added mock-only OMA phase evidence and next-action structures.
- Phase O5 aligned certificates with the manual DN lifecycle.
- Phase O6 aligned `/reports` with official DN reporting indicators.
- Phase O6b clarified `/reports` KPI grouping and units.
- Phase O6c improved report visual hierarchy:
  - renamed `Volumes d'activite` to `Synthese d'activite`
  - kept `Delais cles` as a separate KPI group
  - added the helper note separating volumes and delays
  - added focused responsive bar charts with `recharts`
  - split visual analysis into demandes by entry channel, average delay by phase, demandes by status, and certificates by lifecycle
  - kept completeness alerts as cards/list rather than charts
- Phase O7 added a read-only `/portal-preview` demo page:
  - added a Prototype navigation group with `Portail postulant demo`
  - shows a simplified organism-facing preview for demandes, actions, documents, meetings, payments, notifications, and certificate withdrawal
  - reuses existing mock hooks and portal status labels
  - keeps internal administrative vocabulary out of the applicant-facing page
- Phase O8.1 added demo-only browser state:
  - created a localStorage-backed AIDN demo state seeded from existing mock arrays
  - added get/set/reset/update helpers with browser and parse-failure guards
  - updated fake API reads to use demo state for mutable mock collections
  - kept static decision/timeline reference streams unchanged for now
- Phase O8.2 added controlled demo interactions:
  - added demo action helpers for evidence status updates, next-action completion, and reset
  - added a visible dossier detail demo note and reset control
  - added evidence checklist actions for Recu, Valide, and Manquant demo statuses
  - added a demo-only next-action completion control
  - invalidates AIDN React Query reads after local demo updates
- Phase O8.3 added controlled certificate lifecycle demo interactions:
  - added helpers to derive and advance the manual certificate lifecycle
  - updates lifecycle timestamps in local demo state without generating files
  - added certificate demo actions in `/certificats`
  - added the same certificate demo action in `/dossiers/:id`
  - keeps portal preview read-only while reflecting refreshed certificate state
- Phase O8.4 added controlled meeting and payment demo interactions:
  - added meeting helpers for local demo scheduling and report availability
  - added payment evidence helpers for local received/validated statuses
  - added meeting demo actions in `/reunions`
  - added meeting and payment shortcuts in `/dossiers/:id`
  - kept `/portal-preview` read-only while reflecting refreshed local state
- Phase API-INIT initialized the backend API foundation:
  - created `apps/api` as a TypeScript Express modular monolith
  - added MongoDB/Mongoose connection and environment config
  - added role and permission constants with capability middleware
  - added auth middleware, current-user endpoint, and internal login foundation
  - added official personnel DB adapter interface with mock implementation
  - added bootstrap admin seed script
  - added Mongoose models for users, internal accounts, organizations, account requests, requests, courriers, DG reviews, dossiers, OMA phases, documents, templates, meetings, notifications, and audit logs
  - added minimal admin endpoints for personnel search, internal accounts, activation, organizations, and account requests
  - updated backend/data/workflow/architecture exploration-cache notes
- Phase API-1 hardened auth and internal account activation:
  - normalized personnel adapter contract around search, lookup by personnelId, and matricule authentication
  - hardened bootstrap login, internal login, and current-user payloads
  - rejected inactive users, disabled internal accounts, inactive personnel, and missing activation records
  - constrained internal activation roles to admin/DN/DG/reception/bureau courrier roles only
  - annotated personnel search with AIDN activation status
  - added internal account filters for search, role, and status
  - added audit logging for bootstrap login, internal login, and internal account activation/reactivation/role changes
  - added audit log listing guarded by `AUDIT_VIEW`
  - updated auth/access, route, data model, and architecture decision cache notes
- Phase API-1C connected internal identity to the local MariaDB personnel mirror:
  - added `MariaPersonnelAdapter` over the `employee_directory` view
  - selected MariaDB when `OFFICIAL_PERSONNEL_DB_ENABLED=true`, otherwise mock only when `MOCK_PERSONNEL_ENABLED=true`
  - made missing MariaDB configuration fatal when official personnel mode is enabled
  - switched internal login away from official DB password validation
  - activated AIDN-owned local credentials with a one-time temporary password and `pending_first_login`
  - added first-login password change support at `POST /api/v1/auth/internal/change-password`
  - documented that matricule is the current `personnelId`, email is derived, phone is omitted, and AIDN account activity is determined by `AidnInternalAccount.status`
- Phase API-1C correction clarified the personnel active-status boundary:
  - `employee_directory` has no active-status field
  - the official personnel DB only confirms existence/legitimacy
  - Maria personnel identities omit `isActive` unless the official source exposes it later
  - AIDN account activity remains controlled by `AidnInternalAccount.status`
- Phase API-2 implemented backend postulant account onboarding:
  - added public `POST /api/v1/portal/account-requests`
  - stores raw requested organization and contact fields on `account_requests`
  - hashes the submitted password and never returns `passwordHash`
  - keeps submission review-only: no user, organization, membership, demande, courrier, dossier, upload, email, or QLOG behavior
  - added admin account request list, detail, approve, and reject endpoints
  - approval links to an existing active canonical organization or creates a new one
  - canonical organization creation normalizes names and rejects active duplicate normalized names
  - approval creates the postulant user and active organization membership
  - rejection requires a reason and creates no downstream records
  - added audit events for submission, approval, rejection, and organization link/create decisions
- Phase PORTAL-INIT created the standalone external portal skeleton:
  - added `apps/portal` as a separate React/Vite app
  - added public routes `/`, `/demande-compte`, and `/connexion`
  - added protected placeholder routes `/tableau-de-bord`, `/demandes`, and `/demandes/:id`
  - added `PortalAuthContext` with placeholder auth state only
  - added a public account request form shell without API submission
  - added minimal portal API placeholders for future `POST /api/v1/portal/account-requests` wiring
  - kept admin account request validation UI, login, demande/courrier submission, upload, DG workflow, dossier tracking, and notifications out of scope
- Phase PORTAL-1 wired the public portal account request form:
  - `/demande-compte` now posts to `POST /api/v1/portal/account-requests`
  - client-side validation covers required fields, contact email, optional organization email, password length, and password confirmation
  - confirm password is never sent to the backend
  - success state clears/locks the form and shows `Statut : Soumise`
  - error state keeps entered values and shows a visible French alert
  - no portal login, auth state creation, dashboard data, demande/courrier submission, upload, notification, or DG workflow behavior was added
- Phase ADMIN-2A added the internal review UI for postulant account requests:
  - added `/admin/demandes-comptes` guarded by `POSTULANT_ACCOUNT_REVIEW`
  - added admin navigation label `Comptes postulants`
  - added typed account request API client methods for list, detail, approve, reject, and organization search
  - list supports search, status, start date, and end date filters
  - detail drawer shows sanitized organization/contact/status/decision data only
  - approval supports linking to an existing active canonical organization or creating a new canonical organization
  - rejection requires a reason
  - finalized requests disable approve/reject actions
  - password and `passwordHash` are not displayed
- Phase PORTAL-2 enabled approved postulant portal login:
  - added `POST /api/v1/portal/auth/login` and `GET /api/v1/portal/auth/me`
  - restricts portal auth to active users with `userType=postulant` and `role=postulant`
  - returns JWT plus sanitized user data and never returns `passwordHash`
  - stores the MVP portal token under `aidn_portal_token`
  - restores portal sessions on refresh via `/portal/auth/me`
  - avoids attaching the portal bearer token to public account request submission
  - protects `/tableau-de-bord`, `/demandes`, and `/demandes/:id`
  - added logout controls in the portal header/sidebar
  - tightened admin session restore to reject non-internal users client-side
  - kept demande/courrier submission, upload, DG workflow, dossier tracking, notifications, and password reset out of scope
- Phase AUTH-2A added backend HttpOnly cookie session support with RS256:
  - introduced RS256 JWT signing and verification using `JWT_PRIVATE_KEY_BASE64` and `JWT_PUBLIC_KEY_BASE64`
  - added admin/internal cookie `aidn_admin_session` and portal cookie `aidn_portal_session`
  - login endpoints set HttpOnly cookies
  - auth middleware was initially kept compatible with `Authorization: Bearer` until frontend cookie migration completed
  - added `POST /api/v1/auth/logout` and `POST /api/v1/portal/auth/logout` to clear cookies
  - CORS origins are now explicit through `CORS_ORIGINS` while credentials remain enabled
  - admin/portal frontend migration, CSRF protection, refresh tokens, and bearer fallback removal were deferred to later auth slices
- Phase AUTH-2B migrated the admin frontend to cookie auth:
  - admin API client now sends `credentials: "include"` on API calls
  - admin API client no longer reads localStorage tokens or sends `Authorization: Bearer`
  - admin auth context stores only user/session state in React
  - admin session restore calls `GET /api/v1/auth/me` without requiring a localStorage token
  - admin login ignores the temporary token in backend responses and trusts the HttpOnly cookie
  - admin logout calls `POST /api/v1/auth/logout` and clears local user state
  - old `${STORAGE_PREFIX}_token` is removed during startup/logout cleanup only
  - portal frontend migration, CSRF protection, refresh tokens, and backend bearer fallback removal were deferred to later auth slices
- Phase AUTH-2C migrated the portal frontend to cookie auth:
  - portal API helpers now send `credentials: "include"` on API calls
  - portal API helpers no longer read localStorage tokens or send `Authorization: Bearer`
  - portal auth context stores only the postulant user in React state
  - portal startup restore calls `GET /api/v1/portal/auth/me` without requiring a localStorage token
  - portal login calls `POST /api/v1/portal/auth/login`, ignores the temporary token, and trusts the HttpOnly cookie
  - portal logout calls `POST /api/v1/portal/auth/logout` and clears local user state
  - old `aidn_portal_token` is removed during startup/logout cleanup only
  - protected portal pages still redirect unauthenticated users to `/connexion`
  - CSRF protection, refresh tokens, runtime browser validation, and backend bearer fallback removal were deferred to later auth slices
- Phase AUTH-2D removed JWTs from login response bodies:
  - `POST /api/v1/auth/bootstrap/login` returns only `{ user }` while setting `aidn_admin_session`
  - `POST /api/v1/auth/internal/login` returns `{ user, requiresPasswordChange }` while setting `aidn_admin_session`
  - `POST /api/v1/portal/auth/login` returns only `{ user }` while setting `aidn_portal_session`
  - frontend auth response types no longer include `token`
  - auth middleware no longer accepts `Authorization: Bearer`
  - admin routes require `aidn_admin_session`
  - portal routes require `aidn_portal_session`
- Phase AUTH-2E added double-submit CSRF protection:
  - added readable admin CSRF cookie `aidn_admin_csrf`
  - added readable portal CSRF cookie `aidn_portal_csrf`
  - unsafe protected requests require matching `X-CSRF-Token`
  - safe methods do not require CSRF
  - login, logout, bootstrap login, and public portal account request submission are explicitly exempt
  - login sets both the HttpOnly session cookie and readable CSRF cookie
  - logout clears both the session cookie and CSRF cookie
  - admin and portal clients attach the CSRF header on unsafe requests when the scoped CSRF cookie exists
  - auth cookies remain HttpOnly; CSRF cookies are readable by frontend code
- Phase AUTH-2F hardened public portal account request submission:
  - added route-scoped rate limiting for `POST /api/v1/portal/account-requests`
  - added env controls for public account request rate limit window, max, and minimum submit delay
  - reduced API JSON/urlencoded body limit to `100kb`
  - added hidden `website` honeypot support in the portal form
  - added `formStartedAt` minimum completion delay support
  - rejects honeypot or too-fast submissions with generic `Demande invalide.`
  - blocks duplicate submitted/under_review requests for the same normalized contact email
  - blocks submission when a postulant user already exists for the same email
  - anti-abuse fields are not persisted on account requests
  - public account request remains unauthenticated and CSRF-exempt
  - CAPTCHA and email verification remain deferred
- Phase PORTAL-3 implemented initial demande/courrier submission:
  - added authenticated portal request routes for draft creation, listing, detail, update, courrier upload, physical deposit declaration, and submission
  - added internal read-only admin request list/detail routes guarded by `REQUEST_VIEW_ALL`
  - extended `requests` with `initialDocumentId`, physical deposit metadata, and `courrier_physical_declared`
  - extended `courriers` so physical deposits can exist without a document
  - implemented local upload storage under `UPLOAD_STORAGE_DIR` with 10 MB default max size
  - creates `Document` records for uploaded initial courrier and archives replaced documents without deleting files
  - submit requires uploaded courrier evidence or a physical deposit declaration
  - submitted requests remain `Request` records only; no `Dossier` record is created in this slice
  - added portal request API client methods without building full portal UI pages
  - added audit events for create, update, courrier upload, physical deposit declaration, submit, and optional admin detail view
- Phase PORTAL-3B implemented the minimal postulant UI:
  - `/demandes` now lists the logged-in postulant's own demandes
  - `/demandes/nouvelle` creates a draft request and redirects to the detail page
  - `/demandes/:id` shows request detail, status, dates, courrier evidence, and edit controls before submission
  - request type, subject, and message can be updated before submission
  - initial courrier can be uploaded through multipart form data
  - physical deposit can be declared with expected date, deposit date, location, and notes
  - submit is blocked client-side until uploaded courrier or physical deposit declaration exists
  - submitted demandes hide edit/upload/deposit/submit actions and show the administrative waiting message
  - added small request type/status label components for portal display
- Phase ADMIN-3 implemented internal intake before the physical DG circuit:
  - added request statuses `intake_in_review` and `intake_requires_correction`
  - added internal `request.intake` timestamps, actor refs, correction reason, print marker, send-to-DG marker, and notes
  - added `REQUEST_INTAKE_REVIEW` permission and mapped intake/courrier/DG capabilities to internal roles
  - added `POST /api/v1/admin/requests/:id/start-intake`
  - added `POST /api/v1/admin/requests/:id/request-correction`
  - added `POST /api/v1/admin/requests/:id/register-physical-courrier`
  - added `POST /api/v1/admin/requests/:id/mark-printed-for-dg`
  - added `POST /api/v1/admin/requests/:id/send-to-dg`
  - physical courrier registration can record reception only or attach an internal scan document
  - portal-uploaded courrier must be marked printed before send-to-DG
  - correction and sent-to-DG transitions create in-app notifications for the postulant
  - admin request detail now includes intake metadata with actor summaries when available
  - no `Dossier` records are created by this slice
- Phase ADMIN-3B implemented the internal intake UI:
  - implemented the intake UI on the existing `/demandes` route guarded by `REQUEST_VIEW_ALL`
  - reused the existing `Demandes` navigation entry instead of adding a second demandes screen
  - added `apps/admin/src/lib/api/requests.api.ts` for list/detail and intake actions
  - extended the admin API client with multipart `apiPostForm`
  - added `RequestsPage` with status/type/source/search filters
  - added detail drawer for demande, postulant, organization, courrier, and internal verification metadata
  - added permission-aware action buttons for intake start, correction request, physical courrier registration, printed-for-DG marker, and send-to-DG
  - physical courrier registration supports optional internal scan upload
  - action buttons refresh from API after mutations and do not create dossiers
  - DG return/decision and dossier opening remain deferred

## Guardrails

Historical prototype guardrails before API-INIT:

- No UI mutations.
- No real upload.
- No real email sending.
- No real export.
- No real certificate generation.
- No real persistence; localStorage is allowed only for browser demo state.
- No additional dependencies beyond explicitly approved frontend charting packages.
- No real postulant portal implementation yet; `/portal-preview` is demo-only and read-only.

## Source Context

AIDN must remain a semi-digital traceability system for now.

- The app supports both digital portal submissions and physical ANAC deposits.
- DG instruction remains a physical administrative circuit.
- DN scans/uploads returned DG courrier and workflow evidence into the postulant/dossier file.
- A Dossier DN must not be treated as automatically existing after a demande.
- OMA workflow phases should show formal evidence, especially phase closure courrier.
- Certificates are manually prepared, printed, signed/cacheted, scanned into AIDN, then tracked for withdrawal/remise and archive.
- Reports are mock-derived UI indicators only until backend aggregation/export is validated.

Primary planning sources:

- `Cahier_des_charges.docx`
- `Etude de faisabilite - AIDN.doc` / `Étude de faisabilité - AIDN.doc`
- `AIDN_OMA_WORKFLOW_SOURCE_NOTES.md`
- `AIDN-WORKFLOW-OMA.md`
- `docs/aidn-oma-revised-workflow-blueprint-v1.md`

## OMA-1A: Phase préliminaire - Backend API (2026-05-21)

- Completed `ADMIN-4` (open dossier DN) in a prior session.
- Completed `ADMIN-5` (courriers orientation registry UI) in a prior session.
- Implemented backend-only Phase préliminaire workflow:
  - Created `apps/api/src/modules/oma-phases/oma-phase.service.ts` with 10 service functions
  - Added 9 admin dossier/preliminary endpoints to `admin.routes.ts`
  - Added 2 portal dossier endpoints to `portal.routes.ts`
  - `preliminaryStatus` lazy init: ADMIN-4 creates phase with `null`; first admin action initializes to `preliminary_started`
  - Phase closure requires both `closureCourrierDocumentId` and `preliminaryMeetingReportDocumentId`
  - Closure advances dossier to `formal_request_phase` and activates `formal_request` OmaPhase
- All portal dossier routes are ownership-scoped (postulantUserId match)
- Passed: `apps/api` `npm run build`
- Deferred: DG sub-circuit for pre-evaluation form, correction flow, admin UI, portal UI, emails, progress %
- Runtime validation 2026-05-21: all 13 tests PASS (live MongoDB, bootstrap admin + portal user alex@gmail.com)
  - Lazy init (preliminaryStatus null → preliminary_started), full state machine, portal labels, closure guards, dossier advancement all verified

## Next Action

Phase ADMIN-3B runtime validation and next workflow planning.

P should remain validation-focused:

- Runtime-test `/demandes`, start intake, correction request, physical courrier registration, printed-for-DG marker, send-to-DG, and no dossier creation.
- Runtime-test permission guards for `REQUEST_INTAKE_REVIEW`, `COURRIER_REGISTER_PHYSICAL`, and `DG_CIRCUIT_HANDLE`.
- Confirm portal-uploaded requests cannot be sent to DG until marked printed.
- Confirm physical-deposit requests can register reception/scan before send-to-DG.
- Confirm requests after `initial_sent_to_dg` reject further intake mutation.
- Plan DG return/decision recording next; dossier opening must remain deferred until DG orientation toward DN.
- Keep DG decision endpoints, DN dossier opening, OMA phases, email, export, payment processing, certificate generation, and QLOG integration out of scope until explicitly approved.

## Verification

- Passed: `npx tsc --noEmit`
- Passed: `npm run build`
- Note: Vite still reports the known large chunk warning after build.
- Passed in `apps/api`: `npm install`
- Passed in `apps/api`: `npm run typecheck`
- Passed in `apps/api`: `npm run lint`
- Passed in `apps/api`: `npm run build`
- Passed in `apps/api` after API-1: `npm run typecheck`
- Passed in `apps/api` after API-1: `npm run lint`
- Passed in `apps/api` after API-2: `npm run typecheck`
- Passed in `apps/api` after API-2: `npm run lint`
- Passed in `apps/api` after API-2: `npm run build`
- Passed in `apps/portal` after PORTAL-INIT: `npm install`
- Passed in `apps/portal` after PORTAL-INIT: `npm run typecheck`
- Passed in `apps/portal` after PORTAL-INIT: `npm run lint`
- Passed in `apps/portal` after PORTAL-INIT: `npm run build`
- Note: portal build needed the known outside-sandbox rerun for the Tailwind/Vite native Windows binary.
- Passed in `apps/portal` after PORTAL-1: `npm run typecheck`
- Passed in `apps/portal` after PORTAL-1: `npm run lint`
- Passed in `apps/portal` after PORTAL-1: `npm run build`
- Runtime PORTAL-1 check: `POST /api/v1/portal/account-requests` returned `201` for `Afrijet Test Portal`; Mongo check found `account_requests=1`, `users=0`, `postulant_organizations=0` for the test identity.
- Passed in `apps/admin` after ADMIN-2A: `npx tsc --noEmit`
- Passed in `apps/admin` after ADMIN-2A: `npm run build`
- Note: admin build needed the known outside-sandbox rerun for the Tailwind/Vite native Windows binary.
- Runtime ADMIN-2A API check: account request list found the generated test request; approve-create returned `approved`; approve-existing returned `approved`; reject returned `rejected`; Mongo check found `requestCount=3`, `userCount=2`, `organizationCount=1`, and `membershipCountForCreatedOrganization=2`.
- Runtime ADMIN-2A route check: `http://localhost:5173/admin/demandes-comptes` returned `200`; manual browser interaction was not performed.
- Passed in `apps/api` after PORTAL-2: `npm run typecheck`
- Passed in `apps/api` after PORTAL-2: `npm run lint`
- Passed in `apps/api` after PORTAL-2: `npm run build`
- Passed in `apps/portal` after PORTAL-2: `npm run typecheck`
- Passed in `apps/portal` after PORTAL-2: `npm run lint`
- Passed in `apps/portal` after PORTAL-2: `npm run build` after rerunning outside the sandbox for the known Tailwind/Vite native Windows binary issue.
- Passed in `apps/admin` after PORTAL-2 guard tightening: `npx tsc --noEmit`
- Passed in `apps/admin` after PORTAL-2 guard tightening: `npm run build` after rerunning outside the sandbox for the known Tailwind/Vite native Windows binary issue.
- Runtime PORTAL-2 API check: submitted a new account request, approved it through the admin API, logged in through `POST /api/v1/portal/auth/login`, restored the user through `GET /api/v1/portal/auth/me`, confirmed `passwordHash` was absent, confirmed unapproved request credentials failed, and confirmed bootstrap/internal credentials cannot log into the portal endpoint.
- PORTAL-2 browser redirect/refresh/logout interaction not manually run in this session.
- Passed in `apps/api` after AUTH-2A: `npm run typecheck`
- Passed in `apps/api` after AUTH-2A: `npm run lint`
- Passed in `apps/api` after AUTH-2A: `npm run build`
- AUTH-2A runtime cookie endpoint check was attempted on a temporary API process with generated in-process RS256 keys, but Windows denied starting the background process in this sandbox. Manual runtime check remains pending after setting `JWT_PRIVATE_KEY_BASE64` and `JWT_PUBLIC_KEY_BASE64`.
- Passed in `apps/admin` after AUTH-2B: `npx tsc --noEmit`
- Not available in `apps/admin`: `npm run typecheck` script is not defined.
- Not available in `apps/admin`: `npm run lint` script is not defined.
- Passed in `apps/admin` after AUTH-2B: `npm run build` after rerunning outside the sandbox for the known Tailwind/Vite native Windows binary issue.
- AUTH-2B browser runtime cookie test was not run in this session.
- Passed in `apps/portal` after AUTH-2C: `npm run typecheck`
- Passed in `apps/portal` after AUTH-2C: `npm run lint`
- Passed in `apps/portal` after AUTH-2C: `npm run build` after rerunning outside the sandbox for the known Tailwind/Vite native Windows binary issue.
- AUTH-2C browser runtime cookie test was not run in this session.
- Passed in `apps/api` after AUTH-2D: `npm run typecheck`
- Passed in `apps/api` after AUTH-2D: `npm run lint`
- Passed in `apps/api` after AUTH-2D: `npm run build`
- Passed in `apps/admin` after AUTH-2D: `npx tsc --noEmit`
- Passed in `apps/admin` after AUTH-2D: `npm run build` after rerunning outside the sandbox for the known Tailwind/Vite native Windows binary issue.
- Passed in `apps/portal` after AUTH-2D: `npm run typecheck`
- Passed in `apps/portal` after AUTH-2D: `npm run lint`
- Passed in `apps/portal` after AUTH-2D: `npm run build` after rerunning outside the sandbox for the known Tailwind/Vite native Windows binary issue.
- AUTH-2D runtime bearer rejection and browser cookie validation were not run in this session.
- Passed in `apps/api` after AUTH-2E: `npm run typecheck`
- Passed in `apps/api` after AUTH-2E: `npm run lint`
- Passed in `apps/api` after AUTH-2E: `npm run build`
- Passed in `apps/admin` after AUTH-2E: `npx tsc --noEmit`
- Passed in `apps/admin` after AUTH-2E: `npm run build` after rerunning outside the sandbox for the known Tailwind/Vite native Windows binary issue.
- Passed in `apps/portal` after AUTH-2E: `npm run typecheck`
- Passed in `apps/portal` after AUTH-2E: `npm run lint`
- Passed in `apps/portal` after AUTH-2E: `npm run build` after rerunning outside the sandbox for the known Tailwind/Vite native Windows binary issue.
- AUTH-2E runtime browser/API CSRF validation was not run in this session.
- Passed in `apps/api` after AUTH-2F: `npm run typecheck`
- Passed in `apps/api` after AUTH-2F: `npm run lint`
- Passed in `apps/api` after AUTH-2F: `npm run build`
- Passed in `apps/portal` after AUTH-2F: `npm run typecheck`
- Passed in `apps/portal` after AUTH-2F: `npm run lint`
- Passed in `apps/portal` after AUTH-2F: `npm run build` after rerunning outside the sandbox for the known Tailwind/Vite native Windows binary issue.
- Passed in `apps/api` after PORTAL-3: `npm run typecheck`
- Passed in `apps/api` after PORTAL-3: `npm run lint`
- Passed in `apps/api` after PORTAL-3: `npm run build`
- Passed in `apps/portal` after PORTAL-3: `npm run typecheck`
- Passed in `apps/portal` after PORTAL-3: `npm run lint`
- Passed in `apps/portal` after PORTAL-3: `npm run build` after rerunning outside the sandbox for the known Tailwind/Vite native Windows binary issue.
- PORTAL-3 runtime demande/courrier API flow was not run in this session.
- Passed in `apps/portal` after PORTAL-3B: `npm run typecheck`
- Passed in `apps/portal` after PORTAL-3B: `npm run lint`
- Passed in `apps/portal` after PORTAL-3B: `npm run build` after rerunning outside the sandbox for the known Tailwind/Vite native Windows binary issue.
- PORTAL-3B runtime browser/API validation was not run in this session.
- Passed in `apps/api` after ADMIN-3: `npm run typecheck`
- Passed in `apps/api` after ADMIN-3: `npm run lint`
- Passed in `apps/api` after ADMIN-3: `npm run build`
- Passed in `apps/portal` after ADMIN-3 status-label contract update: `npm run typecheck`
- Passed in `apps/portal` after ADMIN-3 status-label contract update: `npm run lint`
- Passed in `apps/portal` after ADMIN-3 status-label contract update: `npm run build` after rerunning outside the sandbox for the known Tailwind/Vite native Windows binary issue.
- ADMIN-3 runtime API validation was not run in this session.
- Passed in `apps/admin` after ADMIN-3B: `npx tsc --noEmit`
- Not available in `apps/admin` after ADMIN-3B: `npm run typecheck` script is not defined.
- Not available in `apps/admin` after ADMIN-3B: `npm run lint` script is not defined.
- Passed in `apps/admin` after ADMIN-3B: `npm run build` after rerunning outside the sandbox for the known Tailwind/Vite native Windows binary issue.
- ADMIN-3B runtime browser/API validation was not run in this session.

## Phase O6c Expected Result

Status Item

- Done: `/reports` route unchanged.
- Done: `Synthese d'activite` count KPI group added.
- Done: `Delais cles` duration/alert KPI group retained.
- Done: Visual analysis section added.
- Done: Demandes by entry channel chart added.
- Done: Average delay by phase chart added.
- Done: Demandes by status chart added.
- Done: Certificates by lifecycle chart added.
- Done: Completeness alerts kept as non-chart alert cards.
- Done: `recharts` installed for stronger KPI/chart rendering.
- Done: No backend/schema/mutation/export behavior introduced.

## Phase O7 Expected Result

Status Item

- Done: `/portal-preview` route added.
- Done: `PortalPreviewPage` added.
- Done: Prototype navigation item added.
- Done: Page header and prototype note added.
- Done: Existing mock hooks reused.
- Done: Representative organism selector added.
- Done: Applicant-facing sections added for demandes, actions, documents, meetings, payments, notifications, and certificate withdrawal.
- Done: Internal administrative vocabulary avoided in the preview page UI.
- Done: Page remains read-only with no backend/schema/mutation/upload/email/export/certificate download behavior.

## Phase O8.1 Expected Result

Status Item

- Done: `client/src/features/aidn/storage/aidn-demo-storage.ts` added.
- Done: `AIDN_DEMO_STORAGE_KEY` defined as `aidn.demo.state.v1`.
- Done: `AidnDemoState` includes demandes, courriers, dossiers, phases, documents, meetings, certificates, evidence, next actions, and `updatedAt`.
- Done: Demo state seeded from existing mock arrays.
- Done: `getAidnDemoState`, `setAidnDemoState`, `resetAidnDemoState`, and `updateAidnDemoState` added.
- Done: localStorage access is guarded and falls back to mock seed on unavailable storage or parse failure.
- Done: Fake API reads use demo state for mutable mock collections.
- Done: No UI mutations, buttons, backend/schema/real persistence/upload/email/export/certificate generation introduced.

## Phase O8.2 Expected Result

Status Item

- Done: `client/src/features/aidn/storage/aidn-demo-actions.ts` added.
- Done: Demo helper updates phase evidence status in localStorage-backed state.
- Done: Demo helper marks phase next action as done in localStorage-backed state.
- Done: Demo helper resets local demo data.
- Done: `/dossiers/:id` shows a demo note near the top.
- Done: `/dossiers/:id` has a visible `Reinitialiser la demo` control.
- Done: Evidence checklist rows include Recu, Valide, and Manquant demo actions.
- Done: Non-applicable evidence actions are disabled.
- Done: Next action blocks include `Marquer fait dans la demo`.
- Done: AIDN React Query reads are invalidated after updates/reset.
- Done: No backend/schema/real persistence/upload/email/export/certificate generation introduced.

## Phase O8.3 Expected Result

Status Item

- Done: `advanceCertificateLifecycle` added.
- Done: `setCertificateLifecycleStatus` added for future targeted demo updates.
- Done: `getNextCertificateLifecycleStatus` added.
- Done: `getNextCertificateLifecycleActionLabel` added.
- Done: Advancing certificate lifecycle updates the relevant timestamp fields in local demo state.
- Done: `/certificats` includes a demo lifecycle action in row actions and detail view.
- Done: `/certificats` includes a demo note explaining local simulation only.
- Done: `/dossiers/:id` certificate section includes the same demo lifecycle action.
- Done: Portal preview remains read-only and reflects certificate state through existing query refresh.
- Done: No backend/schema/real persistence/upload/email/export/certificate generation introduced.

## Phase O8.4 Expected Result

Status Item

- Done: `markMeetingScheduled` added.
- Done: `markMeetingReportAvailable` added.
- Done: `markPaymentEvidenceReceived` added.
- Done: `markPaymentEvidenceValidated` added.
- Done: `/reunions` includes a demo note explaining local simulation only.
- Done: `/reunions` includes meeting scheduling and report availability demo actions.
- Done: `/dossiers/:id` meetings section includes matching meeting demo actions.
- Done: `/dossiers/:id` payment evidence rows include received/validated shortcuts.
- Done: Portal preview remains read-only and reflects updated meeting/payment states through existing query refresh.
- Done: No backend/schema/real persistence/upload/email/export/payment/certificate generation introduced.

## Focused Correction Pass - Request Labels, Admin KPIs, DG MVP Simplification

Status Item

- Done: Portal and admin OMA request type labels corrected to Certificat de reconnaissance OMA, Certificat d’agrément OMA, Renouvellement de Certificat OMA, and Modification de Certificat OMA while keeping stable enum values.
- Done: Admin Demandes/Requests surfaces show KPI cards for Demandes soumises, En attente DG, À imprimer, Dossiers prêts / orientés DN, and Annulées DG using current list data.
- Done: Visible print action copy changed from DG-specific wording to `Imprimer`; backend route `mark-printed-for-dg` remains unchanged.
- Done: Reorientation removed from normal MVP filters/actions/labels; legacy enum compatibility remains only where already present in backend/types.
- Done: Portal status labels remain applicant-simple and avoid internal DG details such as reorientation, printed-DG, and scanned-return states.
- Done: Exploration cache docs and manifest updated for this correction pass.

## Focused Correction Pass - Print Starts DG Circuit + DG Return Recording

Status Item

- Done: Admin UI no longer exposes `Transmettre au DG` as the normal user path.
- Done: `Imprimer` now moves eligible requests directly to `initial_sent_to_dg` / En attente d’orientation DG.
- Done: Admin request KPIs updated to include Téléversées portail, Dépôts physiques, En attente DG, À traiter retour DG, Orientées DN, and Annulées DG.
- Done: Request detail now shows `Enregistrer le retour DG` when waiting for DG orientation.
- Done: DG return recording accepts decision, return date, optional observations, and optional scan upload; `cancelled_by_dg` maps to the existing `rejected` status for compatibility.
- Done: Backend `send-to-dg` compatibility endpoint remains, but current UI does not use it.
- Done: Workflow docs note the future dedicated DG screen option and keep the MVP as print -> DG physical review -> scan/upload DG response.

## Focused Correction Pass - Mandatory DG Return Scan + Document Registry

Status Item

- Done: Admin DG return modal label changed to `Scan du retour DG annoté *`.
- Done: Admin UI blocks DG return submission without a file and shows `Le scan du retour DG est obligatoire.`.
- Done: `POST /api/v1/admin/requests/:id/record-dg-return` rejects missing multipart file with HTTP 400 and the same French message.
- Done: DG return scans are registered in `documents` as request-owned internal courrier documents with `documentType=dg_annotated_courrier`.
- Done: DG return metadata links `returnedScannedDocumentId` to the registered document.
- Done: Audit metadata includes decision, returnedAt, dgReviewId, and dgReturnDocumentId without raw storage path or file content.
- Done: Docs/cache now state that all uploaded files must be registered in Documents and that OCR/search indexing is deferred.

## Focused Correction Pass - Portal Initial Courrier Submission Workflow

Status Item

- Done: Portal request detail now has one `Courrier initial` section with a mode selector and one final `Soumettre la demande` action.
- Done: Standalone portal `Televerser le courrier` and `Declarer le depot` business actions were removed from the UI.
- Done: Portal final submit validates mode-specific data: upload mode requires a file; physical mode requires planned deposit date and location.
- Done: Physical-deposit portal submission records only planned deposit metadata; actual physical receipt date, official reference, and scan are admin/reception-only.
- Done: Admin request list defaults to submitted/admin-processable demandes, not draft-side portal preparation states.
- Done: Admin physical receipt now requires actual deposit date and scan; the scan is registered as `documentType=initial_courrier_scan`.
- Done: Admin KPIs distinguish portal uploads, planned physical deposits, and received physical courriers.
- Done: All uploaded initial courrier files and receipt scans enter the Documents registry.

## Focused Correction Pass - Block DN Verification Until DG Return Scan

Status Item

- Done: `Demarrer` / `Demarrer la verification` is hidden unless the request is `oriented_to_dn` and the linked DG review has decision `oriented_to_dn` plus `returnedScannedDocumentId`.
- Done: Backend `startAdminRequestIntake` enforces the same DG-return-complete condition before mutating status or writing the success audit event.
- Done: Submitted, printed/en-attente-DG, missing-scan, rejected/cancelled DG requests remain blocked from DN verification.
- Done: Admin list responses now include initial DG review metadata needed for row-level action guards.
- Done: Docs/cache now state that oriented status alone is insufficient without the annotated DG return scan.
