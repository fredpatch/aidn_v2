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

# OMA-OPS-9C — Frontend primitive refactor before Phase 2

You are working inside the existing AIDN_V2 repository.

Current state:

- OMA-OPS-9A backend primitive refactor is complete.
- OMA-OPS-9B DG circuit history / receptionist traceability is complete.
- OMA-OPS-9B-FIX dashboard/timeline consistency is complete.
- API and Admin builds passed.
- Phase 2 / Demande formelle has not started yet.

## Objective

Extract small reusable frontend primitives before implementing Phase 2.

This is a frontend refactor-only slice.

Do not implement Phase 2.
Do not add backend routes.
Do not change API contracts.
Do not change workflow behavior.
Do not extract a PhaseWorkspaceShell yet.

---

## Files to inspect first

Inspect:

apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx
apps/admin/src/pages/dossiers/preliminary-dialogs.tsx
apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx
apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx
apps/admin/src/pages/dossiers/DossierCourriersTab.tsx
apps/admin/src/pages/DgCircuitPage.tsx
apps/admin/src/pages/dossiers/preliminary-evidence.helpers.ts
apps/admin/src/lib/api/dossiers.api.ts
apps/admin/src/lib/api/dg-circuit.api.ts
apps/admin/src/components/ui/dialog.tsx
apps/admin/src/components/ui/button.tsx
apps/admin/src/components/ui/input.tsx
apps/admin/src/components/ui/textarea.tsx

Follow existing component style and imports.

Part 1 — Extract blob utility

Create:

apps/admin/src/lib/utils/blob.ts

Move duplicated openBlobInNewTab logic into this helper.

Expected helper:

export function openBlobInNewTab(blob: Blob, filename?: string): void {
const url = window.URL.createObjectURL(blob);
window.open(url, "\_blank", "noopener,noreferrer");
window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}

If current implementation handles popup failure or filename differently, preserve the existing behavior.

Update imports in all touched files.

Do not change download API calls.

Part 2 — Extract error utility

Create:

apps/admin/src/lib/utils/error.ts

Add:

export function extractError(error: unknown, fallback = "Une erreur est survenue."): string {
// preserve existing API error shape if present
}

Support likely shapes:

error instanceof Error
(error as any)?.response?.data?.error?.message
(error as any)?.response?.data?.message

Update duplicated local extractError implementations in touched files.

Preserve displayed French fallback messages.

Part 3 — Create generic UploadDocumentDialog

Create:

apps/admin/src/pages/dossiers/components/UploadDocumentDialog.tsx

Generic props:

export type UploadDocumentDialogProps = {
open: boolean;
title: string;
description?: string;
fileLabel?: string;
dateLabel?: string;
notesLabel?: string;
submitLabel?: string;
isSubmitting?: boolean;
error?: string | null;
requireDate?: boolean;
requireNotes?: boolean;
onOpenChange: (open: boolean) => void;
onSubmit: (payload: {
file: File;
date?: string;
notes?: string;
}) => Promise<void> | void;
};

Behavior:

file is always required;
date is optional unless requireDate=true;
notes are optional unless requireNotes=true;
reset local form state when dialog closes or after successful submit;
preserve existing visual style;
French labels by default:
Document
Date du document
Observations
Enregistrer
Veuillez sélectionner un fichier.
Veuillez renseigner la date.
Veuillez renseigner les observations.

Then refactor existing specialized dialogs in:

apps/admin/src/pages/dossiers/preliminary-dialogs.tsx

Use the generic dialog internally for:

DG return upload dialog
phase closure courrier upload dialog

Do not change external behavior of the existing specialized dialogs if other files depend on them.

Part 4 — Stabilize EvidenceRequirement type

Inspect:

apps/admin/src/pages/dossiers/preliminary-evidence.helpers.ts

Extend the existing EvidenceRequirement type to support future checklist documents:

submittedDocumentId?: string;
reviewStatus?: string;

If status union exists, make sure it can represent:

missing
available
under_review
validated
rejected
requires_correction
optional

Do not add Phase 2 requirements yet.
Do not change visible preliminary checklist behavior unless needed for types.

Strict constraints

Do not:

implement Phase 2;
add formal request checklist;
add backend code;
add new API calls;
change route behavior;
extract PhaseWorkspaceShell;
redesign dossier pages;
change business labels beyond cleanup consistency;
remove existing dialogs if they are imported elsewhere.
Verification

Run:

cd apps/admin
npx tsc --noEmit
npm run build

If shared types cause API imports or workspace scripts to run, also run:

cd apps/api
npm run typecheck
npm run build

Manual checks:

1. Documents tab downloads still open.
2. Meetings tab report downloads still open.
3. Courriers tab downloads still open.
4. Preliminary workspace document downloads still open.
5. DG circuit returned document download still opens if touched.
6. Record DG return dialog opens, validates, submits.
7. Upload closure courrier dialog opens, validates, submits.
8. Existing error messages still appear.
9. Preliminary evidence checklist still renders.
10. No Phase 2 UI appears.
    Cache updates

Update:

TASK.md
exploration-cache/tasks/current-task.md
exploration-cache/03-frontend/ADMIN_APP_MAP.md
exploration-cache/06-workflows/OMA_WORKFLOW.md if relevant
exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md if commands changed

Create summary:

exploration-cache/tasks/summaries/2026-05-26-oma-ops-9c-frontend-primitive-refactor.md

Summary must include:

Files created.
Files modified.
Blob utility extraction.
Error utility extraction.
UploadDocumentDialog behavior.
EvidenceRequirement changes.
Verification results.
Runtime/manual tests.
Known limitations.
Next recommended slice.
Expected implementation report

Return:

OMA-OPS-9C Implementation Report

1. Files created
2. Files modified
3. Blob utility extraction
4. Error utility extraction
5. UploadDocumentDialog extraction
6. EvidenceRequirement changes
7. Behavior preserved
8. Verification commands
9. Runtime/manual validation
10. Risks/TODOs
11. Next recommended slice

---

# Acceptance checklist

✅ openBlobInNewTab extracted
✅ extractError extracted
✅ UploadDocumentDialog created
✅ existing upload dialogs reuse generic component
✅ EvidenceRequirement ready for Phase 2 checklist
✅ no Phase 2 behavior added
✅ admin typecheck passes
✅ admin build passes
✅ existing downloads still work
✅ existing upload dialogs still work
