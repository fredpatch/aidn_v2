# Personnel API Adapter Implementation

Date: 2026-06-16
Type: implementation
Status: Complete - API typecheck PASS, API build PASS

See summary:

- `exploration-cache/tasks/summaries/2026-06-16-personnel-api-adapter-implementation.md`

## Outcome

Implemented `PERSONNEL_SOURCE=api|maria|mock`, added `PersonnelApiAdapter`, preserved `personnelId = matricule` compatibility, and made MariaDB initialize only in Maria source mode.

## Verification

- `npm install` in `apps/api` - PASS after approved networked install
- `npm run typecheck` in `apps/api` - PASS
- `npm run build` in `apps/api` - PASS

## Next step

Configure real Personnel API env values and smoke-test admin personnel search, internal account activation, and internal login.
