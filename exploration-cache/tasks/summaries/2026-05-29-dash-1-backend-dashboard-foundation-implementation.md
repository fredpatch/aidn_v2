# DASH-1 Backend Dashboard Foundation - Implementation

Date: 2026-05-29
Status: Complete - API typecheck PASS, API build PASS

## Task

Implemented backend-only `GET /api/v1/admin/dashboard` using real persisted AIDN data and existing workflow boundaries.

## Cache status

- Cache was read first and the planning summary was corrected before implementation.
- Non-blocking cache gap remains: `exploration-cache/06-workflows/OMA_FORMAL_REQUEST_WORKFLOW.md` is referenced by the prompt but does not exist.
- Certificate backend remains unavailable; dashboard certificate metrics intentionally return `0`.

## Files changed

- `apps/api/src/modules/dashboard/dashboard.types.ts` - response/query/profile types.
- `apps/api/src/modules/dashboard/dashboard.helpers.ts` - period resolution, profile resolution, business-day helper.
- `apps/api/src/modules/dashboard/dashboard.service.ts` - read-only dashboard aggregation service.
- `apps/api/src/modules/admin/admin.routes.ts` - added `GET /dashboard`.
- `apps/api/src/shared/permissions/permissions.ts` - added `REPORT_VIEW` to `dn_agent`, `dg_secretariat`, `reception`, and `bureau_courrier`.

## Implemented behavior

- Route: `GET /api/v1/admin/dashboard`.
- Auth: admin scope plus `REPORT_VIEW`.
- Default period: `preset=month`, from first day of current month through end of current day.
- Custom period: explicit `from` and `to`, normalized to inclusive day bounds.
- Recent activity uses domain timestamps from requests, dossiers, DG reviews, document submissions, meetings, and closed phases.
- Missing expected documents are counted only for active/currently in-progress phases.
- Certificate counters remain `0`.
- `meta.unavailableMetrics = ["certificates"]`.
- `meta.cacheGaps` includes the missing formal request workflow cache document.
- Courrier-profile users receive the same response shape, with DN-only workload counters zeroed.

## Read-only guardrails

- No workflow mutation.
- No notification sending.
- No status update.
- No fake records.
- No frontend or portal changes.

## Verification

- API: `npm run typecheck` PASS.
- API: `npm run build` PASS.
- React Doctor diff not run because this was backend-only and did not touch React files.
