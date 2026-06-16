# OMA-HARDENING-3 - Admin Phase 2 Tabs Implementation

Date: 2026-05-28
Status: Complete - Admin PASS

## Objective

Add Phase 2 formal meeting and courrier visibility to admin dossier Reunions and Courriers tabs without changing backend workflow rules, portal behavior, Phase 1 behavior, Phase 2 closure logic, or Phase 3.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-16-phase-2-documents-tab-refactor.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-3-admin-phase-2-tabs-planning.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx`
- `apps/admin/src/pages/dossiers/DossierCourriersTab.tsx`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/lib/utils/blob.ts` path confirmed

## Files changed

- `apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx`
- `apps/admin/src/pages/dossiers/DossierCourriersTab.tsx`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/manifest.json`
- `exploration-cache/tasks/history/2026-05-28-oma-hardening-3-admin-phase-2-tabs.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-3-admin-phase-2-tabs.md`

## Key decisions

- Reused the `DossierDocumentsTab` separate-load pattern with `getAdminFormalRequestPhase(dossierId)` and silent not-started failures.
- Kept Phase 1 tab sections unchanged.
- Did not add backend routes or portal behavior.
- Did not add a formal request courrier download because the exposed gate value is a courrier id, not a confirmed dossier document id.
- Marked recevability and Phase II closure courriers as optional/non-blocking evidence.

## Implementation details

- `DossierMeetingsTab` now loads formal phase state, adds formal meeting to the synthetic calendar, and renders a `Phase 2 - Reunion formelle` card when `formalState.meeting` exists.
- `DossierMeetingsTab` reuses the existing report download action when `formalState.meeting.reportDocumentId` exists.
- `DossierCourriersTab` now loads formal phase state and replaces the old future-phases placeholder with a `Phase 2 - Demande formelle` section.
- Phase 2 courrier rows cover formal request gate state, recevability courrier, and Phase II closure courrier.
- If no Phase 2 courrier state exists, the tab shows `Aucun courrier Phase 2 enregistre pour le moment.`

## Verification commands run

- `cd apps/admin; npx tsc --noEmit` - PASS
- `cd apps/admin; npm run build` - initial sandbox run failed due Windows Tailwind/Vite native binary loading; outside-sandbox rerun PASS

## Manual checks run

- Not run in browser.

## Known risks / TODOs

- Manual UI checks remain recommended for dossiers with and without Phase 2, with formal meeting, with formal request gate, and with optional recevability/closure documents.
- Download behavior for recevability/closure evidence depends on the existing dossier document download allowlist. No new backend route was added.

## Next step

Proceed to the next hardening slice only when requested.
