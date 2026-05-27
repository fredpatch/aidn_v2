# Current Task

## Phase: OMA-FORMAL-9C0C — Collapse DG Return Scan and DG Decision for Phase 2

Date: 2026-05-27
Status: **Complete — API typecheck PASS, API build PASS, Admin typecheck PASS, Admin build PASS**

## Summary files

- Implementation: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9c0c-collapse-dg-return-decision.md`

## Files modified

- `apps/api/src/modules/oma-phases/formal-request.service.ts`
  - `recordFormalRequestDgReturn`: sets `formal_dg_decision_recorded` (was `formal_dg_returned`)
  - `canInviteFormalMeeting`: also true when `formal_dg_returned` (existing data safety net)

- `apps/api/src/modules/dg-circuit/dg-circuit.service.ts`
  - `returned_scanned` branch for formal_request → `bucket = "decision_recorded"`, removed `record_dg_decision` action
  - `processedAt` covers both `decision_recorded` and `returned_scanned`

- `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts`
  - `DECISION_OR_AFTER`: added `formal_dg_returned`

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
  - Removed `!dgDecisionRecorded` WaitingState branch
  - `circuitOfficielStatus`: collapsed to "Retour DG scanné" for dgReturned or dgDecisionRecorded
  - `formalStatusLabels`: both `formal_dg_returned` + `formal_dg_decision_recorded` → "Retour DG / Décision disponible"

- `apps/admin/src/pages/DgCircuitPage.tsx`
  - Removed `record_dg_decision` button for formal_request
  - Removed orphaned `submitDecision` function

## Phase 2 guided flow (after this change)

1. No gate → WaitingState postulant
2. Gate, not in circuit → WaitingState Courriers officiels
3. In circuit, no return → WaitingState DG return
4. DG return scanned → **Button: Planifier la réunion formelle** (direct, no decision step)
5. Meeting invited → Button: Marquer comme tenue
6. Meeting held, no report → Button: Joindre le compte rendu
7. Can close → Button: Clôturer la Phase 2
8. Closed → Done banner

## Next step

OMA-FORMAL-9D or manual browser validation of the collapsed Phase 2 DG flow.
