# OMA-1B - Admin UI wiring - Implementation

Date: 2026-05-21
Status: Complete - build PASS

## Objective

Wire the admin UI to the already validated OMA-1A backend endpoints for dossiers and phase préliminaire.

## Cache files read

- `exploration-cache/manifest.json`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-21-OMA-1B-planning.md`

## Source files inspected

- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/dossiers/dossier.model.ts`
- `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- `apps/admin/src/pages/DossiersPage.tsx`
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/pages/RequestsPage.tsx`
- `apps/admin/src/lib/api/requests.api.ts`
- `apps/admin/src/lib/api/client.ts`

## Files changed

| File                                                                    | Change                                              |
| ----------------------------------------------------------------------- | --------------------------------------------------- |
| `apps/admin/src/lib/api/dossiers.api.ts`                                | Created - 4 types + 9 API functions                 |
| `apps/admin/src/pages/DossiersPage.tsx`                                 | Full rewrite - API-backed, mock hooks removed       |
| `apps/admin/src/pages/DossierDetailPage.tsx`                            | Full rewrite - API-backed, preliminary action panel |
| `exploration-cache/tasks/summaries/2026-05-21-OMA-1B-planning.md`       | Created                                             |
| `exploration-cache/tasks/summaries/2026-05-21-OMA-1B-implementation.md` | Created (this file)                                 |
| `exploration-cache/tasks/current-task.md`                               | Updated                                             |

## Key decisions

- `DossierStatus` typed as 9-value union from `dossier.model.ts` enum
- `OmaPhaseKey` enum: `preliminary`, `formal_request`, `document_evaluation`, `inspection`, `delivery` (differs from mock `formal_application`/`onsite_demonstration`)
- `PreliminaryActionPanel`: inline component in `DossierDetailPage.tsx`, driven by `preliminary.phase.preliminaryStatus`
- File uploads via `<input type="file" ref>` + `FormData` construction on submit
- Confirmation dialog before `closePreliminaryPhase`
- `isMockMode()` guard in `DossiersPage`: returns empty items in mock mode
- All `@/features/aidn` imports removed from both pages
- `DossierDetailsDialog` removed (was dead code - `selectedRow` was always null)

## Build verification

```
npm run build (apps/admin)
✓ tsc: PASS
✓ vite build: PASS (1.11s)
```

## Runtime validation

Not yet run - runtime checklist at `exploration-cache/09-qa/OMA_PRELIMINARY_RUNTIME_CHECKLIST.md`.

## Deferred items

- Phase II (demande formelle) actions - no backend yet
- Portal UI for dossiers - separate task
- Evidence checklists - mock-only concept, deferred
- Certificate tracking - mock-only concept, deferred
- Timeline/history - mock-only concept, deferred
- Actual browser validation of action buttons

## Known risks / TODOs

- The `Textarea` component is imported from `@/components/ui/textarea` - must exist in the admin app's shadcn setup. If it doesn't, swap with `<textarea className="...">`.
- The `Label` component is imported from `@/components/ui/label` - same caveat.
- The `Dialog` component imports need the admin app's shadcn Dialog to exist.

## Next step

OMA-1B runtime validation:

- Browse to `/dossiers` - confirm list loads from API
- Open a dossier in `preliminary_phase` - confirm preliminary action panel appears
- Walk through the action buttons in sequence, verifying each state transition

After validation: Portal UI for dossiers (add dossier section to `RequestDetailPage.tsx`).
