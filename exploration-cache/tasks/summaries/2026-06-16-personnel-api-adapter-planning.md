# Personnel API Adapter Planning

Date: 2026-06-16
Type: planning
Status: Complete - no implementation

## Objective

Plan adaptation from direct MariaDB personnel lookup to an external read-only SI-ANAC personnel API, while keeping the MariaDB adapter available for local use and rollback.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/04-backend/personnel-mariadb-adapter.md`
- `exploration-cache/04-backend/BACKEND_ARCHITECTURE.md`
- `exploration-cache/04-backend/AUTH_AND_ACCESS.md`
- `exploration-cache/04-backend/API_ROUTES.md`

## Source files inspected

- `note.md`
- `apps/api/src/modules/personnel/personnel.service.ts`
- `apps/api/src/modules/personnel/personnel.types.ts`
- `apps/api/src/modules/personnel/maria-personnel.adapter.ts`
- `apps/api/src/modules/personnel/mock-personnel.adapter.ts`
- `apps/api/src/shared/config/env.ts`
- `apps/api/src/shared/database/maria.datasource.ts`
- `apps/api/.env.example`
- Narrow references in `auth.service.ts`, `admin.service.ts`, and `admin.routes.ts`

## Files changed

None in product code.

Cache files changed:

- `exploration-cache/tasks/summaries/2026-06-16-personnel-api-adapter-planning.md`
- `exploration-cache/tasks/history/2026-06-16-personnel-api-adapter-planning.md`
- `exploration-cache/tasks/current-task.md`

## Current findings

- Personnel access already goes through `PersonnelAdapter`, so the API migration can be implemented as a new adapter without changing auth/admin business flow.
- `loginInternalUser` checks existence through `personnelAdapter.getPersonnelByMatricule`, then validates AIDN local account/password. It does not validate passwords against the official source.
- Admin personnel search uses `personnelAdapter.searchPersonnel`.
- Existing adapter selection is boolean-driven: `OFFICIAL_PERSONNEL_DB_ENABLED=true` chooses MariaDB; otherwise mock may be used.
- MariaDB initialization is still tied to `OFFICIAL_PERSONNEL_DB_*` env variables and provisions `employee_directory`.

## Recommended implementation plan

1. Add a source enum in env, for example `PERSONNEL_SOURCE=api|maria|mock`, with conservative compatibility for current flags.
2. Add `PersonnelApiAdapter` implementing the existing `PersonnelAdapter` interface.
3. Map external API responses to existing `PersonnelIdentity` fields.
4. Add API env config: base URL, API key, timeout, optional retry count.
5. Update `personnel.service.ts` adapter selection:
   - production should use `PERSONNEL_SOURCE=api`
   - local should use `PERSONNEL_SOURCE=maria` or `mock`
   - rollback can be done by changing env back to `maria`
6. Decouple MariaDB initialization from API mode so production API mode does not require MariaDB config.
7. Update `.env.example` and cache docs.
8. Verify API typecheck/build and smoke-test search/login flows in each configured source.

## Key decisions

- Keep the `PersonnelAdapter` contract unchanged for the first pass.
- Do not change internal login semantics: official personnel source confirms existence only; AIDN local account status and local password remain authoritative.
- Prefer explicit `PERSONNEL_SOURCE` over expanding the meaning of `OFFICIAL_PERSONNEL_DB_ENABLED`.
- Keep MariaDB adapter intact for rollback and local continuity.

## Verification commands run

None - planning only.

## Manual checks

Not run - planning only.

## Known risks / TODOs

- The external API payload shape must be confirmed before implementation.
- Need to decide whether API `id` and `matricule` are always numeric and whether AIDN should keep leading-zero matricules.
- Need to decide timeout/retry behavior for login path; fail closed is safer than allowing unknown personnel.
- Avoid logging API keys or query strings containing personnel search terms.

## Next step

Implement `PERSONNEL-API-1`: env source selection + `PersonnelApiAdapter` + docs/cache update + API build/typecheck.
