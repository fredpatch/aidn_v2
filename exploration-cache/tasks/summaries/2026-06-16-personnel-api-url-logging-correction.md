# Personnel API URL Logging Correction

Date: 2026-06-16
Type: correction
Status: Complete - API typecheck PASS, API build PASS

## Objective

Simplify `ApiPersonnelAdapter` so the outgoing ANAC Personnel API URL is formed explicitly and logged for runtime debugging.

## Source files inspected

- `apps/api/src/modules/personnel/api-personnel.adapter.ts`

## Files changed

- `apps/api/src/modules/personnel/api-personnel.adapter.ts`
- `exploration-cache/tasks/summaries/2026-06-16-personnel-api-url-logging-correction.md`

## Implementation details

- Removed hidden Axios `baseURL` client behavior.
- Added `apiBaseUrl` and `buildUrl(path, params)`.
- `getJson` now logs:
  - `[personnel-api] GET <full url>`
  - `[personnel-api] <status> <full url>`
- Search now logs record counts after parsing:
  - raw records extracted
  - mapped personnel identities
  - returned page size
- API key is sent in headers but not logged.

## Verification commands run

- `npm run typecheck` in `apps/api` - PASS
- `npm run build` in `apps/api` - PASS

## Manual checks

Not run.

## Next step

Run app search and inspect server logs for the exact ANAC URL and mapping counts.
