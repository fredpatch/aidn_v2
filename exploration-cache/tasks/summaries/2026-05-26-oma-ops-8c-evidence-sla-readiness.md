# OMA-OPS-8C — Evidence/SLA Readiness

Date: 2026-05-26
Status: **Complete — API typecheck PASS, API build PASS, Admin typecheck PASS, Admin build PASS, Portal typecheck PASS**

---

## Objective

Prepare the OMA workflow for future evidence-based phase closure, document visibility decisions, portal-safe document exposure, and future SLA/duration indicators.

---

## Files Inspected

- `apps/api/src/modules/documents/document.model.ts`
- `apps/api/src/modules/meetings/meeting.model.ts`
- `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`
- `apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8b-status-labels-french-cleanup.md`

---

## Files Changed

| File | Change |
|------|--------|
| `apps/api/src/modules/oma-phases/oma-phase.service.ts` | Added `sanitizeDocumentEvidence`, `buildPreliminaryDocumentEvidence`; added `reportRequired` to `sanitizeMeeting`; added `heldAt` to portal meeting objects in `getPortalDossier`; updated `getAdminDossier` to include `documentEvidence` |
| `apps/admin/src/lib/api/dossiers.api.ts` | Added `AdminDossierDocumentEvidence` type; added `reportRequired` to `AdminMeetingSummary`; extended `AdminDossierDetail.preliminary` with `documentEvidence?` |
| `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx` | Added `VisibilityBadge`, `formatUploadedAt`; `PhaseDocumentRow` now accepts `evidence`; shows uploadedAt date and visibility badge when metadata is available |
| `apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx` | Meeting card now shows "Date prévue" label on scheduledAt and "Date tenue" row when `heldAt` is set |
| `apps/admin/src/pages/dossiers/preliminary-evidence.helpers.ts` | **New** — `EvidenceRequirement` type + 8-item mapping for Phase préliminaire |

---

## Key Decisions

### Part A — Document metadata serialization
- `sanitizeDocumentEvidence` fetches `title`, `fileName`, `documentType`, `category`, `uploadedAt`, `uploadedById`, `visibility`, `status` — never `storageKey`
- `buildPreliminaryDocumentEvidence` loads all 6 evidence docs in parallel via `Promise.all`
- Returned under `preliminary.documentEvidence` in `getAdminDossier`
- Backend document IDs in `AdminOmaPhase` remain unchanged (backward compatible)
- Admin UI shows uploadedAt date and visibility badge per document row

### Part B — Meeting heldAt readiness
- `heldAt` was already in model, already serialized for admin (OMA-OPS-8A), already typed in `AdminMeetingSummary`
- Portal `getPortalDossier` now includes `heldAt` in `firstMeeting` and `preliminaryMeeting` objects
- `reportRequired` added to `sanitizeMeeting` — derived from `meetingType` (true for `first_contact_meeting` and `preliminary_meeting`), no model change needed
- Admin meeting card now labels scheduledAt as "Date prévue" and shows "Date tenue" when heldAt is set

### Part C — Evidence requirement readiness
- `preliminary-evidence.helpers.ts` provides `EvidenceRequirement` type and `PRELIMINARY_EVIDENCE_REQUIREMENTS` (8 entries)
- Display/checklist only — no blocking logic added

### Part D — Portal visibility decisions
- Existing enforcement confirmed correct: DG annotated = internal_only, preliminary meeting report = internal_only, closure courrier = postulant_visible
- First meeting report visibility is controlled by `input.visibleToPostulant` flag
- Admin UI now shows visibility badge from `documentEvidence` metadata
- No new portal endpoints or downloads added

### Part E — SLA date readiness matrix

| Field | Status |
|---|---|
| `dossier.openedAt`, `closedAt` | Already serialized ✅ |
| `phase.startedAt`, `closedAt` | Already serialized ✅ |
| `meeting.scheduledAt`, `heldAt` | Already serialized (admin); heldAt now added to portal ✅ |
| `preEvaluationSentToDgAt`, `preEvaluationReturnedFromDgAt` | Already serialized ✅ |
| `decisionRecordedAt` | Gap documented — `preEvaluationReturnedFromDgAt` serves this purpose |
| `document.uploadedAt` | Now serialized via `documentEvidence` ✅ |

---

## Verification

- API typecheck: **PASS**
- API build: **PASS**
- Admin typecheck: **PASS**
- Admin build: **PASS** (1,548 kB / 444 kB gzip)
- Portal typecheck: **PASS**
- Portal build: not run (no portal files changed)
- Manual checks: pending runtime browser validation

---

## Risks / TODOs

- `decisionRecordedAt` has no dedicated field — `preEvaluationReturnedFromDgAt` is the functional equivalent. No overbuild done.
- `preliminary-evidence.helpers.ts` mapping is display/readiness only — no closure guards use it yet. Phase 2 can wire it.
- Portal `RequestDetailPage.tsx` uses `firstMeeting.heldAt` — the new field is now in the portal API payload but the portal UI doesn't yet render it. Not a regression (undefined before = null now).

---

## Next Step

Phase 2 can now build on:
- `PRELIMINARY_EVIDENCE_REQUIREMENTS` for a checklist-driven phase closure guard
- `documentEvidence` metadata for an evidence completeness panel
- `heldAt` on portal meetings for a postulant-visible meeting history
