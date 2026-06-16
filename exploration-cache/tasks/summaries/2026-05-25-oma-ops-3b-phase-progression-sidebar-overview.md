# OMA-OPS-3B - Move preliminary progression into phase sidebar and overview

Date: 2026-05-25
Status: **Complete - typecheck PASS, build PASS**

---

## Objective

Move the 11-step progression checklist from the right workspace into:

1. The left column of the Phases OMA tab (below phase stepper).
2. A compact "Progression OMA" card on the Vue d'ensemble tab.

---

## Source Files Inspected

- `apps/admin/src/pages/dossiers/PreliminaryPhaseChecklist.tsx`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/DossierOverviewTab.tsx`
- `apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx`

---

## Files Changed

| File                            | Change                                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `PreliminaryPhaseChecklist.tsx` | Replaced private `buildSteps()` with `getPreliminaryProgress()` import                                |
| `PreliminaryPhaseWorkspace.tsx` | Removed Progression card + `PreliminaryPhaseChecklist` import + `Clock` import                        |
| `DossierPhasesTab.tsx`          | Added `progressionBlock` below phase stepper in left column; added `PreliminaryPhaseChecklist` import |
| `DossierOverviewTab.tsx`        | Added "Progression OMA" Card; uses `getPreliminaryProgress` + `phaseKeyLabels` + `PhaseStatusBadge`   |

## Files Created

| File                              | Purpose                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `preliminary-progress.helpers.ts` | `getPreliminaryProgress(phase)` - shared step logic, returns steps + derived fields |

---

## Key Decisions

1. **Single source of truth** - `buildSteps` logic moved entirely to
   `preliminary-progress.helpers.ts`. `PreliminaryPhaseChecklist` and
   `DossierOverviewTab` both call `getPreliminaryProgress` - zero duplication.

2. **Left column layout** - `DossierPhasesTab` now wraps stepper + progression
   in a `div.space-y-3`. For preliminary phase: shows `PreliminaryPhaseChecklist`
   in a light bordered block. For other phases: shows "La progression détaillée
   sera disponible lorsque cette phase sera activée."

3. **Overview card** - shows active phase (status === "in_progress") with
   `PhaseStatusBadge`, progress ratio `N / 11 étapes`, current step label,
   and next DN action label. Falls back to "Aucune phase active détectée."
   Progress detail only shown when active phase is preliminary (avoids
   inventing fields for other phases).

4. **`DossierOverviewTab` structure** - changed from a single `<Section>` to
   `div.space-y-4` wrapping two cards: Vue d'ensemble + Progression OMA.

---

## Verification

- Admin typecheck: **PASS** (no output)
- Admin build: **PASS** (1,441.43 kB / 416.03 kB gzip)
- Manual checks: pending runtime browser validation

---

## Known Risks / TODOs

- **Browser validation needed**: overview progression card with real data,
  checklist under stepper for preliminary vs non-preliminary phases.
- **OMA-OPS-4**: document download + Documents tab.
- **Phases 2–5**: progress helpers not yet implemented; placeholder shown.
