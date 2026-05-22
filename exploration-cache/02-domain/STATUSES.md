# Statuses

Last reviewed: 2026-05-21
Source: apps/admin/src/features/aidn/types/aidn.enums.ts and components/AidnStatusBadge.tsx

## Internal statuses
- demande internal: draft, submitted, initial_mail_received, in_dg_circuit, dg_return_received, dg_instruction_recorded, ready_for_dn_dossier, dn_dossier_opened, rejected, closed. `redirected` remains legacy/deferred compatibility only and is not exposed as a normal MVP workflow path.
- dossier: open, in_progress, waiting_postulant, late, certificate_ready, closed
- OMA phase: not_started, in_progress, blocked, late, completed
- document: missing, received, to_review, validated, rejected
- evidence: expected, received, scanned, pending_review, validated, missing, not_applicable
- certificate lifecycle: to_prepare, printed, signed_stamped, scanned_in_aidn, ready_for_collection, collected, archived

## External (postulant-facing) statuses
- request_received
- administrative_review
- action_required
- meeting_to_schedule
- meeting_scheduled
- dossier_in_progress
- documents_under_review
- payment_expected
- inspection_under_review
- decision_available
- phase_closed
- certificate_preparation
- certificate_ready_for_collection
- certificate_collected
- request_rejected
- dossier_closed

## Demo-only operational statuses
- next action status: pending, simulated, done
- meeting outcomes in UI context: planned, held, postponed, cancelled
