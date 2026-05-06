# Document Workflow

## Current implementation
- Documents are linked optionally to demande, dossier, and phase.
- Evidence checklist items of kind required_document/formal_courrier/meeting_report also represent document-like proof state.

## Files involved
- apps/admin/src/features/aidn/types/aidn.types.ts
- apps/admin/src/features/aidn/mocks/aidn.mock.ts
- apps/admin/src/pages/DocumentsPage.tsx
- apps/admin/src/pages/PortalPreviewDossierPage.tsx

## Statuses observed
- missing, received, to_review, validated, rejected
- evidence statuses expected/received/scanned/pending_review/validated/missing

## User-facing labels
- Document a fournir
- En analyse
- Valide

## Demo actions / state transitions
- updatePhaseEvidenceStatus in internal dossier detail page.

## Known gaps
- No real file upload/storage pipeline.

## Safe next improvements
- Add backend file metadata model (filename, mime, storage key, uploader).
