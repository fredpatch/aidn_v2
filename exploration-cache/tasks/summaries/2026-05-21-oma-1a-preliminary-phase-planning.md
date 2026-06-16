# OMA-1A Planning - Phase préliminaire

Date: 2026-05-21
Status: Planning complete - awaiting approval

## Objective

Plan the MVP implementation of the Phase préliminaire workflow for dossiers DN opened via ADMIN-4.

## Cache files read

- `exploration-cache/manifest.json`
- `exploration-cache/05-data/DATA_MODELS.md`
- `exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.model.ts` - full
- `apps/api/src/modules/dossiers/dossier.model.ts` - full
- `apps/api/src/modules/meetings/meeting.model.ts` - full
- `apps/api/src/modules/dg-reviews/dg-review.model.ts` - full
- `apps/api/src/modules/documents/document.model.ts` - full
- `apps/api/src/shared/permissions/permissions.ts` - full
- `apps/api/src/modules/admin/admin.routes.ts` - full
- `apps/admin/src/App.tsx` - partial (first 80 lines)
- `apps/admin/src/pages/DossierDetailPage.tsx` - partial (first 60 lines)
- `apps/admin/src/pages/DossiersPage.tsx` - full
- `apps/admin/src/lib/api/requests.api.ts` - partial
- `apps/portal/src/pages/RequestDetailPage.tsx` - full

## Key findings

1. `oma-phase.model.ts` is fully populated with all preliminary-specific fields: `preliminaryStatus`, `firstMeetingId`, `preliminaryMeetingId`, `preEvaluationTemplateDocumentId`, `completedPreEvaluationDocumentId`, `preEvaluationDgReviewId`, `firstMeetingReportDocumentId`, `preliminaryMeetingReportDocumentId`, `closureCourrierDocumentId`.
2. `document.model.ts` has all document types needed: `pre_evaluation_blank_form`, `pre_evaluation_completed_form`, `meeting_report`, `phase_closure_letter`.
3. `meeting.model.ts` has `outlookEmailStatus` tracking (not_required / to_be_sent_manually / sent_manually).
4. `dg-review.model.ts` supports `targetType=pre_evaluation_form` - model-ready for DG sub-circuit (deferred).
5. All permissions needed already exist: `DOSSIER_VIEW_ALL`, `PHASE_START`, `PHASE_CLOSE`, `MEETING_MANAGE`, `DOCUMENT_UPLOAD_INTERNAL`, `DOCUMENT_UPLOAD_PORTAL`.
6. No `oma-phase.service.ts` exists - must be created.
7. No dossier or preliminary phase API endpoints exist - must be added.
8. `DossierDetailPage.tsx` and `DossiersPage.tsx` are 100% mock-data driven (all `@/features/aidn` hooks).
9. `/dossiers/:id` route already exists in App.tsx - no routing change needed.
10. `RequestDetailPage.tsx` (portal) has no dossier section - must add.

## Gaps found

- `apps/api/src/modules/oma-phases/oma-phase.service.ts` - does not exist
- `GET /api/v1/admin/dossiers` and `GET /api/v1/admin/dossiers/:id` - do not exist
- Preliminary phase action endpoints - do not exist
- Portal dossier endpoints - do not exist
- `apps/admin/src/lib/api/dossiers.api.ts` - does not exist

## No model changes needed

Zero backend model / schema changes. All enums, fields, and permissions are ready.

## Recommended implementation scope

### Deferred from this pass

- Pre-evaluation form DG/parapheur sub-circuit (`pre_eval_sent_to_dg` / `pre_eval_dg_returned`)
- Correction request flow for postulant pre-evaluation form
- `WorkflowOmaPage` API rewrite
- Documents/Meetings page API rewrites
- Progress percent calculation
- Portal notification for form availability

### In scope

All preliminary phase steps except DG sub-circuit.

## Phase closure rule

Phase can close only when:

1. `closureCourrierDocumentId` present
2. `preliminaryMeetingReportDocumentId` present

Missing either → backend returns 400.

## `preliminaryStatus` flow

```
preliminary_started
  → first_meeting_invited     (invite-first-meeting)
  → first_meeting_held        (record-first-meeting)
  → pre_eval_form_available   (publish-pre-evaluation-form)
  → pre_eval_form_submitted   (portal upload)
  → preliminary_meeting_invited  (invite-preliminary-meeting)
  → preliminary_meeting_held     (record-preliminary-meeting)
  → preliminary_ready_to_close   (upload-closure-courrier)
  → preliminary_closed           (close)
```

