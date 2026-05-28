# OMA-OPS-2 - Dossier DN Cockpit Tabs + Phases OMA Skeleton

Date: 2026-05-25
Status: **Complete - typecheck PASS, build PASS**

---

## Objective

Refactor monolithic `DossierDetailPage.tsx` (1227 lines) into a tabbed cockpit with a phase stepper. Preserve all existing preliminary phase functionality. No backend changes.

---

## Cache Files Read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-1-dossier-operations-ux-plan.md`
- `apps/admin/src/components/ui/tabs.tsx` - confirmed Radix UI `Tabs` available
- `apps/admin/src/components/ui/split-view.tsx` - confirmed available

---

## Source Files Inspected

- `apps/admin/src/pages/DossierDetailPage.tsx` - 1227 lines, all inline
- `apps/admin/src/lib/api/dossiers.api.ts` - types confirmed
- `apps/admin/src/components/ui/tabs.tsx` - exports: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

---

## Files Changed

### New folder: `apps/admin/src/pages/dossiers/`

| File                            | Purpose                                                         |
| ------------------------------- | --------------------------------------------------------------- |
| `dossier-detail.helpers.tsx`    | Label constants, `formatDate`, 8 shared micro-components        |
| `PreliminaryPhaseWorkspace.tsx` | All 5 inline forms + `PreliminaryActionPanel` (logic unchanged) |
| `DossierOverviewTab.tsx`        | Vue d'ensemble card content                                     |
| `DossierPhasesTab.tsx`          | Split layout: phase stepper left + workspace right              |
| `DossierDocumentsTab.tsx`       | Stub card                                                       |
| `DossierMeetingsTab.tsx`        | Stub card                                                       |
| `DossierCourriersTab.tsx`       | Stub card                                                       |
| `DossierHistoriqueTab.tsx`      | Stub card                                                       |
| `DossierCertificatTab.tsx`      | Stub card                                                       |

### Modified: `apps/admin/src/pages/DossierDetailPage.tsx`

- Reduced from 1227 lines to ~120 lines
- Keeps: load logic, header (back button, dossier number, status badge, org/postulant, type/date)
- Replaces flat card stack with `<Tabs defaultValue="overview">` with 7 tabs

---

## Key Decisions

1. **`dossier-detail.helpers.tsx` named `.tsx`** (not `.ts` as in spec) because it contains JSX components. Noted in response.

2. **Direct CSS in `DossierPhasesTab`** instead of `<SplitView columns="[1fr_2fr]">`. Used `className="lg:grid lg:grid-cols-[1fr_2fr] lg:items-start lg:gap-4"` so Tailwind's static scanner can find the literal class string in the source and include it in the production CSS build. The SplitView component uses a dynamic template literal (`lg:grid-cols-${columns}`) which Tailwind cannot statically scan - using it with a non-default columns value would produce missing CSS in the production build.

3. **`PreliminaryActionPanel` logic entirely preserved** - all 5 inline forms + the 300-line if/else cascade moved verbatim to `PreliminaryPhaseWorkspace.tsx`. Imports adjusted to pull shared components from `./dossier-detail.helpers`.

4. **`PhasesOverview` component dropped** - replaced by the interactive phase stepper in `DossierPhasesTab`. The old component was read-only and non-interactive; the stepper serves the same display purpose while adding click-to-select.

5. **Phase stepper default selection** - uses the first `in_progress` phase, falling back to the first phase with any OmaPhase record, then hardfall to `"preliminary"`.

6. **`TabsList` wrapping** - `className="flex h-auto flex-wrap justify-start gap-0.5"` overrides the default `inline-flex h-10` to allow tabs to wrap on narrow screens.

---

## Verification

- Admin typecheck: **PASS** (no output)
- Admin build: **PASS** (1,433.01 kB / 414.15 kB gzip)
- Manual checks: pending runtime browser validation

---

## Known Risks / TODOs

- **Browser validation needed**: Tab switching, preliminary actions, default phase selection, narrow-screen tab wrapping.
- **Tailwind `SplitView` dynamic class risk**: Existing `DgCircuitPage` and `RequestsPage` use `<SplitView>` with default `[2fr_3fr]` columns. The literal class string `lg:grid-cols-[2fr_3fr]` no longer appears in source files after the previous session's refactor. This may cause the two-column layout to break in production builds. Verify visually (separate fix if needed).

---

## Next Step

OMA-OPS-3: Phase préliminaire checklist + all actions converted to dialogs.

- Extract and replace the 5 inline forms with dialog components.
- Implement a checklist view replacing the if/else cascade.
- No backend changes.
