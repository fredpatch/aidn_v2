# Seed Data

Last reviewed: 2026-05-05

## AIDN seed origin
- apps/admin/src/features/aidn/mocks/aidn.mock.ts

## Demo persistence behavior
- Initial seed cloned into localStorage key aidn.demo.state.v1.
- Functions in aidn-demo-actions mutate stored state for demo simulation.
- resetAidnDemoData() restores seed state.

## Seed coverage
- demandes and DG/courrier layer
- dossiers and OMA phases
- documents
- meetings
- certificate lifecycle records
- evidence checklist by phase
- next actions by phase
- timeline events
