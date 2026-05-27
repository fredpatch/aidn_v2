# Build And Test Commands

Last reviewed: 2026-05-19

## Script source
- apps/admin/package.json
- apps/api/package.json
- apps/portal/package.json

## Commands
- Admin install: `npm ci` in `apps/admin`
- Admin dev: `npm run dev` in `apps/admin`
- Admin build: `npm run build` in `apps/admin`
- Admin typecheck equivalent: `npm run build` runs `tsc && vite build`; there are no separate `typecheck` or `lint` scripts currently.
- Admin direct typecheck: `npx tsc --noEmit` in `apps/admin`
- API install: `npm ci` in `apps/api`
- API build: `npm run build` in `apps/api`
- API typecheck/lint when available: `npm run typecheck`, `npm run lint`
- Portal install: `npm install` in `apps/portal`
- Portal dev: `npm run dev` in `apps/portal`
- Portal typecheck: `npm run typecheck` in `apps/portal`
- Portal build: `npm run build` in `apps/portal`
- Portal lint: `npm run lint` in `apps/portal` currently runs TypeScript checks.
- Docker dev: `npm run docker:up` / `npm run docker:down` from `apps/admin`

## Current verification pattern
- Admin build may fail inside the sandbox because Vite/Tailwind loads a native Windows binary. Rerun `npm run build` outside the sandbox when the failure is `@tailwindcss/oxide-win32-x64-msvc` or `spawn EPERM`.
- Portal build uses the same Vite/Tailwind native binary pattern and may need the same outside-sandbox rerun on Windows.
- Runtime manual checks require live configured API, MongoDB, and MariaDB.
- PORTAL-1 runtime check target: run API plus portal, open `http://127.0.0.1:5174/demande-compte`, submit a test account request, then verify the request exists in `account_requests` and no user/organization/membership is created before approval.
- ADMIN-2A runtime check target: login to `apps/admin`, open `/admin/demandes-comptes`, verify pending requests list, detail drawer, approval with create organization, approval with existing organization, and rejection with reason.
- PORTAL-2 runtime check target: create and approve a portal account request, open `/connexion`, login with the approved contact email/password, confirm redirect to `/tableau-de-bord`, refresh to verify session restore, logout, confirm protected routes redirect to `/connexion`, and confirm rejected/unapproved request credentials fail.
- AUTH-2A runtime check target: configure `JWT_PRIVATE_KEY_BASE64` and `JWT_PUBLIC_KEY_BASE64`, login through internal/bootstrap and portal endpoints, confirm `Set-Cookie` for `aidn_admin_session` and `aidn_portal_session`, call `/auth/me` and `/portal/auth/me` with cookies, and confirm logout endpoints clear cookies.
- AUTH-2B runtime check target: start API and admin, clear legacy localStorage token, login as an internal admin, confirm `Set-Cookie: aidn_admin_session`, confirm localStorage has no admin auth token, confirm admin API requests include cookies and omit `Authorization`, refresh to verify `/auth/me` restore, visit protected admin pages, logout, and confirm protected pages redirect to login.
- AUTH-2C runtime check target: start API and portal with valid RS256 keys, submit and approve a portal account request, login at `/connexion`, confirm `Set-Cookie: aidn_portal_session`, confirm localStorage has no `aidn_portal_token`, confirm portal requests include cookies and omit `Authorization`, refresh to verify `/portal/auth/me` restore, logout, confirm protected pages redirect to `/connexion`, and confirm rejected/unapproved plus internal credentials fail at portal login.

