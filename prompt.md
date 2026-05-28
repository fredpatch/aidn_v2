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

OMA-FORMAL-17 — Block Phase 2 closure until all required postulant documents are deposited

Update Phase 2 closure rule after PO clarification.

Current accepted state:

- OMA-FORMAL-16 moved Phase 2 document details/review to the Documents tab.
- Phases OMA tab now shows a compact summary and links to Documents.
- Only `oma_approval_form` / `DN-AIR-R2-3-F-E-010` is reviewable by DN.
- Other Phase 2 documents are consultation-only.
- Current closure dialog still allows “Clôturer avec réserves” when documents are missing.

New PO rule:

- Phase 2 must not close until all required/expected documents from the postulant are deposited in AIDN.
- The previous “partial closure / clôture avec réserves” behavior must be removed.
- DN can close Phase 2 only when:
  1. formal request courrier exists;
  2. DG evidence is recorded;
  3. formal meeting is held;
  4. formal meeting report is uploaded;
  5. all required/expected Phase 2 postulant documents are deposited;
  6. `DN-AIR-R2-3-F-E-010` / `oma_approval_form` is not unresolved.

Important:

- Consultation-only documents do not need validation.
- They only need to be deposited / available for consultation.
- `oma_approval_form` is the only document with DN decision semantics.
- If `oma_approval_form` is `requires_correction` or `incomplete`, Phase 2 must not close.
- If `oma_approval_form` is deposited but still not validated, planning must confirm whether closure should be blocked or allowed. Default recommendation: block until validated, because it is the only document requiring DN decision.

Before implementation:

1. Follow cache-first protocol from `prompt.md`.
2. Read:
   - `exploration-cache/manifest.json`
   - `exploration-cache/QUICK-REFERENCE.md`
   - `exploration-cache/tasks/current-task.md`
   - OMA-FORMAL-12 summary
   - OMA-FORMAL-15 summary
   - OMA-FORMAL-16 summary
3. Inspect:
   - `apps/api/src/modules/oma-phases/formal-request.service.ts`
   - `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
   - `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
   - `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`
   - `apps/admin/src/lib/api/dossiers.api.ts`

Planning first:

- Return a short planning report before implementation.
- Confirm current `canClosePhase` logic.
- Confirm current `closeFormalRequestPhase` guards.
- Confirm how missing Phase 2 requirements are computed.
- Confirm how `oma_approval_form` status is computed.
- Propose the minimal correction.
- Do not implement until approved.

Implementation goal after approval:

## Backend

Update `canClosePhase` and `closeFormalRequestPhase` to require document deposit completeness.

Closure conditions:

```txt
formalRequestCourrierId exists
DG evidence ready
formal meeting held
formalMeetingReportDocumentId exists
all required/expected non-gate Phase 2 requirements have at least one active submission
oma_approval_form status is validated

Active submission excludes:

replaced
archived
rejected

Treat as not acceptable for closure:

missing
requires_correction
incomplete
rejected

For consultation-only documents:

submitted, under_review, or validated should count as deposited/available.
Validation is not required.

For oma_approval_form:

require validated.

Remove support for closure payload fields if no longer useful:

completeness
comment

Or keep as ignored/backward-compatible only if removing causes unnecessary churn.

Backend error messages should be specific:

Toutes les pièces requises de la demande formelle doivent être déposées avant la clôture.

For the reviewable form:

Le formulaire DN-AIR-R2-3-F-E-010 doit être validé avant la clôture.

Do not reintroduce:

closure courrier requirement;
DG decision approved requirement;
validation requirement for every document.
Frontend

Update Phase 2 close dialog.

Remove:

“Clôturer avec réserves”
reserves warning
reserves comment field
partial close language

Replace with blocking guidance:

If documents are missing:

Clôture impossible
Toutes les pièces requises doivent être déposées avant de clôturer la phase.

Show summary:

14 pièces suivies · X déposées · Z manquantes
Formulaire DN-AIR-R2-3-F-E-010 : Validé / Déposé / Correction demandée / Incomplet / Manquant

If oma_approval_form is not validated:

Le formulaire DN-AIR-R2-3-F-E-010 doit être validé avant clôture.

Disable close button until backend says canClosePhase === true.

In FormalRequestPhaseWorkspace:

keep compact document summary;
if documents are missing, next action should guide DN to Documents tab:
Les pièces de demande formelle doivent être complétées avant clôture.

Button:

Voir les documents
Documents tab

No major redesign.

Ensure DN can clearly see:

missing documents;
deposited consultation-only documents;
oma_approval_form status and review actions.
Do not change
Portal upload checklist
Template download behavior
Phase 1
DG circuit
Formal meeting behavior
Document upload behavior
Consultation-only review guard
Documents tab refactor from OMA-FORMAL-16
Verification

Run:

cd apps/api
npm run typecheck
npm run build

Run:

cd apps/admin
npx tsc --noEmit
npm run build

Manual checks:

Phase 2 cannot close when required documents are missing.
Phase 2 cannot close when oma_approval_form is missing.
Phase 2 cannot close when oma_approval_form is requires_correction.
Phase 2 cannot close when oma_approval_form is incomplete.
Phase 2 can close when all required/expected docs are deposited and oma_approval_form is validated.
Consultation-only docs do not require validation.
No “Clôturer avec réserves” remains.
Phase 3 unlock still works after valid closure.
Portal checklist still works.

Documentation:

Update exploration-cache/tasks/current-task.md
Create summary:
exploration-cache/tasks/summaries/2026-05-28-oma-formal-17-block-closure-until-documents-deposited.md
Update Phase 2 workflow docs with the new PO rule.
Update history when completed.
```
