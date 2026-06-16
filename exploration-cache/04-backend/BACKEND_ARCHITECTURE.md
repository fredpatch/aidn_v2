# Backend Architecture

Last reviewed: 2026-05-17

## Reality in this workspace
- `apps/api` now contains the first AIDN backend foundation.
- The backend is a modular monolith using Node.js, TypeScript, Express, MongoDB, and Mongoose.
- The current slice initializes core models and admin/auth scaffolding only; full workflow transitions are intentionally out of scope.

## What exists
- Frontend API client helper: apps/admin/src/lib/api/client.ts
- DATA_MODE switch: apps/admin/src/lib/data/data-mode.ts
- API URL env var placeholder: VITE_API_BASE_URL
- API bootstrap: apps/api/src/app.ts and apps/api/src/server.ts
- MongoDB connection: apps/api/src/shared/database/mongoose.ts
- Environment config: apps/api/src/shared/config/env.ts
- Error handling: apps/api/src/shared/errors/
- Auth/permission scaffolding: apps/api/src/shared/guards/ and apps/api/src/shared/permissions/
- Official personnel DB abstraction with mock implementation: apps/api/src/modules/personnel/
- Bootstrap admin seed script: apps/api/src/scripts/seed-bootstrap-admin.ts

## Current backend shape
- `modules/auth`: current user and internal personnel login foundation.
- `modules/admin`: personnel search, internal account activation, organizations, account requests.
- `modules/users`: local AIDN user mirror plus internal account activation records.
- `modules/organizations`: canonical organizations and organization members.
- `modules/account-requests`, `requests`, `courriers`, `dg-reviews`, `dossiers`, `oma-phases`, `documents`, `document-templates`, `meetings`, `notifications`, `audit`: Mongoose model layer.

## Boundary
- Internal ANAC users are not self-registered and no internal staff password is stored locally.
- Internal login is designed as `matricule + password -> official personnel adapter -> AIDN activation -> session`.
- Postulant organization names from registration remain raw until approval links or creates a canonical organization.
- A DN dossier remains distinct from an initial request and is opened only after favorable DG orientation toward DN.
