# OMA-HARDENING-1 — Phase 1 + Phase 2 Audit Report

Date: 2026-05-28
Status: Audit complete — no implementation

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` (lines 1040–1180)
- `apps/api/src/modules/oma-phases/formal-request.service.ts` (key sections)
- `apps/api/src/modules/meetings/meeting.service.ts`
- `apps/api/src/modules/documents/document-submission.model.ts`
- `apps/api/src/modules/documents/document-requirement.model.ts`
- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`
- `apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx`
- `apps/admin/src/pages/dossiers/DossierCourriersTab.tsx`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`

---

## A. Status/state mismatches

### A1 — `PORTAL_ACTIVE_SUBMISSION_STATUSES` missing `"incomplete"` — HIGH
- **Where:** `oma-phase.service.ts:1090`
- **Finding:** Admin fixed `ACTIVE_SUBMISSION_STATUSES` to include `"incomplete"` (FORMAL-17). Portal-side `computePortalReqStatus` uses a local set that still only has `submitted, under_review, validated, requires_correction`. A submission with status `"incomplete"` shows as `"missing"` on portal, while admin correctly shows `"incomplete"`.
- **Fix:** Add `"incomplete"` to `PORTAL_ACTIVE_SUBMISSION_STATUSES` in `oma-phase.service.ts`.

### A2 — Portal `formalProgress.missing` counts conditional docs — MEDIUM
- **Where:** `oma-phase.service.ts:1164`
- **Finding:** `missing = portalRequirements.filter(r => r.status === "missing").length`. The DB query already excludes `gate` level, but includes `conditional` requirements. Admin-side `progress.missing` was fixed (FORMAL-17 + conditional fix) to exclude gate/optional/conditional. Portal side is inconsistent: conditional docs with no submission count toward `missing`. This causes `hasFormalDocRequired` on portal to fire for optional/conditional-level missing docs.
- **Fix:** Exclude `requirementLevel: { $in: ["conditional", "optional"] }` from portal requirements query (or from the `missing` count).

### A3 — `rejected` document status not in active submission set — MEDIUM
- **Where:** `document-submission.model.ts:37`, `formal-request.service.ts:1574`
- **Finding:** Admin can set submission status to `"rejected"` (valid enum + valid review payload). But `"rejected"` is NOT in `ACTIVE_SUBMISSION_STATUSES`, so `computeRequirementStatus` returns `"missing"` for a rejected submission. Frontend has no label for `"rejected"` in requirement row. Postulant sees their document as "missing" after it's rejected — no UX cue to re-upload.
- **Fix:** Either: (a) add `"rejected"` to active statuses and surface it as a blocking status with a label, OR (b) document that `rejected` intentionally maps to `"missing"` as a re-upload trigger and add a portal notice. Recommend (a).

### A4 — `formal_documents_tracking` is a dead enum value — LOW
- **Where:** `oma-phase.model.ts:88`, `formal-request.service.ts:1284`
- **Finding:** `formalRequestStatus` has enum value `"formal_documents_tracking"`, but it is never written by any backend function. It only appears in the `STATUSES_BEFORE_RECEVABILITY` static set. `dossiers.api.ts` frontend type also includes it.
- **Fix:** Remove from enum, model, frontend type, and STATUSES_BEFORE_RECEVABILITY set. Or document intent if there is a planned use.

---

## B. Portal / admin inconsistencies

### B1 — `DossierHistoriqueTab` has zero Phase 2 events — HIGH
- **Where:** `DossierHistoriqueTab.tsx:193` (`buildHistoryEvents`)
- **Finding:** `buildHistoryEvents` covers Phase 1 only. When dossier enters Phase 2: formal request reception, DG circuit, formal meeting, document uploads, Phase 2 closure — none appear in the timeline.
- **Fix:** Extend `buildHistoryEvents` to include Phase 2 events from `AdminFormalRequestPhaseState`. Requires either extending `AdminDossierDetail` to include a formalPhase summary, or a separate `getAdminFormalRequestPhase()` call in the tab.

### B2 — `DossierMeetingsTab` has zero Phase 2 meeting — HIGH
- **Where:** `DossierMeetingsTab.tsx`
- **Finding:** Tab only shows Phase 1 meetings (firstMeeting, preliminaryMeeting) from `AdminDossierDetail.preliminary`. Formal meeting is only available via `getAdminFormalRequestPhase()`. No Phase 2 meeting card exists.
- **Fix:** Load `AdminFormalRequestPhaseState` in `DossierMeetingsTab` and render a `Phase2MeetingCard` when `formalState.meeting` is set.

### B3 — `DossierCourriersTab` shows no Phase 2 courriers — HIGH
- **Where:** `DossierCourriersTab.tsx:293`
- **Finding:** "Phases suivantes" section has placeholder text ("Les courriers des phases suivantes seront affichés ici…"). Formal request courrier, recevability courrier, and closure courrier are not shown.
- **Fix:** Load `AdminFormalRequestPhaseState` in `DossierCourriersTab` and render Phase 2 courrier rows from `formalState.closure` + `formalState.gate`.

### B4 — `AdminDossierDetail` lacks formalMeeting / formalPhase data — MEDIUM
- **Where:** `dossiers.api.ts:236`
- **Finding:** `AdminDossierDetail` only has `preliminary` + `phases`. There is no `formalRequest` field. Tabs that use `AdminDossierDetail` (Historique, Réunions, Courriers) must make a separate `getAdminFormalRequestPhase()` call to surface Phase 2 state. This is consistent with how `DossierDocumentsTab` works, but requires conscious loading.
- **Recommendation:** Accept the separate load pattern (consistent with DossierDocumentsTab) rather than bloating `getAdminDossier` response. Document the pattern.

### B5 — Portal `formalRequestPortalLabel` stalls at "Demande formelle déposée" — MEDIUM
- **Where:** `oma-phase.service.ts:1066`
- **Finding:** Once formal courrier is received, the label becomes `"Demande formelle déposée"` and never advances further (DG, meeting, etc.). The postulant sees a static label through the entire Phase 2 workflow.
- **Fix:** Extend `FORMAL_REQUEST_PORTAL_LABELS` to map per-status to more specific portal labels (e.g., "En examen par l'ANAC", "Réunion formelle planifiée", "En attente de clôture").

### B6 — Portal `hasFormalDocRequired` triggers for conditional docs — MEDIUM
- **Where:** `RequestDetailPage.tsx:506`
- **Finding:** `hasFormalDocRequired = dossierDetail?.formalRequest?.requirements?.some(r => r.status === "missing" && ...)`. Since conditional requirements appear in portal requirements list, a conditional doc without submission makes this `true` — showing an "Actions requises" badge even though the conditional doc is optional-by-condition.
- **Fix:** Filter `requirementLevel !== "conditional" && requirementLevel !== "optional"` in the `hasFormalDocRequired` check, OR exclude those levels from portal requirements list entirely.

---

## C. Notifications gaps

### C1 — Phase 1 emits ZERO notifications — HIGH
- **Where:** `oma-phase.service.ts` — no `NotificationModel.create()` calls
- **Missing events:** first meeting invitation, pre-eval form available, pre-eval DG return recorded, preliminary meeting invitation, Phase 1 closed
- **Fix:** Add notifications for key Phase 1 milestones (at minimum: first meeting invitation, pre-eval form available, Phase 1 closed).

### C2 — Phase 2 document `"incomplete"` result not notified — MEDIUM
- **Where:** `formal-request.service.ts:1682`
- **Finding:** Notification is only created when `payload.status === "requires_correction"`. When status is `"incomplete"`, no notification is sent to postulant. Both statuses require a re-upload from the postulant.
- **Fix:** Extend condition to include `"incomplete"`.

### C3 — Formal request received (gate accepted) not notified — MEDIUM
- **Where:** `formal-request.service.ts` — `registerFormalRequestCourrier` function
- **Finding:** When Phase 2 gate is set (formal request courrier registered, whether portal or admin), no notification is sent. Postulant doesn't know their formal request has been received and the process has started.
- **Fix:** Add notification on formal courrier registration.

### C4 — Formal meeting held not notified — LOW
- **Where:** `formal-request.service.ts` — `markFormalMeetingHeld` function
- **Finding:** Meeting held event has no postulant notification.
- **Fix:** Optional — notify when meeting is marked held if desired.

### C5 — DG circuit events not notified — LOW
- **Where:** `formal-request.service.ts` — sendToDg / dgReturn / dgDecision functions
- **Finding:** No postulant notification at any DG circuit step. These are internal actions, so low priority.
- **Fix:** Consider a generic "Votre dossier est en cours d'examen" notification on DG return.

---

## D. Documents / checklist gaps

### D1 — `rejected` status has no portal UX — MEDIUM
- See A3 above. Portal sees `"missing"` when document is `"rejected"`. No label, no guidance message, no re-upload prompt specific to rejection.

### D2 — Portal `formalProgress.missing` includes conditional requirements — MEDIUM
- See A2 above.

### D3 — `incomplete` status now requires same portal UX as `requires_correction` — LOW
- **Finding:** Both statuses now trigger a re-upload on portal side. The portal UI for the requirement row should label `"incomplete"` differently from `"requires_correction"` for clarity, but both allow re-upload. If portal uses the same label for both, that's an acceptable simplification.
- **Recommendation:** Confirm portal requirement status labels for `"incomplete"` are user-readable.

---

## E. Meeting / DG circuit gaps

### E1 — Formal meeting not in DossierMeetingsTab — HIGH
- See B2. Confirmed: `DossierMeetingsTab` has no reference to formalMeeting.

### E2 — Formal meeting appears in portal RendezVousPage — OK
- **Finding:** `listPortalMeetings` queries all meetings by `dossierId ∈ postulant's dossiers` with no `meetingType` filter. Formal meetings DO appear in the portal calendar. This is correct behavior.

