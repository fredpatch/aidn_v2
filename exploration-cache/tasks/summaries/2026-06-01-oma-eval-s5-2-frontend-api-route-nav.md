# OMA-EVAL-S5-2 — Frontend API Client + Route/Nav for Facturation S5

Date: 2026-06-01
Type: implementation (frontend)
Status: Complete — tsc 0 errors

---

## Objective

Add payment API client, route, nav entry, and minimal placeholder page for the
internal S5 Facturation workspace.

---

## Cache files read

- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-s5-0-internal-payment-workspace-planning.md`
- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-s5-1-payment-task-list-endpoint.md`

---

## Source files inspected (from session context — not re-read)

- `apps/admin/src/lib/api/client.ts` — apiGet confirmed
- `apps/admin/src/App.tsx` — ProtectedRoute/AdminLayout nesting pattern
- `apps/admin/src/config/nav.tsx` — NavGroupConfig, NavItemConfig structure
- `apps/admin/src/pages/DgCircuitPage.tsx` — page-container/page-title/page-subtitle CSS classes

---

## Files changed

**New:**
- `apps/admin/src/lib/api/payments.api.ts` — types + listPhasePaymentTasks method
- `apps/admin/src/pages/FacturationS5Page.tsx` — minimal placeholder with counts

**Modified:**
- `apps/admin/src/App.tsx` — import + ProtectedRoute["PAYMENT_VIEW"] + /facturation-s5 route
- `apps/admin/src/config/nav.tsx` — Receipt import + nav entry under "Traitement"

---

## Key decisions

1. **Separate `payments.api.ts`** — not added to dossiers.api.ts; payments are cross-dossier
2. **`Receipt` icon** — valid lucide-react icon, imported in nav.tsx
3. **Placeholder page fetches counts** — validates API client without building the full two-panel UI
4. **Permission string** — `"PAYMENT_VIEW"` used directly as a string (frontend hasPermission is string-based)

---

## Implementation details

### payments.api.ts exports

Types: `PhasePaymentTaskStatus`, `PhasePaymentPhaseKey`, `PhasePaymentType`,
`PhasePaymentTask`, `PhasePaymentTaskCounts`, `PhasePaymentTaskFilters`, `PhasePaymentTaskList`

Method: `listPhasePaymentTasks(filters?)` → `GET /api/v1/admin/payments/phase-payments?...`
Uses URLSearchParams to build query string safely; only includes defined filter values.

### FacturationS5Page

- `useEffect` → `listPhasePaymentTasks()` on mount
- Shows 4 KPI chips: Total / À facturer / Facture envoyée / Preuve reçue
- RefreshCcw button
- Dashed placeholder noting S5-3

### App.tsx route

```tsx
<Route element={<ProtectedRoute permissions={["PAYMENT_VIEW"]} />}>
  <Route element={<AdminLayout />}>
    <Route path="/facturation-s5" element={<FacturationS5Page />} />
  </Route>
</Route>
```

### nav.tsx entry

Under "Traitement" group, after "Courriers officiels":
```ts
{ label: 'Facturation S5', to: '/facturation-s5', icon: <Receipt />, permissions: ['PAYMENT_VIEW'] }
```

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

- `Receipt` icon may not be visually familiar to all users; can swap to `CreditCard` in polish if preferred
- Placeholder page shows dashed border with build note — should be replaced in S5-3

---

## Next step

**OMA-EVAL-S5-3** — Full two-panel `FacturationS5Page`:
- Replace placeholder with SplitView (DgCircuitPage pattern)
- Left: status tabs + PaymentTaskRow list
- Right: DefinitionGrid detail + download + UploadInvoiceDialog action
