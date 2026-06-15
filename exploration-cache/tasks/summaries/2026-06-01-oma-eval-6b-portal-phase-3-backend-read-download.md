# OMA-EVAL-6B — Backend Portal Phase 3 Read State + Download Support

Date: 2026-06-01
Type: implementation (backend)
Status: Complete — API typecheck PASS, API build PASS

---

## Objective

Patch backend portal API for postulant-facing Phase 3 action block:
1. Add `GET /api/v1/portal/dossiers/:id/phases/document-evaluation` — portal-safe read state
2. Extend `downloadPortalDossierDocument` to cover Phase 3 invoice/proof/correction docs

---

## Cache files read

- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-6a-portal-phase-3-api-readiness-audit.md`
- `exploration-cache/04-backend/API_ROUTES.md`

---

## Source files inspected

- `apps/api/src/modules/oma-phases/document-evaluation.service.ts` — getDocumentEvaluations pattern, PAYMENT_PASSED_STATUSES
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` — downloadPortalDossierDocument structure, existing imports
- `apps/api/src/modules/portal/portal.routes.ts` — existing route style
- `apps/api/src/modules/document-evaluations/document-evaluation.model.ts` — correctionRequestedAt/correctionSubmittedAt fields

---

## Files changed

**Modified:**
- `apps/api/src/modules/oma-phases/document-evaluation.service.ts` — added `getPortalDocumentEvaluationState`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` — extended `downloadPortalDossierDocument` with Phase 3 branches
- `apps/api/src/modules/portal/portal.routes.ts` — added import + GET route for portal evaluation state

---

## Key decisions

1. **No auto-init on portal read** — portal does NOT trigger `initializeDocumentEvaluations`; that stays admin-only
2. **No 409 on closed** — portal reads closed state gracefully (for "Phase III terminée" display); unlike admin which uses `loadDocEvalPhaseOrThrow`
3. **`canUploadPaymentProof` disabled when closed** — `!phaseClosed &&` guard
4. **`canUploadCorrection` = `!phaseClosed && status === "non_satisfaisant" && Boolean(annotation)`** — annotation guard ensures postulant knows what to correct
5. **Empty evaluations before payment gate** — if docEvalStatus not in PAYMENT_PASSED_STATUSES, return `evaluations: []` and zero progress
6. **No reviewedById exposed** — portal-safe; internal user IDs never returned
7. **Download extension adds two new branches** (PhasePayment check → DocumentSubmission check → 403), preserving existing preliminary guard intact
8. **New route placed before existing /payment route** — more specific path first (no conflict since `/document-evaluation` vs `/document-evaluation/payment`)

---

## New endpoint

```
GET /api/v1/portal/dossiers/:id/phases/document-evaluation
Auth: portal session (postulant ownership guard via getOwnedDossier)
```

Response shape:
```ts
{
  phase: { id, phaseKey, status, documentEvaluationStatus };
  payment: { status, invoiceDocumentId, paymentProofDocumentId, invoiceSentAt, paymentProofSubmittedAt };
  canUploadPaymentProof: boolean;
  evaluations: Array<{
    evaluationId, requirementLabel, requirementCode, formCode,
    status, annotation, correctionRequestedAt, correctionSubmittedAt,
    canUploadCorrection
  }>;
  progress: { total, pending, satisfaisant, nonSatisfaisant, correctionSubmitted };
}
```

---

## Download extension

`downloadPortalDossierDocument` now supports (after preliminary phase check fails):
- **Phase 3A**: PhasePayment where invoiceDocumentId or paymentProofDocumentId matches + dossierId matches
- **Phase 3B**: DocumentSubmission where documentId matches + phaseKey="document_evaluation" + dossierId matches + status not replaced/archived

Existing preliminary check preserved unchanged — new branches are additive.

---

## API routes updated

Added to `API_ROUTES.md`:
```
GET /api/v1/portal/dossiers/:id/phases/document-evaluation — portal Phase 3 state (OMA-EVAL-6B)
```
Download extension is transparent (same route, extended scope).

---

## Verification commands run

```
npm run typecheck (api) → 0 errors
npm run build (api) → PASS
```

---

## Manual checks run

Not run — no portal UI yet. Runtime checks deferred to OMA-EVAL-6D.

Manual checklist for later:
1. GET /portal/.../phases/document-evaluation returns 404 for non-owned dossier
2. Returns payment state before payment gate
3. Returns empty evaluations before payment gate
4. Returns evaluations with labels, status, annotation after gate
5. non_satisfaisant with annotation → canUploadCorrection=true
6. correction_submitted → canUploadCorrection=false
7. Invoice download works via /dossiers/:id/documents/:invoiceDocId
8. Payment proof download works similarly
9. Correction doc download works
10. Document from another dossier remains blocked

---

## Known risks / TODOs

- Formal request submission docs (phaseKey="formal_request") are not exposed via portal download — acceptable per scope
- Portal read returns empty evaluations when phase is open but payment not passed — UI must handle gracefully

---

## Next step

**OMA-EVAL-6C** — Portal API client + types:
- `PortalPhase3State`, `PortalPhase3EvaluationItem` types
- `getPortalPhase3State(dossierId)` → GET /portal/dossiers/:id/phases/document-evaluation
- `uploadPortalPaymentProof(dossierId, formData)` → POST ...payment-proof
- `uploadPortalDocumentEvaluationCorrection(evaluationId, formData)` → POST ...correction
- Reuse existing `downloadPortalDossierDocument` (backend now extended)
