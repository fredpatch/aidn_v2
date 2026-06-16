# OMA-FORMAL-9C1 - Phase 2 Phase 1 Visual Sync Implementation

Date: 2026-05-27
Status: **Complete - Admin typecheck PASS, Admin build PASS**

## Objective

Make Phase 2 - Demande formelle visually follow the Phase préliminaire guided workspace pattern more closely, while keeping the guided `Prochaine action` card and avoiding backend/portal/business-rule changes.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b2-phase-2-workflow-cleanup.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9c-guided-action-card-phase2.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseChecklist.tsx`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`

## Files changed

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/manifest.json`

## Files created

- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9c1-phase-2-phase-1-visual-sync-implementation.md`
- `exploration-cache/tasks/history/2026-05-27-oma-formal-9c1-phase-2-phase-1-visual-sync.md`

## Key decisions

- Keep the edit narrow in `FormalRequestPhaseWorkspace.tsx`.
- Do not create a reusable phase layout abstraction yet.
- Keep the Phase 2 right-panel order:
  1. Header / metadata
  2. Courrier formel
  3. Réunion formelle
  4. Documents de demande formelle
  5. Prochaine action
- Keep the left progression checklist as the workflow checklist.
- Keep `Circuit officiel` as metadata only.

## Implementation details

- Replaced the per-section `WorkflowSection` full cards with lightweight `DetailSection` groups inside one main workspace card.
- Kept `Courrier formel` full-width because it explains the formal request source and gate.
- Placed `Réunion formelle` and `Documents de demande formelle` in a responsive `xl:grid-cols-2` row.
- Kept the guided `Prochaine action` card as the final right-panel block.
- Added `startedAtDisplay = phaseRecord?.startedAt ?? state.gate.receivedAt` so `Démarrée le` no longer shows `Non renseigné` when the formal request reception date is available.
- Rewrote visible Phase 2 strings in this file with correct UTF-8 French labels.

## Verification commands run

```bash
cd apps/admin
npx tsc --noEmit
npm run build
```

## Verification results

- `npx tsc --noEmit`: PASS.
- `npm run build`: first in-sandbox run failed with known Windows Tailwind/Vite native binary `@tailwindcss/oxide-win32-x64-msvc` / `spawn EPERM`.
- `npm run build` outside sandbox: PASS.
- Vite large chunk warning remains.

## Manual checks

Not run; no live admin/API browser session in this pass.

## Known risks / TODOs

- Runtime visual validation still needed against the two screenshots / live app.
- The fallback start date is a display fix; if the product requires a persisted formal phase start date, backend data should be fixed separately.
- A reusable phase layout component remains a good later cleanup once Phase 2 stabilizes.

## Next step

Browser validation of Phase 2 visual alignment with Phase préliminaire.
