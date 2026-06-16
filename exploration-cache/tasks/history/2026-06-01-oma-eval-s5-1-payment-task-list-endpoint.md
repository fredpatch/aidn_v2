# OMA-EVAL-S5-1 — S5 Payment Task List Endpoint History

Date: 2026-06-01
Status: Complete

## Summary

Created `phase-payment.service.ts` with `listPhasePaymentTasks`. Route added to `admin.routes.ts`.
OmaPhase-first query synthesizes invoice_pending for phases without payment records.
Typecheck: 0 errors.

## Files changed

New: `apps/api/src/modules/payments/phase-payment.service.ts`
Modified: `apps/api/src/modules/admin/admin.routes.ts` (import + route)

## Next: OMA-EVAL-S5-2 (frontend API client + nav/route)
