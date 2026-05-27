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

# OMA-FORMAL-9C0 — Phase 2 UI Alignment Cleanup

You are working inside the existing `AIDN_V2` repository.

## Current validated state

OMA-FORMAL-9C is complete.

Phase 2 now has the guided “Prochaine action” card, similar to Phase 1:

- waiting states for postulant / Courriers officiels / DG return / DG decision;
- action buttons for réunion formelle;
- report upload;
- phase closure when allowed.

Current issue:
The Phase 2 workspace still feels different from Phase 1 and is visually too long.

Redundant blocks:

- `Circuit officiel` block duplicates the left “Progression phase active”.
- `Recevabilité et clôture` block also duplicates the same progression checklist.
- Header/status layout differs from Phase préliminaire.

---

## Objective

Clean the Phase 2 admin workspace so it visually follows the Phase préliminaire pattern.

Keep the guided action card.
Remove duplicated checklist blocks from the right panel.
Make the right panel shorter and more operational.

Frontend/admin only.

Do not change backend.
Do not change portal.
Do not change Courriers officiels.
Do not change meeting/closure business rules.
Do not remove the left progression checklist.

---

## Explore first

Read cache first:

- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/tasks/current-task.md`
- latest OMA-FORMAL 9B2 and 9C summaries

Then inspect:

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`

---

## Required changes

### 1. Align Phase 2 header with Phase 1

Phase 2 header should look closer to Phase préliminaire.

Use the same style/order as much as possible:

Phase 2 — Demande formelle

Statut demande formelle
Phase statut
Démarrée le
Clôturée le
Circuit officiel
Retour DG

Keep “Circuit officiel” as a metadata field if useful, but not as a full block.

Expected values:

Circuit officiel:

- Non mis en circuit
- Mis en circuit
- Retour scanné
- Décision enregistrée

Do not create a separate large section for it.

2. Remove/hide Circuit officiel block

Remove the large workflow section titled:

Circuit officiel

Reason:
This state is already visible in:

top metadata;
left progression card;
guided “Prochaine action” card.

Do not remove underlying status computations if they are still used by the guided card.

3. Remove/hide Recevabilité et clôture checklist block

Remove the large block titled:

Recevabilité et clôture

Reason:
It duplicates the left progression checklist.

Keep its logic only if needed for:

canClosePhase;
guided action card;
status computations.

Do not delete backend/state logic.

4. Keep Courrier formel section

Keep it because it gives useful source/context:

Courrier formel
Demande formelle reçue via le portail
Source
Date réception

It should remain read-only.

5. Keep Réunion formelle section

Keep it because it gives useful operational details:

Réunion formelle
Statut
Date prévue
Lieu
Compte rendu

This mirrors the Phase 1 meeting sections.

6. Keep compact Documents de demande formelle

Keep the compact version only:

14 pièces suivies · 1 déposée · 0 validée
Suivi documentaire uniquement, sans blocage automatique du circuit officiel.

Do not render the full checklist here.

Keep:

Consulter le détail dans l’onglet Documents. 7. Keep guided Prochaine action card

This is now the main workflow driver.

Keep title:

Prochaine action

It should remain the final block on the right panel.

Target right panel order

Final order should be:

1. Header / metadata
2. Courrier formel
3. Réunion formelle
4. Documents de demande formelle
5. Prochaine action

No Circuit officiel block.
No Recevabilité et clôture checklist block.

UX rules
Use French labels.
Keep Phase 2 visually consistent with Phase 1.
Do not repeat the same workflow checklist twice.
Right panel = details + next action.
Left panel = phase list + progression.
No raw technical IDs.
No extra CTAs outside guided card.
Verification

Run:

cd apps/admin
npx tsc --noEmit
npm run build

Manual checks:

Phase 2 workspace loads.
Right panel is shorter.
Circuit officiel no longer appears as a large block.
Recevabilité et clôture checklist no longer appears as a large block.
Left progression card still shows phase steps.
Top metadata still reflects circuit/return status.
Guided “Prochaine action” card still works.
Meeting buttons still appear in the correct states.
Documents compact summary still appears.
Phase 1 screen is unaffected.
Documentation updates

Update:

exploration-cache/tasks/current-task.md
exploration-cache/03-frontend/ADMIN_APP_MAP.md
exploration-cache/manifest.json

Create:

exploration-cache/tasks/summaries/2026-05-27-oma-formal-9c0-phase-2-ui-alignment-cleanup.md

Document:

removed duplicate blocks;
final right-panel order;
Phase 1 alignment decision;
verification results;
TODOs.
Return report

Return:

Files inspected
Files changed
Blocks removed
Final Phase 2 panel structure
Guided action card status
Verification results
Risks/TODOs