## Verification note
- This file lists available commands; run status is tracked in session note and report.
- Latest PORTAL-2 API runtime check covered account request submission, admin approval, portal login, portal `/auth/me`, missing `passwordHash`, unapproved-login rejection, and internal-login rejection at the portal endpoint. Browser redirect/refresh/logout interaction still needs a manual browser pass.
- AUTH-2A backend verification commands: `npm run typecheck`, `npm run lint`, and `npm run build` in `apps/api`.
- AUTH-2B admin verification: `npx tsc --noEmit` and `npm run build` in `apps/admin`; `typecheck` and `lint` scripts are not defined in `apps/admin/package.json`.
- AUTH-2C portal verification: `npm run typecheck`, `npm run lint`, and `npm run build` in `apps/portal`; build may need outside-sandbox execution for the known Vite/Tailwind native Windows binary.
- AUTH-2D runtime check target: confirm login response bodies have no JWT, admin routes only accept `aidn_admin_session`, portal routes only accept `aidn_portal_session`, and `Authorization: Bearer <token>` returns `401` unless a valid scoped cookie is also present.
- AUTH-2E runtime check target: confirm login sets HttpOnly session cookie plus readable scoped CSRF cookie, unsafe protected requests include `X-CSRF-Token`, missing/mismatched CSRF returns `403`, logout clears both cookies, and public portal account request submission still works while logged out without session CSRF.
- AUTH-2F runtime check target: submit a normal public account request and expect `201`; set `PUBLIC_ACCOUNT_REQUEST_RATE_LIMIT_MAX=1` to verify `429`; submit `website` to verify generic `400`; submit a fresh `formStartedAt`/invalid timestamp to verify generic `400`; submit the same contact email twice while the first is submitted to verify `409`; reject the request and confirm the same email can submit again.
- PORTAL-3 runtime check target: login as an approved postulant; create a draft through `POST /api/v1/portal/requests`; upload initial courrier through multipart `POST /requests/:id/courrier`; submit it; verify no `dossiers` record is created; create a second draft, declare physical deposit, submit without file; verify another postulant cannot access it; verify submitted requests reject update/upload/deposit/resubmit; verify `GET /api/v1/admin/requests` works only for internal users with `REQUEST_VIEW_ALL`.
- PORTAL-3 verification commands passed: API `npm run typecheck`, `npm run lint`, `npm run build`; portal `npm run typecheck`, `npm run lint`, and `npm run build` after the known outside-sandbox rerun.
- PORTAL-3B runtime check target: login as an approved postulant in the portal, open `/demandes`, create a draft at `/demandes/nouvelle`, upload a courrier on detail, submit and confirm actions lock, create a second draft, declare physical deposit, submit without upload, verify no `dossiers` record is created, and verify admin read visibility through the API.
- PORTAL-3B verification commands passed: portal `npm run typecheck`, `npm run lint`, and `npm run build` after the known outside-sandbox rerun.
- PORTAL-H1D verification commands passed: API `npm run typecheck`, `npm run lint`, `npm run build`; portal `npm run typecheck`, `npm run lint`, and `npm run build` after the known outside-sandbox rerun.
- PORTAL-H1D-1 verification commands passed: portal `npm run typecheck`, `npm run lint`, and `npm run build` after the known outside-sandbox rerun.
- ADMIN-3 runtime check target: with a submitted request, call admin start-intake, request-correction, register-physical-courrier, mark-printed-for-dg, and send-to-dg endpoints; verify no `dossiers` record is created; verify permission guards; verify mutations reject after `initial_sent_to_dg`.
- ADMIN-3 verification commands passed: API `npm run typecheck`, `npm run lint`, `npm run build`; portal `npm run typecheck`, `npm run lint`, and `npm run build` after the status-label contract update.
- ADMIN-3B runtime check target: open `/demandes`; verify submitted portal-upload and physical-deposit requests appear; start intake; mark portal-uploaded courrier printed; send to DG; register physical courrier with/without scan; request correction before DG send; verify invalid actions are hidden; verify no dossier is created.
- ADMIN-3B verification commands passed: `npx tsc --noEmit` in `apps/admin`; `npm run build` in `apps/admin` after outside-sandbox rerun. `npm run typecheck` and `npm run lint` are not defined in `apps/admin/package.json`.
- OMA-FORMAL-9B1 admin verification commands passed: `npx tsc --noEmit` in `apps/admin`; `npm run build` in `apps/admin` passed after the known outside-sandbox rerun for the Vite/Tailwind Windows native binary.
- OMA-FORMAL-9B1A verification commands passed: portal `npx tsc --noEmit`; portal `npm run build` after the known outside-sandbox rerun; API `npx tsc --noEmit`; API `npm run build`.
- OMA-FORMAL-9B1B admin verification commands passed: `npx tsc --noEmit` in `apps/admin`; `npm run build` in `apps/admin` passed after the known outside-sandbox rerun for the Vite/Tailwind Windows native binary. In-sandbox build failed first with `@tailwindcss/oxide-win32-x64-msvc` / `spawn EPERM`.
- OMA-FORMAL-9C1 admin verification commands passed: `npx tsc --noEmit` in `apps/admin`; `npm run build` in `apps/admin` passed after the known outside-sandbox rerun for the Vite/Tailwind Windows native binary. In-sandbox build failed first with `@tailwindcss/oxide-win32-x64-msvc` / `spawn EPERM`.
