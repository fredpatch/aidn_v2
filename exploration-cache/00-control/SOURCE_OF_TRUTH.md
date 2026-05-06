# Source Of Truth

Priority order for factual decisions:
1. Actual source code under apps/admin/src and config files
2. Existing exploration-cache files (if recently refreshed)
3. docs/* workflow notes and blueprint docs
4. User/stakeholder corrections in chat/task prompts
5. Explicit assumptions (must be labeled as assumptions)

## Primary code sources currently used
- Router: apps/admin/src/App.tsx
- Bootstrap/providers: apps/admin/src/main.tsx
- Shell/navigation: apps/admin/src/layouts/* and apps/admin/src/config/nav.tsx
- AIDN data layer: apps/admin/src/features/aidn/*
- Portal preview pages: apps/admin/src/pages/PortalPreviewPage.tsx and apps/admin/src/pages/PortalPreviewDossierPage.tsx

## Document sources used for business context
- docs/AIDN_OMA_WORKFLOW_SOURCE_NOTES.md
- docs/aidn-oma-revised-workflow-blueprint-v1.md
- docs/AIDN-WORKFLOW-OMA.md
