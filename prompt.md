## CACHE-FIRST PROTOCOL — ALWAYS FOLLOW

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

PORTAL-H1D-2 — Hardening the printable convocation layout to an ANAC-style A4 document.

Follow the existing cache-first protocol from `prompt.md`.

## Context

PORTAL-H1D-1 is complete:

- portal rendez-vous page exists;
- printable convocation card exists;
- browser print works.

Current problem:

- the convocation proportions feel too screen-like and not enough like an A4 institutional document;
- the document should look more ANAC/administrative;
- `apps/portal/public/header.png` is available and should be used as the document header.

Goal:
Refine the convocation into a more institutional, minimal, ANAC-style printable layout.

## Scope

Frontend only in `apps/portal`.

### 1. Use `public/header.png`

Update the convocation print card to display:

/apps/portal/public/header.png

at the top of the printable document.

Rules:

full available width inside the sheet;
preserve aspect ratio;
no distortion;
visible both on screen preview and print. 2. Convert the layout to A4-style proportions

Refactor the convocation container into a print-first A4 sheet.

Requirements:

portrait A4 feeling;
centered white sheet on screen;
clean margins/padding;
tighter spacing than current version;
no oversized proportions.

Recommended implementation:

use mm-based print sizing where useful;
responsive screen preview;
keep document readable on both screen and print. 3. Improve the institutional visual style

Refine the document styling:

minimalistic;
more serious / administrative;
lighter separators;
cleaner typography hierarchy;
less “UI card”, more “official fiche”.

Target structure:

[header.png]

Convocation au rendez-vous

Informations principales:

- Organisation / postulant
- Numéro dossier
- Type de dossier
- Type de rendez-vous
- Objet
- Date et heure
- Lieu
- Statut
- Consignes
- Référence
- Date d’impression

Footer:
Document généré depuis le portail AIDN.

Fallback text remains:

Non renseigné 4. Print CSS hardening

Add or refine print styles so that:

only the convocation content is printed;
app chrome/sidebar/buttons are hidden;
shadows/background decorations are removed in print;
output is clean in grayscale.

Add/refine:

@page {
size: A4 portrait;
margin: 12mm;
} 5. Preserve current functionality

Keep:

Voir la convocation
Imprimer
current meeting data mapping
browser print workflow

Do not change backend.

Constraints

Do not implement:

backend PDF generation;
QR code;
logos beyond header.png;
new API fields;
meeting editing;
extra workflow logic.
Expected deliverables
Convocation uses header.png.
Layout feels A4 and more institutional.
Print preview is cleaner.
Existing convocation actions still work.
Cache/task tracking updated.
Summary file created:
exploration-cache/tasks/summaries/YYYY-MM-DD-PORTAL-H1D-2-convocation-a4-anac-layout-modification.md
Verification commands

Run:

cd apps/portal
npm run typecheck
npm run lint
npm run build
Manual validation checklist
Open /rendez-vous.
Open a convocation.
Header image appears correctly.
Layout feels like an A4 institutional sheet.
Print preview looks cleaner than before.
Buttons/app chrome do not pollute print output.
Missing values still show Non renseigné.
Build passes.
Expected final report

Return:

Cache files read.
Files inspected.
Files modified.
How header.png was integrated.
A4/print styling changes.
Verification results.
Manual checks run or pending.
Cache files updated.
Summary file path.
Known risks / TODOs.
Recommended next step.
