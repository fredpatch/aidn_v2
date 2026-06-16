# Portal App Map

Last reviewed: 2026-05-22 (PORTAL-H1D)
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
| `/tableau-de-bord` | `PortalDashboardPage` | Protected | Stat cards (demandes, actions, notifications, next rendez-vous) linked to /demandes, /notifications, and /rendez-vous; real unread count and next meeting from API |
| `/demandes` | `MyRequestsPage` | Protected | Two-panel workspace: left clickable list (action/dossier indicators), right preview panel with link to full detail |
| `/demandes/nouvelle` | `NewRequestPage` | Protected | Creates a draft demande (French accents corrected) |
| `/demandes/:id` | `RequestDetailPage` | Protected | Tabbed (Résumé / Courrier initial / Actions requises / Dossier / Historique); Sonner toasts |
| `/rendez-vous` | `RendezVousPage` | Protected | Read-only list and calendar of meetings linked to the postulant's owned dossiers |
| `/notifications` | `NotificationsPage` | Protected | List all notifications with per-item mark-read and bulk mark-all-read |
| `*` | `NotFoundPage` | Public fallback | Not-found state |

## API wiring
- `src/lib/api/http.ts` defines `VITE_API_BASE_URL` fallback to `http://localhost:4000` and GET/POST helpers that always send `credentials: "include"` and never attach `Authorization`.
- Authenticated unsafe portal calls attach `X-CSRF-Token` from the readable `aidn_portal_csrf` cookie when present.
- `src/lib/api/portal.api.ts` defines account request, auth, request, meeting, and notification methods. Meeting types: `PortalMeeting`, `PortalMeetingStatus`. Methods include `listPortalMeetings()`.
- PORTAL-3B wires the request methods into the UI:
  - `/demandes` calls `listRequests()`
  - `/demandes/nouvelle` calls `createRequest()`
  - `/demandes/:id` calls `getRequest()`, `updateRequest()`, and `submitRequestWithCourrier()`
- Portal request detail no longer exposes standalone `Televerser le courrier` or `Declarer le depot` workflow buttons; the postulant chooses `Televersement portail` or `Depot physique a l'ANAC` inside `Courrier initial` and submits once.
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
- Request type labels are corrected everywhere the portal renders them:
  - `oma_recognition`: Certificat de reconnaissance OMA
  - `oma_approval`: Certificat d’agrément OMA
  - `oma_renewal`: Renouvellement de Certificat OMA
  - `oma_modification`: Modification de Certificat OMA
- Portal-facing request status labels remain simplified for postulants and do not expose printed-DG, scanned-return, or reorientation wording.
- `/rendez-vous` calls `listPortalMeetings({ status: "all" })`, maps scheduled meetings into `PortalCalendarEvent`, and does not create/update/cancel meetings.
- `PortalCalendar` is a local read-only component using native `Date` / `Intl.DateTimeFormat`; no `date-fns` or shadcn dependency was added.
- PORTAL-H1D-1 adds a printable convocation modal from rendez-vous meeting cards and selected calendar-day items. It uses existing `PortalMeeting` data only, browser print, and print-specific CSS; no backend or document registry work was added.
- `PortalDashboardPage` uses `listPortalMeetings({ status: "all" })` for the next meeting card without fetching dossier details.
- OMA-FORMAL-9B1A wires Phase 2 formal request courrier upload in `/demandes/:id`:
  - `getPortalDossier` now exposes a portal-safe `formalRequest` block with no internal DG review IDs or admin-only details.
  - `RequestDetailPage` shows the action in `Actions requises` when Phase 1 is closed and the formal courrier gate is missing.
  - The upload posts multipart field `file` plus optional `notes` to `POST /api/v1/portal/dossiers/:id/phases/formal-request/courrier`.
  - The portal does not expose source selection, physical-deposit/internal-scan choices, DG decision controls, or scanned-return controls.
- OMA-HARDENING-5 harmonizes portal dossier phase labels:
  - Phase 1 dossier labels use simple ANAC-facing wording: `En cours de traitement par l'ANAC`, `Rendez-vous programmé`, `Formulaire de pré-évaluation à compléter`, `En cours d'examen`, and `Phase préliminaire clôturée`.
  - Phase 2 formal labels now progress by status: `Demande formelle attendue`, `Demande formelle reçue`, `Demande formelle en cours d'examen`, `Réunion formelle programmée`, `Documents de demande formelle à compléter`, `En attente de finalisation par l'ANAC`, `Action requise`, and `Phase de demande formelle clôturée`.
  - `/demandes/:id` formal request Actions requises copy no longer says `circuit officiel DG`; it tells the postulant to upload the formal request so ANAC can continue processing.

## Boundaries
- No admin account request validation UI was added in the portal app.
- Portal demande/courrier UI exists as a minimal validation flow as of PORTAL-3B.
- The UI does not implement admin request review, DG workflow, dossier opening, meeting mutations, timeline API, or document list API.
- DG workflow details, portal stats API, and password reset are not implemented in the portal UI.
- Notifications are now fully implemented: list, per-item mark-read, bulk mark-all-read (PORTAL-H1C).
- Rendez-vous are read-only for portal users as of PORTAL-H1D.
- Meeting convocations are portal-side printable views only as of PORTAL-H1D-1; they are not official generated PDFs.
- Backend no longer accepts bearer tokens as of AUTH-2D; portal auth is cookie-only.
- CSRF is implemented for authenticated unsafe portal requests as of AUTH-2E.
- Public account request submission has basic abuse prevention as of AUTH-2F: rate limiting, honeypot, minimum delay, and duplicate guards.
- OMA-FORMAL-9B1A runtime checks are pending: live portal upload, refresh, action disappearance, and admin gate-present confirmation.
- Refresh-token rotation is not implemented yet.
- CAPTCHA/email verification are not implemented yet.
- Next recommended slice: runtime-validate AUTH-2F public request hardening, then plan CAPTCHA/email verification or refresh/session rotation.
