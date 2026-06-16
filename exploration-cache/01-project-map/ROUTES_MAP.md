# Routes Map

Last reviewed: 2026-05-18
Source: apps/admin/src/App.tsx, apps/portal/src/App.tsx

## Admin app routes

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
| /admin/demandes-comptes | AccountRequestsPage | Review external postulant account requests | admin account request API | Protected by POSTULANT_ACCOUNT_REVIEW |
| /admin/personnel | PersonnelPage | Personnel search and internal account activation | admin personnel API | Protected by PERSONNEL_SEARCH/AIDN_USER_ACTIVATE |
| /admin/internal-accounts | InternalAccountsPage | Internal account list | admin internal accounts API | Protected by AIDN_USER_ACTIVATE |
| /admin/audit-logs | AuditLogsPage | Audit log list | admin audit API | Protected by AUDIT_VIEW |
| * | Navigate -> /dashboard | Catch-all redirect | n/a | Global fallback |

## Portal app routes

| Route | Page/component | Purpose | Data source | Notes |
| --- | --- | --- | --- | --- |
| / | LandingPage | Public portal introduction and account/login CTAs | local/static | apps/portal |
| /demande-compte | AccountRequestPage | External account request form shell | local placeholder | API not wired yet |
| /connexion | LoginPage | Postulant login placeholder | local placeholder | Auth not implemented yet |
| /tableau-de-bord | PortalDashboardPage | Postulant dashboard placeholder | local/static | Protected placeholder; redirects to /connexion |
| /demandes | MyRequestsPage | Postulant request list placeholder | local/static | Protected placeholder; redirects to /connexion |
| /demandes/:id | RequestDetailPage | Request detail placeholder | route param only | Protected placeholder; redirects to /connexion |
| * | NotFoundPage | Portal fallback | local/static | apps/portal |
