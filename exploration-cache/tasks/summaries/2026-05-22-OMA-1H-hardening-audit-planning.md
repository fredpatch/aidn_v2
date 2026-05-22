# OMA-1H - Phase préliminaire hardening audit

Date: 2026-05-22
Phase: PLANNING / AUDIT (no code changed)
Status: **Complete**

## Objective

Audit the completed Phase préliminaire implementation and produce a prioritized hardening plan before implementing the next OMA phase.

## Cache files read

- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/04-backend/AUTH_AND_PERMISSIONS.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/dg-circuit/dg-circuit.service.ts`
- `apps/api/src/shared/permissions/permissions.ts`
- `apps/api/src/modules/admin/admin.routes.ts` (lines 440–607)
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/pages/DgCircuitPage.tsx`
- `apps/portal/src/pages/RequestDetailPage.tsx`

## Files changed

None - audit pass only.

## Key decisions / findings

### Critical gaps (H1)

1. `uploadClosureCourrier` service function exists but **no admin route is wired** and no UI in `DossierDetailPage.tsx`.
2. `pre_eval_dg_returned` status is a **dead status** - never set by backend. Exists in labels, UI branch, and model.
3. `SendToDgPanel` in `DossierDetailPage.tsx` uses **digital-send wording** ("Envoyer au DG") contradicting physical circuit language established in ROLE-UX-1A.
4. `returnsToRegister` count == `awaitingReturn` count - misleading counter in DG circuit workspace.
5. Portal `isSubmitted` banner persists after dossier is open and in preliminary phase.

### Reusable patterns identified

- `InviteMeetingForm` / `RecordMeetingForm` → reusable across all OMA phases with meetings
- `saveDocument` helper → extract to shared utility
- `STATUS → portal label` mapping pattern → template for all phases
- `PreliminaryActionPanel` per-status sub-component pattern → extract each step as its own component
- `DossierDnSection` portal component → extract from `RequestDetailPage.tsx`
- `ensureObjectId` / `toIso` / `toId` utils → move to `shared/utils/mongoose-helpers.ts`
- `sanitizePhase` / `sanitizeMeeting` → move to shared sanitizers
- `portalGuidance` map (new) → add alongside portal label map

### UX/wording

- "Circuit DG" → "Circuit officiel" throughout
- "Envoyer au DG" → "Marquer mis en circuit officiel"
- "Enregistrer le retour DG" → "Enregistrer le retour annoté"
- Portal "Dossier DN" → "Votre dossier de certification"
- Portal raw dossier status labels → simplified postulant labels
- French accent sweep (portal + admin): "reessayer", "premiere", "équipe", "réunion", "Pré-évaluation", etc.
- Contextual portal guidance per status (one sentence per state)

### Automation

- Auto-notify postulant: form available, meeting scheduled, report published, phase closed
- Auto-notify DN: form submitted
- Auto-notify DG circuit actors: form submitted (pre-eval DG circuit)
- All use existing `NotificationModel` - no new infrastructure

### Technical debt

- Type cast hack in `recordPreEvalDgReturn` for `preEvaluationDgAnnotatedDocumentId`
- Admin document download route tied to DG annotated return only
- DG circuit task list has no pagination
- `transmittedAt` for pre_evaluation uses `phase.updatedAt` as proxy

## Prioritized hardening roadmap

### H1 - Quick wins

1. Fix `SendToDgPanel` wording in `DossierDetailPage.tsx`
2. Wire `uploadClosureCourrier` route + UI
3. Remove `pre_eval_dg_returned` dead status
4. Fix `returnsToRegister` count logic
5. Rename "Circuit DG" → "Circuit officiel" in nav/title
6. Fix portal `isSubmitted` banner when dossier is active
7. French accent sweep (portal + admin)
8. Portal dossier status simplified labels
9. Graceful template-missing error in `publishPreEvaluationForm`
10. Portal section title: "Votre dossier de certification"

### H2 - Reusable components/services

- Extract `PreliminaryActionPanel` sub-components
- Shared `saveDocument` utility
- Generalize admin dossier document download
- Extract `DossierDnSection` portal component
- `portalGuidance` map alongside status labels
- Shared `mongoose-helpers.ts` utils

### H3 - Automation

- In-app notifications for 5 key events (form available, meeting scheduled, report published, form submitted, phase closed)
- Verify ADMIN-4 sets `preliminaryStatus=preliminary_started`

### H4 - Post-MVP

- DG circuit task list pagination
- Dedicated `sentToDgAt` timestamp
- `PRELIMINARY_MANAGE` permission
- Outlook integration
- Rate limiting on admin preliminary endpoints

## Verification commands run

None - audit pass only.

## Manual checks run

Code review only. No runtime validation in this pass.

## Known risks / TODOs

- `document-template.service.ts` not read in this pass - template management assumed working per SettingsPage.tsx context
- ADMIN-4 `requests.service.ts` OmaPhase init not audited - verify `preliminaryStatus` is set at dossier open

## Next step

Proceed with **H1 quick wins** implementation slice. Recommended first: wiring `uploadClosureCourrier` route + UI, then wording/accent fixes. Ask user to confirm priority order before starting.
