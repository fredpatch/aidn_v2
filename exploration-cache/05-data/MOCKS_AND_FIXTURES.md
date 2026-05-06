# Mocks And Fixtures

Last reviewed: 2026-05-05

| File | Exports | Used by | Data represented | Notes |
| --- | --- | --- | --- | --- |
| apps/admin/src/features/aidn/mocks/aidn.mock.ts | aidnDemandes, aidnCourriers, aidnDossiers, aidnOmaPhases, aidnDocuments, aidnMeetings, aidnCertificates, aidnPhaseEvidenceItems, aidnPhaseNextActions, aidnTimelineEvents | aidn-demo-storage, aidn.api, dashboard summary mock | Core AIDN domain mock records | Primary seed source |
| apps/admin/src/features/aidn/mocks/aidn-dashboard.mock.ts | mockGetAidnDashboardSummary | aidn.api | Aggregated KPI summary | Derived from aidn.mock |
| apps/admin/src/features/dashboard/mocks/dashboard.mock.ts | mockGetDashboard | useDashboard hook | Generic dashboard summary | Separate from AIDN dashboard summary |
| apps/admin/src/features/items/mocks/items.mock.ts | mockList/Get/Create/Update/DeleteItem | items.api | Generic items CRUD sample | supports mock/API switch |

## Mock mode switch
- apps/admin/src/config/app.ts (DATA_MODE)
- apps/admin/src/lib/data/data-mode.ts (isMockMode, waitForMockLatency)
