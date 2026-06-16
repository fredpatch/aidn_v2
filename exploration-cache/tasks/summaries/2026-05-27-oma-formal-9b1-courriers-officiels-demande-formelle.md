# OMA-FORMAL-9B1 - Courriers Officiels: Demande Formelle Integration

Date: 2026-05-27
Status: Complete

## Objective

Add Phase 2 Demande formelle items to the existing Courriers officiels / DG circuit workspace. Wire physical circuit, DG return scan, and DG decision actions for formal_request source items.

## Cache files read

- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`

## Source files inspected

- `apps/admin/src/pages/DgCircuitPage.tsx`
- `apps/admin/src/lib/api/dg-circuit.api.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
- `apps/api/src/modules/dg-circuit/dg-circuit.service.ts`
- `apps/api/src/shared/permissions/permissions.ts`

## Files changed

| File                                                    | Change                                                                                                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/dg-circuit/dg-circuit.service.ts` | Added formal_request source, DG_DECISION_RECORD permission, OmaPhase query + bucket mapping                                                    |
| `apps/admin/src/lib/api/dg-circuit.api.ts`              | Added formal_request to DgCircuitSource; record_dg_decision to DgCircuitAction                                                                 |
| `apps/admin/src/pages/DgCircuitPage.tsx`                | Imports, ModalState, sourceLabels, markTransmitted/submitReturn branches, submitDecision, decision button, RecordFormalDgDecisionDialog render |

## Key decisions

1. **Backend gap filled**: `listDgCircuitTasks` had no formal_request section. Extended service to query OmaPhaseModel. Scope allowed this ("unless a confirmed API client function is missing").
2. **DG_DECISION_RECORD in DG_TASK_PERMISSIONS**: DN roles hold DG_DECISION_RECORD; DG circuit roles hold DG_CIRCUIT_HANDLE. Added DG_DECISION_RECORD to allow DN users to access Courriers officiels list for decision recording only. This is a permission view extension, not a business rule change.
3. **RecordFormalDgDecisionDialog reuse**: Dialog from `formal-request-dialogs.tsx` handles decision API call internally; DgCircuitPage uses `onSuccess={() => void load()}` for list refresh.
4. **download_outgoing deferred**: Would need backend extension to resolve formal_request document IDs. Not in this slice.
5. **DgReturnDialog shared**: Existing dialog already routes `file` field for non-initial_request sources; formal_request uses it correctly.

## Formal request item source

- Endpoint: `GET /api/v1/admin/dg-circuit/tasks` (extended)
- ORM query: `OmaPhaseModel.find({ phaseKey: "formal_request", formalRequestCourrierId: { $exists: true } })`
- Task ID format: `formal_request:<phaseId>`

## Status mapping

| Condition                  | Bucket              | Actions                                                             |
| -------------------------- | ------------------- | ------------------------------------------------------------------- |
| No formalRequestDgReviewId | `to_transmit`       | mark_transmitted (DG_CIRCUIT_HANDLE)                                |
| DGReview awaiting_return   | `awaiting_return`   | record_annotated_return (DG_CIRCUIT_HANDLE)                         |
| DGReview returned_scanned  | `returned_scanned`  | download_annotated_return + record_dg_decision (DG_DECISION_RECORD) |
| DGReview decision_recorded | `decision_recorded` | download_annotated_return (DG_CIRCUIT_HANDLE)                       |

## Filters/counters

- Existing bucket tabs and KPI counters include formal_request items automatically (they are included in the same `items` array and `counts` computed from all items)
- No new sidebar entries added

## Actions wired

- **Mettre en circuit DG**: `POST /api/v1/admin/dossiers/:id/phases/formal-request/send-to-dg`
- **Enregistrer le retour DG scanné**: `POST /api/v1/admin/dossiers/:id/phases/formal-request/dg-return` (multipart `file`)
- **Enregistrer la décision DG**: `POST /api/v1/admin/dossiers/:id/phases/formal-request/dg-decision` (via RecordFormalDgDecisionDialog)

## Business rules preserved

- Portal owns formal request upload (portal_upload source)
- Courriers officiels owns print/physical circuit/return/decision
- DN workspace remains read-only (FormalRequestPhaseWorkspace unchanged)
- No backend business rule changes
- No portal UI changes

## What was deferred

- `download_outgoing` for formal_request (backend extension needed)
- `Scanner / enregistrer un courrier reçu hors portail` fallback in Courriers officiels (available in FormalRequestPhaseWorkspace for DN via RegisterFormalCourrierDialog; Courriers officiels version deferred)

## Verification results

```
cd apps/admin
npx tsc --noEmit  → PASS (no errors)
npm run build     → PASS (3949 modules, chunk size warning pre-existing)
```

## Next step

OMA-FORMAL-9C or next product roadmap slice.
