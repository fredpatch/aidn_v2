# Data Models

Last reviewed: 2026-05-05
Source: apps/admin/src/features/aidn/types/aidn.types.ts

## Core AIDN entities
- AidnDemande
- AidnCourrier
- AidnDgDecisionRecord
- AidnDossier
- AidnOmaPhase
- AidnDocument
- AidnPhaseEvidenceItem
- AidnPhaseNextAction
- AidnMeeting
- AidnCertificate
- AidnTimelineEvent
- AidnDashboardSummary

## Enums source
- apps/admin/src/features/aidn/types/aidn.enums.ts

## State container model
- AidnDemoState in apps/admin/src/features/aidn/storage/aidn-demo-storage.ts
  - demandes, courriers, dossiers, omaPhases, documents, meetings, certificates, phaseEvidenceItems, phaseNextActions, updatedAt
