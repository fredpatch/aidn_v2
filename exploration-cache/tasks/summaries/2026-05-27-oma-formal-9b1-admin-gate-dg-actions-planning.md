# OMA-FORMAL-9B1 - Admin Phase 2 Gate + DG Action Wiring Planning

Date: 2026-05-27
Status: **Planning complete - awaiting implementation approval**

## Objective

Plan admin action wiring for Phase 2 "Demande formelle":

- register the formal request courrier received by ANAC;
- mark the request as placed in the physical DG/parapheur circuit;
- record the scanned DG return and DG decision/orientation using confirmed backend routes.

No implementation was performed in this pass.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/tasks/current-task.md`

Previously relevant cache identified by the prompt and prior 9A work:

- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-5-supporting-document-uploads.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-7-phase-closure.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-8-corrected-document-reupload.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9a-admin-phase-2-read-workspace-planning.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9a-phase-1-alignment-planning.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/preliminary-dialogs.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/modules/dg-circuit/dg-circuit.service.ts`

## Files changed

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1-admin-gate-dg-actions-planning.md`

## Key decisions

- Keep `DossierPhasesTab` as the owner of the Phase 2 read state and pass a refresh callback into `FormalRequestPhaseWorkspace`.
- Add focused Phase 2 API client functions in `dossiers.api.ts` for only confirmed routes.
- Create small focused Phase 2 dialogs rather than forcing `UploadDocumentDialog` to handle source, official reference, physical deposit date, and DG decision fields.
- Wire DG return and DG decision because formal-specific routes exist and are dossier-scoped; no hidden `formalRequestDgReviewId` is needed in the frontend.
- Preserve physical-circuit wording: the UI records placement in the DG/parapheur circuit; it must not imply digital sending to DG.

## Confirmed API routes

- `POST /api/v1/admin/dossiers/:id/phases/formal-request/courrier`
  - Multipart field: `file`
  - Body: `source`, `officialReference?`, `physicalDepositDate?`, `notes?`
  - Admin sources: `physical_deposit`, `internal_scan`
  - Returns updated formal phase read state.
- `POST /api/v1/admin/dossiers/:id/phases/formal-request/send-to-dg`
  - JSON body not required.
  - Returns updated formal phase read state.
- `POST /api/v1/admin/dossiers/:id/phases/formal-request/dg-return`
  - Multipart field: `file`
  - Body: `returnedFromDgAt?`, `officialReference?`, `notes?`
  - Returns updated formal phase read state.
- `POST /api/v1/admin/dossiers/:id/phases/formal-request/dg-decision`
  - JSON body: `decision`, `orientedDirection?`, `observations?`, `decisionRecordedAt?`
  - Supported decisions: `approved`, `rejected`, `reoriented`, `pending`
  - Returns updated formal phase read state.

## Implementation details planned

- Add API client functions:
  - `uploadFormalRequestCourrier(id, formData)`
  - `sendFormalRequestToDg(id)`
  - `recordFormalRequestDgReturn(id, formData)`
  - `recordFormalRequestDgDecision(id, payload)`
- Add Phase 2 dialogs:
  - `RegisterFormalCourrierDialog`
  - `SendFormalToDgDialog`
  - `RecordFormalDgReturnDialog`
- Update `FormalRequestPhaseWorkspace`:
  - Courrier section shows `Enregistrer le courrier formel` when the gate is missing.
  - DG section shows `Mettre en circuit DG` only when enabled by `canSendToDg`.
  - DG return/decision action is shown only after DG circuit placement and before a recorded decision.
  - Final status text reflects missing gate, ready for DG circuit, waiting return, and decision-recorded states.
- Update `DossierPhasesTab`:
  - Extract Phase 2 refresh into a callback usable after mutations.
  - Refresh Phase 2 read state and parent dossier detail after successful actions where appropriate.

## Business rules preserved

- The formal request courrier remains the only blocking gate.
- Supporting documents remain tracking-only and must not block DG circuit placement.
- Admin action must not submit `portal_upload`.
- No backend business rules, portal UI, meeting actions, closure actions, supporting document review actions, fake data, or unconfirmed downloads will be added.

## Verification commands planned

After implementation approval:

```bash
cd apps/admin
npx tsc --noEmit
npm run build
```

## Manual checks planned

- Phase 2 workspace loads.
- Missing gate shows the register-courrier action.
- Registering courrier refreshes Phase 2 state and makes the gate present.
- `Mettre en circuit DG` is enabled only when backend `canSendToDg` is true.
- Supporting document checklist completion is not required for DG action.
- DG circuit placement refreshes state to waiting DG.
- DG return and decision refresh the DG block and next-action state.
- No backend files and no portal files are changed.

## Known risks / TODOs

- Existing source files show mojibake in some French strings; implementation should avoid broad accent cleanup and keep edits scoped.
- The read model exposes DG progress via status booleans rather than detailed DG review metadata, so UI should not invent unavailable references.
- If backend permissions block the current actor at runtime, the frontend will surface API errors through `extractError`.

## Next step

Await user approval, then implement OMA-FORMAL-9B1 in the admin frontend and run the planned verification commands.
