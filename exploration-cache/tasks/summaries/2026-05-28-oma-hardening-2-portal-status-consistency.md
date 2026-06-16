# OMA-HARDENING-2 - Portal Status Consistency Implementation

Date: 2026-05-28
Status: Complete - API PASS, Portal PASS

## Objective

Fix portal-side Phase 2 inconsistencies for `incomplete`/`rejected` document statuses, missing counts, and action-required behavior.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency-planning.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`
- `apps/portal/src/lib/api/portal.api.ts`

## Files changed

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/manifest.json`
- `exploration-cache/tasks/history/2026-05-28-oma-hardening-2-portal-status-consistency.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency.md`

## Key decisions

- `rejected` is active for portal display and re-upload, not collapsed to `missing`.
- `incomplete`, `requires_correction`, and `rejected` are active but not acceptable completion statuses.
- Conditional and optional missing requirements stay visible but do not count as missing/action-required.
- Only expected requirements can trigger `Actions requises` from Phase 2 document status.

## Implementation details

- Added `incomplete` and `rejected` to portal active submission statuses in `getPortalDossier`.
- Changed portal progress `missing` to count only `expected` requirements with `status === "missing"`.
- Added `rejected` to portal re-upload eligibility.
- Added explicit portal guidance for `incomplete` and `rejected`.
- Changed `hasFormalDocRequired` to only consider expected requirements with `missing`, `requires_correction`, `incomplete`, or `rejected`.

## Verification commands run

- `cd apps/api; npx tsc --noEmit` - PASS
- `cd apps/api; npm run build` - PASS
- `cd apps/portal; npx tsc --noEmit` - PASS
- `cd apps/portal; npm run build` - initial sandbox run failed due Windows Tailwind/Vite native binary loading; outside-sandbox rerun PASS

## Manual checks run

- Not run in browser.
- Source-level checks confirmed status sets, missing count filtering, action-required filtering, and upload eligibility.

## Known risks / TODOs

- Manual UI checks still recommended with seeded `incomplete`, `rejected`, conditional missing, and expected missing requirements.
- Worktree contained unrelated pre-existing changes before this pass; this pass stayed scoped to portal/backend status consistency plus cache docs.

## Next step

Proceed to the next hardening slice only when requested.
