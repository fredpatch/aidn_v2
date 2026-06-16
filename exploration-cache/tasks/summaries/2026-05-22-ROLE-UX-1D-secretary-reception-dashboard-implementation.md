# ROLE-UX-1D - Secretary/reception courrier dashboard

Date: 2026-05-22
Phase: IMPLEMENTATION
Status: **Complete - typecheck PASS, build PASS**

## Objective

Make the dashboard role-aware. For `dg_secretariat`, `reception`, `bureau_courrier`:
show a focused courrier activity dashboard derived from the existing DG circuit task endpoint.
For all other roles, keep the existing admin/DN dashboard unchanged.

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- Previous session context: permissions per role

## Source files inspected

- `apps/admin/src/pages/DashboardPage.tsx` (pre-change)
- `apps/admin/src/features/dashboard/hooks/useDashboard.ts`
- `apps/admin/src/features/dashboard/types.ts`
- `apps/admin/src/components/dashboard/MetricCard.tsx`
- `apps/admin/src/hooks/useAuth.ts`
- `apps/admin/src/lib/auth/permissions.ts`

## Files changed

- `apps/admin/src/pages/DashboardPage.tsx` - made role-aware; extracts admin dashboard into `AdminDnDashboard`
- `apps/admin/src/features/dashboard/components/CourrierDashboard.tsx` - new file, secretary/reception focused dashboard

## Key decisions

- **Role discriminator**: `hasPermission(user, 'DG_CIRCUIT_HANDLE') && !hasPermission(user, 'DOSSIER_VIEW_ALL')` - this uniquely identifies courrier-handling roles (dg_secretariat, reception, bureau_courrier) and excludes dn_agent (has both) and all supervisor/admin roles.
- **No new API endpoint**: `listDgCircuitTasks({})` (fetch all, no filter) provides enough data to derive all KPIs and the recent list client-side. Backend untouched.
- **`useDashboard` hook untouched**: the hook remains broken for non-mock mode (Promise.reject) but only DN/admin roles use it, and that was already the case before this pass.
- **MetricCard reuse**: existing `MetricCard` component used for all KPI cards for consistency.
- **`AdminDnDashboard` extracted**: the original dashboard content moved to a local private component for clarity; no behavior change for admin/DN users.

## Data derivation

All metrics from a single `listDgCircuitTasks({})` call:

- `À imprimer` → `counts.toTransmit`
- `En circuit officiel` → `counts.awaitingReturn`
- `Traités aujourd'hui` → filter items where `bucket === 'processed'` and `processedAt` is today
- `Traités cette semaine` → filter items where `bucket === 'processed'` and `processedAt` within last 7 days
- `Courriers initiaux en cours` → filter items where `source === 'initial_request'` and `bucket !== 'processed'`
- `Formulaires de pré-évaluation en cours` → filter items where `source === 'pre_evaluation'` and `bucket !== 'processed'`
- `Retours en attente` → `counts.awaitingReturn` (same as En circuit)
- Recent processed → items where `bucket === 'processed'`, sorted by `processedAt` desc, take 5

## UI structure (CourrierDashboard)

```
page-container
  header: "Tableau de bord" + subtitle + "Ouvrir les courriers officiels" button
  error banner (401 → French session error)
  section "Activité courrier" - 4-col MetricCard grid
  section "Répartition en cours" - 3-col MetricCard grid
  section "Derniers traitements" - 5 most recent processed tasks, or empty state
```

## Verification commands run

- `cd apps/admin && npx tsc --noEmit` → **PASS**
- `cd apps/admin && npm run build` → **PASS**

## Manual checks run

Not run (no live server). Code review only.

## Known risks / TODOs

### Future TODOs

1. **Notification center / inbox**: Future feature - alert secretaries about new courrier/form actions needed. Not implemented in this pass.

2. **`Traités aujourd'hui` / `cette semaine` accuracy**: These counts are derived from client-side filtering of `processedAt`. If the task list is large and not paginated, this works. If pagination is introduced later, these counts should be moved to a backend endpoint with proper date filters.

3. **`useDashboard` hook remains a stub**: For admin/DN users the dashboard still uses mock data only. This was pre-existing and out of scope for this pass.

4. **Loading state uses `'-'` as value placeholder**: MetricCard shows `-` while loading if `isLoading` is true (the component handles it with Skeleton). The value is just a fallback.

### Technical notes

- `reception` and `bureau_courrier` currently have no test accounts but the logic covers them (same permission set as dg_secretariat, minus `PRE_EVAL_DG_CIRCUIT_HANDLE` for reception/bureau_courrier - but `DG_CIRCUIT_HANDLE` is present in all three and `DOSSIER_VIEW_ALL` absent in all three, so the discriminator is correct).

## Next step

OMA Phase II (Demande formelle) implementation, or H2 reusable component extraction.
