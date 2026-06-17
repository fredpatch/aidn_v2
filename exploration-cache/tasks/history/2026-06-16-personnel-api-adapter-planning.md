# Personnel API Adapter Planning

Date: 2026-06-16
Type: planning
Status: Complete - no implementation

See summary:

- `exploration-cache/tasks/summaries/2026-06-16-personnel-api-adapter-planning.md`

## Outcome

Planned a narrow adapter-based migration from direct MariaDB personnel lookup to an external SI-ANAC personnel API, with MariaDB retained for local use and rollback.

## Next step

Implement `PERSONNEL-API-1`: env source selection + `PersonnelApiAdapter` + docs/cache update + API build/typecheck.
