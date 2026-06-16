# Portal Preview Map

Last reviewed: 2026-05-18

## Boundary update
- Real external portal work now starts in `apps/portal`.
- This file describes the historical protected admin preview at `/portal-preview`.
- New portal skeleton details live in `exploration-cache/03-frontend/PORTAL_APP_MAP.md`.

## Current route files
- apps/admin/src/pages/PortalPreviewPage.tsx
- apps/admin/src/pages/PortalPreviewDossierPage.tsx
- apps/admin/src/pages/portal-preview/portalPreview.utils.ts
- Route registration: apps/admin/src/App.tsx

## Current routes
- /portal-preview: simplified portal home
- /portal-preview/dossiers/:id: tabbed dossier detail

## Data sources used
- useDemandes
- useDossiers
- useAidnDocuments
- useAidnMeetings
- useAidnCertificates
- useAidnPhaseEvidence
- useAidnPhaseNextActions
- useAidnTimelineEvents
(all from apps/admin/src/features/aidn)

## Home page sections
- organization selector
- active dossier card
- simplified status card
- next expected action card
- last update card
- recent updates list
- link to dossier detail

## Detail tabs
- Vue d'ensemble
- Documents
- Paiements
- Reunions
- Notifications
- Certificat

## Read-only status
- Explicit read-only language in both pages.
- No submission/upload/payment trigger actions in portal pages.

## Portal UX finding (historical + current)
- Historical issue: earlier preview was a long concatenated page mixing all sections.
- Current state: split already implemented into Home + Detail tabs.
- Keep this boundary in future refactors; avoid reintroducing admin-style concatenation.

## Suggested safe boundaries for future portal work
- Keep label mapping centralized in portalPreview.utils.ts
- Keep AIDN data hook usage in pages, not in low-level UI components
- Keep portal routes under /portal-preview/* until real external auth is introduced
- Do not migrate preview-only admin routes into `apps/portal` without a dedicated slice.
