# OMA-FORMAL-9B1A - Portal Phase 2 Formal Request Upload

Date: 2026-05-27
Status: **Complete**

## Result

Portal users can now upload the Phase 2 formal request courrier from the existing request detail `Actions requises` tab when Phase 1 is closed and the formal courrier gate is missing.

## Files changed

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`
- cache documentation files

## Verification

- Portal `npx tsc --noEmit`: PASS
- Portal `npm run build`: PASS after outside-sandbox rerun for the known Vite/Tailwind Windows native binary issue
- API `npx tsc --noEmit`: PASS
- API `npm run build`: PASS

## Notes

- Portal route still hardcodes `source=portal_upload`.
- Portal UI does not expose source selection, internal scan, physical deposit, DG decision, or DG return controls.
- Supporting documents remain separate from the formal request gate.
