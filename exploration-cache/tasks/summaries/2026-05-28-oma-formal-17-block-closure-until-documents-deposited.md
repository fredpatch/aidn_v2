# OMA-FORMAL-17 — Block Phase 2 closure until all required documents deposited

Date: 2026-05-28
Status: Complete

## Objective

After PO clarification: Phase 2 must not close until all required/expected postulant documents are deposited AND `oma_approval_form` (DN-AIR-R2-3-F-E-010) is validated by DN. Previous behavior allowed "clôture avec réserves" when documents were missing.

## Changes

### Backend (`apps/api/src/modules/oma-phases/formal-request.service.ts`)

**a) `ACTIVE_SUBMISSION_STATUSES` — add `"incomplete"`**
Fixes: `computeRequirementStatus` was returning `"missing"` for requirements with an `incomplete` submission. Now returns `"incomplete"` correctly.

**b) `ACTIVE_SUBMISSION_STATUS_SET` — add `"incomplete"` + re-upload condition**
Fixes: postulant re-upload for `incomplete` requirements now correctly treats the old submission as a replacement (same pattern as `requires_correction`).

**c) Move `requirementList` build before `canClosePhase`**
Structural refactor so `canClosePhase` can use the already-computed requirement statuses instead of needing a separate query.

**d) Extended `canClosePhase`**
New conditions added:
- `allRequiredDeposited`: every non-gate, non-optional requirement has at least one active submission (status ≠ `"missing"`)
- `omaFormValidated`: `oma_approval_form` requirement status === `"validated"`

**e) New guards in `closeFormalRequestPhase`**
After the meeting report check, re-queries requirements and submissions for the dossier:
- If any non-gate required/expected requirement has no active submission → 409 "Toutes les pièces requises..."
- If `oma_approval_form` is not validated → 409 "Le formulaire DN-AIR-R2-3-F-E-010 doit être validé avant la clôture."

### Frontend (`apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`)

**`CloseFormalRequestPhaseDialog`**:
- Removed `comment` state variable
- Removed `completeness` computed variable
- Replaced amber "clôture avec réserves" warning with destructive blocking message
- Removed comment textarea for partial closure
- Disabled close button when `!isComplete`
- Button always says "Clôturer la Phase 2" (no "Clôturer avec réserves" variant)
- `closeFormalRequestPhase` call now only passes `notes` (removed `completeness`/`comment`)

### Frontend (`apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`)

**`nextActionContent` else branch**:
When meeting report is uploaded but `canClosePhase` is still false (due to documents), shows:
- Destructive text: "Les pièces de demande formelle doivent être complétées avant clôture."
- "Voir les documents" button → `onNavigateToTab("documents")`

## Invariants preserved

- Portal upload checklist unchanged
- Template download behavior unchanged
- Phase 1 unchanged
- DG circuit behavior unchanged
- Formal meeting behavior unchanged
- Consultation-only review guard unchanged (backend still blocks review of non-`oma_approval_form`)
- Phase 3 unlock still happens on valid closure
- `completeness`/`comment` fields kept optional in backend payload (backward-compat, ignored in logic)

## Verification

- `npx tsc --noEmit` passes in both `apps/api` and `apps/admin`
