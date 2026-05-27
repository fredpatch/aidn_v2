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

# OMA-FORMAL-9B1 — Add Phase 2 Demande Formelle to Courriers Officiels Workflow

You are working inside the existing `AIDN_V2` repository.

## Current validated state

OMA-FORMAL-9B0 is complete.

Phase 2 actor responsibility is now corrected:

- Portal/Postulant owns normal upload of the demande formelle.
- Courriers officiels owns print / physical DG circuit / scan return / DG decision.
- Dossier DN Phase 2 workspace only reflects state until DN’s turn to schedule the réunion formelle.

The previous Phase 2 workspace action dialogs were removed from `FormalRequestPhaseWorkspace.tsx`.
The file `formal-request-dialogs.tsx` still exists and was intentionally preserved for future Courriers officiels integration.

Now implement the correct next step:

OMA-FORMAL-9B1 — Add Phase 2 demande formelle to Courriers officiels workflow
Objective

Add Phase 2 Demande formelle items to the existing Courriers officiels / DG circuit workspace.

The formal request should follow the same semi-digital pattern as:

Courrier initial
Formulaire de pré-évaluation
Demande formelle

Real workflow:

Postulant téléverse la demande formelle depuis le portail
→ Courriers officiels voit le courrier reçu
→ Réception / secrétariat imprime le document
→ Document papier placé dans le circuit physique DG/parapheur
→ DG annote / vise / oriente physiquement
→ Retour DG scanné dans AIDN
→ Décision DG enregistrée
→ Dossier Phase 2 se met à jour

AIDN does not digitally send the document to DG. It records the physical circuit.

Scope

Frontend/admin only unless a confirmed API client function is missing.

Implement in Courriers officiels / DG circuit workspace.

Do not change backend business rules.
Do not change portal UI.
Do not put these actions back into FormalRequestPhaseWorkspace.
Do not implement Phase 2 meeting/closure actions in this slice.
Do not implement supporting document review in this slice.
Do not add fake data.

Explore first

Read cache first:

exploration-cache/manifest.json
exploration-cache/QUICK-REFERENCE.md
exploration-cache/03-frontend/ADMIN_APP_MAP.md
exploration-cache/04-backend/API_ROUTES.md
exploration-cache/tasks/current-task.md
exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b0-phase-2-actor-responsibility-fix.md
exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1-admin-gate-dg-actions-planning.md

Then inspect:

apps/admin/src/pages/DgCircuitPage.tsx
apps/admin/src/lib/api/dg-circuit.api.ts
apps/admin/src/lib/api/dossiers.api.ts
apps/admin/src/pages/dossiers/formal-request-dialogs.tsx
apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx
apps/admin/src/lib/utils/error.ts
apps/api/src/modules/dg-circuit/dg-circuit.service.ts
apps/api/src/modules/admin/admin.routes.ts
apps/api/src/modules/oma-phases/formal-request.service.ts

Confirm exact route names and response shapes before wiring.

Confirmed backend routes to use

Use these existing formal-specific routes if confirmed:

POST /api/v1/admin/dossiers/:id/phases/formal-request/send-to-dg
POST /api/v1/admin/dossiers/:id/phases/formal-request/dg-return
POST /api/v1/admin/dossiers/:id/phases/formal-request/dg-decision

Fallback/internal courrier registration route exists but must not be primary:

POST /api/v1/admin/dossiers/:id/phases/formal-request/courrier

Use only for physical/internal received courrier if the UI already supports fallback safely.

Admin sources only:

physical_deposit
internal_scan

Never send:

portal_upload

from admin.

Required behavior

1. Add item type: Demande formelle

In Courriers officiels list, formal request courrier should appear as a new item type:

Demande formelle

It should appear when Phase 2 formal request courrier exists or when formal phase state indicates formal request is active/pending DG circuit.

The card should show:

Dossier number
Organisation
Postulant
Type: Demande formelle
Status badge
Date réception / dépôt

Source labels:

portal_upload → Téléversé par le postulant
physical_deposit → Dépôt physique
internal_scan → Scan interne 2. Status mapping

Use formal phase state to map status.

Recommended labels:

formal_request_received → À imprimer
formal_documents_tracking → À imprimer
formal_sent_to_dg → En circuit
formal_dg_returned → Retour DG enregistré
formal_dg_decision_recorded → Décision saisie
formal_meeting_invited+ → Décision saisie

If exact statuses differ, derive from available booleans:

gate.exists && !sentToDg => À imprimer
sentToDg && !dgReturned => En circuit
dgReturned && !dgDecisionRecorded => Retour DG enregistré
dgDecisionRecorded => Décision saisie 3. List filters / counters

Update Courriers officiels counters/filters to include formal requests.

Current filters likely include:

Tous
À imprimer
En circuit
Retours DG
Décisions saisies

Formal request items must count correctly in those filters.

Do not create a separate sidebar entry for Phase 2.

4. Detail panel

When selecting a formal request courrier, detail panel should show:

Demande formelle
Dossier number
Organisation
Postulant
Suivi
Traceabilité

Timeline labels:

Reçu
Imprimé / mis en circuit
Retour DG scanné
Décision saisie

Traceability:

Type: Demande formelle
Organisation
Postulant
Réception
Envoi DG / mise en circuit
Retour DG
Décision

Use only available fields. Do not show raw IDs.

Actions to wire
Action A — Mettre en circuit DG

Button label:

Imprimer / mettre en circuit DG

or if existing workspace uses shorter labels:

