# Current Task

## Phase: OMA-EVAL-6D — Portal Phase 3 Action Block

Date: 2026-06-01
Status: **Complete — portal tsc 0 errors**

## Files changed

- NEW: `apps/portal/src/components/Phase3DocumentEvaluationBlock.tsx`
- MOD: `apps/portal/src/pages/RequestDetailPage.tsx` (import + block in Dossier tab)

## Phase 3 full chain complete: OMA-EVAL-1 → OMA-EVAL-6D ✅

## Next step

**OMA-EVAL-7** — Cross-tab polish (deferred) — OR commit + push current work

---

## Phase: OMA-EVAL-6B — Backend Portal Phase 3 Read State + Download Support

Date: 2026-06-01
Status: **Complete — API typecheck PASS, API build PASS**

## Files changed

- MOD: `apps/api/src/modules/oma-phases/document-evaluation.service.ts` — `getPortalDocumentEvaluationState` added
- MOD: `apps/api/src/modules/oma-phases/oma-phase.service.ts` — `downloadPortalDossierDocument` Phase 3 branches
- MOD: `apps/api/src/modules/portal/portal.routes.ts` — import + GET `/dossiers/:id/phases/document-evaluation`

---

## Phase: OMA-EVAL-S5-3 — Full Facturation S5 Workspace UI

Date: 2026-06-01
Status: **Complete — tsc 0 errors**

## Files changed

Modified: `apps/admin/src/pages/FacturationS5Page.tsx` (placeholder → full workspace)

---

## Phase: OMA-EVAL-S5-2 — Frontend API Client + Route/Nav

Date: 2026-06-01
Status: **Complete — tsc 0 errors**

## Files changed

New: `apps/admin/src/lib/api/payments.api.ts`, `apps/admin/src/pages/FacturationS5Page.tsx`
Modified: `apps/admin/src/App.tsx` (import + route), `apps/admin/src/config/nav.tsx` (Receipt import + entry)

---

## Phase: OMA-EVAL-S5-1 — Backend S5 Payment Task List Endpoint

Date: 2026-06-01
Status: **Complete — typecheck 0 errors**

## Summary file

- Implementation: `exploration-cache/tasks/summaries/2026-06-01-oma-eval-s5-1-payment-task-list-endpoint.md`

## Files changed

New: `apps/api/src/modules/payments/phase-payment.service.ts`
Modified: `apps/api/src/modules/admin/admin.routes.ts` (import + GET /payments/phase-payments route)

## Key design

- OmaPhase-first query to capture phases with no PhasePayment (synthesize invoice_pending)
- Counts computed before status filter (tab badge accuracy)
- Sort: invoice_pending first, then invoice_sent, then payment_proof_submitted

## Next step

**OMA-EVAL-S5-2** — Frontend API client types + nav/route:
- `PhasePaymentTask`, `PhasePaymentTaskList` types
- `listPhasePaymentTasks(filters?)` method
- Route `/facturation-s5` in App.tsx
- Nav entry in nav.tsx

---

## Phase: OMA-EVAL-S5-0 — S5 Payment Workspace Audit & Planning

Date: 2026-06-01
Status: **Complete — planning only**

## Summary file

- Planning: `exploration-cache/tasks/summaries/2026-06-01-oma-eval-s5-0-internal-payment-workspace-planning.md`

## Key findings

- `DgCircuitPage` is the canonical two-panel workspace pattern to clone
- `SplitView columns="[2fr_3fr]"` — simple CSS grid
- Route pattern: `ProtectedRoute permissions={["PAYMENT_VIEW"]}` (any-of)
- Nav: add to "Traitement" group in `nav.tsx`
- **Backend gap**: no payment list endpoint; S5-1 must create one
- Reusable: `UploadInvoiceDialog`, `downloadDossierDocument`, `SkeletonCard`, `EmptyState`

## Next step

**OMA-EVAL-S5-1** — backend `listPhasePaymentTasks` service + `GET /api/v1/admin/payments/phase-payments` route

