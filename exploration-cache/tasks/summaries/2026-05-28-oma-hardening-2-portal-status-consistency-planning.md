# OMA-HARDENING-2 - Portal Status Consistency Planning

Date: 2026-05-28
Status: Planning complete - awaiting approval before implementation

## Objective

Plan a narrow portal/backend hardening pass for Phase 2 submission statuses, missing counts, and action-required behavior.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`
- `apps/portal/src/lib/api/portal.api.ts`

## Files changed

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency-planning.md`

## Key decisions

- Portal active statuses should be `submitted`, `under_review`, `validated`, `requires_correction`, `incomplete`, and `rejected`.
- `rejected`, `requires_correction`, and `incomplete` should remain visible statuses and should allow re-upload.
- Portal `missing` progress should count only `expected` requirements with `status === "missing"`.
- `hasFormalDocRequired` should only consider `expected` requirements with `missing`, `requires_correction`, `incomplete`, or `rejected`.
- Conditional and optional requirements can remain visible in the checklist, but should not count as missing/action-required.

## Implementation details

- No implementation yet.
- Planned backend edit: update `PORTAL_ACTIVE_SUBMISSION_STATUSES` and `formalProgress.missing` in `oma-phase.service.ts`.
- Planned portal edit: update upload eligibility/guidance/action-required filtering in `RequestDetailPage.tsx`.
- `portal.api.ts` already includes `incomplete` and `rejected` in the portal requirement status type.

## Verification commands run

- Not run; planning only.

## Manual checks run

- Not run; planning only.

## Known risks / TODOs

- Product code has a dirty worktree from prior/user changes; implementation must stay scoped to the three requested files plus cache docs.
- Build verification pending approval.

## Next step

Await approval, then implement the minimal correction and run API/portal typecheck and build commands.
