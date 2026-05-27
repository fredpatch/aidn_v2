# OMA-FORMAL-9B1A - Portal Phase 2 Formal Request Upload Implementation

Date: 2026-05-27
Status: **Complete - Portal typecheck PASS, Portal build PASS, API typecheck PASS, API build PASS**

## Objective

Implement the postulant-facing Phase 2 formal request courrier upload from the portal.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1a-portal-formal-request-upload-planning.md`

## Source files inspected

- `apps/portal/src/pages/RequestDetailPage.tsx`
- `apps/portal/src/pages/MyRequestsPage.tsx`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/lib/api/http.ts`
- `apps/portal/src/lib/routes.ts`
- `apps/api/src/modules/portal/portal.routes.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`

## Files changed

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1a-portal-formal-request-upload-implementation.md`
- `exploration-cache/tasks/history/2026-05-27-oma-formal-9b1a-portal-formal-request-upload.md`
- `exploration-cache/manifest.json`

## Key decisions

- Added a portal-safe `formalRequest` block to `getPortalDossier` because the previous portal read model did not expose whether the formal request gate was missing.
- Kept upload source server-owned: portal never sends or selects a source; the route hardcodes `source=portal_upload`.
- Used the existing `Actions requises` tab and portal form/toast patterns.
- Kept internal DG return/decision controls and source choices out of the portal UI.

## Implementation details

- `getPortalDossier` now returns:
  - `formalRequest.status`
  - `formalRequest.portalLabel`
  - `formalRequest.hasFormalRequestCourrier`
  - `formalRequest.canUploadFormalRequestCourrier`
- `portal.api.ts` now includes:
  - `PortalDossierFormalRequest`
  - `uploadFormalRequestCourrier(dossierId, formData)`
- `RequestDetailPage` now:
  - marks the `Actions requises` tab when the formal courrier gate is missing;
  - shows a portal action card with `Déposer la demande formelle`;
  - accepts a PDF file and optional notes;
  - posts multipart `file` plus optional `notes`;
  - refreshes the dossier detail and shows success toast after upload;
  - shows `Demande formelle déposée - en traitement par l'ANAC` when already deposited.

## Verification commands run

```bash
cd apps/portal
npx tsc --noEmit
npm run build

cd apps/api
npx tsc --noEmit
npm run build
```

Results:

- Portal `npx tsc --noEmit` - PASS.
- Portal `npm run build` - initial sandbox run failed on the known Vite/Tailwind Windows native binary issue; outside-sandbox rerun PASS.
- API `npx tsc --noEmit` - PASS.
- API `npm run build` - PASS.

## Manual checks

Not run; no live portal/API session in this pass.

## Known risks / TODOs

- Runtime validation still needs a live postulant session and a dossier where Phase 1 is closed.
- The upload UI is an inline action panel in the existing `Actions requises` tab, matching existing portal patterns rather than introducing a new modal primitive.
- Admin gate-present confirmation must be checked manually after a live portal upload.

## Next step

Run manual portal/API checks for the Phase 2 formal request upload flow.
