# OMA-FORMAL-9A Adjustment - Align Phase 2 with Phase 1 Workflow UI

Date: 2026-05-27
Status: **Complete - Admin typecheck PASS, Admin build PASS**

## Objective

Adjust the Phase 2 admin workspace so it follows the same visual and workflow structure as the existing Phase préliminaire screen.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseChecklist.tsx`

## Files changed

- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`

## Files created

- `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseChecklist.tsx`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9a-phase-1-alignment-implementation.md`
- `exploration-cache/tasks/history/2026-05-27-oma-formal-9a-phase-1-alignment.md`

## Key decisions

- Lifted Phase 2 read-state loading into `DossierPhasesTab` so the left progression card and right workspace share one API state.
- Added Phase 2 progression based only on the formal request read model.
- Refactored the right workspace into chronological sections matching the Phase 1 workflow style.
- Kept supporting documents as a tracking-only section, not as a blocking gate.
- Removed the dashboard-like two-column summary layout from the Phase 2 workspace.
- Did not add portal UI, backend changes, mutation dialogs, fake data, or download buttons.

## Implementation details

- Added `getFormalRequestProgress(state)` with the required seven steps:
  1. Courrier de demande formelle reçu
  2. Demande formelle transmise au circuit DG
  3. Retour DG enregistré
  4. Réunion formelle programmée
  5. Réunion formelle tenue
  6. Courrier de recevabilité / clôture joint
  7. Phase 2 clôturée
- Added `FormalRequestPhaseChecklist`, mirroring the compact/full checklist behavior used by Phase 1.
- Updated `DossierPhasesTab`:
  - fetches `getAdminFormalRequestPhase(dossierId)` when `formal_request` is selected
  - renders Phase 2 done count/current step/checklist in "Progression phase active"
  - passes shared loading/error/state into `FormalRequestPhaseWorkspace`
- Refactored `FormalRequestPhaseWorkspace` sections:
  - header metadata via `DefinitionGrid`
  - Courrier formel
  - Circuit DG
  - Réunion formelle
  - Documents de demande formelle
  - Recevabilité et clôture
  - Statut final/next action card

## Verification commands run

```
cd apps/admin
npx tsc --noEmit
npm run build
```

Results:

- `npx tsc --noEmit` - PASS
- First `npm run build` - failed in sandbox with known `@tailwindcss/oxide-win32-x64-msvc` / `spawn EPERM` issue.
- Escalated `npm run build` rerun - PASS.

## Manual checks run

Not run; no live admin/API server in this pass.

## Known risks / TODOs

- Runtime browser/API validation is still pending.
- Header fields for DG send/return show state markers, not dates, because the current frontend read type does not expose exact sent/returned timestamps.
- Official reference is omitted unless later exposed by the read model; raw IDs are not displayed as business references.

## Next step

Run a live browser/API validation of the Phase 2 workspace, then proceed to OMA-FORMAL-9B mutation wiring if approved.
