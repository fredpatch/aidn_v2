# OMA-1I - Phase préliminaire H1 hardening implementation

Date: 2026-05-22
Phase: IMPLEMENTATION
Status: **Complete - all builds PASS**

## Objective

Apply H1 quick-win fixes identified in OMA-1H audit:

- Wire `uploadClosureCourrier` backend route + admin UI
- Remove `pre_eval_dg_returned` dead status from reachable code
- Fix `SendToDgPanel` wording to physical circuit language
- Rename "Circuit DG" → "Circuit officiel" in UI + nav
- Fix `returnsToRegister` duplicate count
- Suppress stale portal submitted banner when dossier is active
- Portal section rename + simplified labels + guidance text per status
- Update template-missing error message to guide user to settings
- French accent sweep on all touched files

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- (full context from OMA-1H audit in same session)

## Source files inspected

- `apps/api/src/modules/document-templates/document-template.service.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/config/nav.tsx`
- `apps/api/src/modules/admin/admin.routes.ts` (imports + preliminary section)

## Files changed

**Backend:**

- `apps/api/src/modules/document-templates/document-template.service.ts` - updated 409→422 and improved message
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` - removed `pre_eval_dg_returned` from `PRELIMINARY_STATUS_PORTAL_LABELS` and `PRE_EVAL_VISIBLE_STATUSES`
- `apps/api/src/modules/dg-circuit/dg-circuit.service.ts` - removed duplicate `returnsToRegister` from counts
- `apps/api/src/modules/admin/admin.routes.ts` - added `uploadClosureCourrier` import + `POST /dossiers/:id/preliminary/upload-closure-courrier` route (DOCUMENT_UPLOAD_INTERNAL guard)

**Admin:**

- `apps/admin/src/lib/api/dossiers.api.ts` - added `uploadClosureCourrier` API function
- `apps/admin/src/config/nav.tsx` - "Circuit DG" → "Circuit officiel"
- `apps/admin/src/pages/DgCircuitPage.tsx` - renamed title, removed "Retours à enregistrer" KPI+tab, fixed `sourceLabels` accent, fixed icon on "Retour annoté" button, fixed accents throughout
- `apps/admin/src/pages/DossierDetailPage.tsx` - imported `uploadClosureCourrier`; added `UploadClosureCourrierForm` component; split `preliminary_meeting_held` / `preliminary_ready_to_close` states; removed dead `pre_eval_dg_returned` branch; fixed `SendToDgPanel` to physical circuit wording; removed raw `outlookEmailStatus` from `MeetingCard`; fixed accents throughout

**Portal:**

- `apps/portal/src/pages/RequestDetailPage.tsx` - replaced `dossierStatusLabels` with `portalStatusGuidance` map; removed raw status InfoBlock from dossier grid; renamed "Dossier DN" → "Votre dossier de certification"; added guidance text per `portalLabel`; suppressed stale submitted banner when `request.dossierId` is set; fixed page title accent ("Détail"); fixed validation error accents; fixed evidence labels

## Key decisions

- `pre_eval_dg_returned` kept in `PreliminaryStatus` TypeScript type (model enum may still hold it) but removed from all reachable label maps and UI render branches.
- `uploadClosureCourrier` is optional - `preliminary_meeting_held` shows both the upload form and the close button; `preliminary_ready_to_close` shows close button only.
- `returnsToRegister` removed from DG circuit service response; UI reduced to 3-column KPI grid.
- Stale banner suppressed only when `request.dossierId` is present (not on any isSubmitted state).
- Portal `pre_eval_form_available` guidance is handled by the download form below - not doubled in the status banner.

## Verification commands run

- `cd apps/api && npm run build` → **PASS**
- `cd apps/admin && npx tsc --noEmit` → **PASS**
- `cd apps/admin && npm run build` → **PASS**
- `cd apps/portal && npx tsc --noEmit` → **PASS**
- `cd apps/portal && npm run build` → **PASS**

## Manual checks run

Not run (no running server in this environment). Code review only.

## Known risks / TODOs

- Runtime validation of `uploadClosureCourrier` flow with a live dossier in `preliminary_meeting_held` state.
- `PreliminaryStatus` TypeScript type still includes `pre_eval_dg_returned` - if a future DB migration removes the enum value, update the type.
- `DgCircuitTaskCounts` type change: consuming code outside `DgCircuitPage.tsx` (if any) that referenced `returnsToRegister` would need updating; none found.
- Portal guidance for `pre_eval_form_available` is intentionally suppressed in the banner (form+upload below handles it) - revisit if the banner placement changes.

## Next step

H2 - Reusable component extraction (optional) or OMA Phase II implementation.
Recommended: proceed to next OMA phase (Phase 2 - Demande formelle). H2 extractions can happen alongside Phase 2 development.
