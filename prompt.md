## CACHE-FIRST PROTOCOL - ALWAYS FOLLOW

When processing this task, you MUST:

### 1. Read Cache First

Always start by reading:

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md` if relevant
- `exploration-cache/archive/summaries/**` only when needed as source material

### 2. Answer From Cache When Possible

If the answer exists in cache:

- cite the cache source
- answer from cache
- stop there unless the current task explicitly requires implementation

Format:
FROM CACHE: [file path] - [finding]

### 3. Only Explore Gaps

If cache is incomplete, state:

CACHE GAP: [specific missing info]

Then:

- explore only the missing path(s)
- never re-explore cached paths without reason
- keep exploration narrow

4. Update Cache After Each Discovery
   - After any meaningful new finding:
   - update the relevant `exploration/pattern/task file`
   - update `QUICK-REFERENCE.md` if the finding is cross-cutting
   - update `manifest.json` only if the pass requires manifest changes
   - update `exploration-cache/tasks/current-task.md`

5. Token Saving Rules
   - Do not repeat large cached content in the response
   - Use file references instead
   - Do not re-read files already read this session unless needed
   - Keep responses brief and grounded
   - Do not broaden scope silently
   - One task only

### SESSION START PROCEDURE

At the beginning of the task:

1. Read this prompt.md
2. Read exploration-cache/manifest.json
3. Read exploration-cache/QUICK-REFERENCE.md
4. Check whether relevant answer/state already exists in:
   `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
   `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
   `exploration-cache/04-backend/API_ROUTES.md`
   `exploration-cache/05-data/DATA_MODELS.md`
   `exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md`
   `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
   `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
   `exploration-cache/tasks/current-task.md`
5. State cache status briefly.
6. Proceed only with the current objective.

Expected cache status block:

## CACHE STATUS

- Services explored: [brief list]
- App areas explored: [brief list]
- Packages explored: [brief list]
- Patterns available: [brief list]
- Last update: [timestamp]
- Pending gaps: [brief list]

## CRITICAL RULES

NEVER re-explore a path already sufficiently covered in cache unless a real gap exists.
ALWAYS keep scope narrow.
ALWAYS separate planning from implementation.
ALWAYS update task state in cache.
USE exploration-cache/tasks/history/ for completed-pass memory.
ALWAYS update cache after discovering something new.
KEEP responses concise and point to cache files.
ASK before large explorations over 10 files.
Do not implement before returning the planning report and receiving approval.

## QUICK COMMANDS

[STATUS] Show current cache coverage for this objective
[GAPS] List missing info for current objective
[UPDATE] Force cache update with recent findings
[VERIFY] Check if answer exists in cache before exploring
[NEXT] Propose the next narrow pass

## TASK COMPLETION CHECKLIST

Before marking a pass complete:

- all listed deliverables exist
- content is grounded in cache or explicitly explored gaps
- no unrelated files were changed
- exploration-cache/tasks/current-task.md is updated
- create a brief summary-implementation.md with related implementation notes
- next step is clearly stated
- a summary file was created under `exploration-cache/tasks/summaries/`

## Summary Tracking Rule

For every planning, implementation, correction, or modification pass, create a short summary file in:

`exploration-cache/tasks/summaries/`

Use this naming format:

YYYY-MM-DD-<phase-name>-planning.md
YYYY-MM-DD-<phase-name>-implementation.md
YYYY-MM-DD-<phase-name>-modification.md
YYYY-MM-DD-<phase-name>-correction.md

## Each summary must include:

- Objective
- Cache files read
- Source files inspected
- Files changed, if any
- Key decisions
- Implementation details, if any
- Verification commands run
- Manual checks run or not run
- Known risks / TODOs
- Next step

## Also update:

- exploration-cache/tasks/current-task.md
- exploration-cache/tasks/history/ when the pass is completed

# CURRENT OBJECTIVE

# OMA-FORMAL-9A — Admin Phase 2 Read Workspace Planning

You are working inside the existing AIDN_V2 repository.

## Current validated state

OMA-FORMAL-1 to OMA-FORMAL-8 are complete.

Backend Phase 2 supports:

- formal request courrier gate;
- supporting document requirements/checklist;
- supporting document upload;
- document review;
- corrected re-upload after requires_correction;
- DG circuit;
- formal meeting;
- recevability / closure courrier;
- phase closure;
- Phase 3 unlock.

This task is frontend/admin planning + implementation only.

Do not implement portal UI.
Do not add backend endpoints.
Do not change backend business rules.
Do not implement new upload behavior unless already supported by existing API client.
Do not over-polish.

---

## Objective

Add an admin Phase 2 workspace for:

Phase 2 — Demande formelle

The screen must let DN understand:

1. Is the formal request courrier/gate present?
2. Can the dossier be sent to DG?
3. What documents are expected?
4. Which documents are missing, submitted, validated, or correction requested?
5. Has DG circuit happened?
6. Has the formal meeting happened?
7. Is closure evidence present?
8. Can Phase 2 be closed?

---

## Files to inspect first

Read cache first:

- exploration-cache/manifest.json
- exploration-cache/QUICK-REFERENCE.md
- exploration-cache/03-frontend/ADMIN_APP_MAP.md
- exploration-cache/04-backend/API_ROUTES.md
- exploration-cache/06-workflows/OMA_FORMAL_REQUEST_WORKFLOW.md
- exploration-cache/tasks/current-task.md
- latest OMA-FORMAL summaries

Then inspect frontend patterns:

- apps/admin/src/pages/DossierDetailPage.tsx
- apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx
- apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx
- apps/admin/src/pages/dossiers/DossierCourriersTab.tsx
- apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx
- apps/admin/src/pages/dossiers/components/UploadDocumentDialog.tsx
- apps/admin/src/lib/api/dossiers.api.ts
- apps/admin/src/lib/utils/blob.ts
- apps/admin/src/lib/utils/error.ts

---

## Required UI

Create or update:

apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx

If there is already a generic phase workspace pattern, reuse it.

Mount it in:

apps/admin/src/pages/DossierDetailPage.tsx

or wherever Phase préliminaire is currently rendered.

Layout

Use French UI labels.

Recommended sections:

1. Header / status card

Labels:

Phase 2 — Demande formelle
Statut
Progression documentaire
Action suivante

Show backend booleans if available:

canSendToDg
canInviteFormalMeeting
canClosePhase

Convert to French helper text:

Prêt pour circuit DG
En attente du courrier formel
Réunion formelle à programmer
Clôture possible 2. Gate card

Title:

Courrier de demande formelle

Show:

Présent / Manquant
Source
Date de réception
Référence officielle

Important UX rule:

The gate is the only blocking document.

Supporting checklist must not look like it blocks DG progression.

Add helper text:

Ce courrier conditionne la suite du circuit. Les autres pièces restent suivies sans bloquer automatiquement la progression. 3. Document checklist

Render requirements[].

Columns/cards:

Pièce
Niveau
Statut
Dernier dépôt
Source
Actions

French status labels:

missing → Manquant
submitted → Déposé
under_review → En revue
validated → Validé
requires_correction → Correction demandée
rejected → Rejeté
replaced → Remplacé
not_applicable → Non applicable

Requirement levels:

gate → Bloquant
expected → Attendu
optional → Optionnel
conditional → Conditionnel

For repeatable requirements, show a small badge:

Multiple

For replaced submissions, show them in a collapsed/history area, not as the primary active state.

4. DG circuit block

Title:

Circuit DG — Demande formelle

Show:

Non envoyé
Envoyé au circuit DG
Retour DG enregistré
Décision enregistrée

Actions can be disabled placeholders in 9A if mutation wiring is too large.

Do not invent DG behavior.

5. Formal meeting block

Title:

Réunion formelle

Show:

Non programmée
Programmée
Tenue
Compte rendu disponible 6. Closure block

Title:

Recevabilité et clôture

Show:

Courrier de recevabilité
Courrier de clôture Phase II
Peut clôturer la phase

CTA label:

Clôturer la phase 2

Only enable if backend says canClosePhase === true.

API client

Extend apps/admin/src/lib/api/dossiers.api.ts only if missing.

Needed function:

getAdminFormalRequestPhase(dossierId: string)

Expected route likely:

GET /api/v1/admin/dossiers/:id/phases/formal-request

Use existing client conventions.

Do not hardcode fake data if API route exists.

State handling

Use existing page loading/error patterns.

Required states:

Chargement de la phase 2...
Impossible de charger la phase 2
Aucune donnée de phase 2 disponible
UX rules
Keep it compact.
Avoid giant timeline.
Avoid duplicating full Documents tab.
This workspace is operational: “what is missing / what is next”.
Supporting documents must look like tracking, not blocking.
Show corrected re-upload state clearly:
active submission = Déposé
previous submission = Remplacé
document = archived/replaced in history area if returned by API
Verification

Run:

cd apps/admin
npx tsc --noEmit
npm run build

Manual checks:

Dossier detail loads.
Phase 2 section renders.
Gate card shows missing/present.
Checklist renders all requirements.
Correction/replaced statuses display correctly if returned by API.
Supporting docs do not block DG UI wording.
canSendToDg/canInviteFormalMeeting/canClosePhase wording is clear.
No backend changes.
No portal changes.
Build passes.
Return report

Return:

Files inspected
Files changed
API client additions
UI sections implemented
Status/label mapping
Verification results
Risks/TODOs
