# OMA-FORMAL-3 — DG Circuit for Phase 2 Demande formelle

Date: 2026-05-27
Status: **Complete — API typecheck PASS, API lint PASS, API build PASS**

---

## Objective

Implement Phase 2 DG circuit mutations:
1. Send formal request courrier to DG
2. Record DG return scan
3. Record DG decision

Gate rule: only `formalRequestCourrierId` required to send to DG — supporting checklist non-blocking.

---

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/04-backend/API_ROUTES.md`

## Source files inspected

- `apps/api/src/modules/dg-reviews/dg-review.model.ts` — `targetType` enum includes `"formal_request"`, `decision` enum includes `approved|rejected|reoriented|pending`
- `apps/api/src/modules/dg-circuit/dg-circuit.service.ts` — `createDgReview`, `recordDgReturn`, `recordDgDecision` generic helpers
- `apps/api/src/modules/oma-phases/oma-phase.model.ts` — confirmed `"waiting_dg"` is valid status
- `apps/api/src/modules/oma-phases/formal-request.service.ts` — current Phase 2 service
- `apps/api/src/modules/admin/admin.routes.ts` — route wiring

---

## Files changed

| File | Change |
|------|--------|
| `apps/api/src/modules/oma-phases/formal-request.service.ts` | Added imports: `createDgReview`, `recordDgReturn`, `recordDgDecision`, `DGReviewModel`; added 5 private helpers; added `sendFormalRequestToDg`, `recordFormalRequestDgReturn`, `recordFormalRequestDgDecision` |
| `apps/api/src/modules/admin/admin.routes.ts` | Imported 3 new functions; added 3 new POST routes |

---

## Routes added

| Route | Permission | Multer |
|-------|-----------|--------|
| `POST /admin/dossiers/:id/phases/formal-request/send-to-dg` | `DG_CIRCUIT_HANDLE` | none |
| `POST /admin/dossiers/:id/phases/formal-request/dg-return` | `DG_CIRCUIT_HANDLE` | `handleOmaDocumentUpload` |
| `POST /admin/dossiers/:id/phases/formal-request/dg-decision` | `DG_DECISION_RECORD` | none |

---

## Key decisions

### DGReview reuse
- `targetType = "formal_request"` (already in enum)
- `targetId = phase.formalRequestCourrierId` (the formal courrier ObjectId)
- Reuses generic `createDgReview` / `recordDgReturn` / `recordDgDecision` from `dg-circuit.service.ts`

### Private helpers added
- `loadFormalRequestPhaseOrThrow` — 404 if phase missing
- `assertPhaseNotClosed` — 409 if phase.status === "closed"
- `assertFormalRequestGateExists` — 409 if no formalRequestCourrierId
- `assertNoFormalDgReviewYet` — 409 if DGReview already exists
- `loadFormalRequestDgReviewOrThrow` — 409 if no DGReview, 404 if not found in DB

### OmaPhase status transitions
| Action | formalRequestStatus | phase.status |
|--------|-------------------|-------------|
| send-to-dg | `formal_sent_to_dg` | `waiting_dg` |
| dg-return | `formal_dg_returned` | unchanged |
| dg-decision approved | `formal_dg_decision_recorded` | `in_progress` |
| dg-decision rejected/reoriented/pending | `formal_requires_correction` | `in_progress` |

### Decision → meeting unlock
- `canInviteFormalMeeting = phase.formalRequestStatus === "formal_dg_decision_recorded"` (already in read model)
- Only `approved` sets this status → only approved unlocks meeting
- Rejected/reoriented: meeting NOT unlocked, phase NOT auto-closed

### DG return scan document
- `documentType = "dg_annotated_courrier"` (existing enum value)
- `ownerType = "dg_review"`, `ownerId = dgReview._id`
- `category = "decision"`, `visibility = "internal_only"`

### TypeScript fix
- Helper parameters changed from `{ field: unknown }` to `{ field?: unknown }` to match optional Mongoose schema fields

---

## Audit events

| Action | Trigger |
|--------|---------|
| `formal_request.sent_to_dg` | send-to-dg |
| `formal_request.dg_return_scanned` | dg-return |
| `formal_request.dg_decision_recorded` | dg-decision |

All include: `dossierId`, `phaseId`, `dgReviewId`, `formalRequestCourrierId`; dg-return adds `returnedScannedDocumentId`; dg-decision adds `decision`.

---

## Verification

```
cd apps/api
npm run typecheck  → PASS
npm run lint       → PASS
npm run build      → PASS
```

## Manual runtime tests run

Not run (no running server).

---

## Known risks / TODOs

- Formal rejection/reorientation final business flow (close phase, notify, etc.) needs PO validation — currently only stored, no closure logic.
- `dg-return` does not require DGReview to be in `awaiting_return` status — any non-finalized status is accepted. Could be tightened if needed.
- Supporting checklist remains non-blocking at all DG circuit stages.

---

## Next step

OMA-FORMAL-4 — Formal meeting mutations (invite, record) and possibly phase closure.
