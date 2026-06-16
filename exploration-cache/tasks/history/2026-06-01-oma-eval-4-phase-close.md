# OMA-EVAL-4 — Backend Phase 3 Close + Unlock Phase 4 History

Date: 2026-06-01
Status: Complete — API typecheck PASS, build PASS

## Summary

Implemented Phase 3 close: `closeDocumentEvaluationPhase` service function with server-side DB aggregate guard; Phase 4 inspection OmaPhase creation; dossier.status=inspection_phase; postulant notification; audit event. Admin route POST /close [PHASE_CLOSE].

## Files changed

- MOD: `apps/api/src/modules/oma-phases/document-evaluation.service.ts`
- MOD: `apps/api/src/modules/admin/admin.routes.ts`

## Next: OMA-EVAL-5 (admin Phase 3 workspace UI)