## Portal status mapping

| Internal preliminaryStatus  | Portal label                           |
| --------------------------- | -------------------------------------- |
| preliminary_started         | Dossier en cours de traitement         |
| first_meeting_invited       | Rendez-vous programmé                  |
| first_meeting_held          | Rendez-vous tenu                       |
| pre_eval_form_available     | Action requise - Formulaire disponible |
| pre_eval_form_submitted     | En attente d'analyse                   |
| preliminary_meeting_invited | Rendez-vous préliminaire programmé     |
| preliminary_meeting_held    | Phase préliminaire en cours de clôture |
| preliminary_ready_to_close  | Phase préliminaire en cours de clôture |
| preliminary_closed          | Phase préliminaire clôturée            |

## Files to change

| File                                                   | Change                                                 |
| ------------------------------------------------------ | ------------------------------------------------------ |
| `apps/api/src/modules/oma-phases/oma-phase.service.ts` | New - all preliminary phase service functions          |
| `apps/api/src/modules/admin/admin.routes.ts`           | Add 9 dossier + preliminary endpoints                  |
| `apps/api/src/modules/portal/portal.routes.ts`         | Add 2 portal dossier endpoints                         |
| `apps/admin/src/lib/api/dossiers.api.ts`               | New - AdminDossier type + API calls                    |
| `apps/admin/src/pages/DossiersPage.tsx`                | Full rewrite - API-backed list                         |
| `apps/admin/src/pages/DossierDetailPage.tsx`           | Full rewrite - API-backed detail + preliminary actions |
| `apps/portal/src/lib/api/portal.api.ts`                | Add portal dossier types + upload call                 |
| `apps/portal/src/pages/RequestDetailPage.tsx`          | Add Dossier DN section when dossierId exists           |

## Admin endpoints

```
GET  /api/v1/admin/dossiers                                            DOSSIER_VIEW_ALL
GET  /api/v1/admin/dossiers/:id                                        DOSSIER_VIEW_ALL
POST /api/v1/admin/dossiers/:id/preliminary/invite-first-meeting       MEETING_MANAGE
POST /api/v1/admin/dossiers/:id/preliminary/record-first-meeting       MEETING_MANAGE
POST /api/v1/admin/dossiers/:id/preliminary/publish-pre-evaluation-form DOCUMENT_UPLOAD_INTERNAL
POST /api/v1/admin/dossiers/:id/preliminary/invite-preliminary-meeting MEETING_MANAGE
POST /api/v1/admin/dossiers/:id/preliminary/record-preliminary-meeting MEETING_MANAGE
POST /api/v1/admin/dossiers/:id/preliminary/upload-closure-courrier    DOCUMENT_UPLOAD_INTERNAL
POST /api/v1/admin/dossiers/:id/preliminary/close                      PHASE_CLOSE
```

## Portal endpoints

```
GET  /api/v1/portal/dossiers/:id
POST /api/v1/portal/dossiers/:id/preliminary/upload-pre-evaluation-form
```

## Verification commands

```powershell
cd apps/api && npm run build
cd apps/admin && npm run build
cd apps/portal && npm run build
```

## Known risks

- `DossierDetailPage.tsx` is a large mock page - full rewrite is a non-trivial change; scope should be bounded to Phase préliminaire action section to avoid regression in other UI areas.
- `DossiersPage.tsx` still uses `@/features/aidn` mock constants like `AIDN_DOSSIER_STATUSES`, `AIDN_OMA_PHASE_KEYS` - these must be replaced or removed.
- File upload endpoints require multer middleware (pattern already established in admin.routes.ts for physical courrier and DG return).
- Portal `RequestDetailPage.tsx` must gate the Dossier DN section on `request.dossierId` being set - if absent, no section rendered.

## Next step

Await user approval, then implement in this order:

1. `oma-phase.service.ts` (backend service)
2. Admin routes (dossier list + detail + preliminary actions)
3. Portal routes (dossier detail + form upload)
4. `dossiers.api.ts` (admin frontend API client)
5. `DossiersPage.tsx` rewrite
6. `DossierDetailPage.tsx` rewrite
7. Portal `portal.api.ts` + `RequestDetailPage.tsx` update
8. Build verification
