# Meeting Workflow

## Current implementation
- Meeting records include title, date, location, participants, outcome, convocation metadata, and optional reportDocumentId.

## Files involved
- apps/admin/src/features/aidn/types/aidn.types.ts
- apps/admin/src/features/aidn/mocks/aidn.mock.ts
- apps/admin/src/features/aidn/storage/aidn-demo-actions.ts
- apps/admin/src/pages/ReunionsPage.tsx
- apps/admin/src/pages/PortalPreviewDossierPage.tsx

## Statuses observed
- outcomes: planned, held, postponed, cancelled

## User-facing labels
- Reunion programmee
- Compte rendu disponible
- Compte rendu a venir

## Demo actions / state transitions
- markMeetingScheduled
- markMeetingReportAvailable

## Known gaps
- No real Outlook/email invitation integration.

## Safe next improvements
- Add separate convocation entity with sender/channel and notification delivery status.
