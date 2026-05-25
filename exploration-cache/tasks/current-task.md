# Current Task

## Phase: OMA-OPS-8A - Phase I transition/date hardening

Date: 2026-05-25
Status: **Complete - API/admin verification PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-25-oma-ops-8a-phase1-transition-date-hardening.md`

## Objective

Fix urgent Phase preliminaire workflow/data correctness issues from the
OMA-OPS-8 audit without implementing Phase 2 UI/actions, SLA reports, or
Certificat.

## Completed deliverables

- Phase I close keeps dossier status `formal_request_phase` but leaves/creates
  `formal_request` phase as `not_started`.
- Added `preEvaluationSentToDgAt` and `preEvaluationReturnedFromDgAt` to
  `OmaPhase`.
- `sendPreEvalToDg` and `recordPreEvalDgReturn` persist payload date or server
  time.
- Added `Meeting.heldAt` and set it when preliminary meetings are recorded as
  held.
- Required report files when recording first/preliminary meetings as held.
- Removed `pre_eval_dg_returned` from active admin type/label/progress paths and
  from the OMA phase enum.
- Admin workspace and history now consume the new dates where useful.

## Key findings

- No Phase 2 UI/action was implemented.
- The historical audit action string `oma.preliminary.pre_eval_dg_returned`
  remains, but the workflow status is gone from active paths.
- Existing DB rows with `pre_eval_dg_returned`, if any, need cleanup/migration
  before editing those rows.

## Verification

- API `npx tsc --noEmit`: PASS
- API `npm run build`: PASS
- Admin `npx tsc --noEmit`: PASS
- Admin `npm run build`: PASS after outside-sandbox rerun for known Tailwind
  native Windows binary issue.
- Portal not run because portal files were not changed.

## Previous task references

- OMA-OPS-8A certificate readonly tab: `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8a-certificat-readonly-tab-implementation.md`
- OMA-OPS-7B compact history: `exploration-cache/tasks/summaries/2026-05-25-oma-ops-7b-compact-historique-implementation.md`
- OMA-OPS-7 history tab: `exploration-cache/tasks/summaries/2026-05-25-oma-ops-7-historique-tab-implementation.md`
- OMA-OPS-6 courriers tab: `exploration-cache/tasks/summaries/2026-05-25-oma-ops-6-courriers-tab.md`
- OMA-OPS-5 reunions tab: `exploration-cache/tasks/summaries/2026-05-25-oma-ops-5-reunions-tab.md`
- OMA-OPS-4 documents/downloads: `exploration-cache/tasks/summaries/2026-05-25-oma-ops-4-documents-tab-downloads.md`

## Next step

OMA-OPS-8B: status/label cleanup and French label/mojibake hardening across
admin and portal, without broad workflow refactors.
