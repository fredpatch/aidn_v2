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

# OMA-EVAL-5 — Phase 3 UI Audit & Planning

You are working inside the existing `AIDN_V2` repository.

## Objective

Audit existing admin/portal UI patterns and produce a step-by-step implementation plan for the Phase 3 UI:

```txt
Phase 3 — Évaluation approfondie des documents
```

Do not implement yet.

This pass must inspect existing UI patterns, API client structure, and reusable components, then return a planning report.

---

## Current validated backend state

OMA-EVAL-1 to OMA-EVAL-4 are complete.

Backend supports:

```txt
- Phase 3 payment gate
- S5/admin invoice upload
- Portal payment proof upload
- DN/S5 payment state consultation
- DocumentEvaluation records
- DN review: satisfaisant / non_satisfaisant + annotation
- Portal correction upload
- DN re-review
- Phase 3 close
- Phase 4 unlock
```

No Phase 3 UI exists yet.

---

## Business behavior to reflect in UI

Phase 3 flow:

```txt
1. Phase 3 starts after Phase 2 closes
2. S5 uploads invoice for study fees
3. Postulant uploads payment proof
4. DN can start document evaluation
5. DN reviews documents from Phase 2:
   - satisfaisant
   - non_satisfaisant + annotation
6. Postulant uploads corrected document when requested
7. DN re-reviews correction
8. When all blocking documents are satisfaisant, DN closes Phase 3
9. Phase 4 is unlocked
```

Important:

```txt
No Phase III closure courrier upload.
Closure is button-based.
Official communication remains outside AIDN / Outlook.
AIDN sends in-app notification.
```

---

## Cache-first protocol

Start by reading:

```txt
prompt.md
exploration-cache/manifest.json
exploration-cache/QUICK-REFERENCE.md
exploration-cache/tasks/current-task.md
exploration-cache/tasks/summaries/2026-06-01-oma-eval-1-payment-gate-implementation.md
exploration-cache/tasks/summaries/2026-06-01-oma-eval-2-document-evaluation-implementation.md
exploration-cache/tasks/summaries/2026-06-01-oma-eval-3-correction-loop-implementation.md
exploration-cache/tasks/summaries/2026-06-01-oma-eval-4-phase-close-implementation.md
exploration-cache/03-frontend/ADMIN_APP_MAP.md
exploration-cache/03-frontend/PORTAL_APP_MAP.md
exploration-cache/04-backend/API_ROUTES.md
exploration-cache/05-data/DATA_MODELS.md
exploration-cache/06-workflows/OMA_DOCUMENT_EVALUATION_WORKFLOW.md
exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md
```

If a file is missing, report:

```txt
CACHE GAP: <missing path>
```

---

## Source areas to inspect

### Admin UI

Inspect narrowly:

```txt
apps/admin/src/pages/DossierDetailPage.tsx
apps/admin/src/pages/dossiers/
apps/admin/src/lib/api/dossiers.api.ts
apps/admin/src/lib/api/client.ts
apps/admin/src/lib/utils/blob.ts
apps/admin/src/lib/utils/error.ts
apps/admin/src/pages/dossiers/components/UploadDocumentDialog.tsx
```

Look for:

```txt
- Phase workspace pattern
- Phase 1/2 guided action cards
- payment/download/upload UI patterns
- close phase button pattern
- error/loading handling
- document download/open behavior
- toast behavior
- badge/status helpers
- tab integration
```

### Portal UI

Inspect narrowly:

```txt
apps/portal/src/pages/RequestDetailPage.tsx
apps/portal/src/lib/api/portal.api.ts
apps/portal/src/components/
apps/portal/src/lib/api/http.ts
```

Look for:

```txt
- existing payment proof upload pattern
- correction upload pattern
- document download pattern
- status display pattern
- notification/action required wording
- phase block/card structure
```

### Optional design/prototype input

If useful, prepare a Claude/Cursor design prompt for a static prototype only.

Do not implement design yet.

The prototype should visualize:

```txt
Admin Phase 3 workspace:
- left progression column
- right guided action card
- S5/payment block
- evaluation board
- document preview/download actions
- satisfaisant / non_satisfaisant review control
- annotation textarea
- close phase action

Portal Phase 3 block:
- invoice download
- payment proof upload
- correction required list
- annotation display
- correction upload action
```

---

## Required planning report

Return:

```txt
1. CACHE STATUS
2. Existing reusable admin UI patterns
3. Existing reusable portal UI patterns
4. API client gaps
5. Component gaps
6. Proposed admin Phase 3 workspace UX
7. Proposed portal Phase 3 UX
8. Proposed API client additions
9. Proposed component structure
10. Recommended implementation slices
11. Risks / open questions
12. Next step
```

