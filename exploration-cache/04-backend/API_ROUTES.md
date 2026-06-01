# API Routes

Last reviewed: 2026-06-01

## Implemented backend routes in repository

- `GET /health`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/bootstrap/login`
- `POST /api/v1/auth/internal/login`
- `POST /api/v1/auth/internal/change-password`
- `POST /api/v1/auth/logout`
- `POST /api/v1/portal/auth/login`
- `GET /api/v1/portal/auth/me`
- `POST /api/v1/portal/auth/logout`
- `POST /api/v1/portal/account-requests`
- `POST /api/v1/portal/requests`
- `GET /api/v1/portal/requests`
- `GET /api/v1/portal/requests/:id`
- `PATCH /api/v1/portal/requests/:id`
- `POST /api/v1/portal/requests/:id/courrier`
- `POST /api/v1/portal/requests/:id/physical-deposit`
- `POST /api/v1/portal/requests/:id/submit`
- `GET /api/v1/admin/si-users`
- `GET /api/v1/admin/dashboard?preset=today|7d|month|year&from=&to=`
- `GET /api/v1/admin/personnel?search=&page=&limit=`
- `GET /api/v1/admin/internal-accounts`
- `POST /api/v1/admin/internal-accounts/activate`
- `GET /api/v1/admin/organizations?search=&status=`
- `GET /api/v1/admin/account-requests?status=&search=&from=&to=`
- `GET /api/v1/admin/account-requests/:id`
- `POST /api/v1/admin/account-requests/:id/approve`
- `POST /api/v1/admin/account-requests/:id/reject`
- `GET /api/v1/admin/requests`
- `GET /api/v1/admin/dg-circuit/tasks?bucket=&source=&search=`
- `GET /api/v1/admin/dg-circuit/tasks/:taskId/documents/:documentId`
- `GET /api/v1/admin/requests/:id`
- `POST /api/v1/admin/requests/:id/start-intake`
- `POST /api/v1/admin/requests/:id/request-correction`
- `POST /api/v1/admin/requests/:id/register-physical-courrier`
- `POST /api/v1/admin/requests/:id/mark-printed-for-dg`
- `POST /api/v1/admin/requests/:id/record-dg-return`
- `POST /api/v1/admin/requests/:id/send-to-dg`
- `GET /api/v1/admin/dossiers?status=&dossierType=&search=`
- `GET /api/v1/admin/dossiers/:id`
- `GET /api/v1/admin/dossiers/:id/documents/:documentId`
- `POST /api/v1/admin/dossiers/:id/preliminary/invite-first-meeting`
- `POST /api/v1/admin/dossiers/:id/preliminary/record-first-meeting`
- `POST /api/v1/admin/dossiers/:id/preliminary/publish-pre-evaluation-form`
- `POST /api/v1/admin/dossiers/:id/preliminary/invite-preliminary-meeting`
- `POST /api/v1/admin/dossiers/:id/preliminary/record-preliminary-meeting`
- `POST /api/v1/admin/dossiers/:id/preliminary/upload-closure-courrier`
- `POST /api/v1/admin/dossiers/:id/preliminary/close`
- `GET /api/v1/portal/dossiers/:id`
- `POST /api/v1/portal/dossiers/:id/preliminary/upload-pre-evaluation-form`
- `GET /api/v1/portal/meetings?from=&to=&status=planned|invited|held|postponed|cancelled|all`
- `GET /api/v1/portal/notifications?status=unread|read|all&limit=number`
- `POST /api/v1/portal/notifications/read-all`
- `POST /api/v1/portal/notifications/:id/read`
- `GET /api/v1/admin/audit-logs?page=&limit=`
- `GET /api/v1/admin/dossiers/:id/phases/formal-request` - Phase 2 read state (OMA-FORMAL-1)
- `POST /api/v1/admin/dossiers/:id/phases/formal-request/courrier` - Register formal request courrier, admin internal, DOCUMENT_UPLOAD_INTERNAL (OMA-FORMAL-2)
- `POST /api/v1/portal/dossiers/:id/phases/formal-request/courrier` - Upload formal request courrier, portal postulant, ownership-scoped (OMA-FORMAL-2)
- `POST /api/v1/admin/dossiers/:id/phases/formal-request/send-to-dg` - Send formal request to DG circuit, DG_CIRCUIT_HANDLE (OMA-FORMAL-3)
- `POST /api/v1/admin/dossiers/:id/phases/formal-request/dg-return` - Record DG return scan, DG_CIRCUIT_HANDLE, multipart file (OMA-FORMAL-3)
- `POST /api/v1/admin/dossiers/:id/phases/formal-request/dg-decision` - Record DG decision (approved|rejected|reoriented|pending), DG_DECISION_RECORD (OMA-FORMAL-3)
- `POST /api/v1/admin/dossiers/:id/phases/formal-request/meeting` - Create formal meeting, MEETING_MANAGE (OMA-FORMAL-4)
- `POST /api/v1/admin/dossiers/:id/phases/formal-request/meeting/mark-held` - Mark formal meeting held, MEETING_MANAGE (OMA-FORMAL-4)
- `POST /api/v1/admin/dossiers/:id/phases/formal-request/meeting-report` - Upload formal meeting report, DOCUMENT_UPLOAD_INTERNAL, multipart (OMA-FORMAL-4)
- `POST /api/v1/admin/dossiers/:id/phases/formal-request/documents/:requirementId` - Upload supporting document (non-gate), DOCUMENT_UPLOAD_INTERNAL, source=physical_deposit|internal_scan (OMA-FORMAL-5)
- `POST /api/v1/portal/dossiers/:id/phases/formal-request/documents/:requirementId` - Upload supporting document, portal postulant, ownership-scoped, source=portal_upload (OMA-FORMAL-5)
- `GET /api/v1/admin/dossiers/:id/phases/document-evaluation/payment` - Admin Phase 3 payment state, PAYMENT_VIEW (OMA-EVAL-1)
- `POST /api/v1/admin/dossiers/:id/phases/document-evaluation/invoice` - S5/admin uploads study fee invoice, PAYMENT_INVOICE_UPLOAD, multipart file (OMA-EVAL-1)
- `GET /api/v1/portal/dossiers/:id/phases/document-evaluation/payment` - Portal Phase 3 payment state, portal ownership-scoped (OMA-EVAL-1)
- `POST /api/v1/portal/dossiers/:id/phases/document-evaluation/payment-proof` - Postulant uploads payment proof, portal ownership-scoped, multipart file (OMA-EVAL-1)

## Route notes

- Admin routes use authentication plus capability middleware.
- `admin/dashboard` is guarded by admin-scope auth plus `REPORT_VIEW`. It returns persisted dashboard metrics, profile `dn_full` or `courrier_dg`, period stats, current workload, `phaseFocus`, `priorityActions`, recent domain activity, and `meta.unavailableMetrics=["certificates"]` while certificate backend remains unavailable.
- DASH-2R dashboard SLA constants: preliminary 30 business days, formal request 10, document evaluation 30, inspection/demonstration 25, delivery 5.
- DASH-2R priority actions enrich document actions with available document, requirement, phase, and dossier labels.
- `admin/dg-circuit/tasks` is a focused operational task endpoint for DG circuit actors. It is guarded by any of `DG_CIRCUIT_HANDLE`, `COURRIER_REGISTER_PHYSICAL`, or `PRE_EVAL_DG_CIRCUIT_HANDLE`; it does not require or expose `DOSSIER_VIEW_ALL`.
- `admin/dg-circuit/tasks/:taskId/documents/:documentId` downloads only task-linked outgoing or annotated-return documents after validating task ownership and the actor's relevant DG circuit capability.
- `auth/internal/login` accepts `{ matricule, password }`, confirms the matricule still exists in the official personnel adapter, then validates only the local AIDN `passwordHash`.
- `auth/bootstrap/login` and `auth/internal/login` set the HttpOnly admin/internal cookie and do not return JWTs in the response body.
- `auth/bootstrap/login` returns `{ user }`; `auth/internal/login` returns `{ user, requiresPasswordChange }`.
- `auth/internal/change-password` requires a JWT, accepts `{ currentPassword, newPassword }`, enforces a minimum of 8 characters, clears `mustChangePassword`, and activates a `pending_first_login` internal account.
- `auth/logout` clears the admin/internal cookie and returns `{ ok: true }`.
- `admin/internal-accounts/activate` returns `{ account, temporaryPassword }` for local/dev delivery. Production should send the temporary password through a secure channel instead of exposing it in the API response.
- `admin/personnel` reads through the selected personnel adapter. In official mode this is MariaDB via `employee_directory`; response shape is `{ items, page, limit, total }`.
- `portal/account-requests` is public and unauthenticated. It validates required fields, normalizes email, hashes the supplied password, stores raw requested organization data, returns sanitized request data, and does not create a user, organization, membership, session, or demande.
- `portal/account-requests` is protected by route-scoped rate limiting, a hidden `website` honeypot, a minimum `formStartedAt` submission delay, duplicate pending-request guard, and existing-postulant email guard as of AUTH-2F.
- Anti-abuse fields are accepted for validation only and are not stored on `account_requests`.
- `portal/auth/login` accepts `{ email, password }`, only authenticates active users with `userType=postulant` and `role=postulant`, compares the stored password hash, updates `lastLoginAt`, writes audit logs, sets the HttpOnly portal cookie, and returns `{ user }` without `passwordHash` or JWT.
- `portal/auth/me` requires a valid JWT from the portal cookie and rejects internal, inactive, or non-postulant users.
- `portal/auth/logout` clears the portal cookie and returns `{ ok: true }`.
- `portal/requests` routes require the portal cookie, require a postulant user with `organizationId`, and only expose requests where `submittedById` is the current user.
- `POST /portal/requests` creates a draft `Request` for the current user's canonical `organizationId`; it does not create a `Dossier`.
- `PATCH /portal/requests/:id`, courrier upload, and physical deposit declaration are allowed only before submission.
- `POST /portal/requests/:id/courrier` remains as a compatibility endpoint: it accepts multipart `file` plus optional notes, stores a local file, creates a `Document`, upserts initial `Courrier`, and archives any previous uploaded document metadata, but no longer needs to publish an admin-processable workflow milestone.
- `POST /portal/requests/:id/physical-deposit` remains as a compatibility endpoint: it upserts initial `Courrier` with `source=physical_deposit` and stores planned deposit metadata without recording actual receipt.
- `POST /portal/requests/:id/submit` accepts the final courrier mode payload. Portal upload mode requires a file and creates `documentType=initial_courrier`; physical deposit mode requires `plannedPhysicalDepositDate` and `depositLocation`, sets planned physical deposit metadata, sets `submitted`, writes audit, and still does not create a DN dossier.
- `admin/requests` and `admin/requests/:id` are read-only, guarded by `REQUEST_VIEW_ALL`, and expose request/courrier/document summaries for internal users.
- `admin/requests/:id/start-intake` is guarded by `REQUEST_INTAKE_REVIEW`, moves `submitted` to `intake_in_review`, and records intake actor/date/notes.
- `admin/requests/:id/request-correction` is guarded by `REQUEST_INTAKE_REVIEW`, moves submitted/intake requests to `intake_requires_correction`, records reason/actor/date, and creates an in-app postulant notification.
- `admin/requests/:id/register-physical-courrier` is guarded by `COURRIER_REGISTER_PHYSICAL`, requires actual physical deposit date plus multipart scan `file`, records physical reception as `physicalDeposit.status=received`, creates `documentType=initial_courrier_scan`, and updates initial courrier/document refs before DG send.
- `admin/requests/:id/mark-printed-for-dg` is guarded by `DG_CIRCUIT_HANDLE`, records print metadata and now sets `initial_sent_to_dg` directly for the MVP physical DG circuit.
- `admin/requests/:id/record-dg-return` is guarded by `DG_CIRCUIT_HANDLE`, requires multipart `returnedScannedDocument` plus `decision`, `returnedAt`, and optional `observations`, records/updates a `DGReview`, stores the scan as a `documents` registry record, and maps decisions to `oriented_to_dn` or `rejected`.
- `admin/requests/:id/send-to-dg` remains for compatibility, but the current admin UI no longer uses it.
- No backend route rename was made for the print marker; only the admin-facing label is simplified to `Imprimer`.
- Backend request/DG review enums may still include legacy `reoriented`/`redirected` compatibility values, but current UI/workflow no longer exposes or generates reorientation as an MVP path.
- Portal request status serialization maps internal states to simplified applicant labels and avoids exposing printed-DG, scanned-return, or reorientation wording.
- JWTs are RS256-signed as of AUTH-2A. Middleware reads them only from scoped HttpOnly cookies as of AUTH-2D; `Authorization: Bearer` is no longer accepted.
- Unsafe authenticated routes require double-submit CSRF as of AUTH-2E: scoped readable CSRF cookie plus `X-CSRF-Token`.
- Public/login/logout/bootstrap routes and `POST /api/v1/portal/account-requests` are exempt from session CSRF.
- `apps/portal` `/demande-compte` is wired to `POST /api/v1/portal/account-requests` as of PORTAL-1.
- `apps/portal` `/connexion` is wired to `POST /api/v1/portal/auth/login` and uses the HttpOnly `aidn_portal_session` cookie as of AUTH-2C.
- `apps/portal` restores sessions through `GET /api/v1/portal/auth/me`, logs out through `POST /api/v1/portal/auth/logout`, and no longer stores or sends bearer JWTs.
- `admin/account-requests` is guarded by `POSTULANT_ACCOUNT_REVIEW` and supports `status`, `search`, `from`, and `to`. Search covers requested organization name, contact name, contact email, and requested organization email.
- `admin/account-requests/:id/approve` links to an existing active canonical organization or creates a new canonical organization, then creates the postulant user and active organization membership.
- `admin/account-requests/:id/reject` requires a reason and finalizes the request without creating user, organization, or membership records.
- `apps/admin` `/admin/demandes-comptes` is wired to the admin account request review endpoints as of ADMIN-2A.
- `admin/organizations` supports `search` and `status`; search covers canonical name, normalized name, aliases, and email.
- `admin/audit-logs` is guarded by `AUDIT_VIEW`, paginated with `{ items, page, limit, total }`, and enriches actors from `User` records when `actorId` resolves.
- The requested verification endpoints are intentionally read/scaffold-heavy; full request/dossier workflow endpoints are not implemented yet.
- `admin/dossiers` list supports `status`, `dossierType`, and `search` (client-side after populate); returns populated organization and postulant summaries.
- `admin/dossiers/:id` returns full dossier detail plus all OMA phases and preliminary sub-detail (phase record + firstMeeting + preliminaryMeeting).
- Preliminary phase action endpoints are guarded by `MEETING_MANAGE`, `DOCUMENT_UPLOAD_INTERNAL`, `PRE_EVAL_DG_CIRCUIT_HANDLE`, `PRE_EVAL_DG_RETURN_CONSULT`, or `PHASE_CLOSE` per operation.
- `invite-first-meeting` and `invite-preliminary-meeting` create `Meeting` records with `status=invited` and `outlookEmailStatus=to_be_sent_manually`.
- `record-first-meeting` and `record-preliminary-meeting` accept an optional multipart `file` for the meeting report.
- `send-pre-eval-to-dg` and `record-pre-eval-dg-return` are guarded by `PRE_EVAL_DG_CIRCUIT_HANDLE`, assigned to reception / bureau courrier / DG secretariat and admin fallback roles by default, not DN roles.
- `GET /admin/dossiers/:id/documents/:documentId` is guarded by `PRE_EVAL_DG_RETURN_CONSULT` and only downloads the linked `preEvaluationDgAnnotatedDocumentId`; it does not expose the completed postulant pre-evaluation form.
- `publish-pre-evaluation-form` and `upload-closure-courrier` require a mandatory multipart `file`.
- Phase closure requires both `closureCourrierDocumentId` and `preliminaryMeetingReportDocumentId` to be set; missing either returns 400.
- Closing the preliminary phase advances `dossier.status` to `formal_request_phase` and activates the `formal_request` OmaPhase.
- `portal/dossiers/:id` is ownership-scoped (postulantUserId must match) and exposes portal labels + pre-evaluation form availability.
- `portal/dossiers/:id` also exposes a portal-safe Phase 2 `formalRequest` block as of OMA-FORMAL-9B1A: status, portal label, `hasFormalRequestCourrier`, and `canUploadFormalRequestCourrier`; it does not expose DG review IDs or internal DG return/decision details.
- `portal/dossiers/:id/preliminary/upload-pre-evaluation-form` accepts multipart `file`, only allowed at `pre_eval_form_available` state.
- `portal/meetings` is scoped through owned dossiers only: `Meeting.dossierId -> Dossier.postulantUserId === actor.id`. It returns read-only portal-safe meeting fields plus dossier number/type; no create/update/cancel/postpone portal routes exist.
- `portal/meetings` supports optional `from`, `to`, and `status`; `status=all` applies no status filter. With no date range, it uses a default window from 30 days in the past through 180 days in the future and includes unscheduled meetings last.
- `portal/notifications` is scoped to the current portal user (`recipientUserId === actor.id`); supports `status=unread|read|all` (default: all) and `limit` clamped to 50; returns `{ items, unreadCount }`.
- `portal/notifications/read-all` marks all unread notifications for the current portal user as read, returns `{ updatedCount }`.
- `portal/notifications/:id/read` marks a single notification as read; 404 if it doesn't belong to the current user.
- Portal request and courrier responses now use `sanitizePortalRequest` / `sanitizePortalCourrier` - no `intake` or admin tracking fields exposed to postulants.
- Backend `portalStatusLabel()` now covers `initial_dg_returned`, `initial_dg_decision_recorded`, `dossier_opened`; accents fixed; `rejected` → "Demande non retenue"; `reoriented` → "Demande réorientée".
- All preliminary OMA service functions are in `apps/api/src/modules/oma-phases/oma-phase.service.ts`.
- Phase 2 (formal request) service functions are in `apps/api/src/modules/oma-phases/formal-request.service.ts`.
- `POST /admin/dossiers/:id/phases/formal-request/courrier` requires `source=physical_deposit|internal_scan`; `portal_upload` is rejected on admin endpoint.
- `POST /portal/dossiers/:id/phases/formal-request/courrier` hardcodes `source=portal_upload`, verifies postulant owns the dossier, rejects non-owned dossier with 404.
- Duplicate formal request courrier returns 409; no replacement/versioning implemented yet.
- Phase 2 gate: only `formalRequestCourrierId` blocks `canSendToDg`; supporting checklist is non-blocking.
- `getOwnedDossier` is exported from `oma-phase.service.ts` for reuse by Phase 2 service.
- Phase 2 DG circuit reuses generic `createDgReview`, `recordDgReturn`, `recordDgDecision` from `dg-circuit.service.ts`; `targetType="formal_request"`.
- `send-to-dg` blocks if `formalRequestCourrierId` absent or DGReview already exists.
- `dg-return` stores `documentType=dg_annotated_courrier` under `ownerType=dg_review`.
- `dg-decision approved` → `formalRequestStatus=formal_dg_decision_recorded` → unlocks `canInviteFormalMeeting`.
- `dg-decision rejected|reoriented|pending` → `formalRequestStatus=formal_requires_correction`; meeting NOT unlocked; no auto-close.
- TODO: formal rejection/reorientation final business flow needs PO validation before adding closure logic.
- Formal meeting creation requires `formalRequestStatus="formal_dg_decision_recorded"` (approved DG decision); creates in-app notification for postulant.
- `meeting/mark-held` sets `formalRequestStatus=formal_meeting_held`, `status=in_progress`, `formalMeetingHeldAt`.
- `meeting-report` uploads `documentType=meeting_report` under `ownerType=meeting`; sets `Meeting.reportDocumentId` and `OmaPhase.formalMeetingReportDocumentId`; does not auto-close.
- `getAdminFormalRequestPhase` now includes optional `meeting` block in response.
- Phase 2 closure (recevability + closure courrier) deferred to OMA-FORMAL-6.
- Supporting document endpoints reject gate requirement (`requirementLevel=gate`) with 409.
- Non-repeatable requirements block duplicate active submissions (409).
- Repeatable requirements allow multiple submissions.
- Supporting doc uploads do NOT mutate formalRequestStatus, canSendToDg, canInviteFormalMeeting, canClosePhase.
- `Document.documentType` is conservatively set to "other" for supporting docs; semantic link is via `DocumentSubmission.requirementId`.
- Phase 3 payment routes use `PAYMENT_VIEW` (read) and `PAYMENT_INVOICE_UPLOAD` (write) permissions introduced in OMA-EVAL-1.
- `s5_agent` role introduced: has `DOSSIER_VIEW_ALL`, `DOCUMENT_UPLOAD_INTERNAL`, `PAYMENT_INVOICE_UPLOAD`, `PAYMENT_VIEW`, `REPORT_VIEW`.
- `reception` role gains `PAYMENT_INVOICE_UPLOAD` and `PAYMENT_VIEW`.
- `dn_agent` and `dn_supervisor` gain `PAYMENT_VIEW`.
- Phase 3 admin invoice upload endpoint auto-creates `PhasePayment` for study_fee if not yet present; blocks re-upload once payment proof is submitted.
- Portal payment proof upload requires invoice to exist first (409 otherwise); re-upload (overwrite) is allowed.
- `canStartDocumentEvaluation = invoiceDocumentId && paymentProofDocumentId` — no payment validation/rejection in this slice.
- OmaPhase.documentEvaluationStatus transitions: `document_evaluation_waiting_invoice` → (after invoice upload) `document_evaluation_waiting_payment` → (after proof upload) `document_evaluation_payment_proof_submitted`.

### Phase 3 evaluation routes (OMA-EVAL-2)

- `GET /api/v1/admin/dossiers/:id/phases/document-evaluation/evaluations` — returns all DocumentEvaluation records for Phase 3; auto-initializes from Phase 2 submissions on first call after payment gate passed [DOCUMENT_REVIEW]
- `PATCH /api/v1/admin/dossiers/:id/phases/document-evaluation/evaluations/:evaluationId` — review one evaluation: status=satisfaisant|non_satisfaisant, annotation required for non_satisfaisant [DOCUMENT_REVIEW]
- Initialization is idempotent: one DocumentEvaluation per non-gate Phase 2 requirement (latest active submission); gate requirements (requirementLevel="gate") are excluded.
- Auto-init runs when `documentEvaluationStatus` is in the PAYMENT_PASSED set (payment_proof_submitted or later).
- After init, `documentEvaluationStatus` advances to `document_evaluation_study_in_progress` (from `payment_proof_submitted`).
- After each review, `documentEvaluationStatus` is recomputed: any non_satisfaisant → `waiting_corrections`; all satisfaisant → `ready_to_close`; mixed pending+satisfaisant → stays `study_in_progress`.
- Annotation is required when status=non_satisfaisant; re-review is allowed (status can change).
- Audit events: `document_evaluation.evaluation_satisfaisant` / `document_evaluation.evaluation_non_satisfaisant`.

### Phase 3 correction upload route (OMA-EVAL-3)

- `POST /api/v1/portal/document-evaluations/:evaluationId/correction` — portal uploads corrected document for a non_satisfaisant evaluation [portal auth, ownership derived from evaluation.dossierId]
- Guard: evaluation.status must be `non_satisfaisant`; annotation must exist; phase not closed; dossier must belong to postulant
- Creates a Document (ownerType="phase", category="form", documentType="corrected_document", visibility="postulant_visible")
- Creates a DocumentSubmission (phaseKey="document_evaluation", submittedByRole="postulant", source="portal_upload")
- Updates evaluation: submissionId → new submission, correctionSubmissionId, correctionSubmittedAt, correctionSubmittedById, status="correction_submitted"
- Previous annotation and reviewedById/reviewedAt are preserved (portal shows last DN annotation until re-review)
- Calls syncEvaluationStatus: correction_submitted → study_in_progress (if no non_satisfaisant remain)
- DN re-reviews via existing PATCH evaluations/:evaluationId endpoint (correction_submitted accepted as starting status)
- Audit event: `document_evaluation.correction_submitted`
- Notifies assignedDnAgentId if set; no notification if absent (audit event always written)
- Deferred: "Ajouter ce document à l'évaluation" admin action (ad-hoc doc inclusion without requirement link)

### Phase 3 close route (OMA-EVAL-4)

- `POST /api/v1/admin/dossiers/:id/phases/document-evaluation/close` — close Phase 3, unlock Phase 4 [PHASE_CLOSE]
- Guard: Phase 3 must exist and not be closed; all evaluations must be satisfaisant (0 pending/non_satisfaisant/correction_submitted); total evaluations > 0
- Guard is server-side aggregate from DB (not trusting stored documentEvaluationStatus)
- Sets Phase 3: status=closed, documentEvaluationStatus=document_evaluation_closed, closedAt, closedById
- Sets dossier.status = inspection_phase
- Creates/activates Phase 4 OmaPhase (phaseKey="inspection", status="in_progress")
- Notifies postulant in-app
- Audit event: document_evaluation.phase_closed
- No closure courrier upload required — official communication handled outside AIDN

## Frontend-expected route patterns (generic/items only)

- /items
- /items/:id
  (from apps/admin/src/features/items/api/items.api.ts)

## Admin frontend API wiring

- `apps/admin/src/lib/api/auth.api.ts` wires bootstrap login, internal login, current session, and password change.
- `apps/admin/src/lib/api/admin.api.ts` wires personnel search, internal account activation/listing, and audit logs.
- Legacy `apps/admin/src/features/aidn/api/aidn.api.ts` remains mock-only for request/dossier workflow screens; do not infer those workflows are API-backed yet.
