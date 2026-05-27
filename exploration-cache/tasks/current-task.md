# Current Task

## Phase: OMA-FORMAL-12 — Replace Phase 2 Closure Courrier Requirement with DN Closure Decision

Date: 2026-05-27
Status: **Complete — API typecheck PASS, API build PASS, Admin typecheck PASS, Admin build PASS**

## Summary files

- Implementation: `exploration-cache/tasks/summaries/2026-05-27-oma-formal-12-phase-2-closure-decision.md`

## Files modified

- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`

## Phase 2 closure flow (final)

1. Meeting planned → "Joindre le compte rendu de réunion formelle"
2. Compte rendu uploaded → meeting held, formalRequestStatus = formal_meeting_held
3. canClosePhase becomes true (gate + DG evidence + meeting held + report uploaded)
4. "Clôturer la Phase 2" button appears
5. Dialog shows document completeness summary
6. If complete → "Clôturer la Phase 2"
7. If partial → amber warning + optional comment + "Clôturer avec réserves"
8. On close: Phase 2 closed, dossier = document_evaluation_phase, Phase 3 started

## Next step

Manual browser validation, or proceed to Phase 3 (document evaluation) admin workspace implementation.
