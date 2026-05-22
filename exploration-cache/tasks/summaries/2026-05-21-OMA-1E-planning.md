# OMA-1E Planning Summary

Date: 2026-05-21
Status: Approved - implementation complete

## Objective

Fix Phase préliminaire workflow gaps after OMA-1D runtime review:

1. Blank pre-eval form should be configured once as a template, not uploaded per dossier
2. Portal: consult/download meeting invitation details, blank form, first meeting report
3. Remove separate "record DG decision" step - DG return upload is sufficient
4. Phase closure should not require uploading a closure courrier
5. Portal status should progress meaningfully after closure

## Cache files read

- `exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md`
- `exploration-cache/05-data/DATA_MODELS.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/tasks/current-task.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- `apps/api/src/modules/document-templates/document-template.model.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/portal/src/pages/RequestDetailPage.tsx`
- `apps/portal/src/lib/api/portal.api.ts`

## Key decisions

- `DocumentTemplateModel` already exists with `code`, `documentType=pre_evaluation_blank_form`, `fileDocumentId`
- Template reuse: `publishPreEvaluationForm` no longer takes a file; calls `getActivePreEvalTemplate()` to get `fileDocumentId`
- DG circuit simplified: `recordPreEvalDgReturn` now jumps directly to `pre_eval_dg_decision_recorded`; `recordPreEvalDgDecision` removed
- Closure: `closePreliminaryPhase` now accepts `preliminary_meeting_held` or `preliminary_ready_to_close`; closure courrier no longer required
- Template download: `downloadPortalDossierDocument` now checks if `doc._id` matches `phase.preEvaluationTemplateDocumentId` directly, bypassing ownerId check (template doc is owned by DocumentTemplate record)
- `pre_eval_dg_returned` enum value kept for backward compat with existing data
