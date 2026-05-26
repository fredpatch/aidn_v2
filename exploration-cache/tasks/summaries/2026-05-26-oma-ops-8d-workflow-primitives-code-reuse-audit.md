# OMA-OPS-8D — Workflow Primitives & Code Reuse Audit

Date: 2026-05-26
Status: **Complete — analysis only, no code changed**

---

## Objective

Audit the existing code and identify reusable workflow primitives before Phase 2 implementation.

---

## Files Inspected

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/requests/request.service.ts` (top 100 lines)
- `apps/api/src/modules/meetings/meeting.service.ts`
- `apps/api/src/modules/dg-reviews/dg-review.model.ts`
- `apps/api/src/modules/notifications/notification.model.ts`
- `apps/api/src/shared/permissions/permissions.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/preliminary-dialogs.tsx`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`
- `apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx`
- `apps/admin/src/pages/DgCircuitPage.tsx`
- `apps/portal/src/pages/RequestDetailPage.tsx`

---

## Files Changed

None — audit only.

---

## Key Decisions / Findings

### Repeated primitives found

| Primitive                                     | Duplicated in                                                    | Action                                                       |
| --------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `saveDocument`                                | oma-phase.service (helper) + request.service (inline)            | Extract to `shared/utils/document.helpers.ts` before Phase 2 |
| DG circuit (send + record return)             | request.service (initial_request) + oma-phase.service (pre_eval) | Extract to DgCircuitService before Phase 2                   |
| `ensureObjectId`, `toIso`, `parseDate`        | 3 services                                                       | Extract to `shared/utils/service.helpers.ts` before Phase 2  |
| `openBlobInNewTab`                            | 4 frontend files                                                 | Extract to `lib/utils/blob.ts` during Phase 2                |
| Audit log                                     | All services                                                     | Already shared via audit.service ✅                          |
| `InviteMeetingDialog` / `RecordMeetingDialog` | Already generic ✅                                               | No action needed                                             |
| `ActionError`, status badge maps              | Already shared ✅                                                | No action needed                                             |

### DGReview model is already generic

- `DGReviewModel.targetType` supports: `initial_request`, `pre_evaluation_form`, `formal_request`, `phase_closure_document`, `certificate_document`
- Service is not generic — each targetType is handled in its own service
- Extracting a `DgCircuitService` unlocks Phase 2 and beyond without a third copy

### Meeting model is already generic

- `MeetingModel.meetingType` includes `formal_meeting` — Phase 2 meetings are model-ready
- Creation is hardcoded inside phase orchestrators — acceptable to keep for now

### Notification model exists but is not wired

- `NotificationModel` schema is ready (`in_app` channel)
- No notifications are sent from any service action yet
- Do not wire until notifications are actually activated

### Phase 2 strategy: Option B recommended

- Partially generic checklist + phase-specific orchestration
- Not a full workflow engine
- Keep `FormalRequestPhaseService` as a phase-specific orchestrator
- Call shared utilities (saveDocument, DgCircuitService, service helpers)

---

## Refactor Priority Matrix

### Must before Phase 2

1. `shared/utils/service.helpers.ts` — extract `ensureObjectId`, `toIso`, `parseDate`
2. `shared/utils/document.helpers.ts` — extract `saveDocument`
3. `dg-circuit.service.ts` — add generic DG review operations

### Should during Phase 2

4. `lib/utils/blob.ts` — extract `openBlobInNewTab`
5. Generic `UploadDocumentDialog` component
6. Extend `EvidenceRequirement` with `submittedDocumentId?` + `reviewStatus?`

### Can later

7. `PhaseWorkspaceShell` component
8. `PhaseEvent` ledger
9. `PhaseTransitionService` thin helpers

### Do not refactor yet

10. Full workflow engine
11. `NotificationWorkflowService`
12. `PortalVisibilityPolicy` formal abstraction

---

## Risks if duplicating continues

- 3rd DG circuit copy → correctness risk for formal_request DG tracking
- `saveDocument` divergence → data integrity risk for Phase 2 documents
- Phase 2 workspace copy-paste → Phase 3 maintenance explosion

---

## Next Step

OMA-OPS-9A (pre-Phase 2 prep): 3 targeted extractions:

1. `shared/utils/service.helpers.ts`
2. `shared/utils/document.helpers.ts`
3. `dg-circuit.service.ts` generic DG review operations

Then start OMA-OPS-9 / Phase 2 — Demande formelle.
