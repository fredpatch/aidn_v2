# OMA-OPS-9B-FIX - DG Circuit Dashboard Consistency + Téléversé Status

Date: 2026-05-26
Status: **Complete - API typecheck PASS, API build PASS, Admin typecheck PASS, Admin build PASS**

---

## Objective

Fix three regressions introduced by OMA-OPS-9B:

1. "Téléversé" timeline step not checked for returned DG rows
2. Dashboard stats always 0 for "Traités aujourd'hui" / "Traités cette semaine" / "Derniers traitements"
3. Source label inconsistency between Courriers officiels and dashboard

---

## Root Cause

OMA-OPS-9B replaced the `processed` bucket with `returned_scanned` and `decision_recorded`. Two components were not updated:

- `CourrierTimeline` in `DgCircuitPage.tsx`: `done: !!task.processedAt` - for `returned_scanned` items, `processedAt` (= `decisionRecordedAt`) is null, so the step never checked even when the document is uploaded
- `CourrierDashboard.tsx`: `items.filter(t => t.bucket === "processed")` - no item ever has `bucket === "processed"` now, so all computed stats = 0 and `recentProcessed` = empty

---

## Files Modified

| File                                                                 | Change                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/admin/src/pages/DgCircuitPage.tsx`                             | Fixed `CourrierTimeline` Téléversé step                            |
| `apps/admin/src/features/dashboard/components/CourrierDashboard.tsx` | Fixed processed filter, date fallback, status labels, source label |

No backend changes. No model changes.

---

## Fix 1 - Téléversé Timeline Step

**File**: `DgCircuitPage.tsx` - `CourrierTimeline` component

**Before**:

```ts
{ label: "Téléversé", date: task.processedAt, done: !!task.processedAt }
```

**After**:

```ts
const documentUploaded = !!(
  task.annotatedReturnDocumentId || task.returnedFromDgAt || task.returnedAt || task.processedAt
);
{ label: "Téléversé", date: task.processedAt ?? task.returnedFromDgAt ?? task.returnedAt, done: documentUploaded }
```

Also improved "Signé ou annoté" to prefer `returnedFromDgAt` over `returnedAt` for the date display.

**Logic**: `annotatedReturnDocumentId` presence is the most reliable signal that the document was uploaded. `returnedFromDgAt` / `returnedAt` are fallbacks. `processedAt` (decisionRecordedAt) is only set for `decision_recorded` items.

---

## Fix 2 - Dashboard Stats

**File**: `CourrierDashboard.tsx`

**Before**: `items.filter(t => t.bucket === "processed")` - never matches
**After**: `items.filter(t => completedBuckets.includes(t.bucket))` where `completedBuckets = ["returned_scanned", "decision_recorded"]`

**Date fallback for today/week checks**:

```ts
const processedDate = (t) =>
  t.decisionRecordedAt ?? t.returnedFromDgAt ?? t.processedAt ?? t.returnedAt;
```

`returned_scanned` items often have `decisionRecordedAt = null`, so fallback to `returnedFromDgAt` is required.

**In-progress counts**:

- Before: `bucket !== "processed"` (matched everything since processed is gone)
- After: `bucket === "to_transmit" || bucket === "awaiting_return"` (explicit active buckets only)

**counts state**: Added `returnedScanned` and `decisionRecorded` to match the API response shape.

---

## Fix 3 - Status Labels and Source Labels

**RecentCourrierRow**:

- Status badge now shows `"Décision DG saisie"` for `decision_recorded`, `"Retour DG enregistré"` for `returned_scanned`
- Badge color: emerald for decision_recorded, teal for returned_scanned (matches Courriers officiels)
- "Traité le" date now uses `completedDate(task)` = `decisionRecordedAt ?? returnedFromDgAt ?? processedAt ?? returnedAt`

**sourceLabels**:

- `"Courrier initial"` → `"Demande initiale"` (matches Courriers officiels page)

---

## Verification Commands Run

```
cd apps/api
npm run typecheck  → PASS
npm run build      → PASS

cd apps/admin
npx tsc --noEmit   → PASS
npm run build      → PASS
```

---

## Manual Checks Expected

1. Returned pre-eval row shows "Téléversé" checked in timeline
2. Decision-recorded initial request shows all timeline steps checked
3. Dashboard "Traités aujourd'hui" reflects today's returned/decision rows
4. Dashboard "Traités cette semaine" reflects weekly returned/decision rows
5. Dashboard "Derniers traitements" shows returned/decision rows with correct labels
6. Empty dashboard state only when truly no completed rows
7. Active queue (to_transmit / awaiting_return) still works

---

## Known Limitations

- `processedAt` for initial_request `returned_scanned` items is null (no `decisionRecordedAt`). The date shown is `returnedFromDgAt` via the fallback chain. This is correct behavior.
- Pre-eval items cannot reach `decision_recorded` bucket (no decision field on OmaPhase). Dashboard "Décisions saisies" will only count initial_request items.

---

## Next Step

OMA-OPS-10 / Phase 2 - Demande formelle
