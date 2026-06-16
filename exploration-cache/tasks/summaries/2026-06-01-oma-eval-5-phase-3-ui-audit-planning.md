# OMA-EVAL-5 — Phase 3 UI Audit & Planning

Date: 2026-06-01
Type: planning
Status: Complete — no implementation

---

## Objective

Audit existing admin/portal UI patterns and produce step-by-step implementation plan for Phase 3 (Évaluation approfondie) UI. No implementation in this pass.

---

## Cache files read

- `exploration-cache/tasks/current-task.md`
- OMA-EVAL-1 through OMA-EVAL-4 summary files
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`

---

## Source files inspected

### Admin
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/preliminary-dialogs.tsx`
- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
- `apps/admin/src/pages/dossiers/preliminary-progress.helpers.ts`
- `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts`
- `apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx`
- `apps/admin/src/pages/dossiers/dossier-detail.labels.ts`
- `apps/admin/src/pages/dossiers/components/UploadDocumentDialog.tsx`
- `apps/admin/src/lib/api/client.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/lib/utils/blob.ts`
- `apps/admin/src/lib/utils/error.ts`

### Portal
- `apps/portal/src/pages/RequestDetailPage.tsx`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/lib/api/http.ts`
- `apps/portal/src/components/RequestStatusBadge.tsx`

---

## Files changed

None. Planning only.

---

## Key Findings

### Admin patterns

1. **Phase workspace pattern**: `DossierPhasesTab` holds a left stepper sidebar + right panel. For each phaseKey, a workspace component is conditionally rendered. Existing: `PreliminaryPhaseWorkspace`, `FormalRequestPhaseWorkspace`. Phase 3 needs: `DocumentEvaluationPhaseWorkspace`.

2. **API client**: `client.ts` exposes `apiGet`, `apiPost`, `apiPostForm`, `apiGetBlob`, `apiPatch`. No Phase 3 methods exist in `dossiers.api.ts` yet.

3. **Document download**: `openBlobInNewTab(blob, fileName)` from `blob.ts`. Wraps `apiGetBlob` + object URL + new tab pre-opened to avoid popup blocker. Pattern used by Phase 1/2 workspaces.

4. **Upload dialog**: Generic `UploadDocumentDialog` takes `onSubmit({file, date?, notes?})` callback. Parent builds FormData and calls API. Shows spinner + "En cours…" during submit.

5. **Custom dialogs**: `DialogKey` union type (string literal union); parent tracks `openDialog` via `useState<DialogKey | null>(null)`. Each dialog: `BaseProps = {open, onOpenChange, dossierId, onSuccess}`.

6. **Permission guards**: `hasPermission(user, "PERMISSION_KEY")` from auth context. Actions wrapped in `if (canXxx) { <Button> } else { <WaitingState> }`.

7. **Close phase button**: Only shown when backend returns `canClosePhase: true` AND actor has `PHASE_CLOSE`. Otherwise shows `WaitingState`.

8. **State machine helpers**: `getPreliminaryProgress` / `getFormalRequestProgress` return steps array, done count, current step. `getFormalRequestVisibility` returns boolean flags for progressive reveal. Phase 3 needs `getDocumentEvaluationProgress` + `getDocumentEvaluationVisibility`.

9. **Status labels**: `dossier-detail.labels.ts` has `preliminaryStatusLabels`, `phaseStatusLabels` maps. Phase 3 needs `documentEvaluationStatusLabels` map.

10. **Layout primitives**: `DefinitionGrid`/`Field` (dl/dt/dd), `Card`/`CardHeader`/`CardContent`, `Badge` variants, `Note` (info), `WaitingState` (clock), `ActionError` (XCircle+red), `PhaseStatusBadge`.

### Portal patterns

1. **API client**: `portalPostForm(path, formData)` for uploads; `getCookie("aidn_portal_csrf")` + `X-CSRF-Token` header. No Phase 3 methods in `portal.api.ts` yet.

2. **Download**: `portalGetBlob(path)` → create object URL → `<a>` element with `.download` attribute + `.click()`.

3. **Upload forms**: Inline show/hide forms. `accept=".pdf,.jpg,.jpeg,.png"`. FormData with `file` + optional `notes`. Loading state boolean. Success: `toast.success()` + state reset + dossier reload. Error: inline red alert above form.

4. **Action-required card**: amber "Action requise" label + heading + description + CTA. Form expands inline. Cancel button closes without API call.

5. **Status badges**: `RequestStatusBadge` with `tone: "neutral"|"info"|"success"|"warning"`. For requirements: color-coded per status (validated=emerald, requires_correction=red, correction needed=amber, etc.).

6. **Requirement cards**: Expandable. Show label + status badge + review comment (if correction requested) + upload form.

---

## API Client Gaps

### Admin (`dossiers.api.ts`) — missing
- `getDocumentEvaluationPaymentState(dossierId)` → `AdminDocEvalPaymentState`
- `uploadStudyFeeInvoice(dossierId, formData)` → `AdminDocEvalPaymentState`
- `downloadDocEvalDocument(dossierId, documentId)` → blob (reuse existing `downloadDossierDocument`)
- `getDocumentEvaluations(dossierId)` → `AdminDocEvalState`
- `reviewDocumentEvaluation(dossierId, evaluationId, payload)` → `AdminDocEvalReviewResult`
- `closeDocumentEvaluationPhase(dossierId)` → `AdminDocEvalCloseResult`

### Admin — missing types
- `DocumentEvaluationStatus` = `"pending"|"satisfaisant"|"non_satisfaisant"|"correction_submitted"`
- `PhasePaymentStatus` = `"invoice_pending"|"invoice_sent"|"payment_proof_submitted"`
- `AdminDocEvalPaymentState` = `{phase, payment, canStartDocumentEvaluation}`
- `AdminDocEvalEvaluation` = `{id, status, annotation, reviewedAt, requirement, submission, correctionSubmissionId, ...}`
- `AdminDocEvalState` = `{phase, evaluations, progress}`
- `AdminDocEvalProgress` = `{total, pending, satisfaisant, nonSatisfaisant, correctionSubmitted}`

### Portal (`portal.api.ts`) — missing
- `getPhase3PaymentState(dossierId)` → `PortalPhase3PaymentState`
- `uploadPaymentProof(dossierId, formData)` → result
- `uploadDocumentEvaluationCorrection(evaluationId, formData)` → result
- `downloadPhase3Document(dossierId, documentId)` → blob

---

## Admin Phase 3 Workspace UX Plan

### Component: `DocumentEvaluationPhaseWorkspace.tsx`

Follows same structure as `FormalRequestPhaseWorkspace.tsx`:
- **Data loading**: on mount, call `getDocumentEvaluationPaymentState(dossierId)` to get phase + payment; if payment gate passed, call `getDocumentEvaluations(dossierId)` for eval board
- **State**: `paymentState`, `evalState`, `isLoading`, `error`, `openDialog: DialogKey | null`
- **Visibility helper**: `getDocumentEvaluationVisibility(paymentState, evalState)` → `{showPayment, showInvoiceUpload, showProofState, showEvalBoard, showCorrections, showClose}`
- **Progress helper**: `getDocumentEvaluationProgress(paymentState, evalState)` → steps with done/current/pending

### Sections (progressive reveal)

**Section 1 — État de la phase**
- `PhaseStatusBadge` for `documentEvaluationStatus`
- `DefinitionGrid` with `Démarrée le`, `Clôturée le` (if closed)
- Status label from `documentEvaluationStatusLabels`

**Section 2 — Paiement des frais d'étude**
- Payment status badge (`invoice_pending` | `invoice_sent` | `payment_proof_submitted`)
- If `payment.invoiceDocumentId`: download link "Télécharger la facture"
- If `payment.paymentProofDocumentId`: download link "Télécharger la preuve"
- If `hasPermission(user, "PAYMENT_INVOICE_UPLOAD")` + no proof yet: `Button` "Téléverser la facture" → `UploadInvoiceDialog`
- `canStartDocumentEvaluation` → shows "Paiement reçu - évaluation disponible" Note

**Section 3 — Documents à évaluer** (shown only when payment gate passed)
- Progress summary: `{satisfaisant}/{total} documents satisfaisants`
- Table/list of evaluations, each row:
  - Requirement label + code badge
  - Status badge (pending=slate, satisfaisant=emerald, non_satisfaisant=red, correction_submitted=amber)
  - Submission doc download icon button
  - If `correction_submitted`: "Correction reçue" amber badge + correction doc download
  - Annotation (if non_satisfaisant or correction_submitted): gray italic block with review comment
  - `DOCUMENT_REVIEW` → review actions: "Satisfaisant" (green) | "Non satisfaisant" (outline) buttons → `ReviewDocumentDialog`

**Section 4 — Corrections demandées** (shown when any non_satisfaisant or correction_submitted)
- Filtered list of non_satisfaisant + correction_submitted evaluations
- Each: requirement label + DN annotation + correction status
- Compact read-only view (corrections uploaded by portal — no admin action here)

**Section 5 — Clôture de la phase** (shown when `documentEvaluationStatus === "document_evaluation_ready_to_close"`)
- `PHASE_CLOSE` → "Clôturer la Phase III" destructive button → `ClosePhaseDialog`
- Else: `WaitingState` "Toutes les évaluations doivent être satisfaisantes."

### Dialogs

**UploadInvoiceDialog**: `{open, dossierId, onOpenChange, onSuccess}` — reuse `UploadDocumentDialog`

**ReviewDocumentDialog**: `{open, dossierId, evaluationId, currentStatus, requirementLabel, annotation, onOpenChange, onSuccess}`
- Radio: Satisfaisant / Non satisfaisant
- Textarea for annotation (required when non_satisfaisant)
- Calls `reviewDocumentEvaluation(dossierId, evaluationId, {status, annotation})`

**ClosePhaseDialog**: Confirm dialog — "Clôturer la Phase III — Évaluation approfondie" → call `closeDocumentEvaluationPhase(dossierId)`

---

## Portal Phase 3 UX Plan

### Location: portal dossier detail page (equivalent of RequestDetailPage for OMA dossiers)

CACHE GAP: need to confirm if portal has a dossier detail page or if Phase 3 block goes in RequestDetailPage.

**Sections (progressive reveal):**

**Section 1 — Facture**
- Shown when phase exists
- If `payment.invoiceDocumentId`: "Facture disponible" → download button "Télécharger la facture"
- Else: "En attente de la facture ANAC" muted text

**Section 2 — Paiement**
- If invoice available + no proof: action-required card "Déposer la preuve de paiement" → inline upload form (file + optional notes)
- If proof submitted: "Preuve de paiement envoyée ✓" (emerald)
- If no invoice: section disabled/muted

**Section 3 — Évaluation des documents**
- Shown when payment gate passed
- List of evaluations (requirement label + status)
- status=satisfaisant: emerald "Document satisfaisant"
- status=non_satisfaisant: red "Correction demandée" + amber box with DN annotation
- status=correction_submitted: amber "Correction envoyée — en attente de revue"
- status=pending: muted "En cours d'examen"

**Section 4 — Corrections demandées**
- Shown when any correction needed
- For each `non_satisfaisant` evaluation: requirement label + annotation + "Déposer le document corrigé" action card
- Upload form: file input + optional notes
- Success: "Correction envoyée"

---

## Implementation Slices

### OMA-EVAL-5A — Admin API client + types (small, foundational)
- Add types: `DocumentEvaluationStatus`, `PhasePaymentStatus`, `AdminDocEvalPaymentState`, `AdminDocEvalEvaluation`, `AdminDocEvalState`, `AdminDocEvalProgress`, `AdminDocEvalCloseResult`
- Add methods: `getDocumentEvaluationPaymentState`, `uploadStudyFeeInvoice`, `getDocumentEvaluations`, `reviewDocumentEvaluation`, `closeDocumentEvaluationPhase`
- Note: `downloadDocEvalDocument` reuses existing `downloadDossierDocument` (already calls `/admin/dossiers/:id/documents/:documentId`)

### OMA-EVAL-5B — Admin Phase 3 workspace (medium-large)
- `document-evaluation-progress.helpers.ts` — state machine visibility + progress
- `document-evaluation-dialogs.tsx` — UploadInvoiceDialog, ReviewDocumentDialog, ClosePhaseDialog
- `DocumentEvaluationPhaseWorkspace.tsx` — full workspace (5 sections)
- `dossier-detail.labels.ts` additions — `documentEvaluationStatusLabels`

### OMA-EVAL-5C — Admin integration (small)
- `DossierPhasesTab.tsx` — add `document_evaluation` case to phase switch, lazy-load phase data, render `DocumentEvaluationPhaseWorkspace`
- `DossierHistoriqueTab.tsx` — add Phase 3 milestone events (payment, init, reviews, corrections, close) — low priority

### OMA-EVAL-6A — Portal API client + types (small)
- Add types: `PortalPhase3PaymentState`, `PortalDocEvalEntry`
- Add methods: `getPhase3PaymentState`, `uploadPaymentProof`, `uploadDocumentEvaluationCorrection`, `downloadPhase3Document`

### OMA-EVAL-6B — Portal Phase 3 UI (medium)
- Add Phase 3 block to portal dossier detail (confirm exact page first)
- Invoice section, payment proof upload, evaluation list, correction upload cards

### OMA-EVAL-7 — Cross-tab polish (deferred)
- DossierDocumentsTab Phase 3 documents section
- Dashboard priority actions for Phase 3 evaluations
- Historique Phase 3 detail events

---

## Risks / Open Questions

- R1: Portal dossier detail page — need to confirm where Phase 3 portal block goes (RequestDetailPage or new `DossierDetailPage` in portal)
- R2: Portal document download for Phase 3 — need a portal endpoint to download invoice/correction documents; existing portal doc download endpoint scope unclear
- R3: `downloadDossierDocument` admin endpoint only covers one document type; may need dedicated admin Phase 3 document download if document is `ownerType=phase_payment` not `ownerType=dossier`
- R4: Evaluation board layout — table vs card list; prefer card list for low document count (<20 typically)
- R5: Correction upload portal route returns evaluationId not dossierId; need to check if portal dossier reload includes Phase 3 eval state

---

## Verification commands run

Not run — audit/planning only.

## Manual checks run

Not run — no implementation.

---

## Next step

Implement **OMA-EVAL-5A** (admin API client/types) — foundational, no visual changes, can be done quickly and enables 5B/5C in next pass.
