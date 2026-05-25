# Quick Reference

Last updated: 2026-05-22

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

## Current Objective Notes

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