### E3 — Meeting `outlookEmailStatus` field referenced in `AdminMeetingSummary` but not surfaced in UI — LOW
- **Finding:** `AdminFormalRequestPhaseState.meeting` exposes `outlookEmailStatus` and `outlookEmailSentAt`. There is currently no Outlook integration. These fields render nowhere in the UI. Not a bug.

---

## F. History / reporting gaps

### F1 — Phase 2 completely absent from DossierHistoriqueTab — HIGH
- See B1. No formal courrier, DG circuit, meeting, document, or closure events in timeline.

### F2 — Phase 2 audit actions are written but not surfaced in admin timeline — MEDIUM
- **Finding:** `formal-request.service.ts` writes `writeAuditLog` for every key action (12+ calls). These land in the `audit_logs` collection. But `DossierHistoriqueTab` derives events from `AdminDossierDetail` fields, not from the audit log collection. The audit log data is currently not exposed to the admin history view at all.
- **Recommendation:** Either read Phase 2 events from `AdminFormalRequestPhaseState` (phase timeline fields), or add a `/dossiers/:id/history` API endpoint that merges audit log events. The first approach is simpler and consistent with Phase 1.

---

## Proposed hardening slices

### OMA-HARDENING-2 — Portal submission status fix (quick, high impact)
- Fix `PORTAL_ACTIVE_SUBMISSION_STATUSES` to include `"incomplete"`
- Fix portal `formalProgress.missing` to exclude conditional/optional
- Fix portal `hasFormalDocRequired` to exclude conditional/optional
- Fix portal `"rejected"` UX: label + re-upload guidance
- Estimated scope: 1 file (`oma-phase.service.ts`), 1 portal file

