# OMA-OPS-8A - Phase I transition/date hardening

Date: 2026-05-25
Status: Complete - API/admin verification PASS

Summary:

- Phase I close no longer starts formal request as `in_progress`; formal request
  remains/gets created as `not_started`.
- Added persisted Phase I SLA dates:
  - `preEvaluationSentToDgAt`
  - `preEvaluationReturnedFromDgAt`
- Added `Meeting.heldAt` and set it when recording first/preliminary meetings.
- Required report file when recording first/preliminary meetings as held.
- Removed `pre_eval_dg_returned` from active admin type/label/progress paths and
  from the OMA phase enum.

Verification:

- API `npx tsc --noEmit`: PASS
- API `npm run build`: PASS
- Admin `npx tsc --noEmit`: PASS
- Admin `npm run build`: PASS after outside-sandbox rerun for known Tailwind
  native Windows binary issue.

Primary summary:

- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8a-phase1-transition-date-hardening.md`
