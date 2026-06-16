# OMA-FORMAL-9B1 - Admin Phase 2 Gate + DG Action Wiring

Date: 2026-05-27
Status: **Complete**

## Result

Admin Phase 2 now wires the first mutation actions for "Demande formelle":

- register formal request courrier;
- mark the request as placed in the physical DG/parapheur circuit;
- record DG return scan and DG decision/orientation.

## Files changed

- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts`
- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
- cache documentation files

## Verification

- Admin `npx tsc --noEmit`: PASS
- Admin `npm run build`: PASS after outside-sandbox rerun for the known Vite/Tailwind Windows native binary issue

## Notes

- No backend files changed.
- No portal files changed.
- Supporting documents remain non-blocking.
- DG return/decision use confirmed formal-specific dossier routes, not hidden frontend DG review IDs.
