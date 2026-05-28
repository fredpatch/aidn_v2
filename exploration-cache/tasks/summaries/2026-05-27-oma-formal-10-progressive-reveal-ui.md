# OMA-FORMAL-10 - Phase 2 Progressive Reveal UX

Date: 2026-05-27
Status: Complete

## Objective

Make Phase 2 admin workspace follow Phase 1's progressive disclosure pattern:

- Initial state shows only header + next action
- Supporting documents appear once formal request exists
- Meeting section appears only after DG return unlocks it
- Closure evidence section appears only after meeting is held or closure docs exist
- No placeholder cards showing "Non programmée / Non tenue / Compte rendu non joint" in early states

## Files inspected

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx` - Phase 1 pattern (conditional meeting/evidence rendering)
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx` - Phase 2 workspace (always-visible sections)
- `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts` - existing helpers
- `apps/admin/src/lib/api/dossiers.api.ts` - AdminFormalRequestPhaseState type (fields confirmed)

## Files changed

| File                                                               | Change                                                                                                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts` | Added `FormalRequestVisibility` type + `getFormalRequestVisibility()`                                                                            |
| `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`    | Import + use visibility helper; gate Réunion formelle, Documents, and closure sections; meeting DefinitionGrid only rendered when meeting exists |

## Key decisions

- Visibility helper kept in `formal-request-progress.helpers.ts` (already imported, avoids new file)
- No closure document downloads added (backend download route for formal closure docs not wired yet)
- Closure evidence section shows read-only availability badges only
- "Compte rendu" badge gated by `showMeetingReport` (only when report is attached - avoids "Compte rendu non joint" noise before meeting exists)
- Meeting DefinitionGrid (date/location) only rendered when `state.meeting` exists

## Visibility rules

```
showFormalRequestGate: always true
showSupportingDocuments: state.gate.exists
showFormalMeeting: hasFormalDgCircuit || Boolean(state.meeting)
showMeetingReport: Boolean(state.meeting?.reportDocumentId)
showClosureEvidence: meetingHeld || hasClosureEvidence || status === "formal_closed"
```

where `hasFormalDgCircuit = SENT_OR_AFTER.has(status)`.

## Phase 2 state-by-state result

| State                                  | Visible sections                                         |
| -------------------------------------- | -------------------------------------------------------- |
| initial / waiting formal request       | Header + Courrier formel + Prochaine action              |
| formal_request_received                | + Documents checklist                                    |
| formal_sent_to_dg / formal_dg_returned | + Documents checklist                                    |
| formal_dg_decision_recorded            | + Réunion formelle (invite button) + Documents           |
| formal_meeting_invited                 | + Réunion formelle (mark held button) + Documents        |
| formal_meeting_held                    | + Réunion formelle + Documents + Clôture et recevabilité |
| formal_closed                          | All sections visible                                     |

## Verification results

```
cd apps/admin
npx tsc --noEmit  → PASS (no errors)
npm run build     → PASS (built in 1.28s)
```

## Manual checks

Not run; no live browser session.

## No backend changes

All logic is frontend-only, derived from existing `AdminFormalRequestPhaseState` fields.

## Known risks / TODOs

- Closure evidence section shows availability badges but no downloads. A `downloadFormalRequestDocument` route needs to be wired when formal closure document download is implemented.
- `showMeetingReport` currently requires `meeting?.reportDocumentId` to be set - the "Compte rendu non joint" badge is hidden until report upload action is relevant. This is intentional.

## Next step

Manual browser validation of Phase 2 progressive states. Or proceed to next OMA-FORMAL slice.
