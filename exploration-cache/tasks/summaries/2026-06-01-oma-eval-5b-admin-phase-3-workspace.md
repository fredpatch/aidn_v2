# OMA-EVAL-5B — Admin Phase 3 Workspace UI

Date: 2026-06-01
Type: implementation
Status: Complete (tsc 0 errors, integrated in DossierPhasesTab)

---

## Objective

Create admin Phase 3 workspace UI:
- `document-evaluation-progress.helpers.ts`
- `document-evaluation-dialogs.tsx`
- `DocumentEvaluationPhaseWorkspace.tsx`
- Labels additions in `dossier-detail.labels.ts`
- Wire into `DossierPhasesTab.tsx`

---

## Cache files read

- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-5-phase-3-ui-audit-planning.md`
- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-5a-admin-api-client-types.md`
- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-5a-1-phase-3-document-download-backend-fix.md`

---

## Source files inspected

- `FormalRequestPhaseWorkspace.tsx` — workspace structure, label patterns, badge patterns
- `formal-request-dialogs.tsx` — dialog structure, form patterns
- `formal-request-progress.helpers.ts` — step/visibility helper patterns
- `dossier-detail.helpers.tsx` — shared primitives (ActionError, WaitingState, Note, DefinitionGrid, Field, PhaseStatusBadge)
- `dossier-detail.labels.ts` — existing label maps
- `DossierPhasesTab.tsx` — integration point
- `components/UploadDocumentDialog.tsx` — reusable upload dialog
- `lib/utils/blob.ts` — openBlobInNewTab
- `lib/utils/error.ts` — extractError
- `lib/auth/permissions.ts` — hasPermission(user, string)

---

## Files changed

**New:**
- `apps/admin/src/pages/dossiers/document-evaluation-progress.helpers.ts`
- `apps/admin/src/pages/dossiers/document-evaluation-dialogs.tsx`
- `apps/admin/src/pages/dossiers/DocumentEvaluationPhaseWorkspace.tsx`

**Modified:**
- `apps/admin/src/pages/dossiers/dossier-detail.labels.ts` — 3 new label maps
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx` — DocumentEvaluationPhaseWorkspace import + document_evaluation case
- `apps/admin/src/lib/api/dossiers.api.ts` — added correctionDocument field to AdminDocumentEvaluationItem
- `apps/api/src/modules/oma-phases/document-evaluation.service.ts` — getDocumentEvaluations now includes correctionDocument.documentId via bulk-loaded correctionSubmissions

---

## Key decisions

1. **Self-loading workspace** — `DocumentEvaluationPhaseWorkspace` manages its own state via `useCallback`/`useEffect`, not relying on parent state management (unlike FormalRequestPhaseWorkspace). This simplifies DossierPhasesTab integration.

2. **Backend correction** — `getDocumentEvaluations` was extended to bulk-load correction submissions and return `correctionDocument: {documentId}` per evaluation. This was needed to enable correction download buttons.

3. **EvaluationCard sub-component** — extracted for clarity; receives `onDownload`/`onReview` callbacks; `dossierId` prop removed as it was unused.

4. **Section structure**: 5 sections: phase status, payment, evaluation board, corrections (read-only), closure. Progressive reveal via `getDocumentEvaluationVisibility`.

5. **Badge classes** — emerald for `satisfaisant`/`payment_proof_submitted`, amber for `correction_submitted`/`invoice_sent`, destructive for `non_satisfaisant`. Inline className overrides on `variant="outline"` following existing project pattern.

6. **ReviewDocumentDialog** — toggle-style buttons (not radio inputs) for satisfaisant/non_satisfaisant decision. Annotation required when non_satisfaisant.

7. **DossierPhasesTab integration** — minimal: import + one case in workspace switch. Left progress card stays generic (no doc eval progress shown in left pane for now).

---

## Implementation details

### document-evaluation-progress.helpers.ts
- `getDocumentEvaluationProgress` — 6-step progress: invoice → payment → eval started → corrections resolved → ready to close → closed
- `getDocumentEvaluationVisibility` — boolean flags for progressive reveal
- Badge variant/class helpers for evaluation status and payment status
- `hasPendingCorrections` helper

### document-evaluation-dialogs.tsx
- `UploadInvoiceDialog` — wraps `UploadDocumentDialog`, appends issuedAt/notes to FormData, calls `uploadStudyFeeInvoice`
- `ReviewDocumentDialog` — toggle buttons + textarea, requires annotation for non_satisfaisant, calls `reviewDocumentEvaluation`
- `CloseDocumentEvaluationDialog` — simple confirm dialog, calls `closeDocumentEvaluationPhase`

### DocumentEvaluationPhaseWorkspace.tsx
Section 1: phase status + dates + info note
Section 2: payment status badge + invoice/proof download buttons + upload invoice button + payment gate note
Section 3: evaluation card list (download main doc, download correction, review button)
Section 4: read-only corrections list (non_satisfaisant + correction_submitted)
Section 5: close button or waiting state

---

## Verification commands run

```
npx tsc --noEmit (admin)  →  0 errors
npm run typecheck (api)    →  0 errors
```

---

## Manual checks run

Not run — dev server not started. UI wired but not runtime-tested.

---

## Known risks / TODOs

- Download error is silently swallowed in workspace (no user-visible error on failure). Could add a toast in OMA-EVAL-7 polish.
- Left pane progress card in DossierPhasesTab shows generic placeholder for document_evaluation. Could be enriched in OMA-EVAL-5C.
- ReviewDocumentDialog uses green button styling via className — may not render identically in all themes. Could extract to a helper in polish pass.

---

## Next step

**OMA-EVAL-6A** — Portal API client + types (`portal.api.ts`):
- Types: `PortalPhase3PaymentState`, `PortalDocEvalEntry`
- Methods: `getPhase3PaymentState`, `uploadPaymentProof`, `uploadDocumentEvaluationCorrection`, `downloadPhase3Document`
- Confirm portal Phase 3 block location (RequestDetailPage vs new page)
