# Personnel Admin Blank Search UI Correction

Date: 2026-06-16
Type: correction
Status: Complete - admin typecheck PASS

## Objective

Avoid showing a misleading empty personnel table before the user searches, because the ANAC Personnel API requires `q` to contain at least 2 characters and does not expose a documented list-all endpoint.

## Source files inspected

- `apps/admin/src/pages/PersonnelPage.tsx`
- `apps/admin/src/lib/api/admin.api.ts`
- `apps/api/src/modules/personnel/api-personnel.adapter.ts`

## Files changed

- `apps/admin/src/pages/PersonnelPage.tsx`

## Implementation details

- Added `hasSearched` UI state.
- Blank or one-character non-mock search now clears results locally and shows guidance instead of calling the backend.
- Initial page load shows: `Saisissez au moins 2 caracteres pour rechercher`.
- Empty result after a real search still shows `Aucun personnel trouve.`

## Verification commands run

- `npx tsc --noEmit` in `apps/admin` - PASS

## Manual checks

Not run in browser.

## Known risks / TODOs

- If ANAC later exposes a true list endpoint, the initial page can be changed to call that endpoint.

## Next step

Browser-check `/admin/personnel`: initial prompt, then search `michel` and verify rows appear.
