# Certificate Workflow

## Current implementation
- Certificate lifecycle tracked per dossier with timestamps for prepare/print/sign/scan/ready/collected/archived.

## Files involved
- apps/admin/src/features/aidn/types/aidn.enums.ts
- apps/admin/src/features/aidn/mocks/aidn.mock.ts
- apps/admin/src/features/aidn/storage/aidn-demo-actions.ts
- apps/admin/src/pages/CertificatsPage.tsx
- apps/admin/src/pages/PortalPreviewDossierPage.tsx

## Statuses observed
- to_prepare -> printed -> signed_stamped -> scanned_in_aidn -> ready_for_collection -> collected -> archived

## User-facing labels
- Certificat en preparation
- Pret au retrait
- Retire

## Demo actions / state transitions
- setCertificateLifecycleStatus
- advanceCertificateLifecycle

## Known gaps
- No real certificate generation, signature, stamp, or delivery workflow service.

## Safe next improvements
- Introduce immutable certificate issuance event log and printable artifact metadata.
