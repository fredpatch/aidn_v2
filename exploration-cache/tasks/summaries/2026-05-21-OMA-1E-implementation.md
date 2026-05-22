# OMA-1E Implementation Summary

Date: 2026-05-21
Status: Complete - API PASS, Admin PASS, Portal PASS

## Files changed

### Backend

**NEW `apps/api/src/modules/document-templates/document-template.service.ts`**

- `createDocumentTemplate(file, input, actor)` - saves file, creates Document + DocumentTemplate, deactivates previous active template with same code
- `listDocumentTemplates(filters, actor)` - list by documentType / isActive
- `getActivePreEvalTemplate()` - finds active `pre_evaluation_blank_form` template; throws 409 if none

**`apps/api/src/modules/oma-phases/oma-phase.service.ts`**

- Added import `getActivePreEvalTemplate`
- `publishPreEvaluationForm`: signature changed to `(dossierId, actor)` - no file; calls `getActivePreEvalTemplate()` to resolve `fileDocumentId`
- `recordPreEvalDgReturn`: jumps directly to `pre_eval_dg_decision_recorded` (skips `pre_eval_dg_returned` state)
- Removed `recordPreEvalDgDecision` export
- `closePreliminaryPhase`: accepts `preliminary_meeting_held` OR `preliminary_ready_to_close`; removed `closureCourrierDocumentId` and `preliminaryMeetingReportDocumentId` checks
- `downloadPortalDossierDocument`: added check for `phase.preEvaluationTemplateDocumentId` and `phase.firstMeetingReportDocumentId` by document ID (bypasses ownerId check for template-owned docs)

**`apps/api/src/modules/admin/admin.routes.ts`**

- Added import `createDocumentTemplate`, `listDocumentTemplates`
- `GET /document-templates` - list templates
- `POST /document-templates` - upload new template (multer)
- `POST /dossiers/:id/preliminary/publish-pre-evaluation-form` - removed multer middleware, no file
- Removed `POST /dossiers/:id/preliminary/record-pre-eval-dg-decision`
- Removed `POST /dossiers/:id/preliminary/upload-closure-courrier`

### Admin Frontend

**NEW `apps/admin/src/lib/api/document-templates.api.ts`**

- `listDocumentTemplates(filters)` → `GET /api/v1/admin/document-templates`
- `uploadDocumentTemplate(formData)` → `POST /api/v1/admin/document-templates`

**`apps/admin/src/lib/api/dossiers.api.ts`**

- `publishPreEvaluationForm(id)` - changed to `apiPost` (no FormData)
- Removed `recordPreEvalDgDecision`
- Removed `uploadClosureCourrier`

**`apps/admin/src/pages/DossierDetailPage.tsx`**

- Removed `recordPreEvalDgDecision` import
- Removed `UploadFileForm` component
- Removed `RecordDgDecisionForm` component
- `first_meeting_held` case: replaced file upload form with "Rendre le formulaire disponible" button
- `pre_eval_dg_returned` case: shows "état de transition" message (compat for old data)
- `preliminary_meeting_held` + `preliminary_ready_to_close` cases: merged into single "Clôturer" panel

**`apps/admin/src/pages/SettingsPage.tsx`**

- Added `useEffect`, `useRef`, `CheckCircle2` imports
- Added `listDocumentTemplates`, `uploadDocumentTemplate`, `DocumentTemplate` imports
- Added `DocumentTemplatesSection` component: shows active template status, upload/replace form
- Wired `<DocumentTemplatesSection />` into `SettingsPage` before `DevResetSection`

### Portal Frontend

**`apps/portal/src/pages/RequestDetailPage.tsx`**

- Replaced `Upload` icon import with `Download`
- Download buttons now use `Download` icon
- Submit form button uses `Send` icon (was `Upload`)
- Added `preliminary_closed` completion card (green, with checkmark) in `DossierDnSection`; blue info box shown only for non-closed states

## New status flow

```
preliminary_started → first_meeting_invited → first_meeting_held
  → pre_eval_form_available (uses template, no file upload)
  → pre_eval_form_submitted (portal)
  → pre_eval_sent_to_dg
  → pre_eval_dg_decision_recorded  ← recordPreEvalDgReturn now lands here directly
  → preliminary_meeting_invited
  → preliminary_meeting_held
  → preliminary_closed  ← closePreliminaryPhase, no closure courrier required
```

## Verification

- API: `tsc` PASS
- Admin: `tsc + vite build` PASS
- Portal: `tsc -b + vite build` PASS
