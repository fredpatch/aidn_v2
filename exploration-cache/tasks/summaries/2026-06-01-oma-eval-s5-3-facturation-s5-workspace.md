# OMA-EVAL-S5-3 — Full Facturation S5 Workspace UI

Date: 2026-06-01
Type: implementation (frontend)
Status: Complete — tsc 0 errors

---

## Objective

Replace the placeholder `FacturationS5Page` with the full internal S5 payment workspace
(SplitView, PaymentTaskRow list, DefinitionGrid detail, UploadInvoiceDialog action).

---

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-s5-2-frontend-api-route-nav.md`
- `apps/admin/src/pages/DgCircuitPage.tsx` — canonical two-panel pattern
- `apps/admin/src/components/ui/split-view.tsx`
- `apps/admin/src/lib/api/payments.api.ts`
- `apps/admin/src/pages/dossiers/document-evaluation-dialogs.tsx`
- `apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx`
- `apps/admin/src/lib/utils/blob.ts`
- `apps/admin/src/lib/auth/permissions.ts`
- `apps/admin/src/pages/dossiers/components/UploadDocumentDialog.tsx`

---

## Files changed

**Modified:**
- `apps/admin/src/pages/FacturationS5Page.tsx` — full rewrite (placeholder → workspace)

---

## Key decisions

1. **Self-contained page** — all sub-components (PaymentTaskRow, DetailPanel, PaymentStatusBadge,
   formatDate) defined locally in the file; no new shared components needed.
2. **DgCircuitPage pattern** — identical structure: filter tabs → SplitView → runAction/reload.
3. **`filterRef`** — stable ref so `handleUploadSuccess` always reloads with the current filter
   even though it captures the closure at dialog open time.
4. **UploadInvoiceDialog reuse** — passes `_state` to `onSuccess` (ignored); dialog closes itself
   via `onOpenChange(false)` internally after upload.
5. **Initial selection** — on load, first item is auto-selected; on reload, preserves selected
   by `dossierId` match, falls back to first item if selection disappeared.
6. **Separate error states** — `loadError` for list load failures, `downloadError` for document
   download failures (shown inline above detail panel).
7. **No WaitingState for whole panel** — only used inside action card when permission is missing.

---

## Page structure

```
FacturationS5Page
├── Header: title + subtitle + Actualiser button
├── Load error banner
├── KPI chips: Total / À facturer / Facture envoyée / Preuve reçue  (from data.counts)
├── SplitView [2fr_3fr]
│   ├── Left panel
│   │   ├── Filter tabs: À facturer / Facture envoyée / Preuve reçue / Tous
│   │   └── PaymentTaskRow list (SkeletonCard loading, EmptyState empty)
│   └── Right panel
│       ├── Placeholder if no selection
│       └── DetailPanel if selected
│           ├── Header: dossier number + org + PaymentStatusBadge
│           ├── DefinitionGrid: org, postulant, email, phase, type, statut, dates
│           ├── Documents: invoice download + proof download (conditional)
│           └── Action card (status-conditional):
│               · invoice_pending: upload button (perm-gated) or WaitingState
│               · invoice_sent: "En attente de la preuve de paiement"
│               · payment_proof_submitted: "DN peut poursuivre l'évaluation"
└── UploadInvoiceDialog (modal, gated by modal?.kind)
```

---

## Accents / badges

| Status | Border accent | Badge color |
|---|---|---|
| invoice_pending | amber-400 | amber-50/700 |
| invoice_sent | blue-400 | blue-50/700 |
| payment_proof_submitted | emerald-400 | emerald-50/700 |

---

## Permissions

- `PAYMENT_VIEW` — page route guard (App.tsx, set in OMA-EVAL-S5-2)
- `PAYMENT_INVOICE_UPLOAD` — upload button visibility (`hasPermission(user, "PAYMENT_INVOICE_UPLOAD")`)

---

## Verification commands run

```
npx tsc --noEmit (admin)  →  0 errors
```

---

## Manual checks run

Not run — dev server not available.

---

## Known risks / TODOs

- `paymentId` not shown in DefinitionGrid (not useful to internal user; dossierId is the link)
- No pagination/search — acceptable for current scope (deferred per spec)
- Dark mode badge colors use standard dark variants; should be verified visually

---

## Next step

**OMA-EVAL-6A** — Portal Phase 3 API client + types:
- `PortalPhase3PaymentState`, `PortalDocEvalEntry` types in portal API client
- `getPhase3PaymentState`, `uploadPaymentProof`, `uploadDocumentEvaluationCorrection`, `downloadPhase3Document`
- Confirm portal Phase 3 block location (RequestDetailPage vs new page)
