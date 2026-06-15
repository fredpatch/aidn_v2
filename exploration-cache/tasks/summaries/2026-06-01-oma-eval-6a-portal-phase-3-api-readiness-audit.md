# OMA-EVAL-6A — Portal Phase 3 API Readiness Audit

Date: 2026-06-01
Type: audit/planning
Status: Complete — no implementation

---

## Objective

Audit backend and portal API client readiness for the postulant-facing Phase 3 action block.
Identify what exists, what is missing, and plan implementation slices.

---

## Cache files read

- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/tasks/current-task.md`

---

## Source files inspected

- `apps/api/src/modules/portal/portal.routes.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` (downloadPortalDossierDocument)
- `apps/api/src/modules/oma-phases/document-evaluation.service.ts` (payment, correction)
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`

---

## A. Payment State — GET /portal/dossiers/:id/phases/document-evaluation/payment

**BACKEND: EXISTS ✅**
- Service: `getPortalDocumentEvaluationPaymentState`
- Ownership guard: `getOwnedDossier` ✅
- Response: `phaseStatus`, `documentEvaluationStatus`, `payment.status`,
  `payment.invoiceDocumentId`, `payment.paymentProofDocumentId`,
  `payment.invoiceSentAt`, `payment.paymentProofSubmittedAt`, `canUploadPaymentProof`
- `canUploadPaymentProof = status === "invoice_sent" || status === "payment_proof_submitted"` (re-upload allowed)

**FRONTEND API CLIENT: MISSING ❌** — no method in `portal.api.ts`

---

## B. Payment Proof Upload — POST /portal/dossiers/:id/phases/document-evaluation/payment-proof

**BACKEND: EXISTS ✅**
- Service: `uploadStudyFeePaymentProof`
- Ownership guard: `getOwnedDossier` ✅
- Requires invoice first: ✅ (409 if no invoice)
- Accepts multipart `file` ✅; optional `paymentReference`, `paidAt`, `notes`
- Returns payment state ✅

**FRONTEND API CLIENT: MISSING ❌** — no method in `portal.api.ts`

---

## C. Evaluation Read State — GET /portal/dossiers/:id/phases/document-evaluation

**BACKEND: MISSING ❌ — CRITICAL GAP**
- No portal endpoint exposing:
  - evaluation list
  - status per document
  - requirement label
  - DN annotation
  - evaluationId (required to call correction upload)
  - canUploadCorrection
  - correctionSubmittedAt

Without this endpoint, portal cannot:
- Display evaluation statuses
- Show DN annotations
- Know evaluationId for correction upload → correction upload unreachable

**Proposed endpoint:**
```
GET /api/v1/portal/dossiers/:id/phases/document-evaluation
ownership guard: getOwnedDossier
```

**Proposed safe response:**
```ts
{
  phaseStatus: string;
  documentEvaluationStatus: string | null;
  payment: { status, invoiceDocumentId, paymentProofDocumentId, ... };
  canUploadPaymentProof: boolean;
  evaluations: Array<{
    evaluationId: string;
    requirementLabel: string;
    status: "pending" | "satisfaisant" | "non_satisfaisant" | "correction_submitted";
    annotation?: string | null;
    canUploadCorrection: boolean;
    correctionSubmittedAt?: string | null;
  }>;
}
```

Notes:
- Return empty `evaluations: []` before payment gate is passed
- `canUploadCorrection = status === "non_satisfaisant"`
- Do NOT expose `reviewedById`, internal DN user details, or phase-internal IDs beyond evaluationId
- This endpoint can be a superset of the payment state endpoint — consolidates two calls into one

---

## D. Correction Upload — POST /portal/document-evaluations/:evaluationId/correction

**BACKEND: EXISTS ✅**
- Service: `uploadDocumentEvaluationCorrection`
- Ownership guard: evaluation.dossierId → `getOwnedDossier` ✅
- Guard: evaluation.status must be `non_satisfaisant` ✅
- Requires file ✅; optional `notes`
- Returns updated evaluation state ✅

**FRONTEND API CLIENT: MISSING ❌** — no method in `portal.api.ts`

**BLOCKED** until 6B adds evaluation read endpoint (evaluationId not available without it)

---

## E. Portal Document Download — GET /portal/dossiers/:id/documents/:documentId

**ROUTE: EXISTS ✅** (`portal.routes.ts` line 207)
**FRONTEND API CLIENT: EXISTS ✅** — `downloadPortalDossierDocument(dossierId, documentId)` in `portal.api.ts`

**BACKEND SCOPE: INCOMPLETE ❌ — CRITICAL GAP**
- `downloadPortalDossierDocument` service is **hardcoded to preliminary phase only**
- Checks `OmaPhaseModel.findOne({ phaseKey: "preliminary" })` and validates doc against preliminary phase field IDs only
- Phase 3 docs not covered:
  - Invoice doc (ownerType="phase_payment") → ❌ NOT COVERED
  - Payment proof doc (ownerType="phase_payment") → ❌ NOT COVERED
  - Correction doc (ownerType="phase", phaseKey="document_evaluation") → ❌ NOT COVERED

