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

# DASH-2R — Dashboard UI / Runtime Correction Pass

You are working inside the existing `AIDN_V2` repository.

## Context

DASH-1 backend and DASH-2 admin UI are complete.

The dashboard now loads real data from:

```http
GET /api/v1/admin/dashboard

A browser check showed the dashboard is functional and visually usable, but a few correction items are needed before moving to reports or new features.

Do not redesign the dashboard.
Do not add charts.
Do not add exports.
Do not implement certificate backend.
Do not add new workflow actions.
Keep this as a correction pass.

Issues to fix
1. Fix OMA SLA expected business-day constants

The dashboard currently shows incorrect expected durations:

Phase préliminaire: 20
Demande formelle: 30
Évaluation documentaire: 45
Inspection: 30
Délivrance: 15

Correct official expected durations are:

Phase 1 — Phase préliminaire: 30 jours ouvrés
Phase 2 — Demande formelle: 10 jours ouvrés
Phase 3 — Évaluation documentaire: 30 jours ouvrés
Phase 4 — Inspection / démonstration: 25 jours ouvrés
Phase 5 — Délivrance: 5 jours ouvrés

Fix this in the backend dashboard constants/helper, not in React.

Expected UI result:

Délai prévu : 30 jours ouvrés
Délai prévu : 10 jours ouvrés
Délai prévu : 30 jours ouvrés
Délai prévu : 25 jours ouvrés
Délai prévu : 5 jours ouvrés
2. Improve placeholder phase badge logic

Current issue:

Évaluation documentaire
Dossiers actuels : 1
Badge : À venir

This is contradictory because the phase has active records.

Update UI badge behavior:

implemented = true
→ Actif

implemented = false AND currentDossiers === 0
→ À venir

implemented = false AND currentDossiers > 0
→ Phase ouverte

Optional alternative label:

Structure partielle

Preferred label:

Phase ouverte

Do not hide placeholder phases.

3. Improve unavailable certificate metrics

Current issue:

Certificats délivrés: À venir + badge Normal
Certificats prêts: À venir + badge Normal

When meta.unavailableMetrics contains "certificates":

show value as À venir;
badge should be Non disponible;
use muted/neutral styling;
do not show Normal.

Affected cards:

Certificats délivrés
Certificats prêts
Certificats signés/cachetés if displayed

Do not remove certificate cards.

4. Improve priority action labels for documents

Current issue:

Many actions appear as repeated generic labels:

Document à vérifier
Document à vérifier
Document à vérifier

Expected display:

Document à vérifier
Demande formelle
28/05/2026 10:19

If backend already provides entityLabel, make it more visible in UI.

If backend does not provide a useful document/entity label, update backend priority action generation to include a better entityLabel, using available fields such as:

document title
document fileName
requirement label
phase label
dossier number

Do not calculate business priority in React; only improve labels.

5. Clean French labels / accents

Fix visible labels in touched dashboard code:

A imprimer DG → À imprimer DG
En attente retour DG → En attente du retour DG
Reunions à venir → Réunions à venir
Certificats delivrés → Certificats délivrés
A venir → À venir
A suivre → À suivre

Also verify:

Mois en cours
Année
Dossiers non assignés
Documents à vérifier
Corrections postulant
Phases en retard
Activité récente

Use proper French accents.

Files to inspect
apps/api/src/modules/dashboard/dashboard.helpers.ts
apps/api/src/modules/dashboard/dashboard.service.ts
apps/api/src/modules/dashboard/dashboard.types.ts
apps/admin/src/pages/DashboardPage.tsx
apps/admin/src/lib/api/dashboard.api.ts

Also inspect existing UI badge/card primitives if needed.

Backend changes allowed

Allowed only for:

SLA constants
priorityActions entityLabel/metadata

Do not change endpoint route or response structure unless required for safer labels.

Frontend changes allowed

Allowed only for:

phase badge logic
certificate unavailable display
labels/accents
priority action presentation
small spacing/readability fixes

Do not add new sections.

Verification commands

Run if backend touched:

cd apps/api
npm run typecheck
npm run build

Run for admin:

cd apps/admin
npx tsc --noEmit
npm run build

If build hits the known Vite/Tailwind native Windows binary issue, document it and rerun outside sandbox if that is the existing project convention.

Manual browser checks

Check dashboard with DN profile:

1. SLA values match official values.
2. Phase 3–5 show À venir only when no active dossier exists.
3. Any not-implemented phase with currentDossiers > 0 shows Phase ouverte.
4. Certificate cards show À venir + Non disponible, not Normal.
5. Priority actions show useful secondary labels.
6. French accents are correct.
7. Period selector still works.
8. No mock data appears.

Check courrier/DG profile:

1. Courrier/DG dashboard still renders.
2. DN-only sections remain hidden.
3. Labels are accented correctly.
4. No permission regression.
Documentation updates

Update:

TASK.md
exploration-cache/03-frontend/ADMIN_APP_MAP.md
exploration-cache/04-backend/API_ROUTES.md
exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md
exploration-cache/tasks/current-task.md
exploration-cache/manifest.json

Create:

exploration-cache/tasks/summaries/2026-05-29-dash-2r-dashboard-correction-pass.md

Document:

SLA constants corrected;
phase badge logic corrected;
certificate unavailable display corrected;
priority action labels improved;
French labels cleaned;
verification commands.
Expected implementation report

Return:

Files modified.
SLA constants corrected.
Phase badge behavior.
Certificate unavailable behavior.
Priority action label behavior.
French label cleanup.
Verification commands run.
Browser/manual checks run or not run.
Known risks/TODOs.
Next recommended slice.
```
