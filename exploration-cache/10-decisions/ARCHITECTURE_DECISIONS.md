# ARCHITECTURE_DECISIONS.md

Last reviewed: 2026-05-17
Source files inspected: prompt.md, TASK.md, apps/, exploration-cache/04-backend/BACKEND_ARCHITECTURE.md

## Confirmed facts
- AIDN should use a modular monolithic backend API for the MVP.
- Microservices are out of scope because AIDN workflows are tightly connected and the business rules are still being refined.
- The backend foundation lives in `apps/api`.
- The API stack is Node.js, TypeScript, Express, MongoDB, and Mongoose.
- Internal ANAC identity must be validated against an official personnel database/SIGEM-like source; AIDN stores activation, role, permissions, audit references, and mirrored identity fields only.
- The first implementation uses an adapter interface plus mock personnel adapter until a real MySQL adapter is available.

## Decisions
- `ADR-2026-05-17-01`: Use a modular monolith in `apps/api`, organized by domain modules plus shared infrastructure.
- `ADR-2026-05-17-02`: Use capability-based permission middleware backed by role-permission mappings rather than spreading role checks throughout controllers.
- `ADR-2026-05-17-03`: Keep demande/courrier and DN dossier as separate collections; dossier creation must depend on favorable DG orientation toward DN.
- `ADR-2026-05-17-04`: Treat postulant organization names from portal registration as untrusted input until account approval links or creates a canonical organization.
- `ADR-2026-05-17-05`: Internal AIDN users are activated from official personnel records only; AIDN must not store internal staff passwords.
- `ADR-2026-05-17-06`: Bootstrap admin remains a seeded setup/emergency account and should not replace personnel-backed internal login.

## Source files to inspect first
- `apps/api/src/app.ts`
- `apps/api/src/shared/permissions/permissions.ts`
- `apps/api/src/modules/personnel/personnel.types.ts`
- `apps/api/src/modules/requests/request.model.ts`
- `apps/api/src/modules/dg-reviews/dg-review.model.ts`
- `apps/api/src/modules/dossiers/dossier.model.ts`

## Known gaps
- Real official personnel MySQL adapter is not implemented yet.
- Workflow transition services are not implemented yet.
- Storage is represented by document metadata and `storageKey`; physical file storage adapter is still pending.
- Frontend is not yet wired to the backend API.

## Next update
- Add workflow services after stakeholder validation confirms transition rules and authorization boundaries.
