# Current Task

## Phase: OMA-OPS-2 — Dossier DN Cockpit Tabs + Phases OMA Skeleton

Date: 2026-05-25
Status: **Complete — typecheck PASS, build PASS**

## Summary file

`exploration-cache/tasks/summaries/2026-05-25-oma-ops-2-dossier-cockpit-tabs.md`

## Objective

Refactor `DossierDetailPage.tsx` (1227 lines) into a tabbed cockpit with a phase stepper and split-view workspace. Preserve all existing preliminary phase functionality.

## Completed deliverables

- New folder: `apps/admin/src/pages/dossiers/` with 9 co-located files.
- `dossier-detail.helpers.tsx`: label constants, formatDate, 8 shared micro-components.
- `PreliminaryPhaseWorkspace.tsx`: all 5 inline forms + PreliminaryActionPanel (logic unchanged).
- `DossierOverviewTab.tsx`: Vue d'ensemble card content.
- `DossierPhasesTab.tsx`: left stepper (5 phases, click to select) + right workspace (preliminary or placeholder).
- 5 stub tabs: Documents, Réunions, Courriers, Historique, Certificat.
- `DossierDetailPage.tsx` reduced from 1227 to ~120 lines.

## Key decisions

- `dossier-detail.helpers.tsx` is `.tsx` (not `.ts`) because it contains JSX.
- `DossierPhasesTab` uses direct Tailwind class `lg:grid-cols-[1fr_2fr]` instead of `<SplitView columns="[1fr_2fr]">` to avoid Tailwind static scan gap.
- `PhasesOverview` component dropped — replaced by interactive phase stepper.

## Previous task reference

OMA-OPS-1: `exploration-cache/tasks/summaries/2026-05-25-oma-ops-1-dossier-operations-ux-plan.md`

## Next step

OMA-OPS-3: Phase préliminaire checklist + dialog-based actions (frontend only, no backend).
