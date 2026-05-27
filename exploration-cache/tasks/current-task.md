# Current Task

## Phase: OMA-FORMAL-9C0D — Fix Formal Meeting Action Gating and Refresh

Date: 2026-05-27
Status: **Complete — API typecheck PASS, API build PASS, Admin typecheck PASS, Admin build PASS**

## Summary files

- Implementation: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9c0d-formal-meeting-gating-refresh.md`

## Files modified

- `apps/api/src/modules/oma-phases/formal-request.service.ts`
  - `assertFormalDgDecisionRecorded`: accepts `formal_dg_decision_recorded` OR `formal_dg_returned`; new error message

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
  - `nextActionContent` condition order: meeting states (mark held, upload report) now checked BEFORE DG-evidence/invite branch
  - `&& !meetingProgrammed` guard added to invite-meeting condition
  - Removed unused `fs` variable (TS6133 fix)

## Phase 2 guided flow (after this change)

1. No gate → WaitingState postulant
2. Gate, not sent to DG → WaitingState Courriers officiels
3. Sent to DG, no return → WaitingState DG return
4. DG return scanned → **Button: Planifier la réunion formelle** (once only)
5. Meeting invited (formalMeetingId exists) → **Button: Marquer la réunion comme tenue**
6. Meeting held, no report → **Button: Joindre le compte rendu**
7. canClosePhase → **Button: Clôturer la Phase 2**
8. Closed → Done banner

## Known deferred issue

`canClosePhase` and `closeFormalRequestPhase` still check `dgReview.decision === "approved"` — will be false in collapsed flow. Deferred to closure evidence implementation.

## Next step

Manual browser validation of Phase 2 collapsed flow, or OMA-FORMAL closure evidence implementation.
