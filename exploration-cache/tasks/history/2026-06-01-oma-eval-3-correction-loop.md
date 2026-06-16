# OMA-EVAL-3 — Backend Correction Upload Loop History

Date: 2026-06-01
Status: Complete — API typecheck PASS, build PASS

## Summary

Implemented portal correction upload for Phase 3 non_satisfaisant evaluations. New `correction_submitted` status in DocumentEvaluationModel; correctionRequestedAt/submittedAt/submittedById fields; corrected_document documentType; uploadDocumentEvaluationCorrection service function; portal route POST /document-evaluations/:evaluationId/correction.

## Files changed

- MOD: `apps/api/src/modules/document-evaluations/document-evaluation.model.ts`
- MOD: `apps/api/src/modules/documents/document.model.ts`
- MOD: `apps/api/src/modules/oma-phases/document-evaluation.service.ts`
- MOD: `apps/api/src/modules/portal/portal.routes.ts`

## Next: OMA-EVAL-4 (Phase 3 close backend)
