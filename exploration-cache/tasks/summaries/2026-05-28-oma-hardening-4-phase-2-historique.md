# OMA-HARDENING-4 - Phase 2 Historique Implementation

Date: 2026-05-28
Status: Complete - Admin PASS

## Objective

Add Phase 2 formal request events to the admin dossier Historique tab without changing backend workflow rules, Phase 1 behavior, portal behavior, Documents/Reunions/Courriers tab behavior, Phase 2 closure logic, or Phase 3.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-3-admin-phase-2-tabs.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-16-phase-2-documents-tab-refactor.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-17-block-closure-until-documents-deposited.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`

## Files changed

- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/manifest.json`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-4-phase-2-historique.md`
- `exploration-cache/tasks/history/2026-05-28-oma-hardening-4-phase-2-historique.md`

## Key decisions

- Reused the separate-load pattern with `getAdminFormalRequestPhase(detail.dossier.id)` and silent failures when Phase 2 is not started.
- Kept `AdminDossierDetail` unchanged.
- Preserved the existing synthetic history event model with `category`, `group`, `importance`, compact default `Jalons`, and existing download handling.
- Did not add a formal request gate download because `gate.formalRequestCourrierId` is a courrier id, not a confirmed dossier document id.
- Kept consultation-only document deposits as detail events, so default `Jalons` remains compact.

## Implementation details

- `DossierHistoriqueTab` now loads optional `AdminFormalRequestPhaseState`.
- `buildHistoryEvents` now receives optional formal state and adds Phase 2 events only when state exists.
- Added Phase 2 milestones: formal request received, DG circuit launched/returned/decision recorded, formal meeting planned/held, formal meeting report attached, and Phase 2 closed.
- Added Phase 2 document events: `oma_approval_form` validated/correction/incomplete outcomes are milestones, while per-submission deposit rows are detail events for `Documents` or `Tous`.
- Existing dossier document download behavior is reused for submission document IDs and Phase 2 evidence document IDs.

## Verification commands run

- `cd apps/admin; npx tsc --noEmit` - PASS
- `cd apps/admin; npm run build` - initial sandbox run failed due Windows Tailwind/Vite native binary loading; outside-sandbox rerun PASS

## Manual checks run

- Not run in browser.

## Known risks / TODOs

- The current frontend formal state type does not expose exact DG sent/returned/decision timestamps, meeting `heldAt`, or formal phase `closedAt`; those inferred milestones may display `Date non renseignée` unless those fields are later exposed.
- Manual browser checks remain recommended for Phase 1-only dossier, Phase 2 milestones, formal meeting, Phase 2 closure, Documents filter, and compact Jalons behavior.

## Next step

Proceed to the next hardening slice only when requested.
