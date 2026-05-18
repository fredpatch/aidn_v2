# Exploration Cache Index

Purpose: durable map of the current AIDN prototype so future agents can start from facts instead of rescanning the full repo.

## Reading order for future agents
1. 00-control/SOURCE_OF_TRUTH.md
2. 00-control/CURRENT_STATE.md
3. 01-project-map/REPO_STRUCTURE.md
4. 01-project-map/ROUTES_MAP.md
5. 03-frontend/PORTAL_PREVIEW_MAP.md (for portal tasks)
6. 03-frontend/ADMIN_APP_MAP.md (for admin auth/account/personnel/audit UI tasks)
7. 05-data/MOCKS_AND_FIXTURES.md
8. 06-workflows/*.md relevant to your task
9. 04-backend/personnel-mariadb-adapter.md (for official personnel DB/auth tasks)
10. 10-decisions/internal-auth-flow.md (for internal login/account activation tasks)
11. 09-qa/BUILD_AND_TEST_COMMANDS.md
12. 10-decisions/DECISIONS_LOG.md

## Folder map
- 00-control: global orientation and update protocol
- 01-project-map: structure, entrypoints, route map, boundaries
- 02-domain: glossary, business rules, statuses, roles
- 03-frontend: architecture, shell, portal map, component and UI patterns
- 04-backend: backend/API reality (or explicit absence)
- 05-data: mock data, models, seed behavior
- 06-workflows: operational workflow behavior as implemented now
- 07-ui-ux: page-level UX, navigation, portal UX audit, status labels
- 08-integrations: email/storage/external system status
- 09-qa: build commands, known gaps, risks, manual checklist
- 10-decisions: decisions and open questions
- 99-session-notes: per-session trace log

## This cache was refreshed from source code on
- Date: 2026-05-18
- Main apps: apps/admin, apps/api
- Backend auth/personnel source: apps/api/src/modules/auth, apps/api/src/modules/admin, apps/api/src/modules/personnel
- Admin UI auth/personnel/audit source: apps/admin/src/contexts/AuthContext.tsx, apps/admin/src/lib/api, apps/admin/src/pages
