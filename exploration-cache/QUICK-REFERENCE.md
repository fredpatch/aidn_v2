# Quick Reference

Last updated: 2026-05-28

## OMA-1H Hardening Audit Notes (2026-05-22)

- `uploadClosureCourrier` service function exists but no admin route is wired and no UI in DossierDetailPage.tsx.
- `pre_eval_dg_returned` is a dead status - never set by backend; remove from labels, model, and UI.
- `SendToDgPanel` wording in DossierDetailPage.tsx ("Envoyer au DG") contradicts physical circuit language - fix to "Marquer mis en circuit officiel".
- `returnsToRegister` count == `awaitingReturn` count in dg-circuit.service.ts - needs fix.
- Portal `isSubmitted` banner persists after dossier is open - suppress when `request.dossierId` is set.
- "Circuit DG" → "Circuit officiel" rename pending (nav + page title).
- French accent sweep needed in both portal and admin UI strings.
- Reusable patterns: `InviteMeetingForm`, `RecordMeetingForm`, `saveDocument`, `STATUS → portal label` map, per-status sub-components.
- H1 slice is next; see current-task.md and summary for full roadmap.

## ADMIN-ADJ-1 Notes (2026-05-25)

- `dn_agent` and `dn_supervisor` no longer have `DG_CIRCUIT_HANDLE` - they cannot access `/circuit-dg` (Courriers officiels) and cannot see Imprimer/Retour DG buttons in Demandes page.
- `dn_supervisor` also lost `COURRIER_REGISTER_PHYSICAL` - the any-of guard on `/circuit-dg` required both to be removed.
- `Demandes` page refactored to split-view: `lg:grid lg:grid-cols-[2fr_3fr]` left-list + right-detail, auto-selects first item on load.
- `Ouvrir dossier` → `Démarrer la phase préliminaire` (UI label only, backend enum unchanged).
- `Prêt pour phase préliminaire` emerald badge shown in detail panel when `canOpenDossier` is true.
- Permission constants changed: `dn_supervisor` lost `DG_CIRCUIT_HANDLE`, `COURRIER_REGISTER_PHYSICAL`; `dn_agent` lost `DG_CIRCUIT_HANDLE`.

## OMA-FORMAL-14 Notes (2026-05-28)

- `GET /api/v1/portal/document-templates/:id/download` added - portal-safe, guarded by `phaseKey=formal_request` and `isActive`
- `getPortalDossier` now returns `formalRequest.requirements[]`, `formalRequest.progress`, `formalRequest.formalMeeting`
- Phase 2 templates use `documentType: "other"` + unique `code` field; linked to requirements via `DocumentRequirement.formCode` matching `DocumentTemplate.code`
- Admin SettingsPage extended with 3 Phase 2 template slots: DN-AIR-R2-3-F-E-010, DN-AIR-R2-3-F-E-012, DN-AIR-R2-3-F-E-011
- Portal `Phase2DocumentChecklist` component handles status display, template download, and per-row upload
- Portal `hasFormalDocRequired` flag drives Actions requises badge and guidance card
- No portal download endpoint for submitted supporting documents yet

## OMA-HARDENING-2 Notes (2026-05-28)

- Portal Phase 2 active submission statuses are now `submitted`, `under_review`, `validated`, `requires_correction`, `incomplete`, and `rejected`.
- Portal `incomplete` and `rejected` statuses stay visible; they no longer collapse to `missing`.
- Portal Phase 2 progress `missing` counts only `expected` requirements with `status === "missing"`.
- Conditional/optional missing Phase 2 requirements remain visible in the checklist but do not trigger `Actions requises`.
- Portal re-upload is available for `missing`, `requires_correction`, `incomplete`, and `rejected`.
- `rejected` is treated as a re-upload-needed blocking status for portal UX.

## Current Objective Notes

