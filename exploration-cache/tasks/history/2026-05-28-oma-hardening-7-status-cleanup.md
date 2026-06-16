# OMA-HARDENING-7 - Status Cleanup History

Date: 2026-05-28
Status: Complete - API PASS, Admin PASS

## Completed work

- Removed `formal_documents_tracking` from active Phase 2 logic and normal admin type/UI surfaces.
- Left `formal_documents_tracking` in `OmaPhase.formalRequestStatus` enum for database compatibility.
- Removed `rejected` from the Phase 2 formal request review service allowlist and admin route validation.
- Kept global `DocumentSubmission.status = rejected` and defensive admin/portal display handling.

## Verification

- `cd apps/api; npx tsc --noEmit` - PASS
- `cd apps/api; npm run build` - PASS
- `cd apps/admin; npx tsc --noEmit` - PASS
- `cd apps/admin; npm run build` - PASS after outside-sandbox rerun

## Manual checks

- Not run. Recommended runtime checks:
  - formal request review route rejects `status=rejected`;
  - validation, correction, and incomplete review statuses still work;
  - admin review UI still has no reject action;
  - Phase 2 closure gates remain unchanged.

## Follow-up

- If production data contains `formal_documents_tracking`, decide later whether to migrate it to the nearest current status before removing DB enum compatibility.
