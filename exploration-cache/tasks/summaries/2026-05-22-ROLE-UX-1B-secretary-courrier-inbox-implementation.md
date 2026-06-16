# ROLE-UX-1B - Secretary courrier inbox simplification

Date: 2026-05-22
Phase: IMPLEMENTATION
Status: **Complete - typecheck PASS, build PASS**

## Objective

Redesign the `Circuit officiel` workspace into a simpler secretary-oriented courrier inbox:

- Two-panel inbox/detail layout (list left, detail right)
- Simplified status labels in French
- Status timeline per selected item
- Print CTA triggers download then confirm → marks item as transmitted
- Upload CTA opens return dialog using existing routes
- French auth error message

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-22-OMA-1I-preliminary-h1-hardening-implementation.md`
- `apps/admin/src/lib/api/dg-circuit.api.ts`
- `apps/admin/src/lib/api/client.ts`

## Source files inspected

- `apps/admin/src/pages/DgCircuitPage.tsx` (pre-change)
- `apps/admin/src/config/nav.tsx` (pre-change)
- `apps/admin/src/lib/api/dg-circuit.api.ts`
- `apps/admin/src/lib/api/client.ts` (ApiError.status confirmed)

## Files changed

- `apps/admin/src/pages/DgCircuitPage.tsx` - full redesign as inbox/detail layout
- `apps/admin/src/config/nav.tsx` - "Circuit officiel" → "Courriers officiels"

## Key decisions

- **Two-panel layout**: `lg:grid-cols-[2fr_3fr]` - list on left, detail on right; detail is hidden on small screens until an item is selected (shown below list on mobile).
- **Source labels**: "Courrier initial" and "Formulaire de pré-évaluation" instead of admin-facing identifiers.
- **Status labels**: "À imprimer" / "En circuit" / "Traité" - simpler than previous "À transmettre" / "En attente retour" / "Traités".
- **Print flow**: if `download_outgoing` action available, downloads the document first, then shows `print-confirm` dialog ("Le document a-t-il été imprimé et placé dans le circuit officiel ?"), on confirm calls existing `markTransmitted` which dispatches `markPrintedForDg` or `sendPreEvalToDg` depending on source.
- **Upload CTA**: `record_annotated_return` → `DgReturnDialog`; fallback to `record_physical_receipt` → `PhysicalReceiptDialog` for tasks where only physical receipt is available.
- **Processed CTA**: "Consulter le retour" → `downloadDgCircuitTaskDocument` with `annotatedReturnDocumentId`.
- **Auth error**: `formatApiError` helper returns "Session expirée. Veuillez vous reconnecter." on `ApiError.status === 401`.
- **KPI cards removed**: the three counter cards at the top are gone; counts are now shown inline in the filter tab labels.
- **Selected task refresh**: after any action, the fresh items list is searched for the current selected task ID and the selected state is updated; if the task advanced to a new bucket (and no filter is active), it remains visible.
- **PhysicalReceiptDialog retained**: kept internally for `record_physical_receipt` actions on initial requests but exposed only as a fallback, not the primary CTA.

## Implementation details

### DgCircuitPage.tsx structure

```
DgCircuitPage
  page-container
    header (title + refresh)
    error banner
    lg:grid [list | detail]
      LEFT: filter tabs + search input + task list (clickable rows)
      RIGHT: detail panel
        header (badges + reference + org)
        CourrierTimeline (4 steps: Reçu / Imprimé…/ Signé / Téléversé)
        action card (bucket-based primary CTA)
  modals: PrintConfirmDialog | DgReturnDialog | PhysicalReceiptDialog
```

### New components

- `CourrierTimeline`: 4-step bullet list with filled/empty circles; uses `submittedAt`, `transmittedAt`, `returnedAt`, `processedAt` from `DgCircuitTask`.
- `PrintConfirmDialog`: simple confirm with "Oui, marquer mis en circuit" button.
- `StatusBadge`: maps `DgCircuitBucket` → "À imprimer" / "En circuit" / "Traité".
- `formatApiError`: centralised error formatter; 401 → French session error.

### Removed from page

- KPI counter grid (3-col)
- Bucket tab layout (replaced by same tabs but above the list instead of spanning the page)
- Flat task card list replaced by compact clickable rows

## Verification commands run

- `cd apps/admin && npx tsc --noEmit` → **PASS**
- `cd apps/admin && npm run build` → **PASS**

## Manual checks run

Not run (no running server). Code review only.

## Known risks / TODOs

- `record_physical_receipt` fallback CTA still uses the old `PhysicalReceiptDialog` (date + scan form). If the secretary workflow should also present this as "Téléverser le retour signé/annoté", the two dialogs could be merged. For now they are distinct.
- On mobile, the detail panel appears below the list - user must scroll down to see it. A tab-based mobile layout would be better but is out of scope.
- If a task moves to a different bucket after an action and the current bucket filter hides it, `selected` is set to `null` (task not found in fresh items). The UI shows "Sélectionnez un courrier" which is acceptable.
- `DgCircuitBucket` union still includes `returns_to_register` for filter-compat; it has no tab or status label and is never shown - this is intentional.

## Next step

OMA Phase II - Demande formelle, or H2 reusable component extraction.
