# OMA-EVAL-0 — Phase 3 Audit & Planning History

Date: 2026-06-01
Status: Complete — planning only, no implementation

## Summary

Audited backend, frontend, and cache for all patterns reusable in Phase 3. Confirmed Phase 3 unlock is already implemented in `closeFormalRequestPhase`. Proposed new models (PhasePayment, DocumentEvaluation), OmaPhase schema extension, 8 new API endpoints, admin workspace, portal UI, and 7 implementation slices.

## Key facts locked in

- Phase 3 OmaPhase record is auto-created by Phase 2 close (formal-request.service.ts:1537)
- Dossier status already transitions to `document_evaluation_phase` on Phase 2 close
- No PhasePayment model, no DocumentEvaluation model, no Phase 3 service exists yet
- `DocumentRequirement` and `DocumentSubmission` models already include `document_evaluation` in phaseKey enum
- Phase 3 evaluations are based on Phase 2 submitted documents, not new requirements
- No S5 role exists — invoice upload must use DOCUMENT_UPLOAD_INTERNAL

## Next: OMA-EVAL-1 (backend payment gate)
