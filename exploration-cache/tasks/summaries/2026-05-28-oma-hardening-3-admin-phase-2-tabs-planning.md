# OMA-HARDENING-3 - Admin Phase 2 Tabs Planning

Date: 2026-05-28
Status: Planning complete - awaiting approval before implementation

## Objective

Plan a narrow admin-only pass to surface Phase 2 formal meeting and Phase 2 courriers in the existing dossier Reunions and Courriers tabs.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-2-portal-status-consistency.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-16-phase-2-documents-tab-refactor.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx`
- `apps/admin/src/pages/dossiers/DossierCourriersTab.tsx`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/lib/utils/blob.ts` path confirmed via file search

## Files changed

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-3-admin-phase-2-tabs-planning.md`

## Key decisions

- Use the same separate-load pattern as `DossierDocumentsTab`: `getAdminFormalRequestPhase(dossierId)` in each tab, with not-started/404 failures swallowed.
- Keep Phase 1 sections unchanged.
- Render the Phase 2 meetings section only when `formalState.meeting` exists.
- Replace the Courriers "Phases suivantes" placeholder with a Phase 2 section that reflects available state.
- Mark recevability and closure courriers as optional evidence/non-blocking.
- Do not add backend routes in this pass.

## Implementation details

- Planned meetings tab edit: load formal state, include formal meeting in the event strip, and render a `Phase 2 - Reunion formelle` card using the existing `MeetingCard`/download pattern where possible.
- Planned courriers tab edit: load formal state and render `Phase 2 - Demande formelle` rows for gate, recevability, and Phase II closure.
- Download planning:
  - Formal gate exposes `formalRequestCourrierId`, which is a courrier id, not a confirmed `Document` id for `downloadDossierDocument`; show source/status but no download button unless a supported document id is available.
  - `closure.recevabilityCourrierDocumentId` and `closure.phaseClosureCourrierDocumentId` are document IDs; use existing `downloadDossierDocument` only if supported by the current backend.

## Verification commands run

- Not run; planning only.

## Manual checks run

- Not run; planning only.

## Known risks / TODOs

- Existing cache says the admin dossier document download endpoint was extended for Phase 2 document submissions; it does not clearly confirm formal gate/recevability/closure courrier downloads. Keep download behavior conservative.
- `AdminFormalRequestPhaseState.meeting` does not type `heldAt`, although generic `AdminMeetingSummary` does. Avoid backend changes unless approval expands scope.

## Next step

Await approval, then implement the minimal admin tab additions and run admin typecheck/build.
