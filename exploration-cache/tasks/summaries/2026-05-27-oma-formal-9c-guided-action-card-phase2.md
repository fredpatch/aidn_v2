# OMA-FORMAL-9C - Guided Action Card for Phase 2

Date: 2026-05-27
Status: Complete

## Objective

Implement the same guided "Prochaine action" UX pattern from Phase 1 (PreliminaryActionPanel) into
Phase 2 (FormalRequestPhaseWorkspace). Each workflow state maps to exactly one action button or
a WaitingState explanation, so users are never lost during the Phase 2 process.

## Pattern applied

Phase 1 reference: `PreliminaryPhaseWorkspace.tsx` → `PreliminaryActionPanel` component.

- `openDialog` state (DialogKey union), `nextActionCard` conditional block, dialogs rendered at bottom.
- Permission checks via `useContext(AuthContext)` + `hasPermission`.
- Each mutation dialog calls API → `onSuccess(nextState)` → parent updates state via `onStateChange`.

## Files changed

| File                                                            | Change                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `apps/admin/src/lib/api/dossiers.api.ts`                        | +4 API functions for meeting lifecycle and closure                        |
| `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`      | +4 dialog components + CalendarScheduler import + buildScheduledAt helper |
| `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx` | Full guided action card implementation                                    |

## API functions added (dossiers.api.ts)

```typescript
inviteFormalMeeting(id, { scheduledAt?, location?, notes? })
  → POST /phases/formal-request/meeting → AdminFormalRequestPhaseState

markFormalMeetingHeld(id, { heldAt?, notes? })
  → POST /phases/formal-request/meeting/mark-held → AdminFormalRequestPhaseState

uploadFormalMeetingReport(id, formData)
  → POST /phases/formal-request/meeting-report → AdminFormalRequestPhaseState

closeFormalRequestPhase(id, { notes? })
  → POST /phases/formal-request/close → AdminFormalRequestPhaseState
```

## Dialogs added (formal-request-dialogs.tsx)

| Component                         | Fields                                         | API                       |
| --------------------------------- | ---------------------------------------------- | ------------------------- |
| `InviteFormalMeetingDialog`       | CalendarScheduler (date+time), location, notes | inviteFormalMeeting       |
| `MarkFormalMeetingHeldDialog`     | heldAt (date), notes                           | markFormalMeetingHeld     |
| `UploadFormalMeetingReportDialog` | file (required), notes                         | uploadFormalMeetingReport |
| `CloseFormalRequestPhaseDialog`   | notes (optional), destructive confirm          | closeFormalRequestPhase   |

Notes:

- `CalendarScheduler` uses `onChange?: (value: { date?: Date; time?: string }) => void` (not `onSchedule`)
- `buildScheduledAt(date, time)` helper copied from preliminary-dialogs.tsx (local function)

## Guided action card states (FormalRequestPhaseWorkspace.tsx)

```
formal_closed              → Green done banner
!gate.exists               → WaitingState: "En attente du dépôt postulant"
gate exists, !sentToDg     → WaitingState: "Circuit DG à traiter depuis Courriers officiels"
sentToDg, !dgReturned      → WaitingState: "En attente du retour DG"
dgReturned, !dgDecision    → WaitingState: "En attente décision DG (Courriers officiels)"
dg_decision_recorded       → MEETING_MANAGE → Button: "Planifier la réunion formelle"
                               else WaitingState: "à programmer par le responsable"
formal_meeting_invited     → MEETING_MANAGE → Button: "Marquer la réunion comme tenue"
                               else WaitingState
formal_meeting_held,       → DOCUMENT_UPLOAD_INTERNAL → Button: "Joindre le compte rendu"
  no reportDocumentId        else WaitingState
canClosePhase              → PHASE_CLOSE → Button (destructive): "Clôturer la Phase 2"
                               else WaitingState: "en attente de la clôture"
else                        → WaitingState: "Chargez courrier recevabilité/clôture"
```

## Component changes (FormalRequestPhaseWorkspace.tsx)

- Added imports: `useContext`, `useState`, `Button`, `AuthContext`, `hasPermission`, `DialogKey`, 4 dialogs
- `dossierId` now destructured (was typed but prefixed-unused before)
- `onStateChange: _onStateChange` → `onStateChange` (now used in dialog `onSuccess` callbacks)
- Card title changed: "Statut" → "Prochaine action"
- Card content: static `<p>` → `{nextActionContent}` (interactive block)
- 4 dialog instances rendered at component bottom

## Verification results

```
cd apps/admin
npx tsc --noEmit   → PASS (no output)
npm run build      → PASS (1578 kB chunk, chunk size warning pre-existing)

cd apps/api
npm run typecheck  → PASS (no output)
```

## Known risks / TODOs

- `buildScheduledAt` duplicated in two dialog files - extract to shared util in future cleanup
- Recevability/closure courrier uploads remain in FormalRequestPhaseChecklist (no dedicated action buttons in the guided card yet)
- No re-invite / reschedule path for a cancelled or postponed meeting
