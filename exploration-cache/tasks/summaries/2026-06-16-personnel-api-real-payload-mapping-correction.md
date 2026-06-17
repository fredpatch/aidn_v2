# Personnel API Real Payload Mapping Correction

Date: 2026-06-16
Type: correction
Status: Complete - API typecheck PASS, API build PASS

## Objective

Fix API-backed personnel search mapping after raw logs showed the real ANAC payload shape.

## Source files inspected

- `apps/api/src/modules/personnel/api-personnel.adapter.ts`
- Runtime raw payload for `q=michel`

## Files changed

- `apps/api/src/modules/personnel/api-personnel.adapter.ts`

## Implementation details

- `toIdentity` now maps:
  - `identity.matricule` -> normalized `matricule` / `personnelId`
  - `identity.firstName` + `identity.lastName` -> `fullName`
  - `organization.service.name` / `abbreviation` -> `service`
  - `organization.direction.name` -> `direction`
  - `organization.function.name` -> `fonction`
- Direction/service/function labels collapse repeated whitespace.

## Verification commands run

- `npm run typecheck` in `apps/api` - PASS
- `npm run build` in `apps/api` - PASS

## Manual checks

Not rerun in browser in this session. Expected runtime result for the logged `michel` payload: `records=2 mapped=2 returned=2`.

## Next step

Rerun admin personnel search and confirm mapped count is no longer zero.
