# OMA-DOCS-UX-1 — Compact Documents Tab with Phase Accordion

**Date:** 2026-05-28
**Status:** Complete — Admin TypeScript PASS

## Objective

Refactor the admin DN dossier Documents tab into a compact phase-based accordion layout. Default view shows phase summaries only. Users expand a phase to see document rows and download actions.

## Cache files read

- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/05-data/DATA_MODELS.md`
- `exploration-cache/tasks/current-task.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx` (full read)
- `apps/admin/src/lib/api/dossiers.api.ts` (full read)
- `apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx` (partial)
- `apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts` (partial)

## Files changed

- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx` — full rewrite (~760 lines)

## Key decisions

1. **No new component files created** — all new components (`PhaseAccordionCard`, `GateDocumentRow`, `StatChip`, `RequirementLevelBadge`) are local to the file to avoid over-componentizing.
2. **`PhaseAccordionCard`** — implemented with React `useState(defaultOpen)` + Card + ChevronDown/Up icons (no shadcn accordion primitive needed; none was available).
3. **Gate document display**: `formalState.gate` provides display meta (`exists`, `receivedAt`, `source`); download uses `gateReq.submissions` (Courrier ID in `gate.formalRequestCourrierId` is NOT a document ID).
4. **Correction count**: `requires_correction` only — `incomplete` excluded per business rule.
5. **Accordion default open**: driven by `detail.dossier.status` (synchronous) — `preliminary_phase` or `opened` → Phase 1 open; all other statuses → Phase 2 open.

## Implementation details

### New local components

- `StatChip` — 4 compact summary chips: "Documents suivis", "Déposés", "Manquants", "Corrections" with emphasis colors
- `PhaseAccordionCard` — Card with toggle button, ChevronDown/Up, `useState(defaultOpen)`, Separator before content
- `GateDocumentRow` — dedicated row for the formal request gate: uses `formalState.gate` for display, `gateReq.submissions` for download
- `RequirementLevelBadge` — shows "Conditionnel" (amber) or "Optionnel" badge for conditional/optional requirements

### Phase accordion structure

```
Documents du dossier
├── Summary stat chips (4 chips)
├── Phase préliminaire (accordion)
│   └── 6 document rows with download
├── Phase 2 — Demande formelle (accordion)
│   ├── Documents de passage (GateDocumentRow)
│   └── Pièces de suivi (oma_approval_form + consultation docs)
├── Phase 3 — Évaluation approfondie (collapsed placeholder)
├── Phase 4 — Démonstration / inspection (collapsed placeholder)
└── Phase 5 — Délivrance (collapsed placeholder)
```

### Status badge mapping

Added local `formalRequestStatusLabels` map for Phase 2 status display. Existing `preliminaryStatusLabels` imported from `dossier-detail.helpers`.

### Download behavior

All downloads call `downloadDossierDocument(dossierId, documentId)` unchanged. Gate download requires `gateReq.submissions[0].documentId`. Missing documents show no download button.

## Verification commands run

- `cd apps/admin && npx tsc --noEmit` — **PASS** (1 fix needed: remove redundant `?? null` after `Record<PreliminaryStatus, string>` lookup)
- Build not run (separate step)

## Manual checks

- Not run in browser.

## Known risks / TODOs

- Phases 3-5 show placeholder empty states — no document data exists yet for these phases.
- Build (`npm run build`) should be run outside sandbox for Windows Tailwind/Vite native binary loading.
- `formalState.meeting` does not expose `heldAt` — not used in documents tab.

## Next step

Run `npm run build` to verify production build, then commit and push OMA-DOCS-UX-1 changes.