---

## Phase: OMA-EVAL-5B — Admin Phase 3 Workspace UI

Date: 2026-06-01
Status: **Complete — tsc 0 errors (admin + api), wired in DossierPhasesTab**

## Summary file

- Implementation: `exploration-cache/tasks/summaries/2026-06-01-oma-eval-5b-admin-phase-3-workspace.md`

## Files changed

New: `document-evaluation-progress.helpers.ts`, `document-evaluation-dialogs.tsx`, `DocumentEvaluationPhaseWorkspace.tsx`
Modified: `dossier-detail.labels.ts` (3 label maps), `DossierPhasesTab.tsx` (doc_eval case wired), `dossiers.api.ts` (correctionDocument type), `document-evaluation.service.ts` (correctionDocument in response)

## Next step

**OMA-EVAL-6A** — Portal Phase 3 API client + types in `portal.api.ts`

---

## Phase: OMA-EVAL-5A-1 — Backend Phase 3 Document Download Fix

Date: 2026-06-01
Status: **Complete — typecheck 0 errors**

## Summary file

- Implementation: `exploration-cache/tasks/summaries/2026-06-01-oma-eval-5a-1-phase-3-document-download-backend-fix.md`
- History: `exploration-cache/tasks/history/2026-06-01-oma-eval-5a-1-phase-3-document-download-backend-fix.md`

## Files changed

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
  - Added `PhasePaymentModel` import
  - Extended `downloadAdminDossierDocument` with Phase 3 authorization branches

## Authorization waterfall (final state)

1. Phase 1 preliminary evidence fields → allow
2. Phase 2 formal_request submission → allow
3. Phase 3a PhasePayment invoiceDocumentId/paymentProofDocumentId → allow
4. Phase 3b document_evaluation submission → allow
5. Otherwise → 403

## Next step

**OMA-EVAL-5B** — Admin Phase 3 workspace component. Download support now unblocked.

---

## Phase: OMA-EVAL-5A — Admin Phase 3 API Client + Types

Date: 2026-06-01
Status: **Complete — tsc 0 errors**

## Summary file

- Implementation: `exploration-cache/tasks/summaries/2026-06-01-oma-eval-5a-admin-api-client-types.md`
- History: `exploration-cache/tasks/history/2026-06-01-oma-eval-5a-admin-api-client-types.md`

## Files changed

- `apps/admin/src/lib/api/dossiers.api.ts` — 14 types + 5 methods added, `apiPatch` imported

## Key decisions

- Backend enum values: French (`satisfaisant`, `non_satisfaisant`, `pending`, `correction_submitted`)
- `reviewDocumentEvaluation` → `AdminDocumentEvaluationReviewResult` (single eval + phase, not full list)
- `downloadDossierDocument` does NOT cover Phase 3 docs — documented as TODO in dossiers.api.ts

## Open risks

- R3: Phase 3 document download needs backend extension (phase_payment + phase ownerTypes not covered)

## Next step

**OMA-EVAL-5B** — Admin Phase 3 workspace component:
- `document-evaluation-progress.helpers.ts` — visibility + progress state machine
- `document-evaluation-dialogs.tsx` — UploadInvoiceDialog, ReviewDocumentDialog, ClosePhaseDialog
- `DocumentEvaluationPhaseWorkspace.tsx` — full 5-section workspace
- `dossier-detail.labels.ts` — `documentEvaluationStatusLabels` map

## Phase: OMA-EVAL-5 — Phase 3 UI Audit & Planning

Date: 2026-06-01
Status: **Complete — audit/planning only**

## Summary file

- Planning: `exploration-cache/tasks/summaries/2026-06-01-oma-eval-5-phase-3-ui-audit-planning.md`
- History: `exploration-cache/tasks/history/2026-06-01-oma-eval-5-phase-3-ui-audit-planning.md`

## Phase: OMA-EVAL-4 — Backend Phase 3 Close + Unlock Phase 4

Date: 2026-06-01
Status: **Complete — API typecheck PASS, build PASS**

