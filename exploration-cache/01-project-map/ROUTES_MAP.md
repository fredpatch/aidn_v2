# Routes Map

Last reviewed: 2026-05-05
Source: apps/admin/src/App.tsx

| Route | Page/component | Purpose | Data source | Notes |
| --- | --- | --- | --- | --- |
| /login | LoginPage | Demo login entry | localStorage token | In AuthRoute branch |
| / | Navigate -> /dashboard | Root redirect | n/a | Protected |
| /dashboard | DashboardPage | Overview KPIs/activity | dashboard mocks / hooks | Protected |
| /demandes | DemandesPage | Request tracking | useDemandes (aidnApi.listDemandes) | Protected |
| /courriers | CourriersPage | Courrier + DG orientation view | useCourriers + useDgDecisionRecords | Protected |
| /dossiers | DossiersPage | Dossier list | useDossiers (+ related entities) | Protected |
| /dossiers/:id | DossierDetailPage | Internal detailed workspace with demo actions | AIDN hooks + demo actions | Protected |
| /workflow-oma | WorkflowOmaPage | OMA phase-centric view | AIDN phase/evidence data | Protected |
| /documents | DocumentsPage | Documents/evidence list | AIDN documents + links | Protected |
| /reunions | ReunionsPage | Meeting tracking | AIDN meetings + demo actions | Protected |
| /certificats | CertificatsPage | Certificate lifecycle | AIDN certificates + demo actions | Protected |
| /management | ManagementPage | Admin/management placeholder | local/frontend | Protected |
| /reports | ReportsPage | Aggregated reporting | AIDN entities summary | Protected |
| /portal-preview | PortalPreviewPage | Postulant portal home (simplified) | AIDN hooks + timeline | Protected; read-only |
| /portal-preview/dossiers/:id | PortalPreviewDossierPage | Postulant dossier detail tabs | AIDN hooks | Protected; read-only |
| /settings | SettingsPage | Environment and app settings display | config/app | Protected |
| * | Navigate -> /dashboard | Catch-all redirect | n/a | Global fallback |
