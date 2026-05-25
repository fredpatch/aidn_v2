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

# OMA-OPS-8A — Phase I transition/date hardening

You are working on AIDN.

OMA-OPS-8 audit is complete. Do not move to Phase 2 yet.

## Objective

Fix the urgent workflow/data correctness issues found in the Phase préliminaire audit.

Focus only on:

1. Phase I close behavior and Phase 2 readiness.
2. Persistence of important dates for future SLA/delay reports.
3. Cleanup/quarantine of dead `pre_eval_dg_returned` status.
4. Meeting report requirement decision/enforcement.

Do not refactor large files in this slice unless directly needed.
Do not implement Phase 2 UI/actions.
Do not implement SLA reports.
Do not implement Certificat.

---

## Mandatory process

Read:

- `exploration-cache/manifest.json`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8-preliminary-hardening-audit.md`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- `apps/api/src/modules/meetings/meeting.model.ts`
- `apps/api/src/modules/meetings/meeting.service.ts`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/preliminary-progress.helpers.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- portal dossier/status files if affected

Create summary:

`exploration-cache/tasks/summaries/YYYY-MM-DD-oma-ops-8a-phase1-transition-date-hardening.md`

Update:

- `exploration-cache/tasks/current-task.md`
- manifest if required.

---

## Part A — Phase I close behavior

Audit found:

- Closing Phase I sets:
  - phase status `closed`
  - preliminaryStatus `preliminary_closed`
  - dossier status `formal_request_phase`
  - starts `formal_request` phase immediately

Before changing, inspect actual implementation.

Target decision:

- Closing Phase I should **not silently start Phase 2 actions**.
- Preferred target:
  - Phase I closes.
  - Dossier becomes ready for Phase 2.
  - Formal request phase can exist as `not_started`, but should not be `in_progress` unless explicitly started.
  - UI can later show `Phase 2 prête à démarrer`.

Acceptable implementation:

```txt
Phase I closed
→ dossier.status = formal_request_phase
→ formal_request phase exists with status = not_started
→ no Phase 2 action workspace active yet

Do not implement Phase 2 start button in this slice unless trivial and already supported.

Return clearly what was changed.

Part B — Persist SLA-relevant dates

Audit found inputs are accepted but not persisted:

sendPreEvalToDg.sentAt
recordPreEvalDgReturn.returnedAt

Implement persistence if fields exist or add minimal fields to OmaPhase / DGReview where appropriate.

Preferred fields:

preEvaluationSentToDgAt?: Date;
preEvaluationReturnedFromDgAt?: Date;

or reuse existing DGReview.sentToDgAt and DGReview.returnedFromDgAt if clean.

Rules:

If payload date is provided, persist it.
Else use current server time.
Serialize these dates in admin dossier detail if useful for Historique/SLA later.

Also check meeting held date.

If Meeting does not have heldAt, add:

heldAt?: Date

Set it when recording first/preliminary meeting as held.

Serialize if needed.

Part C — Dead status cleanup

Audit found:

pre_eval_dg_returned

exists in backend/admin types but no route sets it.

Preferred:

remove from frontend label maps and API type if safe;
keep backend enum only if migration risk exists;
otherwise remove fully if no stored data uses it.

Do not create a transition to it unless there is a business reason.

Part D — Meeting report requirement

Audit found:

recordFirstMeeting
recordPreliminaryMeeting

allow no report file, but checklist/report evidence expects reports.

Decision target:

For MVP, make report file required when marking meeting held.

Expected behavior:

If no file is provided, return validation error.
UI dialog should mark file input required.
Checklist and Documents tab remain consistent.

If implementation risk is high, report why and leave as TODO, but do not silently ignore.

Verification

Run:

cd apps/api
npx tsc --noEmit
npm run build

Run:

cd apps/admin
npx tsc --noEmit
npm run build

Run portal only if portal types/statuses changed:

cd apps/portal
npx tsc --noEmit
npm run build

Manual checks:

Closing Phase I no longer silently starts active Phase 2 workflow.
Formal phase is not in progress unless explicitly intended.
Pre-eval sent-to-DG date is persisted.
Pre-eval DG return date is persisted.
Meeting held date is persisted.
Meeting report file is required when marking held.
pre_eval_dg_returned no longer appears in active UI/type paths, or is clearly quarantined.
Admin and portal still load dossier detail.
Existing Phase I happy path still works.

Return:

Files inspected
Files changed
Phase I close behavior result
Date persistence changes
Dead status cleanup
Meeting report requirement behavior
Verification results
Runtime checks pending/done
Risks/TODOs
```