## Summary file

- Implementation: `exploration-cache/tasks/summaries/2026-06-01-oma-eval-4-phase-close-implementation.md`
- History: `exploration-cache/tasks/history/2026-06-01-oma-eval-4-phase-close.md`

## Files changed

- MOD: `apps/api/src/modules/oma-phases/document-evaluation.service.ts` — added closeDocumentEvaluationPhase
- MOD: `apps/api/src/modules/admin/admin.routes.ts` — added POST close route + import

## Next step

Implement **OMA-EVAL-5** (admin Phase 3 workspace UI):
- `DocumentEvaluationPhaseWorkspace.tsx` component
- Payment state display + invoice download link
- Evaluation list with satisfaisant/non_satisfaisant review controls
- Correction submission indicator
- Phase close button (guards: ready_to_close)

## Phase: OMA-EVAL-3 — Backend Correction Upload Loop

Date: 2026-06-01
Status: **Complete — API typecheck PASS, build PASS**

## Phase: OMA-EVAL-2 — Backend Document Evaluation

Date: 2026-06-01
Status: **Complete — API typecheck PASS, build PASS**

## Phase: OMA-EVAL-1 — Backend Payment Gate

Date: 2026-06-01
Status: **Complete — API typecheck PASS, lint PASS, build PASS**

## Phase: OMA-EVAL-0 — Phase 3 Audit + Implementation Plan

Date: 2026-06-01
Status: **Complete — planning only**

---

## Phase: DASH-2R - Dashboard UI / Runtime Correction Pass

Date: 2026-05-29
Status: **Complete - API PASS, Admin PASS**

## Summary file

- Implementation: `exploration-cache/tasks/summaries/2026-05-29-dash-2r-dashboard-correction-pass.md`
- History: `exploration-cache/tasks/history/2026-05-29-dash-2r-dashboard-correction-pass.md`

## Cache status

- Cache read first per protocol.
- DASH-2 dashboard is API-backed and functional.
- DASH-2R was a narrow correction pass only.
- `frontend-design` Swiss direction preserved: compact institutional ledger, no redesign.

## Completed scope

- Corrected OMA dashboard SLA expected business-day constants.
- Corrected placeholder phase badge behavior for not-implemented phases with active dossiers.
- Corrected unavailable certificate metric badges to show `Non disponible`.
- Improved priority action secondary labels using backend document, requirement, phase, and dossier metadata.
- Cleaned French labels and accents in touched dashboard code.
- Did not add charts, exports, certificate backend, workflow actions, or new sections.

## Verification

- API: `npm run typecheck` PASS
- API: `npm run build` PASS
- Admin: `npx tsc --noEmit` PASS
- Admin: `npm run build` PASS after outside-sandbox rerun for known Vite/Tailwind native Windows binary issue

---

## Phase: DASH-2 - Admin Dashboard UI Integration planning

Date: 2026-05-29
Status: **Complete - API PASS, Admin PASS**

## Summary file

- Planning: `exploration-cache/tasks/summaries/2026-05-29-dash-2-admin-dashboard-ui-integration-planning.md`
- Implementation: `exploration-cache/tasks/summaries/2026-05-29-dash-2-admin-dashboard-ui-integration.md`
- History: `exploration-cache/tasks/history/2026-05-29-dash-2-admin-dashboard-ui-integration.md`

## Cache status

- Cache read first per protocol.
- DASH-1 backend route exists: `GET /api/v1/admin/dashboard`.
- Admin dashboard still needs frontend API integration.
- Source inspection found a DASH-2 contract gap: backend currently lacks `today`, `7d`, `year`, `phaseFocus`, and `priorityActions`, while React must not recalculate dashboard business metrics.
- `frontend-design` skill applied with Swiss anchor: compact institutional ledger, hairline grouping, real labels/data only.

## Completed scope