Mettre en circuit DG

Helper text:

Imprimez la demande formelle, placez-la dans le circuit physique DG/parapheur, puis marquez cette étape comme mise en circuit.

API:

POST /api/v1/admin/dossiers/:id/phases/formal-request/send-to-dg

Enable only when:

formal request exists
not already sent to DG
backend canSendToDg === true if available

After success:

refresh Courriers officiels list
refresh selected detail
status becomes En circuit
Action B — Enregistrer le retour DG scanné

Button label:

Enregistrer le retour DG scanné

Dialog fields:

Fichier retour DG annoté/signé
Date retour DG
Référence officielle
Notes

API:

POST /api/v1/admin/dossiers/:id/phases/formal-request/dg-return

Multipart field:

file

Body fields if supported:

returnedFromDgAt
officialReference
notes

Enable only when:

sentToDg === true
dgReturned === false

After success:

refresh list/detail
status becomes Retour DG enregistré
Action C — Enregistrer la décision DG

Button label:

Enregistrer la décision DG

Dialog fields:

Décision
Direction orientée
Observations
Date décision

Use backend-supported decisions only.

Confirmed/planned decisions:

approved
rejected
reoriented
pending

French labels:

approved → Approuvé
rejected → Rejeté
reoriented → Réorienté
pending → En attente

API:

POST /api/v1/admin/dossiers/:id/phases/formal-request/dg-decision

Enable only when:

dgReturned === true
dgDecisionRecorded === false

After success:

refresh list/detail
status becomes Décision saisie
Dossier Phase 2 workspace should reflect next step: DN can schedule formal meeting
Optional fallback action — courrier reçu hors portail

Only if already implemented safely in existing preserved dialogs.

Button label:

Scanner / enregistrer un courrier reçu hors portail

Helper:

À utiliser uniquement si la demande formelle a été reçue physiquement ou scannée en interne. Si le postulant téléverse sa demande depuis le portail, elle apparaîtra automatiquement ici.

This must not be the primary action when waiting for portal upload.

Acceptable to defer this fallback if it complicates the list state.

Reuse preserved dialogs

Inspect:

apps/admin/src/pages/dossiers/formal-request-dialogs.tsx

Reuse dialogs if compatible:

RegisterFormalCourrierDialog
SendFormalToDgDialog
RecordFormalDgReturnDialog
RecordFormalDgDecisionDialog

If names differ, adapt to actual exports.

If dialogs are too coupled to FormalRequestPhaseWorkspace, refactor minimally to accept:

dossierId
open
onOpenChange
onSuccess

Do not move them back into dossier workspace.

API client

Add or reuse functions in:

apps/admin/src/lib/api/dossiers.api.ts

Expected functions:

sendFormalRequestToDg(dossierId: string)
recordFormalRequestDgReturn(dossierId: string, formData: FormData)
recordFormalRequestDgDecision(dossierId: string, payload: ...)
uploadFormalRequestCourrier(...) // fallback only

If DgCircuitPage uses dg-circuit.api.ts, either:

add thin formal-specific calls there, or
import from dossiers.api.ts.

Choose the least disruptive option.

Data loading strategy

If DgCircuitPage currently loads only DG circuit tasks, extend it to include Phase 2 formal request items.

Preferred:

Reuse existing endpoint if backend already includes formal request DG items.

If not included, and no backend aggregate exists:

Use existing admin dossier/phase APIs to load formal request states only if there is a reasonable existing list source.

Do not invent fake formal request items.

If the backend has no way to list all formal request items for Courriers officiels, stop and report the backend gap instead of hardcoding.

The implementation report must explicitly state:

Formal request items source: <endpoint/function>
UI wording rules

Never say:

Envoyer le fichier au DG
Envoyer électroniquement au DG

Use:

Mettre en circuit DG
Circuit physique DG/parapheur
Retour DG scanné
Décision DG enregistrée
Business rules to preserve

- Portal owns normal formal request upload.
- Courriers officiels owns print / physical DG circuit / scan return / decision.
- Dossier DN workspace only reflects state until DN meeting step.
- Supporting documents do not block DG circuit.
- Formal request courrier remains the Phase 2 gate.
- No portal changes in this slice.
- No backend business rule changes.
  Verification

Run:

cd apps/admin
npx tsc --noEmit
npm run build

Manual checks:

1. Courriers officiels loads.
2. Formal request item appears when formal courrier exists.
3. Item type displays “Demande formelle”.
4. Counters include formal request item.
5. Filters classify it correctly.
6. Detail panel shows formal request traceability.
7. “Mettre en circuit DG” marks the formal request as in physical DG circuit.
8. “Enregistrer le retour DG scanné” uploads scan and refreshes state.
9. “Enregistrer la décision DG” records decision and refreshes state.
10. Dossier Phase 2 workspace reflects updated progression after refresh.
11. No action implies digital sending to DG.
12. No portal files changed.
    Documentation updates

Update:

exploration-cache/tasks/current-task.md
exploration-cache/03-frontend/ADMIN_APP_MAP.md
exploration-cache/manifest.json

Create:

exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1-courriers-officiels-demande-formelle.md

Document:

- item source endpoint/function
- status mapping
- filters/counters changed
- actions wired
- routes used
- what was deferred
- verification results
  Return report

Return:

1. Files inspected
2. Files changed
3. Formal request item source
4. Status mapping
5. Filters/counters updates
6. Actions wired
7. API client additions
8. Business rules preserved
9. Verification results
10. Risks/TODOs
