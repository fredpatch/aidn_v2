# ROLE-UX-1C - Secretary navigation cleanup

Date: 2026-05-22
Phase: IMPLEMENTATION
Status: **Complete - typecheck PASS, build PASS**

## Objective

Reduce the `dg_secretariat` sidebar to only the screens they need:

- `Tableau de bord` (always visible)
- `Courriers officiels` (DG circuit workspace)

All other nav items hidden by adding `permissions` guards using existing permissions that `dg_secretariat` lacks.

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `apps/api/src/shared/permissions/permissions.ts` (rolePermissions map)
- `apps/admin/src/lib/auth/permissions.ts` (hasAnyPermission logic)
- `apps/admin/src/layouts/Sidebar.tsx` (filter logic)

## Source files inspected

- `apps/admin/src/config/nav.tsx` (pre-change)
- `apps/admin/src/layouts/Sidebar.tsx`
- `apps/admin/src/lib/auth/permissions.ts`
- `apps/api/src/shared/permissions/permissions.ts`

## Files changed

- `apps/admin/src/config/nav.tsx` - added `permissions` guards to previously unguarded nav items

## Key decisions

- **Permission-based approach**: used `hasAnyPermission` to hide items by referencing existing permissions that `dg_secretariat` does not hold. No new permissions introduced, no backend changes.
- **`dg_secretariat` lacks**: `REPORT_VIEW`, `REQUEST_INTAKE_REVIEW`, `DOSSIER_VIEW_ALL`, `MEETING_MANAGE`, `AIDN_USER_ACTIVATE` - these are used as guards.
- **`Demandes` guard changed**: from `['REQUEST_VIEW_ALL']` (which `dg_secretariat` has) to `['REQUEST_INTAKE_REVIEW']` (which they don't). DN agents and supervisors retain it.
- **Side effect on `reception`/`bureau_courrier`**: these roles also don't have `REQUEST_INTAKE_REVIEW` or `DOSSIER_VIEW_ALL`, so they get the same reduced nav as `dg_secretariat`. Acceptable since the prompt only guarantees unchanged nav for `admin`, `bootstrap_admin`, `dn_supervisor`, `dn_agent`.
- **`Paramètres` guard added**: was completely unguarded. Added `['DOSSIER_VIEW_ALL', 'AIDN_USER_ACTIVATE']` so admin, dn_supervisor, dn_agent can still access it; dg_secretariat cannot.
- **Routes not removed**: all route registrations in `App.tsx` are unchanged. A manually typed URL still reaches the page; existing route-level guards control access.

## Permission guard map

| Nav item                     | Guard added/changed                                  | dg_secretariat sees? |
| ---------------------------- | ---------------------------------------------------- | -------------------- |
| `Tableau de bord`            | none (always visible)                                | yes                  |
| `Rapports`                   | `['REPORT_VIEW']`                                    | no                   |
| `Demandes`                   | `['REQUEST_INTAKE_REVIEW']` (changed)                | no                   |
| `Courriers officiels`        | `['DG_CIRCUIT_HANDLE', ...]` (unchanged)             | yes                  |
| `Courriers / Orientation DG` | `['REQUEST_INTAKE_REVIEW']` (added)                  | no                   |
| `Dossiers DN`                | `['DOSSIER_VIEW_ALL']` (unchanged)                   | no                   |
| `Workflow OMA`               | `['DOSSIER_VIEW_ALL']` (added)                       | no                   |
| `Documents`                  | `['DOSSIER_VIEW_ALL']` (added)                       | no                   |
| `Réunions`                   | `['MEETING_MANAGE']` (added)                         | no                   |
| `Certificats`                | `['DOSSIER_VIEW_ALL']` (added)                       | no                   |
| `Portail postulant demo`     | `['DOSSIER_VIEW_ALL', 'AIDN_USER_ACTIVATE']` (added) | no                   |
| `Paramètres`                 | `['DOSSIER_VIEW_ALL', 'AIDN_USER_ACTIVATE']` (added) | no                   |
| Administration items         | unchanged (already guarded)                          | no                   |

## Verification commands run

- `cd apps/admin && npx tsc --noEmit` → **PASS**
- `cd apps/admin && npm run build` → **PASS**

## Manual checks run

Not run (no live server). Code review only.

## Known risks / TODOs

### TODOs documented per prompt

1. **Secretary dashboard**: Future pass should show only courrier activity indicators (e.g. "N courriers en attente d'impression", "N retours en attente") relevant to `dg_secretariat` instead of the generic admin dashboard.

2. **Notification center / inbox**: Future feature - alert secretaries about new courrier/form actions needed. Would replace or augment the manual refresh currently used on the `Courriers officiels` page.

3. **`Courriers / Orientation DG` rename**: For DN/admin users this page may later be renamed to `Registre des orientations DG` or `Historique des orientations DG` to better reflect its read-only historical nature. Not done in this pass.

### Technical risks

- `reception` and `bureau_courrier` receive the same reduced nav as `dg_secretariat` (only `Tableau de bord` + `Courriers officiels`). This was an acceptable side effect given the prompt scope. If these roles need their own distinct nav in the future, the guard model will need to be revisited.
- `dn_agent` loses `Rapports` (`REPORT_VIEW` not in their set). This is correct behavior - `REPORT_VIEW` was never assigned to `dn_agent` and they should not see that page.
- Route-level guards in `App.tsx` / `ProtectedRoute` remain the real security boundary. Nav filtering is a UX affordance only.

## Next step

OMA Phase II (Demande formelle) implementation, or H2 reusable component extraction.
