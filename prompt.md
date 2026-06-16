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

# OMA-EVAL-6D — Portal Phase 3 Action Block

You are working inside the existing `AIDN_V2` repository.

## Objective

Implement the small postulant-facing Phase 3 block inside the portal Dossier tab.

This is **not** a payment portal.

The block should allow the postulant to:

```txt
- see invoice availability
- download the invoice
- upload proof of payment
- see proof submitted state
- see document evaluation statuses
- read DN annotations when correction is requested
- upload corrected documents
```

Do not implement S5/internal UI.
Do not implement online payment.
Do not implement payment validation/rejection.
Do not create a new portal route unless absolutely necessary.
Do not redesign the whole portal dossier page.

---

## Current validated state

Backend:

```txt
OMA-EVAL-6B complete:
GET /portal/dossiers/:id/phases/document-evaluation
POST /portal/dossiers/:id/phases/document-evaluation/payment-proof
POST /portal/document-evaluations/:evaluationId/correction
GET /portal/dossiers/:id/documents/:documentId supports Phase 3 docs
```

Frontend API:

```txt
OMA-EVAL-6C complete:
getPortalPhase3State
uploadPortalPaymentProof
uploadPortalDocumentEvaluationCorrection
downloadPortalDossierDocument
```

Portal location decision:

```txt
RequestDetailPage.tsx
→ Dossier tab
→ append Phase 3 block after Phase 2 block
```

---

## Cache-first protocol

Start by reading:

```txt
prompt.md
exploration-cache/manifest.json
exploration-cache/QUICK-REFERENCE.md
exploration-cache/tasks/current-task.md
exploration-cache/tasks/summaries/2026-06-01-oma-eval-6a-portal-phase-3-api-readiness-audit.md
exploration-cache/tasks/summaries/2026-06-01-oma-eval-6b-portal-phase-3-backend-read-download.md
exploration-cache/tasks/summaries/2026-06-01-oma-eval-6c-portal-phase-3-api-client-types.md
exploration-cache/03-frontend/PORTAL_APP_MAP.md
exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md
exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md
```

If a summary file is missing, use the current session report and state:

```txt
CACHE GAP: <missing summary path>
```

---

## Files to inspect

```txt
apps/portal/src/pages/RequestDetailPage.tsx
apps/portal/src/lib/api/portal.api.ts
apps/portal/src/lib/api/http.ts
apps/portal/src/components/RequestStatusBadge.tsx
apps/portal/src/components/EmptyState.tsx
apps/portal/src/styles.css
```

Look for:

```txt
- Dossier tab rendering
- Phase 1/2 block structure
- existing upload form pattern
- existing document download pattern
- toast/error pattern
- status badge styles
```

---

## Required implementation

Modify:

```txt
apps/portal/src/pages/RequestDetailPage.tsx
```

Create local helper/component if needed:

```txt
Phase3DocumentEvaluationBlock
```

Prefer local component first unless file becomes too large.

If already too large, create:

```txt
apps/portal/src/components/Phase3DocumentEvaluationBlock.tsx
```

---

## Data loading

When Dossier tab is active and dossier exists:

```txt
call getPortalPhase3State(dossierId)
```

Recommended behavior:

```txt
- load separately from existing dossier detail
- store phase3State, phase3Loading, phase3Error
- if Phase 3 endpoint returns 404 because phase not opened, hide block gracefully
```

Do not block the rest of the dossier tab if Phase 3 state fails.

After payment proof upload or correction upload:

```txt
reload phase3State
```

---

## UI block placement

In Dossier tab:

```txt
Phase 1 block
Phase 2 block
Phase 3 block ← add here
```

Only render Phase 3 block when:

```txt
- phase3State exists
- OR dossier status indicates document_evaluation_phase / inspection_phase / delivery_phase / closed
```

If endpoint 404s, do not show scary error. Phase 3 may not exist yet.

---

## Section layout

### Header

```txt
Phase III — Évaluation approfondie
```

Subtitle:

```txt
Suivi de la facture, du paiement et des corrections documentaires.
```

Status badge from:

```txt
phase.documentEvaluationStatus
```

Labels:

```txt
document_evaluation_waiting_invoice → En attente de facture
document_evaluation_waiting_payment → En attente du paiement
document_evaluation_payment_proof_submitted → Preuve de paiement envoyée
document_evaluation_study_in_progress → Évaluation en cours
document_evaluation_waiting_corrections → Corrections demandées
document_evaluation_ready_to_close → Évaluation finalisée
document_evaluation_closed → Phase III clôturée
```

---

