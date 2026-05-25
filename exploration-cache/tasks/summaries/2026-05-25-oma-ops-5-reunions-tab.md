# OMA-OPS-5 - Reunions tab with mini calendar + meeting cards

Date: 2026-05-25
Status: **Complete - admin typecheck PASS, admin build PASS**

## Objective

Implement the dossier cockpit Reunions tab using existing preliminary meeting data from dossier detail. Show a compact calendar/event strip, meeting cards, report availability, report downloads, and clean missing states. Do not add Outlook/email behavior or new meeting creation flows.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-1-dossier-operations-ux-plan.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-2-dossier-cockpit-tabs.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-3-preliminary-checklist-dialogs.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-3b-phase-progression-sidebar-overview.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-3c-left-panel-visual-hierarchy.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-3d-closure-without-upload.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-4-documents-tab-downloads.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/portal/src/components/PortalCalendar.tsx`
- `apps/portal/src/pages/RendezVousPage.tsx`
- `apps/api/src/modules/meetings/meeting.service.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` (`getAdminDossier` serializer slice)

## Files changed

- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-5-reunions-tab.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/history/2026-05-25-oma-ops-5-reunions-tab.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/manifest.json`
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx`

## Key findings

1. `DossierMeetingsTab` is still a placeholder.
2. `DossierDetailPage` currently renders `<DossierMeetingsTab />` without passing dossier detail.
3. `AdminDossierDetail.preliminary` already includes:
   - `phase`
   - `firstMeeting`
   - `preliminaryMeeting`
4. `AdminMeetingSummary` already has the minimum UI data needed: `id`, `title`, `meetingType`, `status`, `scheduledAt`, `location`, `notes`, `reportDocumentId`.
5. `AdminOmaPhase` also exposes `firstMeetingReportDocumentId` and `preliminaryMeetingReportDocumentId`; these can be used as a fallback/source of truth for report downloads.
6. `getAdminDossier` already fetches and serializes the two preliminary meetings. Backend changes are not needed for this slice.
7. Portal calendar UX patterns available:
   - monthly calendar grid in `PortalCalendar`
   - meeting cards in `RendezVousPage`
   - status labels/date formatting/event grouping patterns

## Implementation plan

1. Frontend-only implementation:
   - Update `DossierDetailPage` to pass `detail` to `DossierMeetingsTab`.
   - Replace the placeholder in `DossierMeetingsTab`.

2. Normalize preliminary meeting items:
   - First contact meeting:
     - title: `Premiere reunion de contact`
     - meeting: `detail.preliminary?.firstMeeting`
     - reportDocumentId: `firstMeeting.reportDocumentId ?? phase.firstMeetingReportDocumentId`
   - Preliminary meeting:
     - title: `Reunion preliminaire`
     - meeting: `detail.preliminary?.preliminaryMeeting`
     - reportDocumentId: `preliminaryMeeting.reportDocumentId ?? phase.preliminaryMeetingReportDocumentId`
   - Include expected/missing rows based on preliminary status progression so not-yet-reached steps look muted, not erroneous.

3. Mini calendar/event strip:
   - Prefer compact event strip over a full month grid for this dossier-level tab.
   - Group scheduled meetings by month and render date chips with day number, month label, meeting title, and time/location when present.
   - If no scheduled meetings exist, show a calm empty strip message.

4. Meeting cards:
   - Show title, `Phase preliminaire`, French status badge, date, location, notes, report status, and report download.
   - Status labels:
     - `planned`: `Planifiee`
     - `invited`: `Invitation envoyee`
     - `held`: `Tenue`
     - `postponed`: `Reportee`
     - `cancelled`: `Annulee`
     - missing: `Non planifiee`
   - Use `downloadDossierDocument(detail.dossier.id, reportDocumentId)` for report download.

5. No backend changes:
   - No new endpoint.
   - No serializer change.
   - No permissions/workflow changes.
   - No Outlook/email behavior.

## Implementation details

1. `DossierDetailPage.tsx`
   - Passes `detail` into `DossierMeetingsTab`.

2. `DossierMeetingsTab.tsx`
   - Replaced placeholder with a frontend-only Reunions tab.
   - Builds two normalized preliminary meeting items:
     - Premiere reunion de contact
     - Reunion preliminaire
   - Uses `meeting.reportDocumentId` first and falls back to phase report document fields.
   - Renders a compact month-grouped event strip for scheduled meetings.
   - Renders meeting cards with phase badge, French status badge, date, location, notes, report status, and report download.
   - Uses `downloadDossierDocument(detail.dossier.id, reportDocumentId)` for report downloads.
   - Missing meetings show `Non planifiee`; missing reports show `Compte rendu manquant`.

## Verification commands run

- `cd apps/admin; npx tsc --noEmit` - PASS
- `cd apps/admin; npm run build` - initial sandbox failure due Tailwind native Windows binary / `spawn EPERM`; rerun outside sandbox - PASS

Backend verification not run because no backend files changed.

## Manual checks

- Runtime browser checks not run in this pass.
- Source checks confirm Reunions tab placeholder removed.
- Source checks confirm no Outlook/email behavior or backend code was added.

## Known risks / TODOs

- Runtime checks require seeded dossiers across preliminary statuses.
- Current source files contain mojibake in some French text; keep OMA-OPS-5 scoped and avoid broad accent cleanup.
- If future phases need meetings, a broader backend model/serializer pass will be needed later.

## Next step

Runtime/manual validation with seeded dossiers across preliminary meeting states.
