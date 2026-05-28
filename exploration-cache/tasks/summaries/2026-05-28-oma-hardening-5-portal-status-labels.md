# OMA-HARDENING-5 - Portal Status Labels Implementation

Date: 2026-05-28
Status: Complete - API PASS, Portal PASS

## Objective

Harmonize portal-facing Phase 1 and Phase 2 status labels plus Actions requises wording before Phase 3, without changing workflow rules, admin workflow, document upload/review rules, closure logic, or starting Phase 3.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-14-portal-phase-2-documents-implementation.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-15-consultation-only-documents-implementation.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-17-block-closure-until-documents-deposited.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-5-portal-status-labels-planning.md`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`
- `apps/portal/src/pages/MyRequestsPage.tsx`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/components/RequestStatusBadge.tsx`

## Files changed

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/manifest.json`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-5-portal-status-labels.md`
- `exploration-cache/tasks/history/2026-05-28-oma-hardening-5-portal-status-labels.md`

## Key decisions

- Kept this pass display-only: no workflow rules, admin workflow, upload/review rules, closure logic, or Phase 3 changes.
- Harmonized Phase 1 portal labels to simple ANAC-facing wording.
- Extended Phase 2 formal request labels by status and removed the `hasFormalRequestCourrier` override that forced every received formal request to display as `Demande formelle déposée`.
- Kept `MyRequestsPage` unchanged because it renders request-level `portalStatusLabel`, not Phase 2 formal dossier labels.
- Did not alter initial request physical-deposit location choices even though that older UI still contains a `DG` option; that is outside this Phase 1/Phase 2 label slice.

## Implementation details

- `PRELIMINARY_STATUS_PORTAL_LABELS` now uses:
  - `En cours de traitement par l'ANAC`
  - `Rendez-vous programmé`
  - `Formulaire de pré-évaluation à compléter`
  - `En cours d'examen`
  - `Phase préliminaire clôturée`
- `FORMAL_REQUEST_PORTAL_LABELS` now maps formal statuses to:
  - `Demande formelle attendue`
  - `Demande formelle reçue`
  - `Demande formelle en cours d'examen`
  - `Réunion formelle programmée`
  - `Documents de demande formelle à compléter`
  - `En attente de finalisation par l'ANAC`
  - `Action requise`
  - `Phase de demande formelle clôturée`
- `getPortalDossier` now falls back to `Demande formelle reçue` only when the formal request courrier exists but status mapping is missing.
- `RequestDetailPage` guidance map was extended for the new labels.
- Formal request upload action copy now avoids `DG`/`circuit` wording.
- Phase 2 documents action copy now uses the approved neutral wording for requested pieces and available templates.
- The gate-present green state now renders `formalRequest.portalLabel` instead of a stale hardcoded sentence.

## Verification commands run

- `cd apps/api; npx tsc --noEmit` - PASS
- `cd apps/api; npm run build` - PASS
- `cd apps/portal; npx tsc --noEmit` - PASS
- `cd apps/portal; npm run build` - initial sandbox run failed due Windows Tailwind/Vite native binary loading; outside-sandbox rerun PASS

## Manual checks run

- Not run in browser.
- Source-level check confirmed Phase 2 action copy no longer says `circuit officiel DG`.

## Known risks / TODOs

- Full manual portal validation still needs a live API with dossiers at each Phase 1/Phase 2 state.
- Existing initial request physical-deposit location UI still includes a `DG` location option; this pass intentionally did not alter request submission choices.

## Next step

Proceed to the next hardening slice only when requested.
