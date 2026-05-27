# OMA-FORMAL-9B1 - Admin Phase 2 Gate + DG Action Wiring Implementation

Date: 2026-05-27
Status: **Complete - Admin typecheck PASS, Admin build PASS**

## Objective

Implement admin action wiring for the Phase 2 formal request gate and physical DG/parapheur tracking:

- register the formal request courrier;
- mark the formal request as placed in the physical DG circuit;
- record the scanned DG return and DG decision/orientation.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1-admin-gate-dg-actions-planning.md`

## Source files inspected

- `apps/admin/src/lib/api/client.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/preliminary-dialogs.tsx`
- `apps/admin/src/pages/dossiers/components/UploadDocumentDialog.tsx`
- `apps/admin/src/components/ui/select.tsx`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/modules/dg-circuit/dg-circuit.service.ts`

## Files changed

- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts`
- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1-admin-gate-dg-actions-implementation.md`
- `exploration-cache/tasks/history/2026-05-27-oma-formal-9b1-admin-gate-dg-actions.md`
- `exploration-cache/manifest.json`

## Key decisions

- Kept Phase 2 read state owned by `DossierPhasesTab`.
- Added focused Phase 2 dialogs instead of overloading the generic upload dialog.
- Wired DG return and DG decision because formal-specific dossier routes exist and no frontend DG review ID is required.
- Kept physical DG/parapheur wording; no UI describes a digital DG send.
- Preserved supporting documents as non-blocking tracking information.

## Implementation details

- Added API client functions:
  - `uploadFormalRequestCourrier`
  - `sendFormalRequestToDg`
  - `recordFormalRequestDgReturn`
  - `recordFormalRequestDgDecision`
- Added `formal-request-dialogs.tsx` with:
  - `RegisterFormalCourrierDialog`
  - `SendFormalToDgDialog`
  - `RecordFormalDgReturnDialog`
- Updated `FormalRequestPhaseWorkspace` to show:
  - formal courrier registration when the gate is missing;
  - DG circuit placement only when backend `canSendToDg` is true;
  - DG return/decision recording after DG circuit placement and before recorded decision.
- Updated `formal-request-progress.helpers.ts` so non-approved DG decisions represented by `formal_requires_correction` still count as DG return/decision recorded.

## Verification commands run

```bash
cd apps/admin
npx tsc --noEmit
npm run build
```

Results:

- `npx tsc --noEmit` - PASS.
- `npm run build` - initial sandbox run failed on known Vite/Tailwind Windows native binary loading; outside-sandbox rerun PASS.

## Manual checks

Not run; no live admin/API session in this pass.

## Known risks / TODOs

- Runtime permission/role checks still need browser validation with live API data.
- DG return and decision are submitted sequentially from one dialog. If decision recording fails after the return scan succeeds, retrying the dialog will re-submit the return scan before retrying the decision.
- The read model does not expose formal DG review detail, so the UI does not show hidden DG review IDs or invented DG metadata.

## Next step

Run the manual Phase 2 workflow checks against a live dossier/API session, then proceed to the next approved Phase 2 slice.
