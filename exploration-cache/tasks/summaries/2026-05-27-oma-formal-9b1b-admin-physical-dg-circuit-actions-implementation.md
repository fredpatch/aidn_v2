# OMA-FORMAL-9B1B - Admin Phase 2 Physical DG Circuit Actions Implementation

Date: 2026-05-27
Status: **Complete - Admin typecheck PASS, Admin build PASS**

## Objective

Implement admin Phase 2 action wording and flow corrections so AIDN records the physical DG/parapheur process after a formal request courrier exists, while showing admin formal courrier upload only as an outside-portal fallback.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/tasks/current-task.md`
- latest `exploration-cache/tasks/summaries/*oma-formal*`

## Source files inspected

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/preliminary-dialogs.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/lib/utils/error.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`

## Files changed

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/manifest.json`

## Files created

- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1b-admin-physical-dg-circuit-actions-implementation.md`
- `exploration-cache/tasks/history/2026-05-27-oma-formal-9b1b-admin-physical-dg-circuit-actions.md`

## API client additions

None. Reused existing admin client functions:

- `uploadFormalRequestCourrier`
- `sendFormalRequestToDg`
- `recordFormalRequestDgReturn`
- `recordFormalRequestDgDecision`

## UI wording corrections

- Missing gate message: `En attente du dépôt de la demande formelle par le postulant.`
- Admin fallback action/dialog: `Scanner / enregistrer un courrier reçu hors portail`.
- Fallback helper added exactly for outside-portal physical/internal receipt.
- `portal_upload` source now displays as `Téléversé par le postulant`.
- DG circuit helper now describes printing and placing the courrier in the physical DG/parapheur circuit.
- DG return action: `Enregistrer le retour DG scanné`.
- DG decision action: `Enregistrer la décision DG`.

## Actions wired

- Outside-portal fallback still posts multipart `file` with admin source `physical_deposit|internal_scan` to `/courrier`.
- `Mettre en circuit DG` still posts to `/send-to-dg` and remains enabled only from backend `canSendToDg`.
- `Enregistrer le retour DG scanné` posts only to `/dg-return`.
- `Enregistrer la décision DG` posts only to `/dg-decision`.

## Business rules preserved

- Admin never sends `portal_upload`.
- Portal upload remains the normal formal request path.
- Admin upload is secondary fallback only.
- Supporting documents remain tracking-only and do not block DG circuit placement.
- No backend changes.
- No portal changes.

## Verification commands run

```bash
cd apps/admin
npx tsc --noEmit
npm run build
```

## Verification results

- `npx tsc --noEmit`: PASS.
- `npm run build`: first in-sandbox run failed with the known Windows Tailwind/Vite native binary `@tailwindcss/oxide-win32-x64-msvc` / `spawn EPERM` issue.
- `npm run build` outside sandbox: PASS.
- Build warning: Vite large chunk warning remains.

## Manual checks

Not run; no live browser/API session in this pass.

## Known risks / TODOs

- Runtime validation still needs a live admin session and Phase 2 dossier.
- Role permissions may hide actions for users lacking `DOCUMENT_UPLOAD_INTERNAL`, `DG_CIRCUIT_HANDLE`, or `DG_DECISION_RECORD`.
- The read model does not expose detailed DG review metadata, so the UI intentionally does not invent it.

## Next step

Runtime browser/API validation of missing-gate fallback, portal-upload source display, physical DG placement, DG return scan, and DG decision recording.
