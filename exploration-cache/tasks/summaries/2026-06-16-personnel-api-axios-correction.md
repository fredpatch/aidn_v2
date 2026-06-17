# Personnel API Axios Correction

Date: 2026-06-16
Type: correction
Status: Complete - API typecheck PASS, API build PASS

## Objective

Switch `ApiPersonnelAdapter` from native `fetch` to Axios and make the outgoing ANAC Personnel API request shape easier to control.

## Source files inspected

- `apps/api/src/modules/personnel/api-personnel.adapter.ts`
- `apps/api/package.json`

## Files changed

- `apps/api/src/modules/personnel/api-personnel.adapter.ts`
- `apps/api/package.json`
- `apps/api/package-lock.json`
- `exploration-cache/tasks/summaries/2026-06-16-personnel-api-axios-correction.md`
- `exploration-cache/tasks/current-task.md`

## Implementation details

- Added `axios` dependency.
- `ApiPersonnelAdapter` now creates one Axios client with:
  - `baseURL`: `PERSONNEL_API_BASE_URL` + `PERSONNEL_API_PREFIX`, unless base URL already includes the prefix
  - `timeout`: `PERSONNEL_API_TIMEOUT_MS`
  - `x-api-key`: `PERSONNEL_API_KEY`
- Search calls are shaped in `ApiPersonnelAdapter.searchPersonnel`:
  - path: `/personnel/search`
  - params: `{ q: search, limit: remoteLimit }`

## Verification commands run

- `npm install axios` in `apps/api` - PASS after approved networked install
- `npm run typecheck` in `apps/api` - PASS
- `npm run build` in `apps/api` - PASS

## Manual checks

Not run against the authenticated ANAC API in this shell.

## Known risks / TODOs

- If app search still returns empty, inspect the successful ANAC JSON response body and adjust `toIdentity` / `extractList`.

## Next step

Runtime-test `GET /api/v1/admin/personnel?search=vanecia&page=1&limit=5`.