---

## Admin UX target

Admin Phase 3 should follow the same structure as Phase 1/2:

```txt
Left:
- Phase progression
- Paiement frais d’étude
- Évaluation documentaire
- Corrections en attente
- Clôture

Right:
- Guided action card
- Current required action
- Payment details
- Evaluation board
```

Recommended sections:

```txt
1. État de la phase
2. Paiement des frais d’étude
3. Documents à évaluer
4. Corrections demandées
5. Clôture de la phase
```

French UI labels:

```txt
Facture des frais d’étude
Preuve de paiement
Paiement reçu
Démarrer l’évaluation
Documents à évaluer
Satisfaisant
Non satisfaisant
Annotation DN
Correction demandée
Correction reçue
Clôturer la phase III
```

---

## Admin expected actions

Admin/DN/S5 actions depend on permissions:

```txt
PAYMENT_INVOICE_UPLOAD:
- upload invoice

PAYMENT_VIEW:
- view invoice/proof state
- download invoice/proof

DOCUMENT_REVIEW:
- start study
- mark document satisfaisant
- mark document non_satisfaisant with annotation

PHASE_CLOSE:
- close Phase 3 when ready
```

Do not assume all users can do all actions.

---

## Portal UX target

Portal Phase 3 should stay simple.

Recommended sections:

```txt
1. Facture
2. Paiement
3. Évaluation des documents
4. Corrections demandées
```

Portal labels:

```txt
Facture disponible
Télécharger la facture
Déposer la preuve de paiement
Preuve de paiement envoyée
Document satisfaisant
Correction demandée
Annotation de la DN
Déposer le document corrigé
Correction envoyée
Phase III clôturée
```

Portal must not show internal DN technical noise.

---

## Required implementation split to validate

Do not implement in this pass, but evaluate this split:

```txt
OMA-EVAL-5A — Admin API client/types:
- add document-evaluation payment/evaluation/close methods
- add types for payment state, evaluations, progress

OMA-EVAL-5B — Admin Phase 3 workspace:
- DocumentEvaluationPhaseWorkspace.tsx
- payment state block
- evaluation board
- review dialogs/forms
- close phase action

OMA-EVAL-5C — Admin dossier integration:
- render Phase 3 workspace in DossierPhasesTab / phase router
- update Documents tab if needed
- update Historique tab if simple

OMA-EVAL-6A — Portal API client/types:
- payment state
- payment proof upload
- correction upload
- invoice/document download

OMA-EVAL-6B — Portal Phase 3 UI:
- invoice download
- proof upload
- correction list
- annotation display
- correction upload

OMA-EVAL-7 — UX polish/cross-tab:
- Documents tab Phase 3 section
- Historique events
- Dashboard priority actions if needed
```

---

## Prototype/design deliverable

If planning finds UI ambiguity, include a separate prompt titled:

```txt
Claude Design Prompt — Phase 3 Workspace Prototype
```

The design prompt should request a static visual/prototype only.

It must not request implementation.

It should ask for:

```txt
- Swiss-style compact institutional layout
- French labels
- desktop-first admin workspace
- portal simplified block
- no fake business rules
- clear state variants:
  1. waiting invoice
  2. waiting payment proof
  3. study in progress
  4. corrections waiting
  5. ready to close
  6. closed
```

---

## Cache updates

Update:

```txt
exploration-cache/tasks/current-task.md
```

Create summary:

```txt
exploration-cache/tasks/summaries/2026-06-01-oma-eval-5-phase-3-ui-audit-planning.md
```

Create/update history:

```txt
exploration-cache/tasks/history/2026-06-01-oma-eval-5-phase-3-ui-audit-planning.md
```

Only update `manifest.json` if current cache convention requires planning-pass manifest updates.

Summary must include:

```txt
Objective
Cache files read
Source files inspected
Files changed
Key decisions
Implementation details, if any
Verification commands run
Manual checks
Known risks / TODOs
Next step
```

---

## Verification

No build required unless files are changed beyond cache.

If source files are inspected only, report:

```txt
Verification commands run: not run — audit/planning only
Manual checks: not run — no implementation
```

---

## Return report

Return:

```txt
1. Cache status
2. Files inspected
3. Existing patterns found
4. UI gaps
5. API client gaps
6. Admin Phase 3 UX plan
7. Portal Phase 3 UX plan
8. Component/API split
9. Prototype/design prompt if useful
10. Recommended next implementation slice
```
