# OMA-1C - Portal UI wiring - Implementation

Date: 2026-05-21
Status: Complete - build PASS

## Objective

Wire the postulant portal UI to the already validated OMA-1A portal dossier endpoints.

## Files changed

| File                                                                    | Change                                                                                                                                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/portal/src/lib/api/portal.api.ts`                                 | Added `dossierId` to `PortalRequest`; added `PortalDossierPreliminary`, `PortalDossierDetail` types; added `getPortalDossier()` and `uploadPreEvaluationForm()` functions |
| `apps/portal/src/pages/RequestDetailPage.tsx`                           | Added `DossierDnSection` component; added dossier state + loadDossier; conditionally renders dossier section when `request.dossierId` is set                              |
| `exploration-cache/tasks/summaries/2026-05-21-OMA-1C-planning.md`       | Created                                                                                                                                                                   |
| `exploration-cache/tasks/summaries/2026-05-21-OMA-1C-implementation.md` | Created (this file)                                                                                                                                                       |
| `exploration-cache/tasks/current-task.md`                               | Updated                                                                                                                                                                   |

## Key decisions

- `DossierDnSection`: inline component, lazy-loaded only when `request.dossierId` is set
- Upload: `<input type="file" ref>` + `FormData` via `uploadPreEvaluationForm` (existing `portalPostForm` pattern)
- After upload success: `onRefresh()` → re-fetches portal dossier → `canSubmitForm` becomes false → form disappears
- `hasCompletedForm && !canSubmitForm` renders "Formulaire soumis" confirmation banner
- No `canSubmitForm` → no upload form rendered (safe guard against re-submission)
- `preEvaluationFormDocumentId` shown as text indicator only - no download link (no download endpoint)

## Build verification

```
npm run build (apps/portal)
✓ tsc -b: PASS
✓ vite build: PASS (586ms)
```

## Runtime validation

Not yet run.

## Deferred items

- Document download for pre-evaluation form (no backend endpoint)
- Phase II portal UI (out of scope)
- DG sub-circuit (out of scope)

## Next step

OMA-1C runtime validation:

- Log in as portal user (alex@gmail.com / password)
- Navigate to request detail for the request linked to dossier `6a0ec71171fe95bfc9352ac4`
- Confirm Dossier DN section appears
- If dossier is at `pre_eval_form_available`: upload a PDF and confirm status updates
