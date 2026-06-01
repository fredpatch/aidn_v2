# OMA-EVAL-1 — Backend Payment Gate History

Date: 2026-06-01
Status: Complete — API typecheck PASS, lint PASS, build PASS

## Summary

Implemented the Phase 3 payment gate: new `s5_agent` role, `PAYMENT_INVOICE_UPLOAD`/`PAYMENT_VIEW` permissions, `PhasePaymentModel`, `OmaPhase.documentEvaluationStatus` sub-status field, admin invoice upload + read, portal payment state + proof upload.

## Files created/changed

- NEW: `apps/api/src/modules/payments/phase-payment.model.ts`
- NEW: `apps/api/src/modules/oma-phases/document-evaluation.service.ts`
- MOD: `apps/api/src/shared/permissions/permissions.ts`
- MOD: `apps/api/src/modules/documents/document.model.ts`
- MOD: `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- MOD: `apps/api/src/modules/oma-phases/formal-request.service.ts`
- MOD: `apps/api/src/modules/admin/admin.routes.ts`
- MOD: `apps/api/src/modules/portal/portal.routes.ts`

## Next: OMA-EVAL-2 (document evaluation backend)
