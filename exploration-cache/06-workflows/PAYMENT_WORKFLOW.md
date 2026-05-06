# Payment Workflow

## Current implementation
- Payments represented as phase evidence kinds: invoice and payment_proof.
- Payment statuses inferred from evidence status.

## Files involved
- apps/admin/src/features/aidn/mocks/aidn.mock.ts
- apps/admin/src/features/aidn/storage/aidn-demo-actions.ts
- apps/admin/src/pages/DossierDetailPage.tsx
- apps/admin/src/pages/PortalPreviewDossierPage.tsx

## Statuses observed
- expected, missing, received, pending_review, validated

## User-facing labels
- Action attendue
- En analyse
- Valide

## Demo actions / state transitions
- markPaymentEvidenceReceived
- markPaymentEvidenceValidated

## Known gaps
- No compta/S5 dedicated authenticated module.
- No payment proof verification workflow beyond status toggles.

## Safe next improvements
- Introduce payment request entity separate from evidence item with audit trail.