- Added a typed admin dashboard API client.
- Replaced mock/demo dashboard reads in `DashboardPage.tsx` with React Query against `/api/v1/admin/dashboard`.
- Added period selector, loading/error states, profile-aware sections, phase focus, priority actions, recent activity, and certificate unavailable display.
- Applied narrow backend dashboard contract correction only for missing presets/fields required by DASH-2.
- Updated required cache/docs.

## Verification

- API: `npm run typecheck` PASS
- API: `npm run build` PASS
- Admin: `npx tsc --noEmit` PASS
- Admin: `npm run build` PASS after outside-sandbox rerun for known Vite/Tailwind native Windows binary issue

---

## Phase: DASH-1 - Backend dashboard foundation planning

Date: 2026-05-29
Status: **Complete - API typecheck PASS, API build PASS**

## Summary file

- Planning: `exploration-cache/tasks/summaries/2026-05-29-dash-1-backend-dashboard-foundation.md`
- Implementation: `exploration-cache/tasks/summaries/2026-05-29-dash-1-backend-dashboard-foundation-implementation.md`
- History: `exploration-cache/tasks/history/2026-05-29-dash-1-backend-dashboard-foundation.md`

## Cache status

- Cache read first per protocol.
- Cache confirms the existing dashboard implementation is frontend-only and mock/demo-state-backed.
- Cache/source confirms no `GET /api/v1/admin/dashboard` route exists yet.
- Cache/source confirms `REPORT_VIEW` exists and is granted to `admin`, `bootstrap_admin`, and `dn_supervisor`.
- Cache/source confirms `REPORT_VIEW` was not previously granted to `dn_agent`, `dg_secretariat`, `reception`, or `bureau_courrier`; approved implementation will add it.
- Cache confirms certificates remain backend-deferred; dashboard certificate metrics must not fabricate real certificate records.
- Cache gap: `exploration-cache/06-workflows/OMA_FORMAL_REQUEST_WORKFLOW.md` is referenced in the prompt but missing.

## Completed scope

- Added backend-only dashboard service/types/helpers under `apps/api/src/modules/dashboard/`.
- Wired `GET /api/v1/admin/dashboard` from `apps/api/src/modules/admin/admin.routes.ts`.
- Guarded with `requirePermission(Permissions.REPORT_VIEW)`.
- Default period is `preset=month`: first day of the current month through end of current day.
- Use domain timestamps for recent activity.
- Count missing expected documents only for active/currently in-progress phases.
- Return certificate counters as `0` and set `meta.unavailableMetrics = ["certificates"]`.
- Returned real read-only metrics from existing Mongoose models.
- Preserved route shape and profile-aware response for all internal dashboard roles.
- Did not touch frontend, portal, workflow mutations, seed data, or certificate backend.

## Verification

- API: `npm run typecheck` PASS
- API: `npm run build` PASS

---

## Phase: DASHBOARD-1 - Admin dashboard implementation planning

Date: 2026-05-29
Status: **Complete - Admin TypeScript PASS, Admin build PASS**

## Summary file

- Planning: `exploration-cache/tasks/summaries/2026-05-29-dashboard-implementation-planning.md`
- Implementation: `exploration-cache/tasks/summaries/2026-05-29-dashboard-implementation.md`
- History: `exploration-cache/tasks/history/2026-05-29-dashboard-implementation.md`

## Cache status

- Cache confirms admin `/dashboard` exists and courrier-only users already receive a separate API-backed `CourrierDashboard`.
- Cache confirms no general dashboard backend route exists.
- Cache confirms AIDN mock/demo state includes `AidnDashboardSummary`, demandes, dossiers, OMA phases, documents, meetings, certificates, phase evidence, next actions, and timeline events.
- Source inspection confirms the default admin dashboard still uses stale generic `mockDashboardData` via `useDashboard`.
- Source inspection confirms `useAidnDashboardSummary` already exposes a richer AIDN summary from current demo state.

## Completed scope

- Frontend-only dashboard refresh.
- No backend routes added.
- Courrier-role dashboard unchanged.
- Phase 3 not started.

## Implementation

