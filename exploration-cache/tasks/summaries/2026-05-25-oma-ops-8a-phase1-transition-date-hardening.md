# OMA-OPS-8A - Phase I transition/date hardening

Date: 2026-05-25
Status: **Complete - API/admin verification PASS**

## Objective

Fix urgent Phase preliminaire workflow/data correctness issues from the
OMA-OPS-8 audit without implementing Phase 2 UI/actions, SLA reports, or
Certificat.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8-preliminary-hardening-audit.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- `apps/api/src/modules/meetings/meeting.model.ts`
- `apps/api/src/modules/meetings/meeting.service.ts`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/preliminary-progress.helpers.ts`
- `apps/admin/src/pages/dossiers/preliminary-dialogs.tsx`
- `apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx`
- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`

## Files changed

- `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- `apps/api/src/modules/meetings/meeting.model.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx`
- `apps/admin/src/pages/dossiers/preliminary-progress.helpers.ts`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/preliminary-dialogs.tsx`
- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/manifest.json`
- `exploration-cache/tasks/history/2026-05-25-oma-ops-8a-phase1-transition-date-hardening.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8a-phase1-transition-date-hardening.md`

## Key decisions

- Phase I close still sets `dossier.status = formal_request_phase`, but the
  `formal_request` phase is left/created as `not_started`.
- No Phase 2 start action or workspace was implemented.
- Persist SLA-relevant dates directly on `OmaPhase`:
  - `preEvaluationSentToDgAt`
  - `preEvaluationReturnedFromDgAt`
- Add `Meeting.heldAt` and set it when first/preliminary meetings are recorded
  as held.
- Meeting report files are now required for both record-held endpoints and in
  the admin dialog.
- `pre_eval_dg_returned` was removed from active admin API type/labels/progress
  paths and from the OMA phase enum; the existing audit action name
  `oma.preliminary.pre_eval_dg_returned` remains as a historical event label.

## Implementation details

- `sendPreEvalToDg` now persists `input.sentAt` or server time to
  `phase.preEvaluationSentToDgAt`.
- `recordPreEvalDgReturn` now persists `input.returnedAt` or server time to
  `phase.preEvaluationReturnedFromDgAt`.
- `sanitizePhase` serializes both new pre-evaluation DG dates.
- `sanitizeMeeting` serializes `heldAt`.
- `recordFirstMeeting` and `recordPreliminaryMeeting` now call
  `validateFile(file, true, "compte rendu")`; they reject missing report files
  and always link the generated report document before advancing status.
- `ClosePreliminaryDialog` copy now says Phase 2 is ready to start, not
  automatically active.
- `PreliminaryPhaseWorkspace` closed-state copy now says formal request is ready
  to start; it also shows persisted DG send/return dates when available.
- `DossierHistoriqueTab` uses `meeting.heldAt` for held meeting events and uses
  `preEvaluationReturnedFromDgAt` for the DG return event.

## Verification commands run

- `cd apps/api; npx tsc --noEmit` - PASS
- `cd apps/api; npm run build` - PASS
- `cd apps/admin; npx tsc --noEmit` - PASS
- `cd apps/admin; npm run build` - failed in sandbox with known Tailwind native
  Windows binary / `spawn EPERM`; rerun outside sandbox - PASS

Portal verification not run because portal source/types were not changed.

## Manual checks

Not run in browser during this pass.

Expected manual checks:

- Closing Phase I leaves formal request phase `not_started`.
- Dossier still shows status `formal_request_phase`.
- Pre-eval DG sent/return dates appear in the phase workspace after actions.
- Held meetings show `heldAt`.
- Record-meeting dialogs require a report file before submit.
- Existing Phase I happy path still works with report files attached.

## Known risks / TODOs

- Existing database records with `pre_eval_dg_returned`, if any, should be
  cleaned or migrated before editing those records because the enum no longer
  includes the dead value.
- The audit log action string `oma.preliminary.pre_eval_dg_returned` remains for
  compatibility with existing history naming; it is not a workflow status.
- Runtime validation with seeded dossiers is still needed.

## Next step

OMA-OPS-8B: status/label cleanup and French label/mojibake hardening across
admin and portal, without broad workflow refactors.
