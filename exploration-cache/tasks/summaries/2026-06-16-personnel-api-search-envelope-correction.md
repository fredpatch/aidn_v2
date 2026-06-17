# Personnel API Search Envelope Correction

Date: 2026-06-16
Type: correction
Status: Complete - API typecheck PASS, API build PASS

## Objective

Fix API-backed personnel search returning no results when the external gateway returns a response envelope that differs from the first adapter assumption.

## Source files inspected

- `apps/api/src/modules/personnel/api-personnel.adapter.ts`
- User-provided successful URL: `GET /api/v1/personnel/search?q=vanecia&limit=20`

## Files changed

- `apps/api/src/modules/personnel/api-personnel.adapter.ts`

## Implementation details

- Search response parsing now supports:
  - raw arrays
  - `{ data: [...] }`
  - `{ items: [...] }`
  - `{ results: [...] }`
  - `{ personnel: [...] }`
  - `{ data: { items/results/data/personnel: [...] } }`
- Nested official-source labels are mapped when present:
  - `direction_anac.libdirec`
  - `fonction_anac.libfct`
  - `service_anac.libserv`
- Existing numeric `numat` normalization remains unchanged.

## Verification commands run

- `npm run typecheck` in `apps/api` - PASS
- `npm run build` in `apps/api` - PASS

## Manual checks

Authenticated runtime call was not run because the local shell does not have `PERSONNEL_API_KEY`.

## Known risks / TODOs

- If the gateway uses a different record field for matricule than `numat` or `matricule`, paste one successful JSON payload and update the mapper.

## Next step

Runtime-test admin personnel search with `search=vanecia`.
