# OMA-HARDENING-6 - Notifications History

Date: 2026-05-28
Status: Complete - API PASS

## Completed work

- Added Phase 1 in-app notifications in `oma-phase.service.ts` for first meeting scheduling, pre-evaluation form availability, preliminary meeting scheduling, and preliminary phase closure.
- Added/aligned Phase 2 in-app notifications in `formal-request.service.ts` for formal request receipt, formal meeting scheduling, `requires_correction`, `incomplete`, and formal request phase closure.
- Used `dossier.postulantUserId` as the portal recipient and skipped notification creation when no postulant owner exists.
- Kept notification creation backend-only and did not change workflow transitions, document review rules, closure rules, or portal UI.

## Verification

- `cd apps/api; npx tsc --noEmit` - PASS
- `cd apps/api; npm run build` - PASS

## Manual checks

- Not run. Required runtime checks:
  - schedule Phase 1 first meeting and confirm portal notification;
  - publish pre-evaluation form and confirm portal notification;
  - schedule preliminary meeting and confirm portal notification;
  - close Phase 1 and confirm portal notification;
  - register/upload formal request and confirm portal notification;
  - schedule formal meeting and confirm portal notification;
  - mark `oma_approval_form` requires correction and confirm portal notification;
  - mark `oma_approval_form` incomplete and confirm portal notification;
  - close Phase 2 and confirm portal notification.

## Follow-up

- Consider focused backend notification tests if this area receives another hardening pass.
