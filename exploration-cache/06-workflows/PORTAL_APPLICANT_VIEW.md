# Portal Applicant View

## Current implementation
- Home page route /portal-preview focuses on summary and next action.
- Detail route /portal-preview/dossiers/:id provides tabbed grouped content.

## Files involved
- apps/admin/src/pages/PortalPreviewPage.tsx
- apps/admin/src/pages/PortalPreviewDossierPage.tsx
- apps/admin/src/pages/portal-preview/portalPreview.utils.ts

## Current grouped sections
- Home: organization selector, active dossier, simplified status, next action, last update, recent updates
- Detail tabs: overview, documents, payments, meetings, notifications, certificate

## Read-only behavior
- Explicitly marked as read-only in UI text.
- No upload/submission/payment actions available.

## Historical UX issue to preserve in audit
- Long single-page concatenation was identified as problematic.
- Current split architecture resolves this and should remain baseline.

## Safe next improvements
- When real postulant auth is added, keep simplified labels and avoid exposing internal DG/DN operations.
