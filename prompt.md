# AIDN — Exploration Cache Initialization Prompt

You are working on the AIDN prototype codebase.

## Objective

Explore the current state of the project and create/fill a durable `exploration-cache/` folder so future implementation agents can reduce exploration time and work from a reliable project map.

Do **not** implement product features in this pass.  
Do **not** refactor application code unless strictly needed to read or document it.  
This task is documentation/exploration only.

---

## Context

AIDN is a semi-digital workflow application for the Direction de la Navigabilité.

The prototype currently includes internal/admin pages such as:

- dashboard
- demandes
- courriers / orientation DG
- dossiers DN
- workflow OMA
- documents
- réunions
- certificats
- reports
- settings
- portal postulant demo / portal preview

Important business principles:

- AIDN is not full dematerialization in v1.
- The official courrier/DG circuit remains semi-physical.
- A demande becomes a dossier DN only after DG orientation toward DN.
- The postulant portal must expose simplified statuses, not internal workflow complexity.
- The prototype may be mock-data driven.

---

# Task

Inspect the repository and create or update the following folder structure:

```txt
exploration-cache/
├── 00-control/
│   ├── INDEX.md
│   ├── CURRENT_STATE.md
│   ├── EXPLORATION_PROTOCOL.md
│   └── SOURCE_OF_TRUTH.md
├── 01-project-map/
│   ├── REPO_STRUCTURE.md
│   ├── ROUTES_MAP.md
│   ├── ENTRYPOINTS.md
│   └── MODULE_BOUNDARIES.md
├── 02-domain/
│   ├── DOMAIN_GLOSSARY.md
│   ├── BUSINESS_RULES.md
│   ├── STATUSES.md
│   └── ROLES_AND_PERMISSIONS.md
├── 03-frontend/
│   ├── FRONTEND_ARCHITECTURE.md
│   ├── ADMIN_SHELL.md
│   ├── PORTAL_PREVIEW_MAP.md
│   ├── COMPONENT_INVENTORY.md
│   └── UI_PATTERNS.md
├── 04-backend/
│   ├── BACKEND_ARCHITECTURE.md
│   ├── API_ROUTES.md
│   ├── SERVICES_AND_CONTROLLERS.md
│   └── AUTH_AND_PERMISSIONS.md
├── 05-data/
│   ├── MOCKS_AND_FIXTURES.md
│   ├── DATA_MODELS.md
│   └── SEED_DATA.md
├── 06-workflows/
│   ├── DEMANDE_TO_DOSSIER.md
│   ├── DG_ORIENTATION.md
│   ├── OMA_WORKFLOW.md
│   ├── DOCUMENT_WORKFLOW.md
│   ├── PAYMENT_WORKFLOW.md
│   ├── MEETING_WORKFLOW.md
│   ├── CERTIFICATE_WORKFLOW.md
│   └── PORTAL_APPLICANT_VIEW.md
├── 07-ui-ux/
│   ├── PAGE_LEVEL_UX.md
│   ├── PORTAL_UX_AUDIT.md
│   ├── STATUS_LABELS_EXTERNAL.md
│   └── NAVIGATION_MODEL.md
├── 08-integrations/
│   ├── EMAIL_NOTIFICATIONS.md
│   ├── FILE_STORAGE.md
│   └── QLOG_OR_EXTERNAL_SYSTEMS.md
├── 09-qa/
│   ├── BUILD_AND_TEST_COMMANDS.md
│   ├── KNOWN_GAPS.md
│   ├── RISK_REGISTER.md
│   └── MANUAL_QA_CHECKLIST.md
├── 10-decisions/
│   ├── DECISIONS_LOG.md
│   └── OPEN_QUESTIONS.md
└── 99-session-notes/
    └── exploration-session-YYYY-MM-DD.md

Create missing files. Update existing files if already present.

Required exploration method
1. Start with project structure

Inspect:

pwd
ls
find . -maxdepth 3 -type f | sort

Ignore heavy folders:

node_modules
dist
build
coverage
.git
.cache
.vite
.next

Document the result in:

exploration-cache/01-project-map/REPO_STRUCTURE.md

Include:

apps/packages/services layout
important source folders
config files
build tooling
where frontend lives
where backend lives, if present
where mock/demo data lives
2. Identify entrypoints and routes

Search for:

router
routes
createBrowserRouter
BrowserRouter
<Route
path:

Document in:

exploration-cache/01-project-map/ROUTES_MAP.md
exploration-cache/01-project-map/ENTRYPOINTS.md

For each route, capture:

Route	Page/component	Purpose	Data source	Notes

Pay special attention to:

/portal-preview
/portal-preview/*
/demandes
/courriers
/dossiers
/dossiers/:id
/workflow-oma
/documents
/reunions
/certificats
/reports
/settings
3. Inspect frontend architecture

Find:

app bootstrap
router config
layouts
sidebar/nav config
pages directory
shared UI components
feature folders
hooks
API/data access files

Document in:

exploration-cache/03-frontend/FRONTEND_ARCHITECTURE.md
exploration-cache/03-frontend/ADMIN_SHELL.md
exploration-cache/03-frontend/COMPONENT_INVENTORY.md
exploration-cache/03-frontend/UI_PATTERNS.md

Include exact file paths.

4. Inspect portal preview

Search for portal-related files:

grep -R "portal" -n .
grep -R "postulant" -n .
grep -R "Portal" -n .

Document in:

exploration-cache/03-frontend/PORTAL_PREVIEW_MAP.md
exploration-cache/06-workflows/PORTAL_APPLICANT_VIEW.md
exploration-cache/07-ui-ux/PORTAL_UX_AUDIT.md

Capture:

current portal page file path
components used
mock data used
current sections displayed
current problems
how data is currently grouped
whether portal is read-only
what should remain unchanged
recommended next refactor boundaries

Important UX finding to record:

The current portal preview shows too much information on one long page. It should later be split into:

Portal home
└── Dossier detail page
    ├── Vue d’ensemble
    ├── Documents
    ├── Paiements
    ├── Réunions
    ├── Notifications
    └── Certificat

Do not implement this refactor now. Only document it.

5. Inspect mock/demo data

Search for:

mock
mocks
fixture
fixtures
demo
seed
aidn-demo

Document in:

exploration-cache/05-data/MOCKS_AND_FIXTURES.md
exploration-cache/05-data/DATA_MODELS.md
exploration-cache/05-data/SEED_DATA.md

Capture:

File	Exports	Used by	Data represented	Notes

Pay attention to data for:

demandes
courriers
dossiers
OMA phases
documents
payments
meetings/reunions
certificates
portal preview
notifications
6. Inspect workflows

From code and data, document current implemented workflow behavior in:

exploration-cache/06-workflows/DEMANDE_TO_DOSSIER.md
exploration-cache/06-workflows/DG_ORIENTATION.md
exploration-cache/06-workflows/OMA_WORKFLOW.md
exploration-cache/06-workflows/DOCUMENT_WORKFLOW.md
exploration-cache/06-workflows/PAYMENT_WORKFLOW.md
exploration-cache/06-workflows/MEETING_WORKFLOW.md
exploration-cache/06-workflows/CERTIFICATE_WORKFLOW.md

Each workflow file should include:

# Workflow name

## Current implementation

## Files involved

## Statuses observed

## User-facing labels

## Demo actions / state transitions

## Known gaps

## Safe next improvements
7. Inspect domain rules

Document:

exploration-cache/02-domain/DOMAIN_GLOSSARY.md
exploration-cache/02-domain/BUSINESS_RULES.md
exploration-cache/02-domain/STATUSES.md
exploration-cache/02-domain/ROLES_AND_PERMISSIONS.md

Include at least:

demande
courrier
orientation DG
dossier DN
postulant
organisme
workflow OMA
phase
document
réunion
convocation
paiement
certificat
retrait
notification

Separate:

Internal status
External/postulant status
Demo-only status
8. Inspect backend if present

If backend exists, inspect:

Express/Nest/etc entrypoints
API route registration
controllers
services
repositories
auth middleware
validation
storage/file upload handling

Document in:

exploration-cache/04-backend/BACKEND_ARCHITECTURE.md
exploration-cache/04-backend/API_ROUTES.md
exploration-cache/04-backend/SERVICES_AND_CONTROLLERS.md
exploration-cache/04-backend/AUTH_AND_PERMISSIONS.md

If no backend exists or prototype is frontend-only/mock-only, state that clearly.

9. Inspect integrations

Document current reality, not assumptions:

exploration-cache/08-integrations/EMAIL_NOTIFICATIONS.md
exploration-cache/08-integrations/FILE_STORAGE.md
exploration-cache/08-integrations/QLOG_OR_EXTERNAL_SYSTEMS.md

For each:

implemented?
mocked?
referenced only?
not present?
future requirement?
10. QA and commands

Inspect package scripts:

cat package.json
find . -name package.json -maxdepth 4 -print

Document in:

exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md
exploration-cache/09-qa/MANUAL_QA_CHECKLIST.md
exploration-cache/09-qa/KNOWN_GAPS.md
exploration-cache/09-qa/RISK_REGISTER.md

Include:

install command
dev command
typecheck command
build command
lint/test if available
verified or not verified
manual pages to check

Do not claim commands passed unless you actually run them.

11. Decisions and open questions

Create/update:

exploration-cache/10-decisions/DECISIONS_LOG.md
exploration-cache/10-decisions/OPEN_QUESTIONS.md

Record known decisions:

MVP is semi-digital, not full dematerialization.
DG does not necessarily need to work directly in app v1.
DN/Admin may record DG decision from physical courrier.
Portal uses simplified statuses.
Portal preview remains read-only for demo.
OMA is the priority workflow for MVP.

Record open questions discovered from code gaps or unclear implementation.

12. Control files

Update:

exploration-cache/00-control/INDEX.md
exploration-cache/00-control/CURRENT_STATE.md
exploration-cache/00-control/EXPLORATION_PROTOCOL.md
exploration-cache/00-control/SOURCE_OF_TRUTH.md
INDEX.md must include:
folder map
what each folder is for
recommended reading order for future agents
CURRENT_STATE.md must include:
project status
implemented modules
mock/demo limitations
next recommended implementation target
EXPLORATION_PROTOCOL.md must include:
how future agents should update the cache
what files to read first
what commands to run
how to record findings
what not to do
SOURCE_OF_TRUTH.md must include:

Priority order:

Actual source code
Existing exploration-cache files
Project feasibility study / cahier des charges
User/stakeholder corrections
Assumptions clearly marked as assumptions
Required output quality

Each .md file should be useful to a future coding agent.

Avoid vague text like:

This file contains information about routes.

Prefer concrete findings:

Route `/portal-preview` is registered in `apps/admin/src/router.tsx` and renders `PortalPreviewPage` from `...`.
It currently reads demo data from `...`.
It displays documents, payments, meetings, notifications, and certificate cards on one page.
File citation convention inside cache

Whenever possible, include exact source file paths and symbols:

Source:
- `apps/admin/src/router.tsx`
- `apps/admin/src/pages/portal/PortalPreviewPage.tsx`
- `apps/admin/src/features/aidn-demo/aidn-demo-data.ts`

No need for line-perfect citations, but include enough path detail for future navigation.

Session note

Create:

exploration-cache/99-session-notes/exploration-session-YYYY-MM-DD.md

Include:

# Exploration session — YYYY-MM-DD

## Goal

## Commands run

## Files inspected

## Files created/updated

## Important findings

## Gaps / uncertain points

## Recommended next task
Verification

After creating/updating the cache:

Run if available:

npx tsc --noEmit
npm run build

If the project is large and these commands are expensive, at minimum run:

git status --short

Then report:

files created/updated
commands run
pass/fail/not run
key findings
next recommended implementation task
Final response format

Return a concise implementation report:

## Exploration Cache Report

### Files created/updated

### Project state summary

### Key findings

### Commands run

### Verification status

### Recommended next task

Create a manifest.json file which act a a summary or index file if there is not any yet, to guide exploration/navigation through the exploration-cache.
```
