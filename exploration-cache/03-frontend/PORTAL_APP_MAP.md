# Portal App Map

Last reviewed: 2026-05-19
Source files inspected: `apps/portal/src/App.tsx`, `apps/portal/src/layouts/*`, `apps/portal/src/pages/*`, `apps/portal/src/lib/*`

## Confirmed facts
- `apps/portal` is a separate React/Vite frontend app for external postulants.
- Portal routes are not mixed into `apps/admin`.
- The app uses Tailwind through `@tailwindcss/vite`, React Router, lucide icons, and local lightweight components.
- Portal authentication is implemented for approved active postulant users.
- `PortalAuthContext` uses the HttpOnly `aidn_portal_session` cookie, stores only user state in React, restores sessions through `/api/v1/portal/auth/me`, and exposes `user`, `isAuthenticated`, `isLoading`, `login`, and `logout`.
- Legacy `aidn_portal_token` is removed during auth startup/logout cleanup only; the portal no longer writes JWTs to browser storage.
- Protected pages redirect to `/connexion` when no valid portal session exists.
- `/demande-compte` now submits account requests to the backend API.

## Routes
| Route | Page | Access | Status |
| --- | --- | --- | --- |
| `/` | `LandingPage` | Public | Portal introduction and CTAs |
| `/demande-compte` | `AccountRequestPage` | Public | Account request form wired to API |
| `/connexion` | `LoginPage` | Public | Email/password portal login |
| `/tableau-de-bord` | `PortalDashboardPage` | Protected | Welcomes the logged-in postulant and shows linked organization id when available |
| `/demandes` | `MyRequestsPage` | Protected | Lists the logged-in postulant's own demandes and links to creation/detail |
| `/demandes/nouvelle` | `NewRequestPage` | Protected | Creates a draft demande |
| `/demandes/:id` | `RequestDetailPage` | Protected | Shows detail, pre-submit edit, courrier upload, physical deposit, and submit |
| `*` | `NotFoundPage` | Public fallback | Not-found state |

## API wiring
- `src/lib/api/http.ts` defines `VITE_API_BASE_URL` fallback to `http://localhost:4000` and GET/POST helpers that always send `credentials: "include"` and never attach `Authorization`.
- Authenticated unsafe portal calls attach `X-CSRF-Token` from the readable `aidn_portal_csrf` cookie when present.
- `src/lib/api/portal.api.ts` defines account request, auth, and PORTAL-3 request methods: `createRequest`, `listRequests`, `getRequest`, `updateRequest`, `uploadRequestCourrier`, `declarePhysicalDeposit`, and `submitRequest`.
- PORTAL-3B wires the request methods into the UI:
  - `/demandes` calls `listRequests()`
  - `/demandes/nouvelle` calls `createRequest()`
  - `/demandes/:id` calls `getRequest()`, `updateRequest()`, `uploadRequestCourrier()`, `declarePhysicalDeposit()`, and `submitRequest()`
- `AccountRequestPage` calls `POST /api/v1/portal/account-requests`.
- Public account request submission opts out of session CSRF because it runs before login.
- `AccountRequestPage` sends hidden anti-abuse fields `website` and `formStartedAt`; these are validation-only and not business data.
- `LoginPage` calls `POST /api/v1/portal/auth/login`, receives only sanitized user data, then redirects to `/tableau-de-bord`.
- Session restore calls `GET /api/v1/portal/auth/me` and rejects non-postulant users client-side.
- Logout calls `POST /api/v1/portal/auth/logout`, clears user state, and redirects to `/connexion`.
- The form validates required fields, email shape, password length, and password confirmation before submitting.
- On success, the form clears/locks and shows the returned status as `Statut : Soumise`.
- On error, the form keeps entered values and shows a visible French error alert.
- Passwords are not logged, rendered back, or stored in browser storage.
- Duplicate pending request messages from the backend are displayed as normal validation errors.

## Boundaries
- No admin account request validation UI was added in the portal app.
- Portal demande/courrier UI exists as a minimal validation flow as of PORTAL-3B.
- The UI does not implement admin request review, DG workflow, dossier opening, OMA phases, meetings, notifications, or download/readback of uploaded files.
- DG workflow, dossier tracking, notifications, and password reset are not implemented in the portal UI.
- Backend no longer accepts bearer tokens as of AUTH-2D; portal auth is cookie-only.
- CSRF is implemented for authenticated unsafe portal requests as of AUTH-2E.
- Public account request submission has basic abuse prevention as of AUTH-2F: rate limiting, honeypot, minimum delay, and duplicate guards.
- Refresh-token rotation is not implemented yet.
- CAPTCHA/email verification are not implemented yet.
- Next recommended slice: runtime-validate AUTH-2F public request hardening, then plan CAPTCHA/email verification or refresh/session rotation.
