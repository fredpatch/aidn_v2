# OMA-FORMAL-11 - Align Phase 2 Formal Meeting Lifecycle with Phase 1 Pattern

Date: 2026-05-27
Status: Complete

## Objective

Replace the two-step Phase 2 meeting workflow (plan → mark held → upload report) with the Phase 1 single-step pattern (plan → upload compte rendu = meeting held).

## Phase 1 pattern confirmed

`recordFirstMeeting` / `recordPreliminaryMeeting` in `oma-phase.service.ts`:

- Take a file upload
- Set `meeting.status = "held"`, `meeting.heldAt = new Date()`, `meeting.reportDocumentId`
- Set `phase.preliminaryStatus = "first_meeting_held"` / `"preliminary_meeting_held"`
- No separate "mark held" step exists

## Phase 2 before this change

| Endpoint                  | Effect                                              |
| ------------------------- | --------------------------------------------------- |
| `POST /meeting/mark-held` | sets held, no report                                |
| `POST /meeting-report`    | attaches report, did NOT set held or advance status |

Frontend primary action: "Marquer la réunion formelle comme tenue" (wrong pattern).

## Files changed

| File                                                            | Change                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/oma-phases/formal-request.service.ts`     | `uploadFormalMeetingReport`: add `meeting.status = "held"` + `heldAt`, set `phase.formalRequestStatus = "formal_meeting_held"`, `phase.formalMeetingHeldAt`, `phase.status = "in_progress"`                                                                                                          |
| `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx` | `meetingProgrammed && !meetingHeld` branch: opens `upload_meeting_report` (was `mark_meeting_held`); uses `canPublishDocuments` permission; label "Joindre le compte rendu de réunion formelle"; removed `MarkFormalMeetingHeldDialog` import + render; removed `mark_meeting_held` from `DialogKey` |

## Backend detail

```typescript
// uploadFormalMeetingReport - after saveDocument():
if (meeting.status !== "held") {
  meeting.status = "held" as never;
  meeting.heldAt = new Date();
}
meeting.reportDocumentId = documentId as never;
// ...
phase.formalMeetingReportDocumentId = documentId as Types.ObjectId;
phase.formalRequestStatus = "formal_meeting_held" as never;
phase.formalMeetingHeldAt = meeting.heldAt ?? new Date();
phase.status = "in_progress" as never;
```

`markFormalMeetingHeld` endpoint kept as admin correction fallback (no UI entry point in primary flow).

## Frontend detail

```tsx
} else if (meetingProgrammed && !meetingHeld) {
  // Phase 1 pattern: compte rendu upload = meeting held
  nextActionContent = canPublishDocuments ? (
    <Button onClick={() => setOpenDialog("upload_meeting_report")}>
      Joindre le compte rendu de réunion formelle
    </Button>
  ) : (
    <WaitingState>Réunion programmée. En attente du compte rendu...</WaitingState>
  );
}
```

`meetingHeld && !reportDocumentId` fallback kept for edge case where `mark-held` was called separately.

## Verification results

```
cd apps/api
npm run typecheck  → PASS
npm run build      → PASS

cd apps/admin
npx tsc --noEmit   → PASS
npm run build      → PASS (built in 1.27s)
```

## Manual checks

Not run; no live browser session.

## Known risks / TODOs

- `markFormalMeetingHeld` endpoint still exists; if called directly it sets `meeting.status = "held"` without a report. The `meetingHeld && !reportDocumentId` fallback branch in the workspace handles this edge case.
- `MarkFormalMeetingHeldDialog` component still exists in `formal-request-dialogs.tsx` (clean component, unused in guided flow but preserved for potential admin-correction use).

## Next step

Manual browser validation of Phase 2 meeting flow, or proceed to closure evidence implementation.
