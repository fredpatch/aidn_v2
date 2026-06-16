# OMA-HARDENING-6 - Notifications Implementation

Date: 2026-05-28
Status: Complete - API PASS

## Objective

Add backend in-app notifications for key Phase 1 and Phase 2 OMA milestones, using portal-safe wording and without changing workflow rules, statuses, document review behavior, closure rules, portal UI, or Phase 3.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-6-notifications-planning.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`

## Files changed

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-6-notifications.md`
- `exploration-cache/tasks/history/2026-05-28-oma-hardening-6-notifications.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/manifest.json`

## Key decisions

- Reused direct `NotificationModel.create` conventions already present in the backend.
- Added small local helpers that skip notification when `dossier.postulantUserId` is absent.
- Kept the MVP duplicate behavior: one notification per successful transition call, no new dedupe layer.
- Kept notifications postulant-facing and avoided DG/circuit/internal status wording.

## Implementation details

- Phase 1 now emits notifications when:
  - first meeting is scheduled;
  - pre-evaluation form is made available;
  - preliminary meeting is scheduled;
  - preliminary phase is closed.
- Phase 2 now emits or aligns notifications when:
  - formal request courrier is registered/received;
  - formal meeting is scheduled;
  - `oma_approval_form` is marked `requires_correction`;
  - `oma_approval_form` is marked `incomplete`;
  - formal request phase is closed.
- Existing Phase 2 formal meeting, correction, and closure notifications were reworded to match the approved portal-safe copy.

## Verification commands run

- `cd apps/api; npx tsc --noEmit` - PASS
- `cd apps/api; npm run build` - PASS

## Manual checks run

- Not run in browser/API runtime.
- Manual notification appearance checks still require a running API, seeded dossier/postulant user, and portal session.

## Known risks / TODOs

- No automated notification regression tests were added.
- No complex idempotency/deduplication was added by design.

## Next step

Run the manual portal notification checks when a seeded OMA dossier is available.
