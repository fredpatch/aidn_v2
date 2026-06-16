# OMA-1D - Phase préliminaire correction - Implementation

Date: 2026-05-21
Status: Complete - all 3 builds PASS

## Objective

Fix 5 workflow gaps in the Phase préliminaire circuit.

## Files changed

| File                                                   | Change                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/oma-phases/oma-phase.model.ts`   | +`preEvaluationDgAnnotatedDocumentId` field                                                                                                                                                                                                                                                                                                          |
| `apps/api/src/shared/storage/storage.adapter.ts`       | +`getBuffer()` to interface + implementation                                                                                                                                                                                                                                                                                                         |
| `apps/api/src/modules/oma-phases/oma-phase.service.ts` | Export `PRELIMINARY_STATUS_PORTAL_LABELS`; add `sendPreEvalToDg`, `recordPreEvalDgReturn`, `recordPreEvalDgDecision`, `downloadPortalDossierDocument`; fix `invitePreliminaryMeeting` guard → `pre_eval_dg_decision_recorded`; add `visibleToPostulant` param to `recordFirstMeeting`; update `getPortalDossier` with meeting details + visible docs |
| `apps/api/src/modules/admin/admin.routes.ts`           | +3 DG circuit routes; update `record-first-meeting` to parse `visibleToPostulant`                                                                                                                                                                                                                                                                    |
| `apps/api/src/modules/portal/portal.routes.ts`         | +`GET /dossiers/:id/documents/:documentId` download endpoint                                                                                                                                                                                                                                                                                         |
| `apps/api/src/modules/requests/request.service.ts`     | Import `PRELIMINARY_STATUS_PORTAL_LABELS`; enrich `listPortalRequests` with dossier phase labels via batch OmaPhase query                                                                                                                                                                                                                            |
| `apps/admin/src/lib/api/dossiers.api.ts`               | +`sendPreEvalToDg`, `recordPreEvalDgReturn`, `recordPreEvalDgDecision` functions                                                                                                                                                                                                                                                                     |
| `apps/admin/src/pages/DossierDetailPage.tsx`           | +`SendToDgPanel`, `RecordDgReturnForm`, `RecordDgDecisionForm` components; replace old `pre_eval_form_submitted` panel; add 3 DG states + `pre_eval_dg_decision_recorded` → invite meeting; add `visibleToPostulant` checkbox to `RecordMeetingForm`                                                                                                 |
| `apps/portal/src/lib/api/portal.api.ts`                | Add `PortalDossierMeeting` type; update `PortalDossierPreliminary` with meeting fields + `firstMeetingReportDocumentId`; add `downloadPortalDossierDocument()`                                                                                                                                                                                       |
| `apps/portal/src/lib/api/http.ts`                      | +`portalGetBlob()` function                                                                                                                                                                                                                                                                                                                          |
| `apps/portal/src/pages/RequestDetailPage.tsx`          | Add `MeetingBlock` component; add download button logic; show meeting cards + document download buttons                                                                                                                                                                                                                                              |
| `apps/portal/src/pages/MyRequestsPage.tsx`             | Pass `label={request.portalStatusLabel}` to `RequestStatusBadge`                                                                                                                                                                                                                                                                                     |

## Key decisions

- `preEvaluationDgAnnotatedDocumentId`: new field added to phase schema; cast via `(phase as unknown as Record<string, unknown>)` in service since TypeScript inferred type doesn't include it yet (auto-propagates at runtime)
- `PRELIMINARY_STATUS_PORTAL_LABELS` exported from `oma-phase.service.ts` and imported into `request.service.ts` for the list enrichment
- `listPortalRequests`: batch-fetches OmaPhase for all `dossierId`-linked requests in one query, then post-processes the sanitized array to override `portalStatusLabel`
- `downloadPortalDossierDocument`: validates ownership + visibility === `postulant_visible` + ownerId is phase or one of its meetings
- `portalGetBlob`: separate function in `http.ts` that returns `Response.blob()` for binary downloads
- First meeting report visibility: controlled by `visibleToPostulant` checkbox in admin UI; defaults `false` (internal_only)

## Build verification

```
apps/api   - tsc -p tsconfig.json: PASS
apps/admin - tsc + vite build: PASS
apps/portal - tsc -b + vite build: PASS
```

## Runtime validation

Not yet run.

## Acceptance checklist (from prompt.md)

- [ ] Portal shows scheduled meeting details
- [ ] Portal shows blank pre-evaluation form as downloadable
- [ ] Portal shows first meeting report if marked visible to postulant
- [ ] Portal status reflects preliminary state (via dossier label)
- [ ] Completed form upload → waiting DG step (admin must use sendPreEvalToDg)
- [ ] Admin has DG circuit actions (send to DG, record return, record decision)
- [ ] Admin cannot invite preliminary meeting before DG decision
- [ ] DG returned document uploadable via recordPreEvalDgReturn
- [ ] After DG decision, admin can invite preliminary meeting
- [ ] No Phase II work added
- [x] Build passes (all 3 apps)
- [x] Summary file exists

## Next step

OMA-1D runtime validation:

- Log in as admin (admin@aidn.local)
- Navigate to a dossier at `pre_eval_form_submitted` and test the DG circuit flow
- Log in as portal user (alex@gmail.com) and verify meeting details + download links
