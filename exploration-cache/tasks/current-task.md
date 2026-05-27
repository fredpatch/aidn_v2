# Current Task

## Phase: OMA-FORMAL-11 — Align Phase 2 Formal Meeting Lifecycle with Phase 1 Pattern

Date: 2026-05-27
Status: **Complete — API typecheck PASS, API build PASS, Admin typecheck PASS, Admin build PASS**

## Summary files

- Implementation: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-11-formal-meeting-report-pattern.md`

## Files modified

- `apps/api/src/modules/oma-phases/formal-request.service.ts`
  - `uploadFormalMeetingReport`: now also marks meeting as held + advances formalRequestStatus

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
  - `meetingProgrammed && !meetingHeld` branch: "Joindre le compte rendu de réunion formelle" (opens upload_meeting_report, requires canPublishDocuments)
  - Removed `MarkFormalMeetingHeldDialog` from import, DialogKey, and render

## Phase 2 meeting lifecycle (after this change)

1. Meeting planned (`formal_meeting_invited`) → Button: "Joindre le compte rendu de réunion formelle"
2. Compte rendu uploaded → meeting.status = "held", phase = formal_meeting_held, showClosureEvidence = true
3. Closure evidence section appears → next action: awaiting recevability/closure courrier

## Kept as fallback

- `POST /phases/formal-request/meeting/mark-held` endpoint preserved (admin correction)
- `meetingHeld && !reportDocumentId` branch in workspace handles edge case

## Next step

Manual browser validation, or proceed to formal request closure evidence/download implementation.
