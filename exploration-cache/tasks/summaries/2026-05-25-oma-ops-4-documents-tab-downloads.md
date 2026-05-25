# OMA-OPS-4 - Documents tab + preliminary document downloads

Date: 2026-05-25
Status: **Complete - API typecheck PASS, API build PASS, admin typecheck PASS, admin build PASS**

## Objective

Extend admin dossier document downloads to all valid preliminary phase evidence documents and replace the Documents tab placeholder with an operational Phase preliminaire document list.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-1-dossier-operations-ux-plan.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-2-dossier-cockpit-tabs.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-3-preliminary-checklist-dialogs.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-3b-phase-progression-sidebar-overview.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-3c-left-panel-visual-hierarchy.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-3d-closure-without-upload.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx`

## Files changed

- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-4-documents-tab-downloads.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/manifest.json`
- `exploration-cache/tasks/history/2026-05-25-oma-ops-4-documents-tab-downloads.md`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`

## Key findings

1. `downloadAdminDossierDocument` currently validates only `preEvaluationDgAnnotatedDocumentId` before fetching the document buffer from storage.
2. Admin route `GET /api/v1/admin/dossiers/:id/documents/:documentId` is currently guarded by `PRE_EVAL_DG_RETURN_CONSULT`, while OMA-OPS-4 requires read-only dossier consultation via `DOSSIER_VIEW_ALL`.
3. `downloadDossierDocument(dossierId, documentId)` already exists in `apps/admin/src/lib/api/dossiers.api.ts` and uses `apiGetBlob`.
4. `DossierDocumentsTab` is still a placeholder and receives no props from `DossierDetailPage`.
5. `PreliminaryPhaseWorkspace` evidence block already enumerates preliminary document fields but only enables download for `preEvaluationDgAnnotatedDocumentId`; other rows still show the OMA-OPS-4 placeholder text.
6. Closure courrier was made optional in OMA-OPS-3D and should remain optional in both the Documents tab and evidence block.

## Implementation plan

1. Backend:
   - Update `downloadAdminDossierDocument` to verify the dossier exists.
   - Load the selected dossier's preliminary phase.
   - Allow a match against `firstMeetingReportDocumentId`, `preEvaluationTemplateDocumentId`, `completedPreEvaluationDocumentId`, `preEvaluationDgAnnotatedDocumentId`, `preliminaryMeetingReportDocumentId`, and `closureCourrierDocumentId`.
   - Reject non-linked document IDs with the existing inaccessible-document convention.
   - Fetch document metadata and storage buffer as today.
   - Change the admin route guard to `DOSSIER_VIEW_ALL` per OMA-OPS-4.

2. Frontend API:
   - Keep existing `downloadDossierDocument`; no duplicate helper needed.

3. Documents tab:
   - Change `DossierDocumentsTab` to accept `detail: AdminDossierDetail`.
   - Render "Documents du dossier" with helper text.
   - Render a compact Phase preliminaire list from `detail.preliminary?.phase`.
   - Show `Disponible`, `Manquant`, or `Optionnel` badges.
   - Enable `Telecharger` for present document IDs and use `downloadDossierDocument(detail.dossier.id, documentId)`.

4. Dossier detail integration:
   - Pass `detail` into `DossierDocumentsTab`.

5. Phase workspace:
   - Replace the OMA-OPS-4 placeholder with download buttons for all available preliminary evidence documents.
   - Keep missing documents hidden in this workspace.
   - Do not require or highlight missing closure courrier.

## Implementation details

1. Backend:
   - Added `ADMIN_PRELIMINARY_DOWNLOAD_FIELDS` in `oma-phase.service.ts`.
   - `downloadAdminDossierDocument` now verifies the dossier exists, loads the dossier's preliminary phase, and only serves a document if the requested ID matches one of the allowed preliminary evidence fields.
   - Admin document route guard changed from `PRE_EVAL_DG_RETURN_CONSULT` to `DOSSIER_VIEW_ALL`.

2. Frontend:
   - `DossierDetailPage` now passes `detail` into `DossierDocumentsTab`.
   - `DossierDocumentsTab` renders Phase preliminaire document rows with `Disponible`, `Manquant`, and `Optionnel` badges.
   - Available rows call existing `downloadDossierDocument(detail.dossier.id, documentId)`.
   - `PreliminaryPhaseWorkspace` evidence rows now download every available preliminary evidence document and no longer show the OMA-OPS-4 placeholder.

## Verification commands run

- `cd apps/api; npx tsc --noEmit` - PASS
- `cd apps/api; npm run build` - PASS
- `cd apps/admin; npx tsc --noEmit` - PASS
- `cd apps/admin; npm run build` - initial sandbox failure due Tailwind native Windows binary / `spawn EPERM`; rerun outside sandbox - PASS

## Manual checks

- Runtime browser checks not run in this pass.
- Source checks confirm Documents tab placeholder removed.
- Source checks confirm Phase workspace no longer contains "OMA-OPS-4" placeholder text.

## Known risks / TODOs

- Runtime checks require seeded dossiers with each document field populated.
- Route guard changed to `DOSSIER_VIEW_ALL` as requested by OMA-OPS-4.
- Existing UI strings contain mojibake in several files; keep this pass scoped and do not perform a broad accent cleanup.

## Next step

Runtime/manual validation with seeded dossiers and valid/invalid document IDs.
