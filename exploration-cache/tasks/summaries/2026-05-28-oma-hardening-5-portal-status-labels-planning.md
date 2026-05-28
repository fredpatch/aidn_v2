# OMA-HARDENING-5 - Portal Status Labels Planning

Date: 2026-05-28
Status: Planning complete - awaiting approval

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

- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-5-portal-status-labels-planning.md`
- `exploration-cache/tasks/current-task.md`

## Current portal label mapping confirmed

### Phase 1 backend labels

`PRELIMINARY_STATUS_PORTAL_LABELS` currently maps:

- `preliminary_not_started`, `preliminary_started` -> `Dossier en cours de traitement`
- `first_meeting_invited` -> `Rendez-vous programmé`
- `first_meeting_held` -> `Rendez-vous tenu`
- `pre_eval_form_available` -> `Action requise - Formulaire disponible`
- `pre_eval_form_submitted`, `pre_eval_sent_to_dg`, `pre_eval_dg_decision_recorded` -> `En attente d'analyse`
- `preliminary_meeting_invited` -> `Rendez-vous préliminaire programmé`
- `preliminary_meeting_held`, `preliminary_ready_to_close` -> `Phase préliminaire en cours de clôture`
- `preliminary_closed` -> `Phase préliminaire clôturée`

### Phase 2 backend labels

`FORMAL_REQUEST_PORTAL_LABELS` currently maps many statuses to static/internal-ish wording:

- `formal_waiting_request` -> `En attente de dépôt de la demande formelle`
- `formal_request_received`, `formal_documents_tracking` -> `Demande formelle déposée`
- `formal_sent_to_dg` -> `En attente d'orientation administrative`
- most later statuses -> `En traitement par l'ANAC`
- `formal_closed` -> `En traitement par l'ANAC`

`getPortalDossier` also overrides labels: when `hasFormalRequestCourrier` is true, the label is always `Demande formelle déposée`, so Phase 2 progression stalls.

## Current Actions requises conditions confirmed

`RequestDetailPage` sets `hasActionRequired` when any of these are true:

- request status is `intake_requires_correction`
- Phase 1 `preliminary.canSubmitForm === true`
- Phase 2 `formalRequest.canUploadFormalRequestCourrier === true`
- Phase 2 expected requirement status is `missing`, `requires_correction`, `incomplete`, or `rejected`

Phase 2 document action card already requires formal request gate present and expected blocking document state.

## Current Actions requises wording confirmed

- Formal request upload card says `Déposer la demande formelle`, but description includes `circuit officiel DG`, which should be removed from portal.
- Formal request upload button says `Téléverser le courrier formel`.
- After gate upload, a green state says `Demande formelle déposée - en traitement par l'ANAC.`
- Phase 2 document action title already says `Documents de demande formelle à compléter`.
- Phase 2 document action description currently says to download DN forms and upload requested pieces; it should be adjusted to the approved neutral copy.

## MyRequestsPage confirmed

- `MyRequestsPage` renders request-level `request.portalStatusLabel` through `RequestStatusBadge`.
- It does not load dossier detail or render Phase 1/Phase 2 dossier labels.
- No Phase 2-specific label duplication exists there.
- Existing fallback request status helper is request/intake-level only; no formal phase mapping is needed there for H5.

## Proposed minimal label mapping

### Phase 1

Keep behavior but make labels consistent and portal-safe:

- not started / started -> `En cours de traitement par l'ANAC`
- first/preliminary meeting invited -> `Rendez-vous programmé`
- first meeting held / submitted / DG-related preliminary review statuses -> `En cours d'examen`
- pre-eval form available -> `Formulaire de pré-évaluation à compléter`
- preliminary meeting held / ready to close -> `En cours d'examen`
- closed -> `Phase préliminaire clôturée`

### Phase 2

- `formal_not_started`, `formal_waiting_request` -> `Demande formelle attendue`
- `formal_request_received`, `formal_documents_tracking` -> `Demande formelle reçue`
- `formal_sent_to_dg`, `formal_dg_returned`, `formal_dg_decision_recorded`, `formal_recevability_recorded` -> `Demande formelle en cours d'examen`
- `formal_meeting_invited` -> `Réunion formelle programmée`
- `formal_meeting_held` -> `Documents de demande formelle à compléter`
- `formal_ready_to_close` -> `En attente de finalisation par l'ANAC`
- `formal_requires_correction` -> `Action requise`
- `formal_closed` -> `Phase de demande formelle clôturée`

If `formalRequestStatus` is missing but formal request courrier exists, use `Demande formelle reçue`.

## Proposed Actions requises wording

- Formal request gate title: `Demande formelle attendue`
- Formal request gate description: `Téléversez le courrier de demande formelle pour permettre à l'ANAC de poursuivre le traitement.`
- Formal request gate button: `Téléverser la demande formelle`
- Gate-present green state: use `dossierDetail.formalRequest.portalLabel` or a neutral sentence, not the hardcoded stale `Demande formelle déposée`.
- Phase 2 document action title: `Documents de demande formelle à compléter`
- Phase 2 document action description: `Téléversez les pièces demandées pour permettre à l'ANAC de poursuivre le traitement. Téléchargez les formulaires disponibles, complétez-les, puis téléversez les versions renseignées.`

## Verification commands planned

- `cd apps/api; npx tsc --noEmit`
- `cd apps/api; npm run build`
- `cd apps/portal; npx tsc --noEmit`
- `cd apps/portal; npm run build`

## Manual checks planned

- Not runnable during planning.
- After implementation: verify before/after formal request upload, formal meeting scheduled, meeting held/report uploaded, all documents uploaded/processing, Phase 2 closure, and absence of DG/circuit wording on portal.

## Known risks / TODOs

- Request-level portal labels still come from request/intake sanitization outside the formal dossier label path; H5 should avoid broad request workflow rewrites.
- Portal build may need outside-sandbox rerun for the known Vite/Tailwind native Windows binary loading issue.

## Next step

Await approval to implement the minimal portal/backend display-label changes.
