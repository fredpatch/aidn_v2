# Current Task

## Phase: OMA-FORMAL-1 — API Foundation for Phase 2 Demande formelle

Date: 2026-05-26
Status: **Complete — API typecheck PASS, API lint PASS, API build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-26-oma-formal-1-api-foundation.md`

## Files created

- `apps/api/src/modules/documents/document-requirement.model.ts`
- `apps/api/src/modules/documents/document-submission.model.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/scripts/seed-document-requirements.ts`

## Files modified

- `apps/api/src/modules/oma-phases/oma-phase.model.ts` — 15 Phase 2 fields added
- `apps/api/src/modules/admin/admin.routes.ts` — GET /dossiers/:id/phases/formal-request

## Key decisions

- Gate = `formalRequestCourrierId` only; supporting checklist is non-blocking.
- `formal_request` OmaPhase always exists (created by `insertMany` in `openAdminDossierDn`).
- Service placed in new `formal-request.service.ts` to keep Phase 2 separate from Phase 1.
- `blockingMissing` only depends on gate; `completionRate` is informational.

## Next step

OMA-FORMAL-2 — Phase 2 upload mutations + DG circuit + formal meeting

---

## Previous task: OMA-OPS-9C — Frontend Primitive Refactor Before Phase 2

Date: 2026-05-26
Status: **Complete — Admin typecheck PASS, Admin build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-26-oma-ops-9c-frontend-primitive-refactor.md`

## Files created

- `apps/admin/src/lib/utils/blob.ts` — `openBlobInNewTab` with popup-block fallback
- `apps/admin/src/lib/utils/error.ts` — `extractError` utility
- `apps/admin/src/pages/dossiers/components/UploadDocumentDialog.tsx` — generic upload dialog

## Files modified

- `apps/admin/src/pages/dossiers/DossierCourriersTab.tsx` — removed local `openBlobInNewTab`
- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx` — removed local `openBlobInNewTab`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx` — removed local `openBlobInNewTab`
- `apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx` — removed local `openBlobInNewTab`
- `apps/admin/src/pages/dossiers/preliminary-dialogs.tsx` — removed local `extractError`; refactored DG return + closure courrier dialogs
- `apps/admin/src/pages/dossiers/preliminary-evidence.helpers.ts` — extended `EvidenceRequirement` type

## Next step

OMA-OPS-10 / Phase 2 — Demande formelle

---

## Previous task: OMA-OPS-9B-FIX — DG Circuit Dashboard Consistency + Téléversé Status

Date: 2026-05-26
Status: **Complete — API typecheck PASS, API build PASS, Admin typecheck PASS, Admin build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-26-oma-ops-9b-fix-dg-circuit-dashboard-consistency.md`

## Files modified

- `apps/admin/src/pages/DgCircuitPage.tsx` — Fixed `CourrierTimeline` Téléversé step: checks `annotatedReturnDocumentId || returnedFromDgAt || returnedAt || processedAt`
- `apps/admin/src/features/dashboard/components/CourrierDashboard.tsx` — Fixed processed filter, date fallback, per-bucket status labels, source label

## Root causes fixed

1. `bucket === "processed"` never matched (no items have that bucket in OMA-OPS-9B)
2. `done: !!task.processedAt` failed for returned_scanned items (processedAt = decisionRecordedAt = null)
3. Source label "Courrier initial" inconsistency

## Next step

OMA-OPS-10 / Phase 2 — Demande formelle

---

## Previous task: OMA-OPS-9B — DG Circuit History / Receptionist Traceability

Date: 2026-05-26
Status: **Complete — API typecheck PASS, API build PASS, Admin typecheck PASS, Admin build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-26-oma-ops-9b-dg-circuit-history-reception-traceability.md`

## Files modified

