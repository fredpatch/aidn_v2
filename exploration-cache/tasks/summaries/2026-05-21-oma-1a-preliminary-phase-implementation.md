# OMA-1A Implementation - Phase préliminaire (Backend)

Date: 2026-05-21
Status: Complete

## Objective

Implement the backend API for the OMA Phase préliminaire workflow. Backend only - no UI changes.

## Files changed

| File                                                   | Change                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| `apps/api/src/modules/oma-phases/oma-phase.service.ts` | Created - full preliminary phase service                          |
| `apps/api/src/modules/admin/admin.routes.ts`           | Added `handleOmaDocumentUpload` + 9 dossier/preliminary endpoints |
| `apps/api/src/modules/portal/portal.routes.ts`         | Added `handlePreEvalFormUpload` + 2 portal dossier endpoints      |

## Admin endpoints added

```
GET  /api/v1/admin/dossiers                                             DOSSIER_VIEW_ALL
GET  /api/v1/admin/dossiers/:id                                         DOSSIER_VIEW_ALL
POST /api/v1/admin/dossiers/:id/preliminary/invite-first-meeting        MEETING_MANAGE
POST /api/v1/admin/dossiers/:id/preliminary/record-first-meeting        MEETING_MANAGE       (multipart file optional)
POST /api/v1/admin/dossiers/:id/preliminary/publish-pre-evaluation-form DOCUMENT_UPLOAD_INTERNAL (multipart file required)
POST /api/v1/admin/dossiers/:id/preliminary/invite-preliminary-meeting  MEETING_MANAGE
POST /api/v1/admin/dossiers/:id/preliminary/record-preliminary-meeting  MEETING_MANAGE       (multipart file optional)
POST /api/v1/admin/dossiers/:id/preliminary/upload-closure-courrier     DOCUMENT_UPLOAD_INTERNAL (multipart file required)
POST /api/v1/admin/dossiers/:id/preliminary/close                       PHASE_CLOSE
```

## Portal endpoints added

```
GET  /api/v1/portal/dossiers/:id
POST /api/v1/portal/dossiers/:id/preliminary/upload-pre-evaluation-form  (multipart file required)
```

## Service design

### `oma-phase.service.ts` exports

- `listAdminDossiers` - filtered + populated dossier list
- `getAdminDossier` - full dossier detail with all phases + preliminary meetings
- `inviteFirstMeeting` - creates `first_contact_meeting` Meeting, transitions to `first_meeting_invited`
- `recordFirstMeeting` - marks meeting `held`, optional report upload, transitions to `first_meeting_held`
- `publishPreEvaluationForm` - uploads blank form, sets `postulant_visible`, transitions to `pre_eval_form_available`
- `invitePreliminaryMeeting` - creates `preliminary_meeting` Meeting, transitions to `preliminary_meeting_invited`
- `recordPreliminaryMeeting` - marks meeting `held`, optional report upload, transitions to `preliminary_meeting_held`
- `uploadClosureCourrier` - uploads closure letter, sets `postulant_visible`, transitions to `preliminary_ready_to_close`
- `closePreliminaryPhase` - validates closure prereqs, sets phase `closed`, advances dossier to `formal_request_phase`, activates `formal_request` OmaPhase
- `getPortalDossier` - ownership-scoped dossier summary with portal label + form availability flags
- `uploadCompletedPreEvaluationForm` - portal form submission, transitions to `pre_eval_form_submitted`

### `preliminaryStatus` flow implemented

```
null (from ADMIN-4)
  → preliminary_started   (getOrCreatePreliminaryPhase lazy init)
  → first_meeting_invited     (invite-first-meeting)
  → first_meeting_held        (record-first-meeting)
  → pre_eval_form_available   (publish-pre-evaluation-form)
  → pre_eval_form_submitted   (portal upload)
  → preliminary_meeting_invited  (invite-preliminary-meeting)
  → preliminary_meeting_held     (record-preliminary-meeting)
  → preliminary_ready_to_close   (upload-closure-courrier)
  → preliminary_closed           (close)
```

### Lazy init pattern

`openAdminDossierDn` (ADMIN-4) creates the preliminary OmaPhase with `preliminaryStatus: null`.
`getOrCreatePreliminaryPhase` detects `null` and sets `"preliminary_started"` before any action runs.

