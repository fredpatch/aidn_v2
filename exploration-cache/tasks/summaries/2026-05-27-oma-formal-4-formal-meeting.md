# OMA-FORMAL-4 — Formal Meeting Mutations for Phase 2 Demande formelle

Date: 2026-05-27
Status: **Complete — API typecheck PASS, API lint PASS, API build PASS**

---

## Objective

Implement Phase 2 formal meeting mutations:
1. Create / invite formal meeting (with in-app notification)
2. Mark formal meeting held
3. Upload formal meeting report

Also: extend `getAdminFormalRequestPhase` read state with optional `meeting` block.

No phase closure added. No Phase 3 unlock. No email automation.

---

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/04-backend/API_ROUTES.md`

## Source files inspected

- `apps/api/src/modules/meetings/meeting.model.ts` — `meetingType` includes `"formal_meeting"`; `outlookEmailStatus` enum; `reportDocumentId`
- `apps/api/src/modules/meetings/meeting.service.ts` — portal read-only; admin creation is in oma-phase.service.ts
- `apps/api/src/modules/notifications/notification.model.ts` — `NotificationModel.create` pattern; `relatedType` includes `"meeting"`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` — `invitePreliminaryMeeting` / `recordPreliminaryMeeting` patterns

---

## Files changed

| File | Change |
|------|--------|
| `apps/api/src/modules/oma-phases/formal-request.service.ts` | Added `MeetingModel`, `NotificationModel` imports; added `meeting` block to read state; added 3 private helpers; added `createFormalMeeting`, `markFormalMeetingHeld`, `uploadFormalMeetingReport` |
| `apps/api/src/modules/admin/admin.routes.ts` | Imported 3 new functions; added 3 new POST routes |

---

## Routes added

| Route | Permission | Multer |
|-------|-----------|--------|
| `POST /admin/dossiers/:id/phases/formal-request/meeting` | `MEETING_MANAGE` | none |
| `POST /admin/dossiers/:id/phases/formal-request/meeting/mark-held` | `MEETING_MANAGE` | none |
| `POST /admin/dossiers/:id/phases/formal-request/meeting-report` | `DOCUMENT_UPLOAD_INTERNAL` | `handleOmaDocumentUpload` |

---

## Key decisions

### Meeting creation guard
- Requires `formalRequestStatus === "formal_dg_decision_recorded"` (approved DG decision only)
- Duplicate blocked (409 if `formalMeetingId` already set)
- `outlookEmailStatus` defaults to `"to_be_sent_manually"` if not provided
- `status = "invited"` if `scheduledAt` given, else `"planned"`

### Notification
- `NotificationModel.create` directly (no service wrapper)
- Recipient: `dossier.postulantUserId`
- `relatedType: "meeting"`, `relatedId: meeting._id`
- Notification only created if `postulantUserId` is set (graceful if missing)

### OmaPhase status transitions

| Action | formalRequestStatus | phase.status |
|--------|-------------------|-------------|
| create meeting | `formal_meeting_invited` | `waiting_meeting` |
| mark held | `formal_meeting_held` | `in_progress` |
| upload report | unchanged | unchanged |

### Meeting report
- `documentType = "meeting_report"`, `ownerType = "meeting"`, `category = "meeting_report"`
- Sets `Meeting.reportDocumentId` and `OmaPhase.formalMeetingReportDocumentId`
- Does NOT auto-close phase

### Read model update
- `getAdminFormalRequestPhase` now fetches `MeetingModel.findById(phase.formalMeetingId)` if set
- Returns `meeting: { id, status, scheduledAt, location, outlookEmailStatus, outlookEmailSentAt, reportDocumentId }` or `null`

---

## Audit events

| Action | Trigger |
|--------|---------|
| `formal_request.meeting_created` | create meeting |
| `formal_request.meeting_held` | mark held |
| `formal_request.meeting_report_uploaded` | upload report |

---

## Verification

```
cd apps/api
npm run typecheck  → PASS
npm run lint       → PASS
npm run build      → PASS
```

## Manual runtime tests

Not run (no running server).

---

## Known risks / TODOs

- Phase 2 closure (recevability + closure courrier) deferred to OMA-FORMAL-5.
- `meeting-report` does not require `meeting.status === "held"` — upload is allowed after meeting exists (consistent with spec guidance "do not strictly require held status").
- `outlookEmailStatus` on create is not validated against enum at route layer — service accepts any string and Mongoose enforces enum at save (will return 500 on invalid value; acceptable for internal API).
- Notification is fire-and-forget (no retry/delivery confirmation).

---

## Next step

OMA-FORMAL-5 — Phase 2 closure: recevability courrier + closure courrier + close phase mutation.