- `apps/api/src/modules/dg-circuit/dg-circuit.service.ts` — rewritten `listDgCircuitTasks`: DGReview-first query, new buckets, extended counts, new response fields
- `apps/admin/src/lib/api/dg-circuit.api.ts` — new bucket values, new task fields, extended counts
- `apps/admin/src/pages/DgCircuitPage.tsx` — new tabs, KPI row, read-only traceability panel, improved labels/empty state

## Next step

OMA-OPS-10 / Phase 2 — Demande formelle

---

## Previous task: OMA-OPS-9A — Pre-Phase 2 Workflow Primitive Refactor

Date: 2026-05-26
Status: **Complete — API typecheck PASS, API lint PASS, API build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-26-oma-ops-9a-pre-phase-2-workflow-primitive-refactor.md`

## Files created

- `apps/api/src/shared/utils/service.helpers.ts` — `ensureObjectId`, `toIso`, `toId`, `parseDate`, `parseOptionalDate`
- `apps/api/src/shared/utils/document.helpers.ts` — `saveDocument`

## Files modified

- `apps/api/src/modules/dg-circuit/dg-circuit.service.ts` — added `createDgReview`, `markSentToDg`, `recordDgReturn`, `recordDgDecision`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` — local helpers removed, imports added
- `apps/api/src/modules/requests/request.service.ts` — local helpers removed, DG circuit delegated to service
- `apps/api/src/modules/meetings/meeting.service.ts` — local helpers removed, imports added

## Next step

OMA-OPS-9 / Phase 2 — Demande formelle

---

## Previous task: OMA-OPS-8D — Workflow primitives & code reuse audit

Date: 2026-05-26
Status: **Complete — analysis only, no code changed**

## Summary file

`exploration-cache/tasks/summaries/2026-05-26-oma-ops-8d-workflow-primitives-code-reuse-audit.md`

## Key findings

- 3 primitives must be extracted before Phase 2: `saveDocument`, `ensureObjectId/toIso/parseDate`, DG circuit service
- `DGReviewModel` and `MeetingModel` are already generic — services are not
- Notifications exist in model but not wired — do not touch yet
- `InviteMeetingDialog` / `RecordMeetingDialog` already generic ✅
- Phase 2 strategy: Option B (partially generic + phase-specific orchestration)

## Next step

OMA-OPS-9A: Extract 3 shared service utilities before starting Phase 2

---

## Previous task: OMA-OPS-8C — Evidence/SLA readiness

Date: 2026-05-26
Status: **Complete — API typecheck PASS, API build PASS, Admin typecheck PASS, Admin build PASS, Portal typecheck PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-26-oma-ops-8c-evidence-sla-readiness.md`

## Objective

Prepare the OMA workflow for evidence-based phase closure, document visibility decisions, portal-safe document exposure, and future SLA/duration indicators.

## Completed deliverables

- `oma-phase.service.ts`: Added `sanitizeDocumentEvidence` + `buildPreliminaryDocumentEvidence`; `reportRequired` added to `sanitizeMeeting`; `heldAt` added to portal meeting objects; `documentEvidence` included in `getAdminDossier` preliminary response
- `dossiers.api.ts`: Added `AdminDossierDocumentEvidence` type; `reportRequired` on `AdminMeetingSummary`; `documentEvidence?` on `AdminDossierDetail.preliminary`
- `DossierDocumentsTab.tsx`: Shows visibility badge and uploadedAt date from evidence metadata
- `DossierMeetingsTab.tsx`: Meeting card shows "Date prévue" / "Date tenue" labels
- `preliminary-evidence.helpers.ts`: NEW — `EvidenceRequirement` type + 8-item PRELIMINARY_EVIDENCE_REQUIREMENTS mapping

## Previous task references

- OMA-OPS-8B: `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8b-status-labels-french-cleanup.md`
- OMA-OPS-8A: `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8a-phase1-transition-date-hardening.md`

## Next step

Phase 2 planning — can build on `PRELIMINARY_EVIDENCE_REQUIREMENTS` for checklist-driven closure guards and `documentEvidence` for an evidence completeness panel.
