# Current Task

## Phase: OMA-FORMAL-17 — Block Phase 2 closure until all required documents deposited

Date: 2026-05-28
Status: **Complete — API PASS, Admin PASS**

## Summary files

- OMA-FORMAL-15: `exploration-cache/tasks/summaries/2026-05-28-oma-formal-15-consultation-only-documents-implementation.md`
- OMA-FORMAL-16: `exploration-cache/tasks/summaries/2026-05-28-oma-formal-16-phase-2-documents-tab-refactor.md`
- OMA-FORMAL-17: `exploration-cache/tasks/summaries/2026-05-28-oma-formal-17-block-closure-until-documents-deposited.md`

## Files modified (OMA-FORMAL-17)

- `apps/api/src/modules/oma-phases/formal-request.service.ts`
  - Added `"incomplete"` to `ACTIVE_SUBMISSION_STATUSES` (fixes status display for `incomplete` submissions)
  - Added `"incomplete"` to `ACTIVE_SUBMISSION_STATUS_SET` + treat it like `requires_correction` for re-upload
  - Moved `requirementList` build before `canClosePhase` computation
  - Extended `canClosePhase`: requires `allRequiredDeposited` + `omaFormValidated`
  - Added document deposit + `oma_approval_form` validated guards in `closeFormalRequestPhase`

- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
  - `CloseFormalRequestPhaseDialog`: removed "clôture avec réserves" behavior
  - Replaced amber partial warning + comment field with destructive blocking message
  - Disabled close button when `!isComplete`
  - Removed `completeness`/`comment` from API call

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
  - `nextActionContent` `else` branch: shows blocking message + "Voir les documents" when meeting report uploaded but canClosePhase=false due to missing docs

## Key decisions

- `oma_approval_form` submitted but not validated → BLOCK
- `oma_approval_form` `requires_correction` or `incomplete` → BLOCK
- Consultation-only docs: deposit only required (validation not required and not possible)
- `incomplete` status fix: now included in `ACTIVE_SUBMISSION_STATUSES` for correct display
- `incomplete` re-upload fix: treated like `requires_correction` (replacement allowed)
- Backend error messages are specific per blocking reason
- `completeness`/`comment` payload fields kept optional in backend signature (backward-compat)

## Manual checks

Phase 2 cannot close when:
- Required documents are missing
- `oma_approval_form` is missing
- `oma_approval_form` is `requires_correction`
- `oma_approval_form` is `incomplete`
- `oma_approval_form` is `submitted` or `under_review` (not yet validated)

Phase 2 CAN close when:
- All required/expected docs are deposited
- `oma_approval_form` is `validated`
- Plus existing conditions: gate, DG evidence, meeting held, report uploaded

No "Clôturer avec réserves" remains in the UI.
