# OMA-HARDENING-6 - Notifications Planning

Date: 2026-05-28
Status: Planning complete - awaiting approval

## Objective

Add missing in-app notifications for key Phase 1 and Phase 2 workflow milestones, aligned with portal Actions requises wording, without changing workflow rules, Phase 1/Phase 2 status transitions, document upload/review rules, closure logic, portal UI, or Phase 3.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-5-portal-status-labels.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-15-consultation-only-documents-implementation.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-17-block-closure-until-documents-deposited.md`

## Source files inspected

- `apps/api/src/modules/notifications/notification.model.ts`
- `apps/api/src/modules/notifications/notification.service.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/modules/meetings/meeting.service.ts`
- `apps/api/src/modules/portal/portal.routes.ts`

## Files changed

- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-6-notifications-planning.md`
- `exploration-cache/tasks/current-task.md`

## Notification model and portal read path confirmed

- `NotificationModel` fields:
  - `recipientUserId` required `User` ref.
  - `channel` enum currently only `in_app`.
  - `title`, `message`.
  - `relatedType` enum: `request`, `dossier`, `phase`, `document`, `meeting`, `dg_review`, `account_request`.
  - `relatedId` required.
  - `status` enum: `unread`, `read`; optional `readAt`.
- Portal reads notifications through `notification.service.ts`:
  - `listPortalNotifications({ status, limit }, actor)`.
  - `markPortalNotificationRead(id, actor)`.
  - `markAllPortalNotificationsRead(actor)`.
- Portal routes are already wired at:
  - `GET /api/v1/portal/notifications`
  - `POST /api/v1/portal/notifications/read-all`
  - `POST /api/v1/portal/notifications/:id/read`

## Recipient resolution confirmed

- OMA phase functions load `DossierModel` by dossier id.
- The portal recipient is `dossier.postulantUserId`.
- Existing formal request code already skips notification if `postulantUserId` is absent.
- If only a submission/phase is available, current formal review code resolves `submission -> dossier` before notifying.

## Existing notifications confirmed

### Phase 1

- `oma-phase.service.ts` currently has no `NotificationModel` import and emits no Phase 1 notifications.
- Missing from Phase 1:
  - first meeting scheduled;
  - pre-evaluation form available;
  - preliminary meeting scheduled;
  - preliminary phase closed.

### Phase 2

Existing in `formal-request.service.ts`:

- Formal meeting scheduled notification exists:
  - title `Réunion formelle programmée`
  - relatedType `meeting`
  - message is shorter than requested but portal-safe.
- Phase 2 closed notification exists:
  - title `Phase II clôturée`
  - relatedType `phase`
  - message mentions moving to deeper document evaluation.
- Formal document correction notification exists only for `requires_correction`:
  - title `Correction demandée`
  - relatedType `document`
  - generic message.

Missing / needs adjustment:

- Formal request received/registered has no notification.
- `incomplete` review status does not notify.
- Existing formal meeting scheduled notification should be aligned with the requested message.
- Existing Phase 2 closed notification should be retitled/reworded to `Phase de demande formelle clôturée`.
- Existing correction notification should use the `oma_approval_form` wording and be extended to `incomplete` without creating duplicate branches.

## Proposed minimal notification additions

### Phase 1 in `oma-phase.service.ts`

- Import `NotificationModel`.
- Add a small local helper, e.g. `notifyPostulant(dossier, payload)`, that skips when `dossier.postulantUserId` is absent.
- Add notification after successful transition/save:
  - `inviteFirstMeeting`: title `Rendez-vous programmé`, relatedType `meeting`, relatedId `meeting._id`.
  - `publishPreEvaluationForm`: title `Formulaire de pré-évaluation disponible`, relatedType `document`, relatedId `fileDocumentId`.
  - `invitePreliminaryMeeting`: title `Réunion préliminaire programmée`, relatedType `meeting`, relatedId `meeting._id`.
  - `closePreliminaryPhase`: title `Phase préliminaire clôturée`, relatedType `phase`, relatedId `phase._id`.

### Phase 2 in `formal-request.service.ts`

- Add notification after formal request courrier registration succeeds:
  - title `Demande formelle reçue`, relatedType `phase`, relatedId `phase._id`.
  - For admin-source registration, resolve full dossier or fetch `postulantUserId` using `resolvedDossierId`.
- Update existing formal meeting scheduled notification message to the requested wording.
- Update existing phase closed notification title/message to the requested wording.
- Replace the `requires_correction`-only branch with a branch for `requires_correction` and `incomplete`.
  - `requires_correction`: title `Correction demandée`, requested message, relatedType `document`.
  - `incomplete`: title `Document incomplet`, requested message, relatedType `document`.

## Idempotency / duplicate decision

- Current mutation functions reject repeat calls for these transitions before notification creation.
- Minimum MVP is one notification per successful transition call, matching existing formal request notification style.
- No complex dedupe should be added unless future requirements demand it.

## Verification commands planned

- `cd apps/api; npx tsc --noEmit`
- `cd apps/api; npm run build`
- Portal verification is not planned because this is backend-only unless implementation touches portal types/UI.

## Manual checks planned

- Not runnable during planning.
- After implementation: verify notifications appear for first meeting scheduled, pre-eval form available, preliminary meeting scheduled, Phase 1 closed, formal request received, formal meeting scheduled, correction, incomplete, and Phase 2 closed.

## Known risks / TODOs

- No automated notification tests are currently identified in cache.
- Manual checks require a live API plus seeded dossiers/users.
- Existing notification creation is direct model usage, not a central write helper; keeping local helpers avoids broad refactor.

## Next step

Await approval to implement the backend-only notification additions.
