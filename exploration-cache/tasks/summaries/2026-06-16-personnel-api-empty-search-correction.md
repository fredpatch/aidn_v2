# Personnel API Empty Search Correction

Date: 2026-06-16
Type: correction
Status: Complete - API typecheck PASS, API build PASS

## Objective

Fix admin personnel search returning 500 when the admin UI calls `GET /api/v1/admin/personnel?search=&page=1&limit=5` while `PERSONNEL_SOURCE=api`.

## Source files inspected

- `apps/api/src/modules/personnel/api-personnel.adapter.ts`
- Runtime error report from admin personnel search
- `note.md` API contract: personnel search requires `q` with at least 2 characters

## Files changed

- `apps/api/src/modules/personnel/api-personnel.adapter.ts`

## Implementation details

- `ApiPersonnelAdapter.searchPersonnel` now returns an empty result without calling the external gateway when `params.search.trim().length < 2`.
- This prevents the external API `400` from surfacing as an AIDN admin `500` during initial blank search.

## Verification commands run

- `npm run typecheck` in `apps/api` - PASS
- `npm run build` in `apps/api` - PASS

## Manual checks

Not run in browser. Expected behavior: blank admin personnel search returns `{ items: [], total: 0, page, limit }`.

## Known risks / TODOs

- API-backed admin personnel list no longer shows all personnel on blank search because the external gateway does not support blank `q`.
- UI may need a small empty-state copy update if users expect initial listing.

## Next step

Runtime smoke-test `GET /api/v1/admin/personnel?search=&page=1&limit=5` and a two-character search against the configured Personnel API.
