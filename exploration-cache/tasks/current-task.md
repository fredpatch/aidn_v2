# Current Task

## Phase: OMA-FORMAL-9C — Guided Action Card for Phase 2

Date: 2026-05-27
Status: **Complete — Admin typecheck PASS, Admin build PASS, API typecheck PASS**

## Summary files

- Implementation: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9c-guided-action-card-phase2.md`

## Files modified

- `apps/admin/src/lib/api/dossiers.api.ts`
  - Added `inviteFormalMeeting(id, payload)` → POST `/phases/formal-request/meeting`
  - Added `markFormalMeetingHeld(id, payload)` → POST `/phases/formal-request/meeting/mark-held`
  - Added `uploadFormalMeetingReport(id, formData)` → POST `/phases/formal-request/meeting-report`
  - Added `closeFormalRequestPhase(id, payload)` → POST `/phases/formal-request/close`
  - All return `AdminFormalRequestPhaseState`

- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
  - Added `import { CalendarScheduler }` and `import { closeFormalRequestPhase, inviteFormalMeeting, markFormalMeetingHeld, uploadFormalMeetingReport }`
  - Added local `buildScheduledAt` helper (mirrors preliminary-dialogs.tsx)
  - Added `InviteFormalMeetingDialog` — CalendarScheduler + location + notes
  - Added `MarkFormalMeetingHeldDialog` — date input + notes, confirm
  - Added `UploadFormalMeetingReportDialog` — file upload + notes
  - Added `CloseFormalRequestPhaseDialog` — confirmation + notes, destructive button

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
  - Added `useContext`, `useState`, `AuthContext`, `hasPermission`, `Button` imports
  - Added `DialogKey` type union
  - Imported 4 new dialogs from `formal-request-dialogs`
  - Added `dossierId` to destructured props (was in type but unused)
  - Renamed `onStateChange: _onStateChange` → `onStateChange` (now actually used)
  - Added permission checks: `canManageMeetings`, `canPublishDocuments`, `canPhaseClose`
  - Replaced static "Statut" card with "Prochaine action" interactive card
  - Built guided `nextActionContent` block covering all 10 workflow states
  - Rendered 4 dialogs at component bottom

## Guided action card flow

| formalRequestStatus | Actor | Content |
|---------------------|-------|---------|
| (no gate) | — | WaitingState: En attente du dépôt postulant |
| gate, not sent to DG | — | WaitingState: Circuit DG à traiter depuis Courriers officiels |
| sent_to_dg | — | WaitingState: En attente du retour DG |
| dg_returned | — | WaitingState: En attente décision DG (Courriers officiels) |
| dg_decision_recorded | MEETING_MANAGE | Button: Planifier la réunion formelle |
| meeting_invited | MEETING_MANAGE | Button: Marquer la réunion comme tenue |
| meeting_held, no report | DOCUMENT_UPLOAD_INTERNAL | Button: Joindre le compte rendu |
| meeting_held + report / recevability/closure steps | — | WaitingState: Charger courriers de recevabilité/clôture |
| canClosePhase | PHASE_CLOSE | Button: Clôturer la Phase 2 (destructive) |
| formal_closed | — | Green done banner |

## Verification completed

```bash
cd apps/admin
npx tsc --noEmit   # PASS (no errors)
npm run build      # PASS (3949+ modules, chunk size warning pre-existing)

cd apps/api
npm run typecheck  # PASS
```

## Manual checks

Not run; no live browser session in this pass.

## Known risks / TODOs

- `buildScheduledAt` is duplicated between `preliminary-dialogs.tsx` and `formal-request-dialogs.tsx` — could be extracted to a shared utility later
- Recevability and closure courrier uploads (uploadFormalRecevabilityCourrier, uploadFormalClosureCourrier) are not yet exposed as action buttons — they are handled via FormalRequestPhaseChecklist
- No re-invite / reschedule handling for meeting (not in scope)

## Next step

OMA-FORMAL-9D or next product roadmap slice.
