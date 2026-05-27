# OMA-FORMAL-9B2 — Phase 2 Workflow Cleanup + Official Circuit Consistency

Date: 2026-05-27
Status: Complete

## Objective

Clean and harden Phase 2 workflow display and Courriers officiels behavior. Four targeted fixes.

## Cache files read

- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1-courriers-officiels-demande-formelle.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/modules/dg-circuit/dg-circuit.service.ts`
- `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts`

## Files changed

| File | Change |
|------|--------|
| `apps/api/src/modules/oma-phases/formal-request.service.ts` | Fix 1: add `phase.status = "in_progress"` after DG return scan |
| `apps/api/src/modules/dg-circuit/dg-circuit.service.ts` | Fix 2: add CourrierModel import, batch-load Courriers, add `download_outgoing` to to_transmit, set documentToTransmitId, add `formal_request` branch in downloadDgCircuitTaskDocument |
| `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx` | Fix 1+3+4: nextActionLabel rewrite, "Circuit DG" → "Circuit officiel", compact document section |

## Fix 1 — Phase status after DG return scan

### Root cause
`recordFormalRequestDgReturn` set `formalRequestStatus = "formal_dg_returned"` but did NOT update
`phase.status` (stayed `"waiting_dg"` from send-to-dg). PhaseStatusBadge showed "Attente DG".
Also, `nextActionLabel` had a generic fallback instead of "Décision DG à enregistrer".

### Backend fix (formal-request.service.ts)
```typescript
phase.formalRequestStatus = "formal_dg_returned" as never;
phase.status = "in_progress" as never;   // ← added
phase.formalDgReturnedAt = returnedAt;
await phase.save();
```

### Frontend fix (FormalRequestPhaseWorkspace.tsx — nextActionLabel)
| State | Label |
|-------|-------|
| gate missing | "En attente du dépôt de la demande formelle par le postulant." |
| gate exists, not sent | "Demande formelle reçue. Circuit DG à traiter depuis Courriers officiels." |
| sent, no return | "Demande formelle en circuit officiel. En attente du retour DG." |
| returned, no decision | "Retour DG reçu. Décision DG à enregistrer." (was: "Consultez l'état de la phase...") |
| decision recorded | "Décision DG enregistrée. Réunion formelle à programmer." |

## Fix 2 — download_outgoing for formal_request in Courriers officiels

### Changes in dg-circuit.service.ts
1. Added `CourrierModel` import
2. Batch-loaded Courriers alongside Dossiers and DGReviews: `CourrierModel.find({ _id: { $in: formalCourrierIds } }).select("_id documentId")`
3. Built `formalCourrierById` map
4. For `to_transmit` formal_request items: add `"download_outgoing"` action if `courrier.documentId` exists
5. Set `documentToTransmitId` from courrier's documentId (was `undefined`)
6. Added `formal_request` branch in `downloadDgCircuitTaskDocument`:
   - Resolves `phase.formalRequestCourrierId` → CourrierModel → `documentId`
   - Resolves `phase.formalRequestDgReviewId` → DGReviewModel → `returnedScannedDocumentId`
   - Permission: `DG_CIRCUIT_HANDLE` for both outgoing and annotated return
   - Throws 403 if document doesn't match either known ID

## Fix 3 — "Circuit officiel" wording

In `FormalRequestPhaseWorkspace.tsx`:
- `<Field label="Circuit DG">` → `<Field label="Circuit officiel">`
- WorkflowSection `title="Circuit DG"` → `title="Circuit officiel"`
- Note text: "Le circuit officiel est traité depuis l'espace Courriers officiels."
- Step label "Mis en circuit DG" → "Mis en circuit DG/parapheur" (kept specific per prompt)

## Fix 4 — Compact document checklist

Removed full 14-row `RequirementRow` list. New compact section shows:
- Summary line: `N pièces suivies · X déposées · Y validées [· Z corrections]`
- Sub-note: "Suivi documentaire uniquement, sans blocage automatique du circuit officiel."
- Gate requirement row: label + LevelBadge + StatusBadge
- Corrections demandées list (filtered from requirements) or "Aucune correction demandée pour le moment."
- Hint: "Consulter le détail dans l'onglet Documents."

### Derived variables added to component body
```typescript
const correctionsCount = state.requirements.filter(r => r.status === "requires_correction").length;
const gateRequirement = state.requirements.find(r => r.requirementLevel === "gate");
const correctionRequirements = state.requirements.filter(
  r => r.status === "requires_correction" && r.requirementLevel !== "gate"
);
```

### Removed from FormalRequestPhaseWorkspace.tsx
- `AdminFormalRequestRequirement` import (was only in RequirementRow param type)
- `AdminFormalRequestSubmission` import (was only in latestActiveSubmission return type)
- `latestActiveSubmission` function (only used in RequirementRow)
- `RequirementRow` function (replaced by compact inline JSX)

## Verification results

```
cd apps/api
npm run typecheck  → PASS (no output)
npm run build      → PASS

cd apps/admin
npx tsc --noEmit   → PASS (no errors)
npm run build      → PASS (3949 modules, chunk size warning pre-existing)
```

## Manual checks

Not run; no live admin/API browser session in this pass.

## Known risks / TODOs

- `download_outgoing` in `awaiting_return` / `returned_scanned` buckets for formal_request not added (not in scope; to_transmit only per prompt)
- The `PhaseStatusBadge` for `status="in_progress"` will show "En cours" generically — acceptable; specific guidance is in nextActionLabel
- Documents tab full checklist rendering remains a future task

## Next step

OMA-FORMAL-9C or next product roadmap slice.
