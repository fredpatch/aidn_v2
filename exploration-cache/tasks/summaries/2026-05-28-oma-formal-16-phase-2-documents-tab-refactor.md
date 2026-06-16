# OMA-FORMAL-16 - Phase 2 document detail moved to Documents tab

Date: 2026-05-28
Status: Complete

## Objective

After FORMAL-15 added inline document review to `FormalRequestPhaseWorkspace`, the workspace became too crowded. FORMAL-16 moves the full Phase 2 document checklist (download + review) into `DossierDocumentsTab` and replaces it in the workspace with a compact summary card.

## Changes

### API

**`apps/api/src/modules/oma-phases/oma-phase.service.ts`**

- `downloadAdminDossierDocument`: extended allowlist with a secondary lookup - if not linked to preliminary evidence, checks `DocumentSubmissionModel` for a live Phase 2 submission with matching `dossierId` + `documentId`. Reuses existing download endpoint without a new route.

### Admin

**`apps/admin/src/pages/DossierDetailPage.tsx`**

- Converted `<Tabs>` from uncontrolled (`defaultValue`) to controlled (`value={activeTab}` / `onValueChange={setActiveTab}`)
- Added `dossierId={dossier.id}` prop to `DossierDocumentsTab`
- Added `onNavigateToTab={setActiveTab}` prop to `DossierPhasesTab`

**`apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`**

- Added `onNavigateToTab?: (tab: string) => void` to props interface
- Passed it through to `FormalRequestPhaseWorkspace`

**`apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`**

- Removed: full document review UI (`Phase2RequirementRow`, `omaApprovalFormReq` review form, consultation-only list)
- Removed: unused `LevelBadge`, `requirementLevelLabels`, `gateRequirement`, `FormalRequirementLevel` import
- Added: compact `<DetailSection title="Documents de demande formelle">` card showing:
  - `X pièces suivies · Y déposées · Z manquantes · W corrections`
  - `oma_approval_form` formCode + status badge
  - "Voir les documents" button → `onNavigateToTab("documents")`

**`apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`**

- Added imports: `useCallback`, `useContext`, `useEffect`, `Label`, `Textarea`, `AuthContext`, `adminReviewFormalRequestDocument`, `getAdminFormalRequestPhase`, various types, `hasPermission`, `extractError`
- Added `formalSubmissionStatusLabels` map
- Added `FormalStatusBadge` component
- Added `Phase2RequirementRow` component: download + inline review (Valider / Demander correction / Marquer incomplet) gated by `isReviewable` + `canReview`
- Added `Phase2DocumentsCard` component: splits requirements into reviewable form (`oma_approval_form`) and consultation-only list
- Added `dossierId: string` to `DossierDocumentsTab` props
- Added `canReview` from `hasPermission(user, "DOCUMENT_REVIEW")`
- Added `formalState` state + `loadFormalPhase` callback + `useEffect` trigger
- Added `Phase2DocumentsCard` below the Phase 1 card in JSX (only rendered when `formalState` is truthy)

## Invariants preserved

- Phase 1 document list and download behavior unchanged
- Backend consultation-only guard (FORMAL-15) still enforced - UI merely reflects it
- `oma_approval_form` review actions only shown when `canReview && latestSubmission && status !== "validated"`
- `getAdminFormalRequestPhase` 404 is swallowed silently (Phase 2 not started = no card shown)