- OMA-FORMAL-9B0 implemented:
  - Summary: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b0-phase-2-actor-responsibility-fix.md`.
  - Phase 2 admin workspace is now read/progression-only. All 4 action buttons removed from `FormalRequestPhaseWorkspace`.
  - Courrier formel section: missing state shows WaitingState + Note directing to portal/Courriers officiels; portal-upload source displays "Demande formelle reçue via le portail."
  - Circuit DG section: read-only StepLines + Note "Le circuit DG est traité depuis l'espace Courriers officiels." No action buttons.
  - `nextActionLabel` updated: 5 conditions keyed on gate.exists / sentToDg / dgReturned / dgDecisionRecorded.
  - `formal-request-dialogs.tsx` preserved (unused) for future Courriers officiels integration.
  - Actor split: Portal → postulant upload; Courriers officiels → DG circuit actions; DN workspace → read state + réunion formelle.
- OMA-FORMAL-9A implemented:
  - Summary: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9a-admin-phase-2-read-workspace-implementation.md`.
  - Admin `DossierPhasesTab` now renders `FormalRequestPhaseWorkspace` when Phase 2 (`formal_request`) is selected.
  - `apps/admin/src/lib/api/dossiers.api.ts` includes `getAdminFormalRequestPhase(dossierId)` for `GET /api/v1/admin/dossiers/:id/phases/formal-request`.
  - Workspace is read-oriented: formal request gate, document tracking, DG circuit state, formal meeting, closure evidence, and backend close readiness.
  - Supporting documents are displayed as tracking only; wording keeps formal request courrier as the only blocking gate.
  - No backend changes, portal changes, Phase 2 document downloads, or mutation wiring were added.
- OMA-FORMAL-9A Phase 1 alignment adjustment implemented:
  - Summary: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9a-phase-1-alignment-implementation.md`.
  - `DossierPhasesTab` now loads Phase 2 read state for both the left active progression card and the right workspace.
  - Added `FormalRequestPhaseChecklist` and `formal-request-progress.helpers.ts` with seven Phase 2 workflow steps.
  - `FormalRequestPhaseWorkspace` now uses chronological Phase-1-like sections instead of dashboard-style blocks.
  - Still read-only: no backend, portal, mutation dialog, fake data, or download changes.
- OMA-FORMAL-9B1 implemented:
  - Summary: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1-admin-gate-dg-actions-implementation.md`.
  - Phase 2 admin workspace now wires formal courrier registration, physical DG/parapheur circuit marking, and DG return plus decision recording.
  - API client additions use confirmed formal routes: `/courrier`, `/send-to-dg`, `/dg-return`, and `/dg-decision`.
  - `DossierPhasesTab` remains the Phase 2 state owner; mutation success updates local read state and refreshes dossier detail.
  - Supporting documents remain tracking-only and do not gate DG circuit placement.
- OMA-FORMAL-9B1A implemented:
  - Summary: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1a-portal-formal-request-upload-implementation.md`.
  - Portal `RequestDetailPage` now shows Phase 2 formal request upload in `Actions requises` when preliminary is closed and the formal request gate is missing.
  - Portal upload posts multipart `file` plus optional `notes` to `POST /api/v1/portal/dossiers/:id/phases/formal-request/courrier`; backend sets `source=portal_upload`.
  - `getPortalDossier` exposes a portal-safe `formalRequest` block with simple labels and no internal DG return/decision controls.
- OMA-FORMAL-9B1B implemented:
  - Summary: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1b-admin-physical-dg-circuit-actions-implementation.md`.
  - Admin Phase 2 now presents formal courrier admin upload only as the fallback `Scanner / enregistrer un courrier reçu hors portail`.
  - Portal-uploaded formal request courriers display as `Téléversé par le postulant`.
  - `Mettre en circuit DG` wording now describes the physical DG/parapheur circuit and remains gated by backend `canSendToDg`.
  - DG return scan and DG decision are separate admin actions/dialogs using `/dg-return` and `/dg-decision` respectively.
