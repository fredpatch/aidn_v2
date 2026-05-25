# OMA-OPS-6 - Courriers tab for dossier cockpit

Date: 2026-05-25
Phase: implementation
Status: **Complete - API typecheck PASS, API build PASS, admin typecheck PASS, admin build PASS**

## Objective

Implement the dossier cockpit Courriers tab as a consultation-only view for official courrier traces linked to the dossier: initial request courrier, initial DG orientation return, pre-evaluation DG return, optional Phase I closure courrier, and a placeholder for later phase courriers.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-3d-closure-without-upload.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-4-documents-tab-downloads.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-5-reunions-tab.md`
- `exploration-cache/tasks/summaries/2026-05-25-admin-adj-1-permissions-demandes-split-view.md`
- `exploration-cache/tasks/summaries/2026-05-25-admin-adj-2-demandes-detail-tabs.md`
- `exploration-cache/tasks/summaries/2026-05-25-admin-adj-3-dn-consult-orientation-courrier.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/DossierCourriersTab.tsx`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`
- `apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx`
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/lib/api/requests.api.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/requests/request.service.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/modules/requests/request.model.ts`
- `apps/api/src/modules/dg-reviews/dg-review.model.ts`
- `apps/api/src/modules/courriers/courrier.model.ts`

## Files changed

- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-6-courriers-tab.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/manifest.json`
- `exploration-cache/tasks/history/2026-05-25-oma-ops-6-courriers-tab.md`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/requests/request.service.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/pages/dossiers/DossierCourriersTab.tsx`

## Key findings

1. `DossierCourriersTab` is still a placeholder and currently receives no props from `DossierDetailPage`.
2. `DossierDocumentsTab` and `DossierMeetingsTab` provide the preferred cockpit style: compact header, card/list rows, `ActionError`, local download state, and `openBlobInNewTab`.
3. `AdminDossierDetail` currently exposes `dossier`, `phases`, and `preliminary`; it does not expose the originating request, initial courrier metadata, initial document metadata, or initial DG review metadata.
4. Backend `getAdminDossier` already has `dossier.requestId` through `sanitizeDossierSummary`, but it does not fetch or serialize the linked request/courrier/DG review.
5. Existing request orientation download exists: `downloadRequestOrientationDocument(requestId, documentId)` calls `GET /api/v1/admin/requests/:id/documents/:documentId`.
6. The existing backend route verifies only `DGReview.returnedScannedDocumentId`. It is safe for initial DG return, but it does not serve the initial courrier document.
7. Preliminary courriers can use existing OMA-OPS-4 `downloadDossierDocument(detail.dossier.id, documentId)` for `preEvaluationDgAnnotatedDocumentId` and optional `closureCourrierDocumentId`.
8. OMA-OPS-3D established that closure courrier is optional evidence only; missing closure courrier must render as optional/non-joint, not as an error.
9. ADMIN-ADJ-1/3 established that DN roles must not regain `/circuit-dg` access or DG circuit actions; this tab must stay read-only.

## Implementation details

1. Backend dossier detail serializer:
   - Added `buildDossierCourriers` in `oma-phase.service.ts`.
   - `getAdminDossier` now includes `courriers.initialCourrier` and `courriers.initialDgOrientation` when the dossier has a linked request.
   - Data sources are existing `RequestModel`, `CourrierModel`, `DGReviewModel`, and `DocumentModel` fields only.
   - No workflow mutation, upload, print, mark-in-circuit, Outlook, or email behavior was added.

2. Request-side download security:
   - Extended `downloadAdminRequestOrientationDocument` to allow the request's own initial courrier document in addition to the DG returned scan.
   - Allowed document IDs are strictly:
     - `Request.initialDocumentId`
     - linked `Courrier.documentId` for the same request
     - linked initial `DGReview.returnedScannedDocumentId`
   - The route guard remains `REQUEST_VIEW_ALL`.
   - Arbitrary request document IDs still return 403.

3. Frontend API/types:
   - Added `AdminDossierCourriers` and `AdminDossierDetail.courriers`.
   - `DossierDetailPage` now passes `detail` into `DossierCourriersTab`.

4. Frontend Courriers tab:
   - Replaced placeholder with a consultation-only tab.
   - Sections rendered:
     - `Demande initiale`
     - `Phase preliminaire`
     - `Phases suivantes`
   - Rows rendered:
     - `Courrier initial transmis`
     - `Retour DG orientation initiale`
     - `Retour DG pre-evaluation`
     - `Courrier de cloture phase I - optionnel`
   - Request-side rows download through `downloadRequestOrientationDocument`.
   - Preliminary rows download through `downloadDossierDocument`.
   - Missing closure courrier is shown as optional/non-joint and never as an error.

## Verification commands run

- `cd apps/api; npx tsc --noEmit` - PASS
- `cd apps/api; npm run build` - PASS
- `cd apps/admin; npx tsc --noEmit` - PASS
- `cd apps/admin; npm run build` - initial sandbox failure due Tailwind native Windows binary / `spawn EPERM`; rerun outside sandbox - PASS

## Manual checks pending

- Dossier detail loads.
- Courriers tab no longer shows placeholder.
- Initial courrier row appears.
- Initial DG orientation row appears if data exists.
- Pre-evaluation DG return row appears if data exists.
- Closure courrier is optional and missing state says non-joint/optionnel.
- Available courriers can be downloaded/consulted.
- DN users still cannot access `/circuit-dg`.
- No DG circuit, upload, Outlook, or email action appears in the tab.

## Known risks / TODOs

- Current source contains mojibake in several French strings; OMA-OPS-6 should avoid broad accent cleanup.
- Runtime validation requires seeded dossiers with request, DG return, preliminary return, and optional closure courrier variants.
- Chunk-size warning remains during admin production build.

## Next step

Runtime/manual validation with seeded dossier variants and invalid document-id attempts.
