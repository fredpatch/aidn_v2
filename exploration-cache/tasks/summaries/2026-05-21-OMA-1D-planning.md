# OMA-1D - Phase préliminaire correction - Planning

Date: 2026-05-21
Status: Approved - implementation completed

## Objective

Fix Phase préliminaire workflow gaps found after OMA-1C runtime/UI review.

## Problems identified

| #   | Problem                                   | Root cause                                                                                   |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | Portal missing meeting details            | `getPortalDossier` never loaded meetings                                                     |
| 2   | Portal status too generic on request list | `listPortalRequests` didn't hydrate dossier label                                            |
| 3   | No downloadable documents                 | No portal download endpoint; `getReadUrl` is placeholder                                     |
| 4   | Admin missing DG sub-circuit              | No `sendPreEvalToDg` / `recordPreEvalDgReturn` / `recordPreEvalDgDecision` service functions |
| 5   | Wrong guard on `invitePreliminaryMeeting` | Checked `pre_eval_form_submitted` instead of `pre_eval_dg_decision_recorded`                 |

## Files planned for change

- `oma-phase.model.ts` - add `preEvaluationDgAnnotatedDocumentId`
- `storage.adapter.ts` - add `getBuffer()`
- `oma-phase.service.ts` - 3 DG functions, fix guard, update `recordFirstMeeting`, update `getPortalDossier`, add download function, export label map
- `admin.routes.ts` - 3 new DG routes, update `record-first-meeting`
- `portal.routes.ts` - document download endpoint
- `request.service.ts` - enrich `listPortalRequests` with dossier portal labels
- `dossiers.api.ts` - 3 DG API functions
- `DossierDetailPage.tsx` - 3 DG states in PreliminaryActionPanel, `visibleToPostulant` checkbox
- `portal.api.ts` - updated types, `downloadPortalDossierDocument`
- `http.ts` - `portalGetBlob`
- `RequestDetailPage.tsx` - meeting cards, document download buttons
- `MyRequestsPage.tsx` - pass `portalStatusLabel`
