# Current Task

## Phase: OMA-FORMAL-9B1 — Add Phase 2 Demande Formelle to Courriers Officiels

Date: 2026-05-27
Status: **Complete — Admin typecheck PASS, Admin build PASS**

## Summary files

- Implementation: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1-courriers-officiels-demande-formelle.md`

## Files modified

- `apps/api/src/modules/dg-circuit/dg-circuit.service.ts`
  - Added `'formal_request'` to `TaskSource` union type
  - Added `Permissions.DG_DECISION_RECORD` to `DG_TASK_PERMISSIONS`
  - Added full `formal_request` section in `listDgCircuitTasks`: queries `OmaPhaseModel` where `phaseKey="formal_request"` and `formalRequestCourrierId` exists; parallel lookup of `DossierModel` and `DGReviewModel`; bucket/action mapping
- `apps/admin/src/lib/api/dg-circuit.api.ts`
  - Added `'formal_request'` to `DgCircuitSource` type
  - Added `'record_dg_decision'` to `DgCircuitAction` type
- `apps/admin/src/pages/DgCircuitPage.tsx`
  - Added imports: `recordFormalRequestDgReturn`, `sendFormalRequestToDg`, `sendPreEvalToDg`, `recordPreEvalDgReturn` from dossiers.api; `RecordFormalDgDecisionDialog` from formal-request-dialogs
  - Added `{ kind: "formal-dg-decision"; task: DgCircuitTask }` to `ModalState`
  - Added `formal_request: "Demande formelle"` to `sourceLabels`
  - Added `formal_request` branch in `markTransmitted`: `await sendFormalRequestToDg(task.dossierId)`
  - Added `formal_request` branch in `submitReturn`: `await recordFormalRequestDgReturn(task.dossierId, formData)`
  - Added `submitDecision` handler: `setModal({ kind: "formal-dg-decision", task })`
  - Added "Enregistrer la décision DG" button in `returned_scanned` detail panel (gated by `source === "formal_request"` and `availableActions.includes("record_dg_decision")`)
  - Added `RecordFormalDgDecisionDialog` render at bottom for `modal?.kind === "formal-dg-decision"`

## Files NOT modified

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx` — remains read-only
- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx` — reused as-is (RecordFormalDgDecisionDialog)
- Portal: no changes
- Backend business rules: no changes

## Implementation details

- Formal request items source: OmaPhaseModel (phaseKey="formal_request" + formalRequestCourrierId exists) — task ID: `formal_request:<phaseId>`
- Status/bucket mapping:
  - No formalRequestDgReviewId → `to_transmit` (mark_transmitted for DG_CIRCUIT_HANDLE)
  - DGReview awaiting_return → `awaiting_return` (record_annotated_return for DG_CIRCUIT_HANDLE)
  - DGReview returned_scanned → `returned_scanned` (download_annotated_return + record_dg_decision for DG_DECISION_RECORD)
  - DGReview decision_recorded → `decision_recorded` (download_annotated_return for DG_CIRCUIT_HANDLE)
- DG_DECISION_RECORD added to DG_TASK_PERMISSIONS so DN roles can access Courriers officiels for decision recording
- `download_outgoing` for formal_request deferred (would require backend extension)
- DgReturnDialog already handles `formal_request` source (uses `file` field, not `returnedScannedDocument`)

## Verification completed

```bash
cd apps/admin
npx tsc --noEmit  # PASS
npm run build     # PASS (chunk size warning pre-existing)
```

## Manual checks

Not run; no live admin/API browser session in this pass.

## Known risks / TODOs

- `download_outgoing` for formal_request not wired — backend `downloadDgCircuitTaskDocument` doesn't resolve formal_request source documents yet
- DG_DECISION_RECORD added to DG_TASK_PERMISSIONS allows DN users to see Courriers officiels list; confirm with product owner
- Runtime validation needs a live Phase 2 dossier with portal-uploaded courrier

## Next step

OMA-FORMAL-9C or next product slice as defined in roadmap.
