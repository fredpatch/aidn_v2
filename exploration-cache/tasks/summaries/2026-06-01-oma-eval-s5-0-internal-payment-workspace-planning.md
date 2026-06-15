# OMA-EVAL-S5-0 — Internal S5 Payment Workspace Audit & Planning

Date: 2026-06-01
Type: planning
Status: Complete — no implementation

---

## Objective

Audit existing admin workspace patterns and produce implementation plan for the
S5/Facturation internal payment workspace (Phase 3 study fee queue).

---

## Cache files read

- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-1-payment-gate-implementation.md`
- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-5b-admin-phase-3-workspace.md`

---

## Source files inspected

- `apps/admin/src/pages/DgCircuitPage.tsx` — two-panel SplitView pattern, CourrierTaskRow, KPI chips, tab filter chips
- `apps/admin/src/components/ui/split-view.tsx` — SplitView: lg:grid [var(--split-cols)] 2fr 3fr
- `apps/admin/src/App.tsx` — ProtectedRoute permissions (any-of) pattern
- `apps/admin/src/config/nav.tsx` — NAV_GROUPS / NavGroupConfig / NavItemConfig
- `apps/api/src/modules/admin/admin.routes.ts` — confirmed no payment list route exists

---

## Files changed

None. Planning only.

---

## Key findings

### Reusable patterns
- `SplitView` columns="[2fr_3fr]" — same as DgCircuitPage
- `SkeletonCard` / `EmptyState` / `CourrierTaskRow` style (border-l-4 accent, icon slot, content, toolbar)
- `ProtectedRoute permissions={["PAYMENT_VIEW"]}` → any-of gate
- Nav entry with `permissions: ['PAYMENT_VIEW']` under "Traitement" group
- `UploadInvoiceDialog` (OMA-EVAL-5B) is fully reusable for the invoice upload action
- `downloadDossierDocument` works for Phase 3 docs (OMA-EVAL-5A-1 fix)

### Backend gap confirmed
No `GET /payments/phase-payments` or equivalent endpoint exists.
`PhasePaymentModel` data exists but needs a list/aggregate query exposing dossier+org+postulant context.

---

## Implementation slices

### OMA-EVAL-S5-1 — Backend: payment task list endpoint
- New service function: `listPhasePaymentTasks(filters, actor)`
- Route: `GET /api/v1/admin/payments/phase-payments` [PAYMENT_VIEW]
- Query: PhasePayment.find → join Dossier → extract org/postulant names
- Returns items array + counts object
- No pagination MVP

### OMA-EVAL-S5-2 — Frontend API client + route + nav
- New API method: `listPhasePaymentTasks(filters?)` + types `PhasePaymentTask`, `PhasePaymentTaskList`
- Route `/facturation-s5` → `FacturationS5Page` in `App.tsx`
- Nav entry under "Traitement" in `nav.tsx`

### OMA-EVAL-S5-3 — Admin S5 workspace page
- `FacturationS5Page.tsx` — two-panel SplitView
- Left: status tabs + PaymentTaskRow list
- Right: DefinitionGrid detail + download buttons + action card
- Reuses `UploadInvoiceDialog` from `document-evaluation-dialogs.tsx`

---

## Proposed left-border accent colors

- invoice_pending → amber (border-l-amber-400)
- invoice_sent → blue (border-l-blue-400)
- payment_proof_submitted → emerald (border-l-emerald-400)

---

## Risks

- Backend Dossier join cost: minimal (indexed dossierId, MVP <100 dossiers)
- dossierNumber may be absent on some records: render "-"
- Phase 4/5 extension: phaseKey filter already supports it

---

## Next step

OMA-EVAL-S5-1 — Backend payment task list endpoint.
