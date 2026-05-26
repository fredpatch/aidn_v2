# OMA-FORMAL-1 — API Foundation for Phase 2 Demande formelle

Date: 2026-05-26
Status: **Complete — API typecheck PASS, API lint PASS, API build PASS**

---

## Objective

Implement the backend foundation for Phase 2 (Demande formelle) state/read model:
- Two new Mongoose models
- OmaPhase extended with Phase 2 fields
- Seeded document requirements
- Admin read endpoint

No file upload, no DG mutations, no meeting mutations, no frontend.

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/api/src/modules/documents/document-requirement.model.ts` | Phase 2 document requirement catalog (seeded) |
| `apps/api/src/modules/documents/document-submission.model.ts` | Per-dossier document submission tracker |
| `apps/api/src/modules/oma-phases/formal-request.service.ts` | `getAdminFormalRequestPhase` service function |
| `apps/api/src/scripts/seed-document-requirements.ts` | Idempotent seed for 14 Phase 2 requirements |

## Files Modified

| File | Change |
|------|--------|
| `apps/api/src/modules/oma-phases/oma-phase.model.ts` | Added 15 Phase 2 fields |
| `apps/api/src/modules/admin/admin.routes.ts` | Added `GET /dossiers/:id/phases/formal-request` |

---

## OmaPhase Fields Added

```ts
formalRequestStatus: string | null   // 14-value enum + null
formalRequestCourrierId?: ObjectId   // Gate: formal request letter (ref Courrier)
formalRequestDgReviewId?: ObjectId   // ref DGReview
formalMeetingId?: ObjectId           // ref Meeting
formalMeetingReportDocumentId?: ObjectId  // ref Document
recevabilityCourrierDocumentId?: ObjectId // ref Document
phaseClosureCourrierDocumentId?: ObjectId // ref Document
formalRequestReceivedAt?: Date
formalSentToDgAt?: Date
formalDgReturnedAt?: Date
formalMeetingHeldAt?: Date
formalClosedAt?: Date
```

---

## Models

### DocumentRequirement
- Collection: `document_requirements`
- Indexes: `{ phaseKey, code }` unique; `{ phaseKey, isActive, sortOrder }`
- Fields: `phaseKey`, `code`, `label`, `formCode?`, `requirementLevel` (gate/expected/optional/conditional), `documentType` (14 values), `appliesToRequestTypes[]`, `isRepeatable`, `sortOrder`, `isActive`

### DocumentSubmission
- Collection: `document_submissions`
- Indexes: `{ dossierId, phaseKey }`, `{ phaseId, requirementId }`, `{ documentId }`
- Fields: `dossierId`, `phaseId`, `phaseKey`, `requirementId?`, `documentId`, `submittedById`, `submittedByRole`, `source`, `status` (7 values), `reviewComment?`, `reviewedById?`, `reviewedAt?`

---

## Seed

14 requirements seeded for `phaseKey: "formal_request"`:

| sortOrder | code | level |
|-----------|------|-------|
| 10 | formal_request_letter | **gate** |
| 20 | oma_approval_form | expected |
| 30 | management_personnel_acceptance | expected |
| 40 | management_cv | expected |
| 50 | management_qualifications | expected |
| 60 | certification_staff_list | expected |
| 70 | mpm | expected |
| 80 | quality_manual | conditional |
| 90 | sgs_manual | expected |
| 100 | capability_list | conditional |
| 110 | training_program | conditional |
| 120 | subcontractor_contracts | conditional |
| 130 | technical_structure_documents | expected |
| 140 | compliance_statement | expected |

Run seed: `npm run ts-node src/scripts/seed-document-requirements.ts` or equivalent.

---

## API Endpoint

`GET /api/v1/admin/dossiers/:id/phases/formal-request`
- Auth: `DOSSIER_VIEW_ALL`
- Returns: `{ phase, gate, requirements[], progress }`

### Gate computation

```ts
gate.exists = !!phase.formalRequestCourrierId
canSendToDg = gate.exists && !phase.formalRequestDgReviewId
canInviteFormalMeeting = phase.formalRequestStatus === "formal_dg_decision_recorded"
canClosePhase = !!(formalRequestCourrierId && formalMeetingId && (recevabilityCourrierDocumentId || phaseClosureCourrierDocumentId))
```

**Supporting documents do NOT block canSendToDg.**

### Progress computation

```ts
blockingMissing = !gate.exists  // only blocked if formal request courrier absent
completionRate = Math.round((submitted / totalTracked) * 100)  // informational only
```

---

## Verification

```
cd apps/api
npm run typecheck  → PASS
npm run lint       → PASS
npm run build      → PASS
```

---

## Known Limitations / TODOs

- `formalRequestCourrierId` is always null until a Phase 2 upload mutation is implemented → gate always `false`, `canSendToDg` always `false`.
- No upload endpoint yet — `DocumentSubmission` records cannot be created.
- `formal_request_courrier` is not yet in the `Courrier.type` enum — add when implementing upload.
- Seed script should be added to `package.json` scripts for convenience.

---

## Next Step

OMA-FORMAL-2 — Phase 2 upload mutations (formal request courrier upload, supporting document upload) + admin DG circuit + formal meeting.
