# Current Task

## Phase: OMA-FORMAL-10 — Phase 2 Progressive Reveal UX

Date: 2026-05-27
Status: **Complete — Admin typecheck PASS, Admin build PASS**

## Summary files

- Implementation: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-10-progressive-reveal-ui.md`

## Files modified

- `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts`
  - Added `FormalRequestVisibility` type
  - Added `getFormalRequestVisibility(state)` function

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
  - Import `getFormalRequestVisibility`
  - Compute `visibility` from state
  - Réunion formelle section: gated by `visibility.showFormalMeeting`
  - Documents de demande formelle: gated by `visibility.showSupportingDocuments`
  - Meeting DefinitionGrid (date/location): only rendered when `state.meeting` exists
  - "Compte rendu" badge: gated by `visibility.showMeetingReport`
  - New "Clôture et recevabilité" section: gated by `visibility.showClosureEvidence`

## Phase 2 progressive reveal states

1. Initial / waiting formal request → Header + Courrier formel + Prochaine action only
2. Formal request received → + Documents checklist
3. Sent to DG / DG return → + Documents checklist
4. DG decision recorded → + Réunion formelle (invite button) + Documents
5. Meeting invited → + Réunion formelle (mark held button)
6. Meeting held → + Réunion formelle + Clôture et recevabilité
7. Closed → All sections

## Known deferred

- Closure document downloads not wired (no `downloadFormalRequestDocument` route yet)
- `canClosePhase` still checks legacy `dgReview.decision === "approved"` — deferred

## Next step

Manual browser validation, or proceed to formal request closure evidence implementation.