1. Refocused `AdminDnDashboard` in `apps/admin/src/pages/DashboardPage.tsx` around `useAidnDashboardSummary`.
2. Derived compact Phase 1/Phase 2 dashboard signals from existing AIDN hooks.
3. Kept dashboard interactions as navigation links into existing work surfaces instead of adding workflow mutations.
4. Preserved existing dashboard primitives and loading/error patterns.

## Verification

- Admin: `npx tsc --noEmit` PASS
- Admin: `npm run build` failed in sandbox with known Vite/Tailwind native Windows binary issue.
- Admin: `npm run build` PASS after outside-sandbox rerun.

## Next step

Run a browser pass in mock mode to confirm dashboard layout and navigation links.

## Phase: OMA-DOCS-UX-1 — Compact Documents tab with phase accordion

Date: 2026-05-28
Status: **Complete - Admin TypeScript PASS**

## Summary file

- Implementation: `exploration-cache/tasks/summaries/2026-05-28-oma-docs-ux-1-documents-phase-accordion.md`

## Files changed

- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx` — full rewrite

## Next step

Run `npm run build` outside sandbox, then commit + push.

---

## Phase: OMA-HARDENING-7 - Cleanup dead/ambiguous Phase 2 statuses and rejected document semantics

Date: 2026-05-28
Status: **Complete - API PASS, Admin PASS**

## Summary files

- Planning: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-7-status-cleanup-planning.md`
- Implementation: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-7-status-cleanup.md`
- History: `exploration-cache/tasks/history/2026-05-28-oma-hardening-7-status-cleanup.md`
- Source audit: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`
- Prior status fix: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency.md`
- Review semantics reference: `exploration-cache/tasks/summaries/2026-05-28-oma-formal-15-consultation-only-documents-implementation.md`
- Closure reference: `exploration-cache/tasks/summaries/2026-05-28-oma-formal-17-block-closure-until-documents-deposited.md`

## Current scope

- Small backend/types/UI cleanup.
- Do not change workflow rules.
- Do not change Phase 1 behavior.
- Do not change Phase 2 closure gates.
- Do not change portal checklist behavior except labels/types if needed.
- Do not start Phase 3.

## Confirmed plan

- `formal_documents_tracking` is still present in model enum, formal request service status set, admin type union, and admin workspace label, but no inspected backend mutation writes it.
- Keep `formal_documents_tracking` in the Mongoose enum for DB compatibility, but remove it from active logic/UI/type surfaces.
- `rejected` remains a global `DocumentSubmission.status` enum value.
- Phase 2 formal request review should allow only `validated`, `requires_correction`, and `incomplete`.
- Remove `rejected` from the Phase 2 review route/service allowlist while keeping admin/portal labels as defensive fallback.

## Implementation

- `apps/api/src/modules/oma-phases/formal-request.service.ts` no longer includes `formal_documents_tracking` in active recevability status logic and no longer accepts `rejected` as a Phase 2 formal review status.
- `apps/api/src/modules/admin/admin.routes.ts` now validates formal request review statuses as `validated`, `requires_correction`, or `incomplete`.
- `apps/admin/src/lib/api/dossiers.api.ts` removed `formal_documents_tracking` from the admin Phase 2 status union.
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx` removed the normal label for `formal_documents_tracking`.
- `apps/api/src/modules/oma-phases/oma-phase.model.ts` still keeps `formal_documents_tracking` in the enum for DB compatibility.

## Verification

- API: `npx tsc --noEmit` PASS
- API: `npm run build` PASS
- Admin: `npx tsc --noEmit` PASS
- Admin: `npm run build` PASS after outside-sandbox rerun for Windows Tailwind/Vite native binary loading
- Portal: not run; no portal files were changed.

## Manual checks

- Not run in browser/API runtime.

## Phase: OMA-HARDENING-6 - Harmonize Phase 1 + Phase 2 notifications

Date: 2026-05-28
Status: **Complete - API PASS**

## Summary files

