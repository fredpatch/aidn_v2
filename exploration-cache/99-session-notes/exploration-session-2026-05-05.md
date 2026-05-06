# Exploration session - 2026-05-05

## Goal
Initialize/update exploration-cache with durable, source-backed project map and workflow documentation.

## Commands run
- pwd
- ls
- find . -maxdepth 3 -type f ... | sort (heavy folders excluded)
- find . -maxdepth 4 -name package.json -print
- multiple code searches for routes/portal/mock usage
- file reads across router, shell, aidn mocks/storage/actions, portal pages, config, docs

## Files inspected
- apps/admin/src/main.tsx
- apps/admin/src/App.tsx
- apps/admin/src/config/nav.tsx
- apps/admin/src/layouts/*
- apps/admin/src/features/aidn/**/*
- apps/admin/src/pages/PortalPreviewPage.tsx
- apps/admin/src/pages/PortalPreviewDossierPage.tsx
- apps/admin/src/pages/portal-preview/portalPreview.utils.ts
- apps/admin/package.json
- apps/admin/.env.example
- infra/docker-compose.yml
- infra/Dockerfile
- docs/AIDN_OMA_WORKFLOW_SOURCE_NOTES.md
- docs/aidn-oma-revised-workflow-blueprint-v1.md
- docs/AIDN-WORKFLOW-OMA.md

## Files created/updated
- Required exploration-cache schema files under 00-control to 10-decisions
- manifest.json at exploration-cache root

## Important findings
- Frontend mock-driven prototype; no backend service implementation in workspace.
- AIDN data is seeded and persisted to localStorage for demo transitions.
- Portal preview is now split into simplified home + tabbed dossier detail and remains read-only.

## Gaps / uncertain points
- Production backend/API design and auth model remain undefined in repo.
- External integration strategy (email/storage/qlog) not implemented.

## Recommended next task
Define and scaffold backend contract for AIDN core entities and transition rules, then connect existing hooks from mock mode to API mode.
