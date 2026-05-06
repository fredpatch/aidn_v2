# Manual QA Checklist

Last reviewed: 2026-05-05

## Core app
- /dashboard loads
- /demandes, /courriers, /dossiers, /workflow-oma load
- /documents, /reunions, /certificats, /reports, /settings load

## Portal preview
- /portal-preview shows simplified home
- Opening active dossier navigates to /portal-preview/dossiers/:id
- Tabs switch correctly on detail page
- Documents/payments/reunions/notifications/certificat are not dumped on home
- No admin mutation action appears in portal pages

## Demo actions (admin pages)
- Reunions demo actions update rows
- Certificat lifecycle demo actions update statuses
- Dossier detail demo actions update evidence/next actions