## Section 1 — Facture

If no invoice:

```txt
En attente de la facture ANAC.
```

If invoice exists:

```txt
Facture disponible
[ Télécharger la facture ]
```

Download:

```ts
downloadPortalDossierDocument(dossierId, invoiceDocumentId);
```

Use filename:

```txt
facture-frais-etude.pdf
```

---

## Section 2 — Paiement

If no invoice:

```txt
Le dépôt de la preuve sera disponible après réception de la facture.
```

If invoice exists and no proof:

Show action-required card:

```txt
Action requise
Déposer la preuve de paiement
Téléversez la quittance ou preuve de paiement des frais d’étude.
[Choisir un fichier] [Envoyer]
```

Upload:

```txt
multipart/form-data
file
notes optional
```

Call:

```ts
uploadPortalPaymentProof(dossierId, formData);
```

If proof exists:

```txt
Preuve de paiement envoyée
```

Optional download proof button:

```txt
Télécharger la preuve déposée
```

Use `downloadPortalDossierDocument`.

---

## Section 3 — Évaluation des documents

If `evaluations.length === 0`:

Show muted message:

```txt
L’évaluation documentaire commencera après réception de la preuve de paiement.
```

If evaluations exist:

Render compact list.

Each item:

```txt
- requirementLabel
- formCode or requirementCode if present
- status badge
- annotation block if annotation exists
```

Status labels:

```txt
pending → En cours d’examen
satisfaisant → Satisfaisant
non_satisfaisant → Correction demandée
correction_submitted → Correction envoyée
```

---

## Section 4 — Corrections demandées

For each evaluation where:

```ts
canUploadCorrection === true;
```

Show action-required card:

```txt
Correction demandée
<requirementLabel>
Annotation DN:
<annotation>
[Déposer le document corrigé]
```

Inline upload form:

```txt
file
notes optional
```

Call:

```ts
uploadPortalDocumentEvaluationCorrection(evaluationId, formData);
```

After success:

```txt
toast.success("Correction envoyée.")
reload phase3State
```

For `correction_submitted`:

```txt
Correction envoyée — en attente de revue DN.
```

No duplicate upload unless backend allows status back to `non_satisfaisant`.

---

## Upload constraints

Use existing portal upload style:

```txt
accept=".pdf,.jpg,.jpeg,.png"
```

Handle:

```txt
loading state per upload action
inline error message
reset file input after success
```

---

## Download behavior

Use existing portal download pattern:

```txt
portalGetBlob → object URL → <a download> click
```

If `downloadPortalDossierDocument` already handles this, use it.

If it only returns Blob, create local helper:

```ts
downloadAndSave(blob, fileName);
```

Do not introduce new dependency.

---

## Error behavior

Use existing patterns:

```txt
toast.success
toast.error or inline red alert
```

Rules:

```txt
- 404 for Phase 3 state: hide block / show nothing
- other Phase 3 state error: compact warning inside dossier tab
- upload failure: inline error in the upload card
- download failure: toast/error message
```

---

## Scope boundaries

Do not implement:

```txt
- online payment
- S5 workspace
- admin evaluation controls
- correction history
- Phase 4 portal block
- route/page split
- dashboard integration
```

---

## Cache updates

Update:

```txt
exploration-cache/tasks/current-task.md
exploration-cache/03-frontend/PORTAL_APP_MAP.md
exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md
```

Create summary:

```txt
exploration-cache/tasks/summaries/2026-06-01-oma-eval-6d-portal-phase-3-action-block.md
```

Create/update history:

```txt
exploration-cache/tasks/history/2026-06-01-oma-eval-6d-portal-phase-3-action-block.md
```

Update manifest if current convention requires it.

---

## Verification

Run:

```bash
cd apps/portal
npx tsc --noEmit
npm run build
```

Manual checks if dev server available:

```txt
1. Dossier tab loads without Phase 3
2. Phase 3 block appears when phase exists
3. Waiting invoice state renders
4. Invoice download works
5. Payment proof upload appears only when invoice exists and no proof exists
6. Payment proof upload refreshes block
7. Evaluations list appears after payment gate
8. non_satisfaisant shows annotation
9. Correction upload appears only when canUploadCorrection=true
10. Correction upload refreshes to correction_submitted
11. Closed phase shows read-only state
```

---

## Return report

Return:

```txt
1. Cache status
2. Files changed
3. Data loading behavior
4. Phase 3 block behavior
5. Upload/download behavior
6. Error/loading behavior
7. Verification results
8. Manual checks
9. Known risks/TODOs
10. Next step
```