- OMA-FORMAL-9C1 implemented:
  - Summary: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9c1-phase-2-phase-1-visual-sync-implementation.md`.
  - Phase 2 right panel now renders as one Phase-1-like workspace card with lightweight internal sections instead of stacked full cards.
  - `Réunion formelle` and `Documents de demande formelle` sit side by side on wide screens and stack on smaller screens.
  - `Démarrée le` falls back to the formal request reception date when the phase record start date is missing.
  - Guided `Prochaine action` remains the final right-panel block.
- OMA-OPS-8A Phase I hardening implemented:
  - Summary: `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8a-phase1-transition-date-hardening.md`.
  - Phase I close now keeps dossier status `formal_request_phase` but leaves/creates formal request phase as `not_started`; no Phase 2 actions were added.
  - `OmaPhase` now persists `preEvaluationSentToDgAt` and `preEvaluationReturnedFromDgAt`.
  - `Meeting` now has `heldAt`, set when first/preliminary meetings are recorded as held.
  - First/preliminary meeting reports are required when marking the meeting held.
  - `pre_eval_dg_returned` was removed from active admin type/label/progress paths and from the OMA phase enum; the audit action name remains only as history text.
- OMA-OPS-8 preliminary hardening audit complete:
  - Summary: `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8-preliminary-hardening-audit.md`.
  - Audit only; no product code changed.
  - Preliminary transitions are strict 409 rejections for invalid/repeated actions, not idempotent retries.
  - Closure courrier upload is optional; backend close accepts `preliminary_meeting_held` or `preliminary_ready_to_close`.
  - Closing Phase I automatically moves the dossier to `formal_request_phase` and starts the formal request phase record; confirm before Phase 2.
  - `sentAt`/`returnedAt` inputs for pre-eval DG circuit are not persisted, and `pre_eval_dg_returned` remains dead.
  - Admin dossier document downloads are allowlisted to the six preliminary evidence fields and reject unrelated document IDs.
- OMA-OPS-8A implemented:
  - `DossierCertificatTab` is now a frontend-only readonly readiness view and receives `AdminDossierDetail`.
  - The tab derives status from dossier status and any delivery phase in `detail.phases`.
  - It shows dossier-derived certificate information, delivery phase status/dates, expected certificate document placeholders, target lifecycle preview, and a no-actions explanation.
  - No backend changes, certificate model/API, mutation actions, upload actions, DG circuit actions, Outlook, or email behavior were added.
- OMA-OPS-8 planning complete:
  - No real certificate backend model/API exists yet; `CertificatsPage` is mock/demo only.
  - Existing `DocumentTemplateModel` supports `certificate_template` and delivery phase templates, but certificate generation/storage workflow is not implemented.
  - Recommended next backend slice is OMA-OPS-8B: `CertificateModel`, permissions, admin routes, dossier serializer extension, and certificate document download allowlist.
- OMA-OPS-7B implemented:
  - `DossierHistoriqueTab` remains frontend-only and still derives events from `AdminDossierDetail`.
  - Local history events now include `importance` (`milestone`/`detail`) and `group` metadata for compact filtering.
  - Default filter is `Jalons`; additional filters are `Tous`, `Reunions`, `Documents`, `Courriers`, and `DG`.
  - KPI row shows duration since opening, active phase, total event count, and latest dated activity.
  - Timeline initially shows 6 filtered events; `Afficher plus` adds 6 and filter changes reset the count.
  - Meeting planned rows are detail events when the meeting was held, reducing duplicate noise in milestone mode.
  - Ordinary document events are detail-only; DG pre-evaluation return remains a milestone.
  - No backend changes, audit API calls, mutation actions, upload actions, DG circuit actions, or Outlook/email behavior were added.
- OMA-OPS-7 implemented:
  - `DossierHistoriqueTab` is frontend-only and receives `AdminDossierDetail`.
  - Timeline events are derived from dossier opening, preliminary phase start/closure, preliminary meetings, preliminary documents, OMA-OPS-6 courriers, and DG orientation fields.
  - Events sort oldest-first; events without dates render last with `Date non renseignee`.
  - Existing download helpers are reused: `downloadDossierDocument` for dossier documents and `downloadRequestOrientationDocument` for request-side courrier/orientation documents.
  - No backend changes, audit API calls, mutation actions, upload actions, DG circuit actions, or Outlook/email behavior were added.
- OMA-OPS-6 implemented:
  - `getAdminDossier` exposes consultation-only `courriers.initialCourrier` and `courriers.initialDgOrientation` metadata from existing request/courrier/DG review/document fields.
  - Request-side document downloads remain guarded by `REQUEST_VIEW_ALL` and only allow `Request.initialDocumentId`, the linked `Courrier.documentId`, or the linked initial `DGReview.returnedScannedDocumentId`.
  - `DossierCourriersTab` renders Demande initiale, Phase preliminaire, and Phases suivantes sections.
  - Initial courrier/orientation downloads use `downloadRequestOrientationDocument`; preliminary DG return and optional closure courrier use `downloadDossierDocument`.
  - Closure courrier remains optional/non-joint when absent; no upload, DG circuit action, print action, Outlook/email, or permission loosening was added.
- OMA-OPS-5 implemented:
  - `DossierMeetingsTab` uses existing `AdminDossierDetail.preliminary` data; no backend/API change was needed.
  - Reunions tab shows a compact event strip plus two Phase preliminaire meeting cards.
  - Report downloads use OMA-OPS-4 `downloadDossierDocument`.
  - No Outlook/email behavior or new meeting creation flow was added.
- OMA-OPS-4 implemented:
  - `GET /api/v1/admin/dossiers/:id/documents/:documentId` is guarded by `DOSSIER_VIEW_ALL`.
  - Admin dossier document download allows only linked preliminary evidence fields: first meeting report, pre-evaluation template, completed pre-evaluation form, DG annotated return, preliminary meeting report, optional closure courrier.
  - `DossierDocumentsTab` uses existing dossier detail data; no listing endpoint or GED flow was added.
  - Preliminary phase workspace evidence buttons download all available preliminary documents.
  - Closure courrier remains optional.
- PORTAL-H1D-1 implemented:
  - Rendez-vous meeting cards and selected-day calendar items expose `Voir la convocation` and `Imprimer`.
  - Convocation card is frontend-only, uses existing `PortalMeeting` data and current portal user name, and prints via browser print.
  - Print CSS hides app chrome/buttons and prints only `.print-area` in a clean black/white layout.
  - No backend, PDF generation, document registry, acknowledgement, email, QR code, or new dependency was added.
- PORTAL-H1D implemented:
  - Added read-only `GET /api/v1/portal/meetings`, scoped by `Meeting.dossierId -> Dossier.postulantUserId === portal actor id`.
  - Default meeting window is 30 days past through 180 days future; unscheduled meetings are included last only for default-window queries.
  - Added portal `/rendez-vous`, `PortalCalendar`, sidebar link, and dashboard next rendez-vous card.
  - No meeting mutation, Outlook, notification, shadcn, or date-fns dependency was added.
- ROLE-UX-1A implemented:
  - Circuit DG physical action wording must not imply digital sending.
  - Pre-evaluation DG return upload route expects multipart field `file`.
  - Initial request DG return upload route expects multipart field `returnedScannedDocument`.
  - Circuit DG now sends only the field expected by the target endpoint.
- ROLE-UX-1 implemented:
  - Do not grant `DOSSIER_VIEW_ALL` to DG circuit actors.
  - Added a focused `Circuit DG` workspace backed by `GET /api/v1/admin/dg-circuit/tasks`, guarded by DG circuit capabilities.
  - `/dossiers` and `/dossiers/:id` should remain DN/admin full-workflow surfaces guarded by `DOSSIER_VIEW_ALL`.
  - Task sources: initial request DG circuit and preliminary pre-evaluation DG circuit.
- OMA-1F corrected pre-evaluation responsibility:
  - `PRE_EVAL_DG_CIRCUIT_HANDLE` handles completed form physical DG transmission and annotated-return registration.
  - `PRE_EVAL_DG_RETURN_CONSULT` allows consulting/downloading the registered annotated DG return.
- Default DN roles do not receive `PRE_EVAL_DG_CIRCUIT_HANDLE`.
- Reception, bureau courrier, and DG secretariat receive `PRE_EVAL_DG_CIRCUIT_HANDLE`.
- DN continuation is gated by `pre_eval_dg_decision_recorded` plus linked `preEvaluationDgAnnotatedDocumentId`.

## Verification

- API build: `npm run build` in `apps/api`.
- Admin typecheck: `npx tsc --noEmit` in `apps/admin`.
- Admin build: `npm run build` in `apps/admin`; may need outside-sandbox rerun for Tailwind native Windows binary.
