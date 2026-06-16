# Backend Initialization - 2026-05-17

## Scope
- Initialized `apps/api` as the AIDN modular monolith backend.
- Added TypeScript, Express, MongoDB/Mongoose, JWT/session scaffolding, and seed tooling.
- Added core Mongoose model files for the MVP domain collections.
- Added minimal endpoints for health, current user, personnel lookup, internal account activation, organizations, and account requests.
- Added a narrow bootstrap login endpoint so the seeded first admin can obtain a token before personnel-backed accounts are activated.

## Commands
- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Seed
- `cd apps/api`
- `npm run seed:bootstrap-admin`
- Bootstrap token endpoint: `POST /api/v1/auth/bootstrap/login`

## Important environment variables
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGIN`
- `BOOTSTRAP_ADMIN_FULL_NAME`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `MOCK_PERSONNEL_ENABLED`

## TODO
- Replace mock personnel adapter with official MySQL/SIGEM adapter.
- Add file storage adapter for local storage first, then production storage.
- Add DG orientation to dossier-opening transaction service.
- Wire admin frontend API mode to backend routes after endpoint contracts are approved.