### Closure validation

`closePreliminaryPhase` returns 400 if:

- `closureCourrierDocumentId` is missing
- `preliminaryMeetingReportDocumentId` is missing

### Document specs

| Action                              | ownerType | category       | documentType                  | visibility        | status                 |
| ----------------------------------- | --------- | -------------- | ----------------------------- | ----------------- | ---------------------- |
| publish-pre-evaluation-form         | phase     | form           | pre_evaluation_blank_form     | postulant_visible | available_to_postulant |
| record-first-meeting (report)       | meeting   | meeting_report | meeting_report                | internal_only     | uploaded               |
| record-preliminary-meeting (report) | meeting   | meeting_report | meeting_report                | internal_only     | uploaded               |
| upload-closure-courrier             | phase     | closure_letter | phase_closure_letter          | postulant_visible | uploaded               |
| portal upload-pre-evaluation-form   | phase     | form           | pre_evaluation_completed_form | internal_only     | uploaded               |

### Audit events

- `oma.preliminary.first_meeting_invited`
- `oma.preliminary.first_meeting_recorded`
- `oma.preliminary.pre_evaluation_form_published`
- `oma.preliminary.pre_evaluation_form_uploaded`
- `oma.preliminary.preliminary_meeting_invited`
- `oma.preliminary.preliminary_meeting_recorded`
- `oma.preliminary.closure_courrier_uploaded`
- `oma.preliminary.closed`

All use `entityType: "dossier"`.

## Deferred (not in scope)

- Pre-evaluation form DG/parapheur sub-circuit (`pre_eval_sent_to_dg` / `pre_eval_dg_returned`)
- Correction request flow for postulant pre-evaluation form
- Admin UI rewrites (`DossiersPage`, `DossierDetailPage`)
- Portal UI update (`RequestDetailPage` dossier section)
- Automatic Outlook email sending
- Progress percentage calculation

## Build verification

- `apps/api` - `npm run build` passed (no TS errors)

## Runtime validation - 2026-05-21 (all 13 pass)

Live MongoDB at 100.98.64.49:27017, bootstrap admin session, portal user `alex@gmail.com / password`, dossier `6a0ec71171fe95bfc9352ac4`.

| #   | Test                                                                                                            | Result |
| --- | --------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | GET /admin/dossiers returns org + postulant populated                                                           | PASS   |
| 2   | GET /admin/dossiers/:id - 5 phases, preliminary block, `preliminaryStatus=null` (lazy init confirmed)           | PASS   |
| 3   | invite-first-meeting → `first_meeting_invited`, `waiting_meeting`, `outlookEmailStatus=to_be_sent_manually`     | PASS   |
| 4   | record-first-meeting → meeting `held`, report doc created and linked                                            | PASS   |
| 5   | publish-pre-evaluation-form → `pre_eval_form_available`, `waiting_postulant`, doc ID on phase                   | PASS   |
| 6   | GET /portal/dossiers/:id → `portalLabel: "Action requise - Formulaire disponible"`, `canSubmitForm=true`        | PASS   |
| 7   | Portal upload completed form → `pre_eval_form_submitted`, `canSubmitForm=false`, `hasCompletedForm=true`        | PASS   |
| 8   | invite-preliminary-meeting after form submitted → `preliminary_meeting_invited`; re-invite guard → 409          | PASS   |
| 9   | record-preliminary-meeting → meeting `held`, report doc linked on phase                                         | PASS   |
| 10  | close before upload-closure-courrier → 409 "La phase préliminaire n'est pas prête à être clôturée."             | PASS   |
| 11  | upload-closure-courrier → `preliminary_ready_to_close`, `ready_to_close`                                        | PASS   |
| 12  | close → `preliminary_closed`, dossier `formal_request_phase`, `formal_request` phase activates to `in_progress` | PASS   |
| 13  | All 5 mutation endpoints → 409 after closure                                                                    | PASS   |

No issues found.

## Next step

OMA-1B - Admin UI: rewrite `DossiersPage.tsx` and `DossierDetailPage.tsx` to consume the new dossier API endpoints.
