# OMA Workflow

## Current implementation
- 5 phases represented as ordered AidnOmaPhase records:
  preliminary, formal_application, document_evaluation, onsite_demonstration, delivery.
- Phase evidence and next actions derive from phase status.

## Files involved
- apps/admin/src/features/aidn/mocks/aidn.mock.ts
- apps/admin/src/features/aidn/storage/aidn-demo-actions.ts
- apps/admin/src/pages/WorkflowOmaPage.tsx
- apps/admin/src/pages/DossierDetailPage.tsx

## Statuses observed
- not_started, in_progress, blocked, late, completed

## User-facing labels
- Portal maps these to simplified progress language via portalPreview.utils.ts.

## Demo actions / state transitions
- updatePhaseEvidenceStatus
- markPhaseNextActionDone
- resetAidnDemoData

## Known gaps
- Phase transition enforcement by formal closure courrier is informational, not hard-enforced by validation rules.

## Safe next improvements
- Add phase closure guard requiring evidence checklist completion.
