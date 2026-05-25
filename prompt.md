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

# OMA-OPS-3 — Phase préliminaire checklist + action dialogs

You are working on the AIDN admin app.

## Context

OMA-OPS-2 is complete:

- `DossierDetailPage.tsx` was reduced from ~1227 lines to a tabbed cockpit shell.
- New folder exists:
  `apps/admin/src/pages/dossiers/`
- `DossierPhasesTab.tsx` now uses a left phase stepper and right workspace.
- `PreliminaryPhaseWorkspace.tsx` contains the existing preliminary phase action logic and inline forms.
- Backend/API contracts must remain unchanged in this slice.

Current issue:
The Phase préliminaire workspace still displays large inline forms. This is functional but not ideal UX.

Goal:
Replace the inline action panel with:

- a checklist-based phase workspace;
- a clear “prochaine action” card;
- dialogs for actions;
- evidence/document blocks where existing fields allow it.

Do not change backend.
Do not change API contracts.
Do not change permissions.
Do not implement document endpoint extension yet.
Do not implement Documents tab yet.
Do not implement Phases 2–5 actions yet.

---

## Mandatory process

Follow exploration-cache protocol first.

Read:

- `exploration-cache/manifest.json`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-1-dossier-operations-ux-plan.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-2-dossier-cockpit-tabs.md`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- existing shadcn Dialog/Button/Input/Textarea components
- `apps/admin/src/components/ui/split-view.tsx`

Before implementation:

1. Inspect `PreliminaryPhaseWorkspace.tsx`.
2. Identify the existing inline forms and actions.
3. Confirm all current handlers can be reused inside dialogs.
4. Confirm no backend change is required.
5. Report a short plan.
6. Then implement targeted refactor.

At the end, create summary:

`exploration-cache/tasks/summaries/YYYY-MM-DD-oma-ops-3-preliminary-checklist-dialogs.md`

Update:

- `exploration-cache/tasks/current-task.md`
- manifest if required.

---

## Objective

Refactor Phase préliminaire workspace from inline form flow to:

Phase header
Checklist
Evidence block
Next action card
Action dialogs

Preserve all existing preliminary phase functionality.

Required components

Create or extract under:

apps/admin/src/pages/dossiers/

Recommended components:

PreliminaryPhaseWorkspace.tsx // orchestrator
PreliminaryPhaseChecklist.tsx // checklist rendering
PreliminaryNextActionCard.tsx // current action CTA
InviteMeetingDialog.tsx
RecordMeetingDialog.tsx
PublishPreEvalDialog.tsx
SendToDgDialog.tsx
RecordDgReturnDialog.tsx
UploadClosureCourrierDialog.tsx
ClosePreliminaryDialog.tsx

If this creates too many files, keep small dialog components in one preliminary-dialogs.tsx file, but document the choice.

Checklist model

Represent Phase préliminaire as ordered steps.

Use existing preliminaryStatus and existing document/meeting fields.

Suggested steps:

const preliminarySteps = [
{
key: "opened",
label: "Dossier ouvert après orientation DG",
done: true,
},
{
key: "first_meeting_invited",
label: "Première réunion de contact planifiée",
done: Boolean(phase.firstMeetingId),
current: phase.preliminaryStatus === "preliminary_started",
},
{
key: "first_meeting_held",
label: "Compte rendu première réunion joint",
done: Boolean(phase.firstMeetingReportDocumentId),
current: phase.preliminaryStatus === "first_meeting_invited",
},
{
key: "pre_eval_form_available",
label: "Formulaire pré-évaluation mis à disposition",
done: Boolean(phase.preEvaluationTemplateDocumentId),
current: phase.preliminaryStatus === "first_meeting_held",
},
{
key: "pre_eval_form_submitted",
label: "Formulaire pré-évaluation complété reçu",
done: Boolean(phase.completedPreEvaluationDocumentId),
current: phase.preliminaryStatus === "pre_eval_form_available",
},
{
key: "pre_eval_sent_to_dg",
label: "Pré-évaluation mise en circuit DG",
done: ["pre_eval_sent_to_dg", "pre_eval_dg_decision_recorded", "preliminary_meeting_invited", "preliminary_meeting_held", "preliminary_ready_to_close", "preliminary_closed"].includes(phase.preliminaryStatus),
current: phase.preliminaryStatus === "pre_eval_form_submitted",
},
{
key: "pre_eval_dg_decision_recorded",
label: "Retour DG pré-évaluation enregistré",
done: Boolean(phase.preEvaluationDgAnnotatedDocumentId),
current: phase.preliminaryStatus === "pre_eval_sent_to_dg",
},
{
key: "preliminary_meeting_invited",
label: "Réunion préliminaire planifiée",
done: Boolean(phase.preliminaryMeetingId),
current: phase.preliminaryStatus === "pre_eval_dg_decision_recorded",
},
{
key: "preliminary_meeting_held",
label: "Compte rendu réunion préliminaire joint",
done: Boolean(phase.preliminaryMeetingReportDocumentId),
current: phase.preliminaryStatus === "preliminary_meeting_invited",
},
{
key: "closure_courrier_uploaded",
label: "Courrier de clôture phase I téléversé",
done: Boolean(phase.closureCourrierDocumentId),
current: phase.preliminaryStatus === "preliminary_meeting_held",
},
{
key: "preliminary_closed",
label: "Phase préliminaire clôturée",
done: phase.preliminaryStatus === "preliminary_closed",
current: phase.preliminaryStatus === "preliminary_ready_to_close",
},
];

Adapt to actual type names.

Visual indicators:

✓ terminé
→ en cours
○ à venir

Use icons if already available, otherwise simple badges.

Next action logic

Replace the current visible inline form with a single next-action card.

Map current preliminaryStatus to action:

preliminaryStatus Action label Dialog
preliminary_started Planifier la première réunion de contact InviteMeetingDialog
first_meeting_invited Joindre le compte rendu de première réunion RecordMeetingDialog
first_meeting_held Mettre le formulaire pré-évaluation à disposition PublishPreEvalDialog
pre_eval_form_available no DN action waiting state
pre_eval_form_submitted Mettre en circuit officiel DG SendToDgDialog
pre_eval_sent_to_dg Enregistrer le retour DG annoté RecordDgReturnDialog
pre_eval_dg_decision_recorded Planifier la réunion préliminaire InviteMeetingDialog variant
preliminary_meeting_invited Joindre le compte rendu de réunion préliminaire RecordMeetingDialog variant
preliminary_meeting_held Téléverser le courrier de clôture OR Clôturer phase if closure already uploaded UploadClosureCourrierDialog / ClosePreliminaryDialog
preliminary_ready_to_close Clôturer la phase préliminaire ClosePreliminaryDialog
preliminary_closed no action completed state

Respect existing permission gates:

meeting actions require the same existing permission/can flags
DG circuit actions require the same existing permission/can flags
document upload actions require the same existing permission/can flags
phase close requires the same existing permission/can flags

Do not loosen permissions.

Dialog behavior

Each dialog should reuse the same API calls currently used by inline forms.

InviteMeetingDialog

Used for:

first contact meeting
preliminary meeting

Fields:

date prévue optional
lieu optional
notes optional

Props should allow:

title
submitLabel
onSubmit
RecordMeetingDialog

Used for:

first meeting report
preliminary meeting report

Fields:

compte rendu file
notes optional
visibility to postulant if already present in existing form
PublishPreEvalDialog

Confirm only:

explain that the blank form/template becomes available to the postulant.
submit with existing publish API call.
SendToDgDialog

Confirm only:

explain that the completed pre-evaluation document enters the official DG/parapheur circuit.
no upload here.
RecordDgReturnDialog

Fields:

returned scan file
returnedAt/date if currently supported
notes/observations if currently supported
UploadClosureCourrierDialog

Fields:

file
title if currently supported
ClosePreliminaryDialog

Extract existing close dialog logic, preserve behavior.

Evidence block

Add a compact evidence block in the workspace.

Show available evidence from current fields:

firstMeetingReportDocumentId
preEvaluationTemplateDocumentId
completedPreEvaluationDocumentId
preEvaluationDgAnnotatedDocumentId
preliminaryMeetingReportDocumentId
closureCourrierDocumentId

For now:

show document IDs / “Document disponible” labels.
only render download buttons for documents that already have working download behavior.
Do not implement new download endpoint in this slice.
For unavailable downloads, show muted text:
Téléchargement à activer dans OMA-OPS-4
SplitView Tailwind safety fix

The previous report noted a possible production CSS issue:
SplitView accepts dynamic arbitrary grid column classes such as lg:grid-cols-[2fr_3fr], which Tailwind may not generate if not statically present.

Fix SplitView in this slice.

Preferred safe implementation:

use CSS variable or inline style for desktop grid template columns
keep stable classes only:

<div
  className={cn("grid grid-cols-1 gap-4 lg:grid-cols-[var(--split-view-columns)]", className)}
  style={{ "--split-view-columns": columns } as React.CSSProperties}
>

If Tailwind arbitrary variable syntax is unsupported, use inline style with media-safe fallback or predefined variant mapping.

Constraint:

Do not break current usage in DgCircuitPage, RequestsPage, or DossierPhasesTab.
Keep API:
<SplitView left={...} right={...} columns="[1fr_2fr]" />

Run visual/build check after.

UX requirements
No large form should be visible by default.
The workspace should feel like an operational checklist.
Only one primary action should be visually dominant.
Dialogs should be compact.
Keep French labels.
Keep institutional minimal style.
Preserve purple primary buttons.
Verification

Run:

cd apps/admin
npx tsc --noEmit
npm run build

Manual checks:

Dossier detail page loads.
Phases OMA tab loads.
Phase 1 selected by default.
No inline meeting/upload form visible by default.
Checklist appears with correct current step.
Clicking the next action opens the correct dialog.
Submitting dialog triggers the same API behavior as before.
Existing preliminary action flow still works.
Permission-gated actions remain hidden/disabled when unauthorized.
Phases 2–5 placeholders still work.
SplitView still renders correctly in:
DgCircuitPage
RequestsPage
DossierPhasesTab

Return:

Files inspected
Files changed
Components extracted/created
Checklist logic summary
Dialogs created
SplitView fix result
Verification results
Remaining risks/TODOs
