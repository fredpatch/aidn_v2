# OMA-OPS-8 - Phase preliminaire hardening audit + Phase 2 readiness

Date: 2026-05-25
Status: **Complete - audit only, no product code changed**

## Objective

Audit the implemented Phase preliminaire cockpit before Phase 2 work. This pass
does not implement fixes.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- OMA-OPS summaries 1, 2, 3, 3D, 4, 5, 6, 7, 7B
- ADMIN-ADJ summaries 1, 2, 3
- `docs/AIDN_OMA_WORKFLOW_SOURCE_NOTES.md`
- `exploration-cache/06-workflows/OMA_WORKFLOW.md`
- `exploration-cache/06-workflows/OMA_PHASES.md`
- `exploration-cache/06-workflows/MEETING_WORKFLOW.md`
- `exploration-cache/06-workflows/DOCUMENT_WORKFLOW.md`
- `exploration-cache/06-workflows/PORTAL_APPLICANT_VIEW.md`

## Source files inspected

Backend:

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/meetings/meeting.service.ts`
- `apps/api/src/modules/requests/request.service.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/shared/permissions/permissions.ts`
- `apps/api/src/modules/dossiers/dossier.model.ts`
- `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- `apps/api/src/modules/meetings/meeting.model.ts`
- `apps/api/src/modules/documents/document.model.ts`
- `apps/api/src/modules/requests/request.model.ts`
- `apps/api/src/modules/dg-reviews/dg-review.model.ts`
- `apps/api/src/modules/notifications/notification.model.ts`

Admin:

- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/pages/dossiers/*`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/lib/api/requests.api.ts`
- `apps/admin/src/pages/RequestsPage.tsx`
- `apps/admin/src/pages/DgCircuitPage.tsx`
- `apps/admin/src/config/nav.tsx`
- `apps/admin/src/lib/auth/permissions.ts`

Portal:

- `apps/portal/src/pages/RequestDetailPage.tsx`
- `apps/portal/src/pages/RendezVousPage.tsx`
- `apps/portal/src/pages/MyRequestsPage.tsx`
- `apps/portal/src/pages/PortalDashboardPage.tsx`
- `apps/portal/src/components/PortalCalendar.tsx`
- `apps/portal/src/components/RequestStatusBadge.tsx`
- `apps/portal/src/lib/api/portal.api.ts`

## Status transition matrix

| Action / endpoint | Guard | Required evidence / current state | Result |
| --- | --- | --- | --- |
| Start preliminary via dossier opening | `DOSSIER_OPEN` on request route | request `oriented_to_dn`, DG decision oriented to DN, returned scan required by `canOpenDossier` | creates dossier + preliminary phase, status `preliminary_started` |
| `POST /dossiers/:id/preliminary/invite-first-meeting` | `MEETING_MANAGE` | `preliminary_started` | meeting `invited`, phase `waiting_meeting`, preliminary `first_meeting_invited` |
| `POST /dossiers/:id/preliminary/record-first-meeting` | `MEETING_MANAGE` | `first_meeting_invited`, firstMeetingId; report file optional | meeting `held`, preliminary `first_meeting_held`; report linked only if uploaded |
| `POST /dossiers/:id/preliminary/publish-pre-evaluation-form` | `DOCUMENT_UPLOAD_INTERNAL` | `first_meeting_held`, active pre-eval template | template linked, phase `waiting_postulant`, preliminary `pre_eval_form_available` |
| `POST /portal/dossiers/:id/preliminary/completed-form` | portal actor | `pre_eval_form_available`, completed form required | completed form linked, preliminary `pre_eval_form_submitted` |
| `POST /dossiers/:id/preliminary/send-pre-eval-to-dg` | `PRE_EVAL_DG_CIRCUIT_HANDLE` | `pre_eval_form_submitted` | phase `waiting_dg`, preliminary `pre_eval_sent_to_dg` |
| `POST /dossiers/:id/preliminary/record-pre-eval-dg-return` | `PRE_EVAL_DG_CIRCUIT_HANDLE` | `pre_eval_sent_to_dg`, returned file required | DG annotated doc linked, preliminary jumps to `pre_eval_dg_decision_recorded` |
| `POST /dossiers/:id/preliminary/invite-preliminary-meeting` | `MEETING_MANAGE` | `pre_eval_dg_decision_recorded` | preliminary meeting `invited`, status `preliminary_meeting_invited` |
| `POST /dossiers/:id/preliminary/record-preliminary-meeting` | `MEETING_MANAGE` | `preliminary_meeting_invited`; report file optional | meeting `held`, preliminary `preliminary_meeting_held`; report linked only if uploaded |
| `POST /dossiers/:id/preliminary/upload-closure-courrier` | `DOCUMENT_UPLOAD_INTERNAL` | `preliminary_meeting_held`, file required | optional closure doc linked, preliminary `preliminary_ready_to_close` |
| `POST /dossiers/:id/preliminary/close` | `PHASE_CLOSE` | `preliminary_meeting_held` or `preliminary_ready_to_close` | preliminary phase closed, dossier status `formal_request_phase`, formal phase started |

Gaps / risks:

- Invalid transitions are blocked with 409s. Repeated actions are safely rejected, but not idempotent.
- `recordFirstMeeting` and `recordPreliminaryMeeting` allow no report file, yet checklist/report evidence expects reports. Decide if reports are mandatory before Phase 2.
- `pre_eval_dg_returned` remains in backend/admin types but no route sets it.
- `sendPreEvalToDg.sentAt` and `recordPreEvalDgReturn.returnedAt` inputs are accepted by the route but not persisted; SLA dates are lost.
- Closing Phase I immediately starts Phase II (`formal_request`) by side effect. This is implemented, but prompt says "not moving to Phase 2 yet"; treat as a Phase 2 readiness decision to confirm.

## UI label issues

Most active dossier cockpit labels are mapped to French via
`dossier-detail.helpers.tsx`, `DossierMeetingsTab.tsx`, and portal status maps.
Issues found:

| File | Visible risk | Proposed label |
| --- | --- | --- |
| `apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx` | `pre_eval_sent_to_dg` is labeled "Envoye au DG" / physical circuit wording drift | `Pre-evaluation mise en circuit DG` |
| `apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx` | dead `pre_eval_dg_returned` label | remove or keep only as defensive `Retour DG pre-evaluation recu` |
| `apps/admin/src/pages/dossiers/DossierCourriersTab.tsx` | no-accent labels: `Oriente vers DN`, `Rejete`, `Reoriente` | `Orienté vers DN`, `Rejeté`, `Réorienté` |
| `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx` | no-accent labels in derived events (`Annule`, `Premiere`, `Reunion`) | accented French labels |
| `apps/portal/src/pages/RequestDetailPage.tsx` | meeting fallback displays raw unknown status if backend adds `planned`/`postponed` | add `planned: Planifié`, `postponed: Reporté` |
| `apps/admin/src/lib/api/dossiers.api.ts` | `pre_eval_dg_returned` in API type | remove after backend cleanup |

No broad raw enum leakage was found for the required statuses in active dossier
tabs, but duplicate maps increase drift risk.

## Portal visibility issues

Current portal labels are mostly applicant-friendly:

- Request list/detail uses `portalStatusLabel`, e.g. `Demande reçue`,
  `Action requise`, `Dossier en cours de traitement`.
- Dossier preliminary labels come from `PRELIMINARY_STATUS_PORTAL_LABELS`, e.g.
  `Rendez-vous programmé`, `Action requise - Formulaire disponible`,
  `Phase préliminaire clôturée`.
- Meeting/calendar labels are French in `RendezVousPage.tsx`.

Gaps:

- Portal string files contain mojibake in several labels; a French accent sweep is needed.
- Portal dossier detail exposes a few internal phase concepts such as "phase de demande formelle" after Phase I closure. This is acceptable, but should remain simplified for postulants.
- Portal first-meeting report is only visible if the document itself is `postulant_visible`; preliminary meeting report and closure courrier are not exposed in the portal dossier serializer.
- `RequestStatusBadge` has fallback `status`, so any unmapped future status can leak raw enum.

## Document / download matrix

| Document field | Admin detail | Documents tab | Phase workspace evidence | Admin download | Portal visibility |
| --- | --- | --- | --- | --- | --- |
| `firstMeetingReportDocumentId` | yes | yes | yes | allowed by dossier doc allowlist | only if `postulant_visible` |
| `preEvaluationTemplateDocumentId` | yes | yes | yes | allowed by dossier doc allowlist | visible from `pre_eval_form_available` onward |
| `completedPreEvaluationDocumentId` | yes | yes | yes | allowed by dossier doc allowlist | not downloadable; portal has `hasCompletedForm` only |
| `preEvaluationDgAnnotatedDocumentId` | yes | yes | yes | allowed by dossier doc allowlist | not portal-visible |
| `preliminaryMeetingReportDocumentId` | yes | yes | yes | allowed by dossier doc allowlist | not serialized to portal |
| `closureCourrierDocumentId` | yes, optional | yes, optional | yes if present | allowed by dossier doc allowlist | not serialized to portal |

Security result:

- `downloadAdminDossierDocument` verifies dossier existence and matches the
  requested document ID against the six preliminary evidence fields before
  reading storage. Unrelated document IDs are rejected with 403.
- Request-side orientation downloads are separately allowlisted to the request
  initial document, same-request courrier document, or initial DG returned scan.

Gaps:

- Admin download endpoint does not additionally verify document owner after the
  field allowlist; the field match is currently the source of truth and is
  acceptable.
- Portal can download template and first meeting report when visible, but not
  preliminary meeting report or closure courrier. Confirm intended visibility.

## Meeting flow matrix

| Flow | Backend status change | Report behavior | Admin display | Portal display |
| --- | --- | --- | --- | --- |
| Planifier premiere reunion | creates meeting `invited`, preliminary `first_meeting_invited` | none | Reunions tab + workspace | shown in dossier detail and calendar |
| Joindre CR premiere reunion | meeting `held`, preliminary `first_meeting_held` | file optional; linked if present | report download if linked | report download only if visible |
| Planifier reunion preliminaire | creates meeting `invited`, preliminary `preliminary_meeting_invited` | none | Reunions tab + workspace | shown in dossier detail and calendar |
| Joindre CR reunion preliminaire | meeting `held`, preliminary `preliminary_meeting_held` | file optional; linked if present | report download if linked | meeting visible; report not exposed |

Risks:

- Meeting model lacks explicit `heldAt`; UI falls back to `updatedAt`/`createdAt`.
- No postpone/cancel admin flow exists for preliminary meetings, although model supports statuses.
- No explicit participant fields are collected by the preliminary dialogs.
- Outlook/email status is only `to_be_sent_manually`; no send integration.

## Close phase behavior

Result:

- UI shows close after `preliminary_meeting_held` or `preliminary_ready_to_close`.
- Backend close does not require `closureCourrierDocumentId`.
- Closing sets phase status `closed`, preliminaryStatus `preliminary_closed`,
  `closedAt`, and `closedById`.
- Closing also changes dossier status to `formal_request_phase` and starts the
  `formal_request` phase record immediately.
- Portal shows `Phase preliminaire terminee` and tells the applicant the dossier
  moves to the formal request phase.

Blockers:

- None for optional closure courrier.

Phase 2 implication:

- The next phase is already unlocked by backend close. Before implementing Phase
  2 actions, confirm whether automatic Phase 2 start is intended or whether it
  should become a distinct explicit action.

## Permissions audit

Actual mapping from `permissions.ts` and routes:

| Action | dn_agent | dn_supervisor | admin | dg_secretariat | reception / bureau_courrier |
| --- | --- | --- | --- | --- | --- |
| View dossier | yes | yes | yes | no | no |
| Plan meetings | yes | yes | yes | no | no |
| Upload meeting reports | yes | yes | yes | no | no |
| Publish pre-eval form | yes | yes | yes | no | no |
| Send pre-eval to DG circuit | no | no | yes | yes | yes |
| Record DG return | no | no | yes | yes | yes |
| Consult DG return | yes | yes | yes | yes permission, but no dossier route access | yes permission, but no dossier route access |
| Close phase | yes | yes | yes | no | no |

Gaps:

- `PRE_EVAL_DG_RETURN_CONSULT` is granted to DG circuit actors, but dossier
  document downloads require `DOSSIER_VIEW_ALL`, which those roles do not have.
  They can use `/dg-circuit` surfaces, not dossier tabs. This is probably
  intentional after ADMIN-ADJ, but the permission name now overstates access.
- Admin has all permissions, including DG circuit handling, by design.
- UI action guards in `PreliminaryPhaseWorkspace` align with permissions; direct
  backend route guards are present.

## Component health findings

| File | Lines | Risk | Recommendation | Priority |
| --- | ---: | --- | --- | --- |
| `apps/api/src/modules/requests/request.service.ts` | 1500 | urgent monolith | split portal/admin/intake/DG/download concerns | P1 |
| `apps/api/src/modules/oma-phases/oma-phase.service.ts` | 1028 | urgent monolith | extract preliminary transitions, serializers, downloads, portal dossier helpers | P1 |
| `apps/admin/src/pages/dossiers/preliminary-dialogs.tsx` | 723 | large bundled dialogs | split by dialog or form group after stabilization | P1 |
| `apps/admin/src/pages/DgCircuitPage.tsx` | 839 | large page | extract task list/detail/action dialogs | P2 |
| `apps/admin/src/pages/AccountRequestsPage.tsx` | 848 | large page | extract review panel/list helpers | P2 |
| `apps/admin/src/pages/CourriersPage.tsx` | 785 | large page | extract filters, list, detail, status helpers | P2 |
| `apps/admin/src/pages/RequestsPage.tsx` | 615 | growing split-view | extract right-panel tabs and actions | P1 |
| `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx` | 593 | derived timeline logic + UI together | extract event builder and status/date helpers | P1 |
| `apps/portal/src/pages/RequestDetailPage.tsx` | 905 | portal detail monolith | extract dossier block, status guidance, document block | P1 |
| `apps/portal/src/pages/RendezVousPage.tsx` | 524 | calendar + print card + list in one file | extract printable convocation and status helpers | P2 |

Duplications:

- Status label maps exist in admin helpers, dossier tabs, portal API service,
  `RequestStatusBadge`, and meeting pages.
- Blob download/open-new-tab logic is duplicated across dossier document,
  courrier, historique, requests, and DG circuit surfaces.
- Timeline/card-row patterns repeat across Documents, Reunions, Courriers, and
  Historique tabs.

## Delay / SLA readiness

Available fields:

- Request: `submittedAt`, `createdAt`, `updatedAt`, `intake.sentToDgAt`.
- DG review: `sentToDgAt`, `returnedFromDgAt`, `decisionRecordedAt`.
- Dossier: `openedAt`, `closedAt`, timestamps.
- Phase: `startedAt`, `closedAt`, timestamps.
- Meeting: `scheduledAt`, `createdAt`, `updatedAt`.
- Document: `uploadedAt`, timestamps.

Missing or unreliable for SLA:

- First/preliminary meeting `heldAt` is missing.
- Pre-eval form available date is only phase `updatedAt` unless inferred from
  template document/audit log.
- Pre-eval submitted date can be inferred from completed document `uploadedAt`,
  but admin detail does not serialize it.
- Pre-eval sent-to-DG date route input is not stored.
- Pre-eval DG return date route input is not stored on phase/DGReview.
- Phase close courrier optional date is document `uploadedAt` only if present.
- Derived Historique uses some undated events because IDs are serialized without
  document metadata timestamps.

Recommendation:

- Do not implement SLA now. Later add explicit event timestamps or a phase event
  ledger for action dates, and serialize document metadata dates where needed.

## Priority table

| Priority | Finding |
| --- | --- |
| P0 | Confirm or change Phase I close behavior that automatically starts Phase II before implementing Phase 2 UI/actions. |
| P0 | Persist `sentAt` / `returnedAt` or remove inputs before SLA reporting depends on them. |
| P1 | Remove or quarantine dead `pre_eval_dg_returned` status from model/types/UI. |
| P1 | Decide whether meeting reports are mandatory; backend currently accepts missing report files. |
| P1 | Centralize status/meeting label maps and fix portal/admin mojibake. |
| P1 | Extract `oma-phase.service.ts`, `request.service.ts`, `preliminary-dialogs.tsx`, and `DossierHistoriqueTab.tsx` before they grow further. |
| P1 | Add reliable `heldAt` / action timestamps for SLA readiness. |
| P2 | Confirm portal visibility for preliminary meeting report and optional closure courrier. |
| P2 | Factor repeated blob download/open helpers. |
| P2 | Add runtime manual validation with seeded dossiers across every preliminary status. |

## Recommended implementation slices after audit

- OMA-OPS-8A: Phase I transition/date hardening:
  persist sent/return dates, decide auto-start Phase II, clean dead status.
- OMA-OPS-8B: Status/label cleanup:
  central label helpers, French accent/mojibake sweep, portal fallback hardening.
- OMA-OPS-8C: Evidence/SLA readiness:
  document metadata serialization, meeting `heldAt`, report-required decision,
  portal visibility decisions.

## Verification commands run or recommended

Run during audit:

- `rg` searches for preliminary statuses, meeting statuses, document fields, and permissions.
- `Get-Content` targeted reads for required backend/admin/portal files.
- line-count scans for admin dossier files, admin pages, API services, portal files.

Not run:

- API/admin/portal typecheck or build, because this was audit-only and product code was not changed.

Recommended after fixes:

- `cd apps/api; npx tsc --noEmit`
- `cd apps/api; npm run build`
- `cd apps/admin; npx tsc --noEmit`
- `cd apps/admin; npm run build`
- `cd apps/portal; npx tsc --noEmit`
- `cd apps/portal; npm run build`
- Manual seeded runtime checks for each preliminary status and invalid document-id attempts.
