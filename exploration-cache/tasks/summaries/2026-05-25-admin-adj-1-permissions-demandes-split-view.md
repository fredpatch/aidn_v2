# ADMIN-ADJ-1 - Permissions Courriers officiels + Demandes split-view

Date: 2026-05-25
Phase: implementation
Status: **Complete - typecheck PASS, api build PASS, admin build PASS**

## Objective

1. Harden role-based access to `Courriers officiels` (/circuit-dg) - remove `dn_agent` and `dn_supervisor`.
2. Refactor `Demandes` page from wide table layout to 2-column split-view (list left, detail right).
3. Replace `Ouvrir dossier` action wording with `Démarrer la phase préliminaire`.

## Cache files read

- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/04-backend/AUTH_AND_PERMISSIONS.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/tasks/current-task.md`

## Source files inspected

- `apps/api/src/shared/permissions/permissions.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/admin/src/config/nav.tsx`
- `apps/admin/src/App.tsx`
- `apps/admin/src/pages/RequestsPage.tsx`
- `apps/admin/src/pages/DgCircuitPage.tsx` (reference for split-view pattern)
- `apps/admin/src/components/auth/ProtectedRoute.tsx`
- `apps/admin/src/lib/auth/permissions.ts`

## Files changed

1. `apps/api/src/shared/permissions/permissions.ts`
2. `apps/admin/src/pages/RequestsPage.tsx`

## Key decisions

### Part A - Permission fix

Root cause: `dn_supervisor` had both `DG_CIRCUIT_HANDLE` and `COURRIER_REGISTER_PHYSICAL`; `dn_agent` had `DG_CIRCUIT_HANDLE`. Both triggered the `any-of` guard on `/circuit-dg`.

Fix: Removed `DG_CIRCUIT_HANDLE` and `COURRIER_REGISTER_PHYSICAL` from `dn_supervisor`; removed `DG_CIRCUIT_HANDLE` from `dn_agent`. No changes to nav.tsx, App.tsx, or admin.routes.ts - existing any-of guards are already correct.

Permission constants changed:

- `dn_supervisor`: removed `DG_CIRCUIT_HANDLE`, `COURRIER_REGISTER_PHYSICAL`
- `dn_agent`: removed `DG_CIRCUIT_HANDLE`

Side-effects (all correct by design):

- `Imprimer` and `Retour DG` action buttons on `/demandes` page now hidden for DN roles (guarded by `canHandleDg` = `DG_CIRCUIT_HANDLE`)
- `Enregistrer réception courrier` button now hidden for `dn_supervisor` (guarded by `canRegister` = `COURRIER_REGISTER_PHYSICAL`)

### Part B - Split-view layout

Replaced wide Table + fixed-overlay `DetailDrawer` with:

- Left column (2fr): compact filter form + scrollable `RequestListCard` list
- Right column (3fr): inline detail panel (same sections as old DetailDrawer)
- `lg:grid lg:grid-cols-[2fr_3fr] lg:gap-4 lg:items-start` grid pattern (same as DgCircuitPage)
- Auto-selects first item on initial page load
- `border-l-4` accent color on list cards keyed to status (emerald=oriented, blue=in DG, amber=in review, red=rejected)
- `SkeletonCard` loading state, `EmptyState` for empty results

### Part C - Wording

- `Ouvrir dossier` / `Ouvrir le dossier DN` → `Démarrer la phase préliminaire` in action button and ActionDialog title/button/success
- Added `Prêt pour phase préliminaire` emerald badge in right panel header when `canOpenDossier` is true
- No backend enum changes - UI label mapping only

## Verification commands run

- `apps/api`: `npx tsc --noEmit` → PASS; `npm run build` → PASS
- `apps/admin`: `npx tsc --noEmit` → PASS; `npm run build` → PASS (1427 kB / 413 kB gzip)

## Manual checks pending

- `dn_agent` login: Courriers officiels must not appear in sidebar; direct /circuit-dg must redirect.
- `dn_supervisor` login: same.
- `admin`/`dg_secretariat` login: Courriers officiels must still appear and actions work.
- Demandes page loads with first item auto-selected in right panel.
- Clicking another card updates right panel.
- `Démarrer la phase préliminaire` button visible when `canOpenDossier` is true.
- `Prêt pour phase préliminaire` badge visible in right panel header when applicable.

## Known risks / TODOs

- `DG_DECISION_RECORD` and `DG_DECISION_CORRECT` remain on `dn_supervisor` - these are unrelated to the Courriers officiels circuit and were left intact to avoid breaking any future DG decision recording by supervisors.
- `reception` still has read-only access to `/circuit-dg` per the target table (may read, cannot mark in circuit). This is unchanged and already correct.

## Next step

Runtime validation in browser. Awaiting next task from prompt.md.
