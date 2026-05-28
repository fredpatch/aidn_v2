# OMA-FORMAL-9B0 - Phase 2 Actor Responsibility Fix

Date: 2026-05-27
Status: **Complete - Admin typecheck PASS, Admin build PASS**

## Objective

Correct Phase 2 admin workspace: remove misplaced action buttons for courrier formel, DG circuit, DG return scan, and DG decision. Make the workspace read/progression-oriented. Actor ownership:

- Portal → postulant uploads formal request
- Courriers officiels → physical DG circuit, scan return, record decision
- Dossier DN workspace → reflects state, DN acts after DG decision (réunion formelle)

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1b-admin-physical-dg-circuit-actions-implementation.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`

## Files changed

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx` - complete rewrite of Phase 2 workspace

## Files NOT changed

- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx` - kept for future Courriers officiels integration
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx` - props interface unchanged, no update needed
- Backend: no changes
- Portal: no changes

## Key decisions

1. **Dialog files preserved** - `formal-request-dialogs.tsx` still exports all 4 dialogs but they are no longer rendered from `FormalRequestPhaseWorkspace`. Kept for future Courriers officiels integration.
2. **Props interface unchanged** - `onRefreshPhase` and `onStateChange` remain declared in props (prefixed `_` to satisfy lint) so `DossierPhasesTab` needs no change.
3. **StepLine "Non mis en circuit"** - renamed from "Pas encore en circuit" per spec.
4. **Helper text** - "Le circuit DG est traité depuis l'espace Courriers officiels." added to Circuit DG section.

## UI wording removed/downgraded

- ❌ Removed: `Scanner / enregistrer un courrier reçu hors portail` button
- ❌ Removed: `Mettre en circuit DG` button
- ❌ Removed: `Enregistrer le retour DG scanné` button
- ❌ Removed: `Enregistrer la décision DG` button
- ❌ Removed: dialog renders at bottom of workspace
- ❌ Removed: `useContext(AuthContext)`, `hasPermission()` calls
- ❌ Removed: permission variables `canUploadInternalDocument`, `canHandleDgCircuit`, `canRecordDgDecision`
- ❌ Removed: `openDialog` state and `setOpenDialog`

## UI wording added/updated

### Courrier formel section

- Missing → `WaitingState`: "En attente du dépôt de la demande formelle par le postulant."
- Missing → `Note`: "Le postulant doit téléverser la demande formelle depuis son portail. Si le courrier est reçu physiquement, il devra être traité depuis le circuit des courriers officiels."
- Exists + portal_upload → green text: "Demande formelle reçue via le portail."
- Source label "Téléversé par le postulant" displayed from `sourceLabels.portal_upload` (pre-existing)
- Physical/internal → source shown in DefinitionGrid (no action)

### Circuit DG section

- Step label: "Non mis en circuit" (was "Pas encore en circuit")
- `Note`: "Le circuit DG est traité depuis l'espace Courriers officiels."
- No action buttons

### Final status card (nextActionLabel)

| Condition                | Message                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| !gate.exists             | En attente du dépôt de la demande formelle par le postulant.                                       |
| gate.exists && !sentToDg | Demande formelle reçue. Le traitement du circuit DG doit être effectué depuis Courriers officiels. |
| sentToDg && !dgReturned  | Demande formelle en circuit DG/parapheur. En attente du retour scanné.                             |
| dgDecisionRecorded       | Retour DG enregistré. DN peut maintenant programmer la réunion formelle.                           |
| otherwise                | Consultez l'état de la phase pour déterminer la prochaine action.                                  |

## Phase 2 progression behavior

Unchanged: `FormalRequestPhaseChecklist` (7 steps) and `formal-request-progress.helpers.ts` remain as-is. Progress card in `DossierPhasesTab` left panel still reflects backend state.

## Actor responsibility preserved

| Actor                  | Owns                                                        |
| ---------------------- | ----------------------------------------------------------- |
| Postulant (portal)     | Upload demande formelle                                     |
| Courriers officiels    | Print, physical DG circuit, scan return, record DG decision |
| DN workspace (dossier) | Read state, réunion formelle scheduling (after DG decision) |

## Verification commands run

```bash
cd apps/admin
npx tsc --noEmit  # PASS
npm run build     # PASS
```

## Known risks / TODOs

- `formal-request-dialogs.tsx` is now orphaned (no imports). When Courriers officiels workspace is built, these dialogs will be wired there.
- `onRefreshPhase` and `onStateChange` props are declared but unused (prefixed `_`). Remove when Courriers officiels takes over mutation.
- Runtime validation still needs a live Phase 2 dossier.

## Next step

Courriers officiels workspace integration - wire the 4 dialogs from `formal-request-dialogs.tsx` into the `DgCircuitPage` or dedicated Courriers officiels page.
