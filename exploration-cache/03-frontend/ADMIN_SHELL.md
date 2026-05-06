# Admin Shell

Last reviewed: 2026-05-05

## Shell files
- apps/admin/src/layouts/AdminLayout.tsx
- apps/admin/src/layouts/Sidebar.tsx
- apps/admin/src/layouts/Header.tsx
- apps/admin/src/layouts/Footer.tsx
- apps/admin/src/components/layout/PageTransition.tsx
- apps/admin/src/config/nav.tsx

## Navigation groups (config/nav.tsx)
- Pilotage: /dashboard, /reports
- Traitement: /demandes, /courriers, /dossiers, /workflow-oma
- Suivi: /documents, /reunions, /certificats
- Prototype: /portal-preview
- Administration: /settings

## Auth shell behavior
- ProtectedRoute redirects to /login when local token absent.
- AuthRoute redirects authenticated users to /dashboard.
