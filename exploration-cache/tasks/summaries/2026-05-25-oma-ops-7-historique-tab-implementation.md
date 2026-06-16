# OMA-OPS-7 - Historique tab implementation

Date: 2026-05-25
Phase: implementation
Status: **Complete - admin typecheck PASS, admin build PASS**

## Objective

Replace the Historique tab placeholder with a frontend-only derived timeline built from existing `AdminDossierDetail` data.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-7-historique-tab-plan.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/pages/dossiers/DossierCourriersTab.tsx`
- `apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx`

## Files changed

- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-7-historique-tab-implementation.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/manifest.json`
- `exploration-cache/tasks/history/2026-05-25-oma-ops-7-historique-tab.md`

## Key decisions

- Kept OMA-OPS-7 frontend-only.
- Did not add audit API calls or backend changes.
- Used a local `DossierHistoryEvent` model inside `DossierHistoriqueTab.tsx`.
- Sorted derived events oldest-first, with undated events last.
- Reused existing secure download helpers:
  - dossier documents: `downloadDossierDocument`
  - request-side courrier/orientation documents: `downloadRequestOrientationDocument`

## Implementation details

- `DossierDetailPage` now passes `detail` into `DossierHistoriqueTab`.
- `DossierHistoriqueTab` now derives timeline events from:
  - dossier `openedAt`
  - preliminary phase `startedAt` / `closedAt`
  - first contact meeting and preliminary meeting
  - preliminary document IDs
  - OMA-OPS-6 courrier metadata
- The tab renders:
  - header
  - local download error state
  - compact vertical timeline
  - category badges
  - date/time or `Date non renseignee`
  - `Consulter` button when a safe document download is available
  - calm empty state when no event can be derived

## Verification commands run

- `cd apps/admin; npx tsc --noEmit` - PASS
- `cd apps/admin; npm run build` - initial sandbox failure due Tailwind native Windows binary / `spawn EPERM`; rerun outside sandbox - PASS

## Manual checks

- Runtime browser checks not run.
- Source checks confirm no backend call, mutation action, upload action, DG circuit action, or Outlook/email behavior was added.

## Known risks / TODOs

- This is derived history, not an authoritative audit log.
- Some document events are undated because dossier detail exposes document IDs but not document upload timestamps.
- Meeting held events use `createdAt` fallback because no explicit held timestamp exists.
- Admin build still reports large chunk warning.

## Next step

Runtime/manual validation with seeded dossiers across dated and undated events.
