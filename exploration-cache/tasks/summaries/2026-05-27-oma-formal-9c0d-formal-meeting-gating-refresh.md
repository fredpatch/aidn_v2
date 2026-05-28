# OMA-FORMAL-9C0D - Fix Formal Meeting Action Gating and Refresh

Date: 2026-05-27
Status: Complete

## Objective

Fix Phase 2 formal meeting scheduling so:

1. After DG return scanned → "Planifier la réunion formelle" appears once
2. After scheduling → UI updates to "Marquer la réunion comme tenue"
3. Duplicate meeting scheduling button is never shown again

## Files inspected

- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9c0c-collapse-dg-return-decision.md`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts`

## Files changed

| File                                                            | Change                                                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/oma-phases/formal-request.service.ts`     | Rewrote `assertFormalDgDecisionRecorded` to accept both statuses; new error message                                       |
| `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx` | Fixed condition order (meeting states before DG-evidence); added `!meetingProgrammed` guard; removed unused `fs` variable |

## Backend fix - assertFormalDgDecisionRecorded

**Before**: checked only `formal_dg_decision_recorded`, threw old error message
**After**:

```typescript
const assertFormalDgDecisionRecorded = (phase: {
  formalRequestStatus?: unknown;
}) => {
  const status = phase.formalRequestStatus as string | undefined;
  const dgEvidenceReady =
    status === "formal_dg_decision_recorded" || status === "formal_dg_returned";
  if (!dgEvidenceReady) {
    throw new HttpError(
      409,
      "Le retour DG scanné doit être enregistré avant de planifier la réunion formelle.",
    );
  }
};
```

Duplicate meeting guard unchanged (`assertNoFormalMeetingYet` → formalMeetingId check).

## Frontend fix - condition order

**Before**: DG-evidence branch checked before meeting-state branches - invite button persisted after meeting was scheduled because `formal_meeting_invited` is in `DECISION_OR_AFTER` → `dgDecisionRecorded = true`.

**After** (correct priority order):

1. `isClosed` → done banner
2. `canClosePhase` → close button / waiting
3. `meetingHeld && !reportDocumentId` → upload report
4. `meetingProgrammed && !meetingHeld` → mark held ← **now before invite branch**
5. `!gate.exists` → waiting postulant
6. `!sentToDg` → waiting circuit
7. `!dgReturned` → waiting DG return
8. `(canInviteFormalMeeting || dgDecisionRecorded) && !meetingProgrammed` → invite meeting
9. else → awaiting recevability/closure

Key guard added: `&& !meetingProgrammed` in condition 8 - if `formalMeetingId` exists, never show "Planifier la réunion formelle".

## State refresh after scheduling

`InviteFormalMeetingDialog.onSuccess` → `onStateChange(nextState)` in workspace.
`onStateChange` is wired to `setFormalState` in `DossierPhasesTab.tsx` - direct React setState, no API refetch needed.
Modal closes, state updates, condition chain re-evaluates → "Marquer la réunion comme tenue" shown.

## Error wording update

Stale message: "La décision DG doit être approuvée et enregistrée avant de planifier la réunion formelle."
New message: "Le retour DG scanné doit être enregistré avant de planifier la réunion formelle."

## Verification results

```
cd apps/api
npm run typecheck  → PASS
npm run build      → PASS

cd apps/admin
npx tsc --noEmit   → PASS (after removing unused `fs` variable at line 280)
npm run build      → PASS (built in 1.18s)
```

## Manual checks

Not run; no live browser session.

## Known risks / TODOs

- `canClosePhase` in `getAdminFormalRequestPhase` still checks `formalDgReview.decision === "approved"` - will always be false in collapsed DG flow. Not fixed here (prompt: "Do not implement closure evidence yet").
- `closeFormalRequestPhase` also guards on `dgReview.decision !== "approved"` - same deferral.
- These need fixing when OMA-FORMAL closure evidence is implemented.

## Next step

Manual browser validation of Phase 2 collapsed flow (OMA-FORMAL-9D), or proceed to closure evidence implementation.
