# OMA-OPS-8 - Preliminary hardening audit

Date: 2026-05-25
Status: Complete - audit only

Summary:

- Created the Phase preliminaire hardening audit before Phase 2 readiness work.
- No product code was changed.
- Main findings:
  - invalid/repeated preliminary transitions are rejected with 409s, not idempotent;
  - closure courrier is optional and not required by backend close;
  - Phase I close automatically starts the formal request phase;
  - `sentAt` / `returnedAt` for pre-eval DG circuit are not persisted;
  - `pre_eval_dg_returned` remains a dead status;
  - admin preliminary document downloads are allowlisted to the six evidence fields.

Primary summary:

- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8-preliminary-hardening-audit.md`

Recommended next slice:

- Phase I transition/date hardening: persist DG circuit dates, confirm Phase 2
  auto-start behavior, and clean `pre_eval_dg_returned`.