- Planning: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-6-notifications-planning.md`
- Implementation: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-6-notifications.md`
- History: `exploration-cache/tasks/history/2026-05-28-oma-hardening-6-notifications.md`
- Source audit: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`
- Prior portal status fix: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency.md`
- Prior portal label fix: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-5-portal-status-labels.md`
- Document review reference: `exploration-cache/tasks/summaries/2026-05-28-oma-formal-15-consultation-only-documents-implementation.md`

## Current scope

- Backend in-app notifications only.
- Do not change workflow rules.
- Do not change Phase 1/Phase 2 status transitions.
- Do not change document upload/review rules.
- Do not change closure logic.
- Do not change portal UI unless type changes require it.
- Do not start Phase 3.

## Confirmed plan

- Use `NotificationModel` with existing fields: `recipientUserId`, `channel`, `title`, `message`, `relatedType`, `relatedId`, `status`.
- Recipient is `dossier.postulantUserId`; skip notification when absent.
- Phase 1 currently emits no notifications from `oma-phase.service.ts`.
- Add Phase 1 notifications for first meeting scheduled, pre-evaluation form available, preliminary meeting scheduled, and preliminary phase closed.
- Phase 2 already notifies formal meeting scheduled, correction requested, and Phase 2 closure, but wording/status coverage needs adjustment.
- Add Phase 2 notification for formal request received.
- Extend document review notifications to include `incomplete` and align `requires_correction` wording with portal Actions requises.
- Reword existing formal meeting scheduled and Phase 2 closed notifications.
- Keep one notification per successful transition call; no broad dedupe/refactor.

## Implementation

- `apps/api/src/modules/oma-phases/oma-phase.service.ts` now emits Phase 1 notifications for first meeting scheduled, pre-evaluation form available, preliminary meeting scheduled, and preliminary phase closed.
- `apps/api/src/modules/oma-phases/formal-request.service.ts` now emits/aligned Phase 2 notifications for formal request received, formal meeting scheduled, correction requested, incomplete document, and Phase 2 closed.
- Notification helpers skip when `dossier.postulantUserId` is absent.

## Verification

- API: `npx tsc --noEmit` PASS
- API: `npm run build` PASS
- Portal: not run; no portal files/types/UI were touched.

## Manual checks

- Not run in browser/API runtime.

## Phase: OMA-HARDENING-5 - Harmonize portal Phase 1 + Phase 2 status labels

Date: 2026-05-28
Status: **Complete - API PASS, Portal PASS**

## Summary files

- Planning: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-5-portal-status-labels-planning.md`
- Implementation: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-5-portal-status-labels.md`
- Source audit: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`
- Prior status fix: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency.md`
- Phase 2 document reference: `exploration-cache/tasks/summaries/2026-05-28-oma-formal-14-portal-phase-2-documents-implementation.md`

## Current scope

- Portal/backend display wording only.
- Do not change workflow rules.
- Do not change admin workflow.
- Do not change document upload/review rules.
- Do not change closure logic.
- Do not start Phase 3.

## Confirmed plan

- Harmonize `PRELIMINARY_STATUS_PORTAL_LABELS` with simple portal-safe labels.
- Extend `FORMAL_REQUEST_PORTAL_LABELS` so Phase 2 status progresses beyond `Demande formelle déposée`.
- Remove the `hasFormalRequestCourrier` override that forces the label to stay static; only fall back to `Demande formelle reçue` when status is missing but the formal request exists.
- Keep `MyRequestsPage` unchanged unless implementation reveals a direct Phase 2 label path; it only renders request-level `portalStatusLabel`.
- Update `RequestDetailPage` Actions requises wording to avoid `DG`, `circuit`, and internal role wording.

## Verification planned

- API: `npx tsc --noEmit` PASS
- API: `npm run build` PASS
- Portal: `npx tsc --noEmit` PASS
- Portal: `npm run build` PASS after outside-sandbox rerun for Windows Tailwind/Vite native binary loading

## Manual checks

- Not run in browser.

## Phase: OMA-HARDENING-4 - Add Phase 2 events to Admin Historique tab

Date: 2026-05-28
Status: **Complete - Admin PASS**

## Summary files

- Planning: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-4-phase-2-historique-planning.md`
- Implementation: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-4-phase-2-historique.md`
- Source audit: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`
- Reference pattern: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-3-admin-phase-2-tabs.md`
- Document reference: `exploration-cache/tasks/summaries/2026-05-28-oma-formal-16-phase-2-documents-tab-refactor.md`

## Current scope

- Admin-only Phase 2 visibility in `DossierHistoriqueTab`.
- Do not change backend workflow rules.
- Do not change Phase 1 behavior.
- Do not change portal.
- Do not change Documents/Reunions/Courriers tab behavior.
- Do not change Phase 2 closure logic.
- Do not start Phase 3.

## Confirmed plan

- Reuse the `DossierDocumentsTab` separate-load pattern: call `getAdminFormalRequestPhase(detail.dossier.id)` and silently ignore failures when Phase 2 is not started.
- Keep `AdminDossierDetail` unchanged and pass optional `AdminFormalRequestPhaseState` into the local history event builder.
- Preserve the existing history event model: `category`, `group`, `importance`, compact default `Jalons`, and existing download handling.
- Add Phase 2 milestones where available: formal request received, DG circuit sent/returned/decision inferred from formal status, formal meeting planned/held, formal meeting report attached, Phase 2 closed.
- Add Phase 2 document events carefully: `oma_approval_form` review outcomes may appear as milestones; other submission/deposit details stay out of the default `Jalons` filter.
- Do not add a formal request gate download because `gate.formalRequestCourrierId` is a courrier id, not a confirmed dossier document id.

## Verification

- Admin: `npx tsc --noEmit` PASS
- Admin: `npm run build` PASS after outside-sandbox rerun for Windows Tailwind/Vite native binary loading

## Manual checks

- Not run in browser.

## Phase: OMA-HARDENING-3 - Add Phase 2 coverage to Admin Reunions and Courriers tabs

Date: 2026-05-28
Status: **Complete - Admin PASS**

## Summary files

- Planning: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-3-admin-phase-2-tabs-planning.md`
- Implementation: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-3-admin-phase-2-tabs.md`
- Source audit: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`
- Prior implementation: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency.md`
- Reference pattern: `exploration-cache/tasks/summaries/2026-05-28-oma-formal-16-phase-2-documents-tab-refactor.md`

## Current scope

- Admin-only Phase 2 visibility in `DossierMeetingsTab` and `DossierCourriersTab`.
- Do not change backend workflow rules.
- Do not change Phase 1 behavior.
- Do not change portal.
- Do not change Phase 2 closure logic.
- Do not start Phase 3.

## Confirmed plan

- Follow `DossierDocumentsTab` separate-load pattern: call `getAdminFormalRequestPhase(dossierId)` and silently ignore 404/not-started failures.
- `AdminFormalRequestPhaseState` exposes `gate`, `meeting`, `requirements`, `progress`, and `closure`.
- Formal meeting can render from `formalState.meeting` with title/type inferred in UI, scheduled date, location, status, and report document status.
- `formalState.meeting` type does not currently expose `heldAt`; show held date only if the available object contains it at runtime.
- Phase 2 courrier rows can show formal gate, recevability courrier, and closure courrier states.
- Only `closure.recevabilityCourrierDocumentId` and `closure.phaseClosureCourrierDocumentId` are exposed as document IDs.
- `gate.formalRequestCourrierId` is a courrier id, not a confirmed document id for `downloadDossierDocument`; do not add a formal request courrier download button unless an existing supported document id is available.
- Recevability and Phase II closure courriers are optional evidence/non-blocking in UI wording.

## Verification

- Admin: `npx tsc --noEmit` PASS
- Admin: `npm run build` PASS after outside-sandbox rerun for Windows Tailwind/Vite native binary loading

## Manual checks

- Not run in browser.

---

## Phase: OMA-HARDENING-2 - Portal Phase 2 submission status and action-required consistency fixes

Date: 2026-05-28
Status: **Complete - API PASS, Portal PASS**

## Summary files

- Planning: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency-planning.md`
- Implementation: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency.md`
- Source audit: `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`

## Current scope

- Portal/backend Phase 2 status consistency only.
- Do not change admin workflow.
- Do not change Phase 2 closure logic.
- Do not change document upload or review rules.
- Do not start Phase 3.

## Confirmed plan

- Backend portal active submission statuses should include `submitted`, `under_review`, `validated`, `requires_correction`, `incomplete`, and `rejected`.
- `incomplete`, `requires_correction`, and `rejected` are active for display/re-upload but not acceptable for completion/closure.
- Portal `formalProgress.missing` should count only `requirementLevel === "expected"` requirements with `status === "missing"`.
- Portal `hasFormalDocRequired` should only trigger for `expected` requirements with `missing`, `requires_correction`, `incomplete`, or `rejected`.
- Portal re-upload action should be available for `missing`, `requires_correction`, `incomplete`, and `rejected`.
- `rejected` is treated as re-upload-needed and displayed as `Rejeté`, not collapsed to `Manquant`.

## Verification

- API: `npx tsc --noEmit` PASS
- API: `npm run build` PASS
- Portal: `npx tsc --noEmit` PASS
- Portal: `npm run build` PASS after outside-sandbox rerun for Windows Tailwind/Vite native binary loading

---

## Phase: OMA-HARDENING-1 — Phase 1 + Phase 2 audit

Date: 2026-05-28
Status: **Audit complete — no implementation**

## Summary file

`exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`

## Prior completed tasks (this session)

- OMA-FORMAL-15: `exploration-cache/tasks/summaries/2026-05-28-oma-formal-15-consultation-only-documents-implementation.md`
- OMA-FORMAL-16: `exploration-cache/tasks/summaries/2026-05-28-oma-formal-16-phase-2-documents-tab-refactor.md`
- OMA-FORMAL-17: `exploration-cache/tasks/summaries/2026-05-28-oma-formal-17-block-closure-until-documents-deposited.md`
- FORMAL-17 conditional fix: `conditional` level now excluded from closure guards + `progress.missing` count

## Proposed hardening slices (from audit)

### OMA-HARDENING-2 — Portal submission status fix (high impact, small scope)
- Add `"incomplete"` to `PORTAL_ACTIVE_SUBMISSION_STATUSES` in `oma-phase.service.ts`
- Exclude conditional/optional from portal `formalProgress.missing` and `hasFormalDocRequired`
- Fix `"rejected"` portal UX (label + re-upload guidance)

### OMA-HARDENING-3 — Phase 2 in DossierMeetingsTab + DossierCourriersTab
- Formal meeting card in DossierMeetingsTab
- Phase 2 courrier rows in DossierCourriersTab

### OMA-HARDENING-4 — Phase 2 in DossierHistoriqueTab
- Extend buildHistoryEvents with formalState events

### OMA-HARDENING-5 — Portal formal request label progression
- Extend FORMAL_REQUEST_PORTAL_LABELS per-step

### OMA-HARDENING-6 — Notifications Phase 1 + Phase 2 gaps
- Phase 1: 3 notifications (first meeting, pre-eval form, Phase 1 closed)
- Phase 2: incomplete correction notification, gate-received notification

### OMA-HARDENING-7 — Dead code + rejected status cleanup
- Remove `formal_documents_tracking` enum value
- Define `rejected` document semantics clearly

## Key decisions from audit

- Accept separate `getAdminFormalRequestPhase()` load pattern for Meetings/Courriers/Historique tabs (consistent with DossierDocumentsTab)
- `"rejected"` document submission currently maps to `"missing"` in requirement status — undocumented, needs explicit decision
- Phase 1 emits ZERO notifications — high severity gap
- Portal `"incomplete"` status fix is independent of admin FORMAL-17 fix (two different sets)