**Required backend patch in 6B:**
Extend `downloadPortalDossierDocument` to also allow when:
1. Document owner matches a PhasePayment where `PhasePayment.dossierId === dossierObjectId`
2. Document is a DocumentSubmission where `phaseKey="document_evaluation"` and `dossierId === dossierObjectId` and status not replaced/archived

Route itself does NOT need changing — only the service logic.

---

## F. Portal Page Location

**CONFIRMED: `RequestDetailPage.tsx` — "Dossier" tab**

- Tab key: `"dossier"` (line 472)
- `dossierDetail` state already loaded via `loadDossier(dossierId)` → `getPortalDossier`
- Dossier tab already renders Phase 1 label and Phase 2 block (formalRequest, formalMeeting, Phase2DocumentChecklist)
- Phase 3 block appends after Phase 2 content when `dossierDetail.dossier.status` is in document_evaluation or later phases
- Phase 3 data loaded SEPARATELY (not bundled into `getPortalDossier`):
  - New call: `getPortalDocumentEvaluations(dossierId)` when tab activates and Phase 3 is unlocked
  - `getPortalDossier` does not currently include Phase 3; extending it would couple unrelated state

---

## Backend Gaps Summary

| Gap | Severity | Fix |
|---|---|---|
| No portal evaluation read endpoint | CRITICAL | 6B: add GET /portal/dossiers/:id/phases/document-evaluation |
| downloadPortalDossierDocument limited to preliminary | CRITICAL | 6B: extend service to cover PhasePayment + doc_eval correction docs |

---

## Frontend API Gaps Summary (all in portal.api.ts)

| Method | Endpoint | Status |
|---|---|---|
| `getPortalPhase3State(dossierId)` | GET /portal/dossiers/:id/phases/document-evaluation | ❌ (endpoint missing too) |
| `uploadPortalPaymentProof(dossierId, formData)` | POST /portal/dossiers/:id/phases/document-evaluation/payment-proof | ❌ |
| `uploadPortalDocumentEvaluationCorrection(evaluationId, formData)` | POST /portal/document-evaluations/:evaluationId/correction | ❌ |
| `downloadPortalDossierDocument` | GET /portal/dossiers/:id/documents/:documentId | ✅ exists (but backend scope is gap) |

Note: A single `getPortalPhase3State` can replace the separate payment state call — return payment + evaluations together.

---

## Recommended Implementation Slices

### OMA-EVAL-6B — Backend portal gaps (backend-only)

1. Add `GET /api/v1/portal/dossiers/:id/phases/document-evaluation`:
   - New service: `getPortalDocumentEvaluationState` in `document-evaluation.service.ts`
   - Returns payment state + evaluation list (applicant-safe; no internal user IDs)
   - Empty evaluations before payment gate; full list after init
   - Wire in `portal.routes.ts`

2. Extend `downloadPortalDossierDocument` in `oma-phase.service.ts`:
   - After preliminary check fails, try:
     - PhasePayment: `PhasePaymentModel.findOne({ dossierId, $or: [{invoiceDocumentId}, {paymentProofDocumentId}] })`
     - DocumentSubmission: `DocumentSubmissionModel.findOne({ dossierId, documentId, phaseKey: "document_evaluation", status: { $nin: ["replaced", "archived"] } })`
   - Only allow `visibility === "postulant_visible"` (already checked at top)

### OMA-EVAL-6C — Portal API client + types (frontend-only)

In `portal.api.ts`:
- `PortalPhase3EvaluationItem` type
- `PortalPhase3State` type (payment + evaluations)
- `getPortalPhase3State(dossierId)` → GET /portal/dossiers/:id/phases/document-evaluation
- `uploadPortalPaymentProof(dossierId, formData)` → POST ...payment-proof
- `uploadPortalDocumentEvaluationCorrection(evaluationId, formData)` → POST ...correction
- Reuse `downloadPortalDossierDocument` (backend extended in 6B)

### OMA-EVAL-6D — Portal Phase 3 UI block

In `RequestDetailPage.tsx` Dossier tab:
- Load Phase 3 state via `getPortalPhase3State(dossierId)` when tab activates and `dossierDetail.dossier.status` is in document_evaluation or later
- Block structure:
  - Phase III header + status
  - Invoice: download button (if invoiceDocumentId) or "En attente de la facture ANAC"
  - Payment proof: upload card (if canUploadPaymentProof) or "Preuve de paiement envoyée"
  - Evaluation list: per-item status + annotation + correction upload card (if canUploadCorrection)

---

## Files changed

None — audit only.

---

## Verification commands run

Not run — audit/planning only.

## Manual checks

Not run — no implementation.

---

## Known risks

- `downloadPortalDossierDocument` extension must preserve existing preliminary guard — only ADD new branches, don't replace
- Portal evaluation list must NOT expose internal DN user IDs (reviewedById), admin-only IDs, or unrelated docs
- `canUploadPaymentProof = invoice_sent || payment_proof_submitted` means re-upload is allowed — portal UX should confirm this is the intended behavior

---

## Next step

**OMA-EVAL-6B** — Backend portal Phase 3 gaps:
1. Add portal evaluation read endpoint
2. Extend portal document download to cover Phase 3 docs
