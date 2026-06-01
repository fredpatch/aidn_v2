# DASH-1 Backend Dashboard Foundation - Planning

Date: 2026-05-29
Status: Planning corrected and approved - implementation authorized

## Task

Plan a backend-only implementation for `GET /api/v1/admin/dashboard`, using real persisted AIDN data and preserving existing workflow boundaries. No implementation was performed in this pass.

## Cache status

- Cache read first: `CURRENT_STATE`, `API_ROUTES`, `AUTH_AND_PERMISSIONS`, `DATA_MODELS`, `ADMIN_INTAKE_WORKFLOW`, `PORTAL_REQUEST_WORKFLOW`, `BUILD_AND_TEST_COMMANDS`, current task notes, quick reference, and prior Phase 1/Phase 2 summaries.
- Cache confirms there is no general backend dashboard route today.
- Cache confirms the previous dashboard refresh was frontend-only and mock/demo-state-backed.
- Cache confirms certificates remain a backend gap: no `CertificateModel`, certificate service, or real certificate admin API exists yet.
- Cache gap: `exploration-cache/06-workflows/OMA_FORMAL_REQUEST_WORKFLOW.md` is referenced by the prompt but does not exist in the repository.

## Source inspected

- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/modules/requests/request.model.ts`
- `apps/api/src/modules/courriers/courrier.model.ts`
- `apps/api/src/modules/dg-reviews/dg-review.model.ts`
- `apps/api/src/modules/dossiers/dossier.model.ts`
- `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- `apps/api/src/modules/documents/document.model.ts`
- `apps/api/src/modules/documents/document-submission.model.ts`
- `apps/api/src/modules/documents/document-requirement.model.ts`
- `apps/api/src/modules/meetings/meeting.model.ts`
- `apps/api/src/modules/notifications/notification.model.ts`
- `apps/api/src/modules/audit/audit-log.model.ts`
- `apps/api/src/modules/users/user.model.ts`
- `apps/api/src/shared/permissions/permissions.ts`
- `apps/api/src/shared/guards/permission.middleware.ts`
- Targeted service read: `oma-phase.service.ts` and `formal-request.service.ts` for existing phase closure/readiness rules.

## Existing patterns

- Admin API routes are centralized in `admin.routes.ts` behind `adminRouter.use(requireAuth({ scope: "admin" }))`.
- Per-route authorization uses `requirePermission(Permissions.X)`.
- `REPORT_VIEW` already exists and is granted to `admin`, `bootstrap_admin`, and `dn_supervisor`.
- `REPORT_VIEW` is not currently granted to `dn_agent`, `dg_secretariat`, `reception`, or `bureau_courrier`.
- Existing models are Mongoose models with `lean()` query patterns in service code.

## Proposed implementation

1. Add a dashboard module under `apps/api/src/modules/dashboard/`:
   - `dashboard.types.ts`
   - `dashboard.helpers.ts`
   - `dashboard.service.ts`
2. Wire `GET /dashboard` in `admin.routes.ts`:
   - Guard with `requirePermission(Permissions.REPORT_VIEW)`.
   - Return the dashboard payload from `getAdminDashboardSummary`.
3. Update `rolePermissions`:
   - Add `REPORT_VIEW` to `dn_agent`, `dg_secretariat`, `reception`, and `bureau_courrier` so all stated internal roles can hit the endpoint.
4. Keep all logic read-only:
   - No mutations.
   - No workflow status changes.
   - No fake fallback records.
   - Unknown/unimplemented certificate metrics return zero with an `unavailable` metadata flag.

## Proposed payload

- `generatedAt`
- `period`
- `profile`
- `periodStats`
- `currentWorkload`
- `recentActivity`
- `alerts`
- `meta`

## Query semantics

- Period defaults to `preset=month` when no query is provided.
- `preset=month` uses `from` = first day of the current month and `to` = end of the current day.
- Support explicit `from` and `to` ISO date query params.
- Treat the period as inclusive by normalizing `from` to start-of-day and `to` to end-of-day.
- Business-day age convention: count weekdays in `(startDate, now]`; same day is `0`, Friday to Monday is `1`.

## Metric mapping

- Requests received: `Request.createdAt`.
- Requests by source:
  - `Request.courrierSource` for `portal_upload` and `physical_deposit`.
  - `Courrier.source === "internal_scan"` for internal scan counts where available.
- Initial DG decisions: `DGReview.targetType === "initial_request"` and `decisionRecordedAt` in period.
- Dossiers opened: `Dossier.openedAt`.
- Phases closed: `OmaPhase.closedAt`.
- Certificates collected: `0` until the certificate backend exists, with `meta.unavailableMetrics = ["certificates"]`.
- DG awaiting return: `DGReview.status` in `sent_to_dg_circuit` or `awaiting_return`.
- DG returned to record: `DGReview.status === "returned_scanned"` without `decisionRecordedAt`.
- Active dossiers: dossier status not in `closed`, `cancelled`, `suspended`.
- Unassigned dossiers: active dossier with no `assignedDnAgentId`.
- Documents to review: `DocumentSubmission.status` in `submitted`, `under_review`.
- Corrections waiting postulant: `DocumentSubmission.status === "requires_correction"`.
- Missing expected documents: active `DocumentRequirement` expected rows without active submissions by dossier/phase, only for active/currently in-progress phases. Do not count not-started, closed, suspended, or placeholder phases.
- Upcoming meetings: `Meeting.status` in `planned`, `invited` with `scheduledAt` in the next 30 days.
- Overdue phases: active `OmaPhase` older than configured expected business-day thresholds.
- Phases ready to close:
  - Preliminary: `status === "ready_to_close"` or `preliminaryStatus === "preliminary_ready_to_close"`.
  - Formal request: reuse the same persisted fields and closure criteria already exposed by `getAdminFormalRequestPhase`.

## Profile behavior

- `admin`, `bootstrap_admin`, `dn_supervisor`, `dn_agent`: full operational profile.
- `dg_secretariat`, `reception`, `bureau_courrier`: courrier-focused profile with the same response shape, but DN-only workload groups empty/zeroed.
- `postulant`: not applicable because admin scope auth blocks portal users.

## Verification plan

- `npm run typecheck` in `apps/api`.
- `npm run build` in `apps/api`.
- `npx react-doctor@latest --verbose --diff` only if implementation touches frontend or lint-triggered React files; backend-only DASH-1 should not need it.

## Approved decisions

- Grant `REPORT_VIEW` to `dn_agent`, `dg_secretariat`, `reception`, and `bureau_courrier`.
- Use domain timestamps for recent activity, not audit logs.
- Calculate missing expected documents only for active/currently in-progress phases.
- Keep certificate metrics at `0` and expose `meta.unavailableMetrics = ["certificates"]`.
- Do not block implementation on missing `OMA_FORMAL_REQUEST_WORKFLOW.md`; report it as a cache gap.
- Keep endpoint strictly read-only: no workflow mutation, notification sending, status update, or fake records.
