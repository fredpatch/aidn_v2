# Personnel API Adapter Implementation

Date: 2026-06-16
Type: implementation
Status: Complete - API typecheck PASS, API build PASS

## Objective

Implement the planned personnel source adaptation so production can use the external read-only SI-ANAC Personnel API while MariaDB remains available for local/rollback use.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/04-backend/personnel-mariadb-adapter.md`
- `exploration-cache/tasks/summaries/2026-06-16-personnel-api-adapter-planning.md`

## Source files inspected

- `schema.json`
- `personnel_anac.json`
- `direction.json`
- `apps/api/src/modules/personnel/personnel.service.ts`
- `apps/api/src/modules/personnel/personnel.types.ts`
- `apps/api/src/modules/personnel/maria-personnel.adapter.ts`
- `apps/api/src/modules/personnel/mock-personnel.adapter.ts`
- `apps/api/src/modules/personnel/personnel-email.ts`
- `apps/api/src/shared/config/env.ts`
- `apps/api/src/shared/database/maria.datasource.ts`
- `apps/api/src/modules/admin/admin.service.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/.env.example`

## Files changed

- NEW: `apps/api/src/modules/personnel/api-personnel.adapter.ts`
- MOD: `apps/api/src/modules/personnel/personnel.service.ts`
- MOD: `apps/api/src/shared/config/env.ts`
- MOD: `apps/api/src/shared/database/maria.datasource.ts`
- MOD: `apps/api/src/modules/admin/admin.service.ts`
- MOD: `apps/api/.env.example`
- MOD: `exploration-cache/04-backend/personnel-mariadb-adapter.md`
- MOD: `exploration-cache/tasks/current-task.md`

## Key decisions

- `PERSONNEL_SOURCE=api|maria|mock` is now the explicit adapter selector.
- Legacy flags remain compatible when `PERSONNEL_SOURCE` is omitted:
  - `OFFICIAL_PERSONNEL_DB_ENABLED=true` maps to `maria`
  - otherwise `MOCK_PERSONNEL_ENABLED !== false` maps to `mock`
- `PersonnelApiAdapter` keeps `personnelId` equal to normalized matricule to avoid breaking existing AIDN internal accounts.
- Numeric `numat` values are normalized with leading zeros, for example `161 -> 0161`.
- MariaDB initialization now runs only when `PERSONNEL_SOURCE=maria`.
- Internal login behavior is unchanged: personnel source confirms existence only; local AIDN account/password remain authoritative.

## Implementation details

- `PersonnelApiAdapter` calls:
  - `GET /api/v1/personnel/search?q=<text>&limit=<n>`
  - `GET /api/v1/personnel/matricule/:matricule`
- API key header is `x-api-key`.
- Adapter accepts either direct JSON payloads or `{ data: ... }` / `{ items: ... }` envelopes.
- Records are mapped from SI-ANAC fields such as `numat`, `prenag`, `nomag`, `direction`, `libdirec`, `fonction`, and `libfct`.
- The legacy `/admin/si-users` helper now reads through `personnelAdapter` instead of direct MariaDB.

## Verification commands run

- `npm install` in `apps/api` - PASS after approved networked install
- `npm run typecheck` in `apps/api` - PASS
- `npm run build` in `apps/api` - PASS

## Manual checks

Not run. Runtime Personnel API URL/key were not provided in local env.

## Known risks / TODOs

- External API runtime smoke test remains pending with real `PERSONNEL_API_BASE_URL` and `PERSONNEL_API_KEY`.
- API search endpoint supports `limit` but no `page`; adapter fetches up to `page * limit` capped at 50 and slices locally.
- `idpersonnel` is not stored as `personnelId` yet to preserve compatibility with accounts created when `personnelId = matricule`.
- `npm install` reported one high severity audit item; no dependency changes were made beyond restoring installed packages.

## Next step

Configure `PERSONNEL_SOURCE=api`, `PERSONNEL_API_BASE_URL`, and `PERSONNEL_API_KEY` in a runtime env, then smoke-test:

1. Admin personnel search
2. Internal account activation
3. Internal login for an activated matricule
