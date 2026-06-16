# OMA-HARDENING-2 - Portal Status Consistency

Date: 2026-05-28
Status: Complete

Summary: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency.md`

Implemented the portal/backend Phase 2 status consistency fix:

- `incomplete` and `rejected` are active portal submission statuses.
- Portal missing count only includes expected missing requirements.
- Conditional/optional missing requirements do not trigger portal `Actions requises`.
- Re-upload is available for `missing`, `requires_correction`, `incomplete`, and `rejected`.
- Portal guidance now distinguishes incomplete and rejected documents.

Verification:

- API typecheck/build passed.
- Portal typecheck passed.
- Portal build passed after outside-sandbox rerun for native Tailwind/Vite loading.
