# Demande To Dossier

## Current implementation
- Demandes, courriers, and dossiers are distinct entities.
- Dossier references demande via demandeId.
- Route /dossiers lists dossiers; /dossiers/:id shows detailed workspace.

## Files involved
- apps/admin/src/features/aidn/mocks/aidn.mock.ts
- apps/admin/src/features/aidn/types/aidn.types.ts
- apps/admin/src/pages/DemandesPage.tsx
- apps/admin/src/pages/CourriersPage.tsx
- apps/admin/src/pages/DossiersPage.tsx

## Statuses observed
- demande internal: in_dg_circuit, dg_instruction_recorded, ready_for_dn_dossier, dn_dossier_opened
- demande portal: administrative_review, dossier_in_progress

## User-facing labels
- Dossier en cours de traitement
- En cours d'examen administratif

## Demo actions / state transitions
- No direct "open dossier" button in current UI flow; dossier existence is seed/state driven.

## Known gaps
- Backend models now represent the explicit separation between initial request, DG review, and DN dossier.
- No explicit backend transaction for DG orientation -> dossier creation has been implemented yet.

## Safe next improvements
- Add explicit transition event record for dossier opening from demande/courrier context.
- Add a service method that atomically records favorable DG orientation, opens a dossier, starts preliminary phase, and writes an audit log.
