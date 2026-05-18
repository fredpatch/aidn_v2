# Build And Test Commands

Last reviewed: 2026-05-18

## Script source
- apps/admin/package.json
- apps/api/package.json

## Commands
- Admin install: `npm ci` in `apps/admin`
- Admin dev: `npm run dev` in `apps/admin`
- Admin build: `npm run build` in `apps/admin`
- Admin typecheck equivalent: `npm run build` runs `tsc && vite build`; there are no separate `typecheck` or `lint` scripts currently.
- API install: `npm ci` in `apps/api`
- API build: `npm run build` in `apps/api`
- API typecheck/lint when available: `npm run typecheck`, `npm run lint`
- Docker dev: `npm run docker:up` / `npm run docker:down` from `apps/admin`

## Current verification pattern
- Admin build may fail inside the sandbox because Vite/Tailwind loads a native Windows binary. Rerun `npm run build` outside the sandbox when the failure is `@tailwindcss/oxide-win32-x64-msvc` or `spawn EPERM`.
- Runtime manual checks require live configured API, MongoDB, and MariaDB.

## Verification note
- This file lists available commands; run status is tracked in session note and report.
