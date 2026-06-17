# Personnel API List Endpoint Integration

Date: 2026-06-17
Type: correction
Status: Complete - API typecheck/build PASS, admin typecheck PASS

## Objective

Use the new ANAC Personnel API list endpoint so the admin Personnel page can load a paginated table before the user searches.

## Source files inspected

- `apps/api/src/modules/personnel/api-personnel.adapter.ts`
- `apps/admin/src/pages/PersonnelPage.tsx`

## Files changed

- `apps/api/src/modules/personnel/api-personnel.adapter.ts`
- `apps/admin/src/pages/PersonnelPage.tsx`

## Implementation details

- Blank or one-character personnel search now calls:
  - `GET /personnel?page=<page>&limit=<limit>`
- Two-character-or-longer search still calls:
  - `GET /personnel/search?q=<term>&limit=<remoteLimit>`
- Search mode still slices locally because the search endpoint has no documented `page` parameter.
- List mode does not locally skip because the ANAC list endpoint is expected to paginate.
- `extractList` now reads totals from `meta.total`, `meta.count`, and related fields.
- Admin Personnel initial state now says `Chargement du personnel` instead of asking the user to search.

## Verification commands run

- `npm run typecheck` in `apps/api` - PASS
- `npm run build` in `apps/api` - PASS
- `npx tsc --noEmit` in `apps/admin` - PASS

## Manual checks

Not run in browser.

## Next step

Runtime-check `/admin/personnel` initial load and confirm server logs show `GET .../api/v1/personnel?page=1&limit=5`.