### OMA-HARDENING-3 — Phase 2 coverage in DossierMeetingsTab + DossierCourriersTab
- Load `AdminFormalRequestPhaseState` in each tab
- Add formal meeting card in DossierMeetingsTab
- Add formal request courrier, recevability courrier, closure courrier rows in DossierCourriersTab
- Estimated scope: 2 admin tab files

### OMA-HARDENING-4 — Phase 2 coverage in DossierHistoriqueTab
- Extend `buildHistoryEvents` with Phase 2 events from formalState
- Key events: formal courrier received, DG circuit sent/returned, formal meeting planned/held, Phase 2 closed
- Estimated scope: 1 admin file + `DossierHistoriqueTab.tsx` type extension

### OMA-HARDENING-5 — Portal status label progression
- Extend `FORMAL_REQUEST_PORTAL_LABELS` map in `oma-phase.service.ts`
- Add per-step labels for DG circuit, meeting, closure states
- Estimated scope: 1 backend file

### OMA-HARDENING-6 — Notifications Phase 1 + Phase 2 gaps
- Phase 1: add 3 notifications (first meeting invitation, pre-eval form available, Phase 1 closed)
- Phase 2: add `"incomplete"` to correction notification, add gate-received notification
- Estimated scope: `oma-phase.service.ts` + `formal-request.service.ts`

### OMA-HARDENING-7 — Dead code + `rejected` status cleanup
- Remove `formal_documents_tracking` from enum, model, frontend type
- Define clear `rejected` semantics: add to active statuses or remove from review payload
- Estimated scope: 2 backend files + 1 frontend type

---

## Do not fix yet
- Phase 3 backend (document_evaluation) — defer until hardening complete
- Outlook/email notifications — not in scope
- Certificate model / delivery workflow — deferred to later phase
- Portal DossierDocumentsTab separate API call pattern — acceptable as-is
- Admin split-view refactor for Historique/Réunions/Courriers tabs — not needed; tabs can call `getAdminFormalRequestPhase()` directly

---

## Documentation updates needed

- Update `exploration-cache/tasks/current-task.md` → set to OMA-HARDENING-1 complete
- Update `exploration-cache/QUICK-REFERENCE.md` → add hardening findings
- Update `exploration-cache/manifest.json` → add this summary entry
