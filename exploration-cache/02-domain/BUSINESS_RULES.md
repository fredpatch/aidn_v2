# Business Rules

Last reviewed: 2026-05-05
Sources:
- docs/aidn-oma-revised-workflow-blueprint-v1.md
- apps/admin/src/features/aidn/mocks/aidn.mock.ts
- apps/admin/src/pages/*.tsx

## Rules observed in code and docs
1. MVP is semi-digital; physical DG/courrier steps remain part of reality.
2. Dossier DN opens after favorable DG orientation/instruction.
3. OMA workflow has 5 phases and each phase can be tracked with evidence items.
4. Portal status vocabulary is simplified compared with internal/admin statuses.
5. Portal preview remains read-only.
6. Demo mode allows local simulation of status/evidence transitions via localStorage updates.

## Evidence of rule #2 in data model
- aidnDemandes + aidnCourriers + aidnDossiers are distinct entities.
- Dossiers link back to demandes through demandeId.
- Comments/text in Demandes/Courriers pages emphasize favorable orientation before dossier creation.
