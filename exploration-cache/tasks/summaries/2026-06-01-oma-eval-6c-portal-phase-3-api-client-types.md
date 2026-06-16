# OMA-EVAL-6C — Portal Phase 3 API Client + Types

Date: 2026-06-01
Type: implementation (portal frontend)
Status: Complete — portal tsc 0 errors

---

## Objective

Add portal API client types and methods for Phase 3 (Évaluation approfondie) to `portal.api.ts`.

---

## Cache files read

- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-6a-portal-phase-3-api-readiness-audit.md`
- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-6b-portal-phase-3-backend-read-download.md`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`

---

## Source files inspected

- `apps/api/src/modules/oma-phases/document-evaluation.service.ts` — exact backend response shapes for payment proof upload and correction upload
- `apps/portal/src/lib/api/http.ts` — confirmed `portalPostForm<TResponse>` generic signature
- `apps/portal/src/lib/api/portal.api.ts` — existing type naming + method patterns

---

## Files changed

**Modified:**
- `apps/portal/src/lib/api/portal.api.ts` — 8 types + 3 methods appended at end of file

---

## Key decisions

1. **`downloadPortalDossierDocument` NOT added** — already exists (line 346-353 of portal.api.ts); backend now supports Phase 3 docs after 6B. UI must reuse it.
2. **`PortalPaymentProofUploadResult` matched to actual backend return** — backend returns `{ phaseStatus, documentEvaluationStatus, payment, canUploadPaymentProof }`, not the minimal shape in the prompt. Used actual shape.
3. **`PortalCorrectionUploadResult` matched to actual backend return** — `{ uploaded, evaluation: { id, status, correctionSubmissionId, currentSubmissionId, currentDocumentId }, document, submission }`
4. **Typed `portalPostForm<TResponse>`** — generic is already supported, no cast needed.
5. **No new file** — `portal.api.ts` is the canonical API client; types appended in one block.

---

## Types added (8)

```
PortalDocumentEvaluationStatus
PortalDocumentEvaluationPhaseStatus
PortalPhasePaymentStatus
PortalDocumentEvaluationPhase
PortalPhase3Payment
PortalDocumentEvaluationEntry
PortalDocumentEvaluationProgress
PortalPhase3State
PortalPaymentProofUploadResult
PortalCorrectionUploadResult
```

---

## Methods added (3)

| Method | Endpoint | HTTP helper |
|---|---|---|
| `getPortalPhase3State(dossierId)` | GET /portal/dossiers/:id/phases/document-evaluation | `portalGet` |
| `uploadPortalPaymentProof(dossierId, formData)` | POST .../payment-proof | `portalPostForm` |
| `uploadPortalDocumentEvaluationCorrection(evaluationId, formData)` | POST /portal/document-evaluations/:evaluationId/correction | `portalPostForm` |

---

## Download method decision

`downloadPortalDossierDocument(dossierId, documentId)` already exists — no duplicate added. Phase 3 UI reuses it directly.

---

## Verification

```
npx tsc --noEmit (portal) → 0 errors
```
(Build not run — no Vite/Tailwind changes, tsc covers this pass.)

---

## Manual checks

Not run — API client only, no UI yet.

---

## Known risks / TODOs

- `portalGet` returns `Promise<TResponse>` — call sites must handle 404 when Phase 3 not yet opened
- `PortalPaymentProofUploadResult.payment.invoiceSentAt` etc. come as `string | undefined` from backend (`toId`/`toIso` return undefined, not null) — types use `string | null` which is slightly looser; safe at runtime

---

## Next step

**OMA-EVAL-6D** — Portal Phase 3 UI block in `RequestDetailPage.tsx` Dossier tab:
- Invoice download button (if `invoiceDocumentId`)
- Payment proof upload card (if `canUploadPaymentProof`)
- Evaluation list with per-item status + annotation + correction upload
- Load `getPortalPhase3State(dossierId)` separately when Dossier tab activates and status indicates Phase 3
