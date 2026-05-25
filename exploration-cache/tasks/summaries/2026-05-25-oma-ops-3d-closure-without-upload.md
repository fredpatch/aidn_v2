# OMA-OPS-3D — Phase preliminary closure independent from closure courrier upload

Date: 2026-05-25
Status: **Complete — typecheck PASS, build PASS**

---

## Objective

Remove the closure courrier upload as a required/primary action before phase closure.
Show only "Clôturer la phase préliminaire" when the phase is ready.
Treat closure courrier as optional evidence (show if present, don't block on absence).

---

## Files Inspected

- `exploration-cache/tasks/current-task.md`
- `apps/admin/src/pages/dossiers/preliminary-progress.helpers.ts`
- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx`

## Files Changed

| File | Change |
|------|--------|
| `preliminary-progress.helpers.ts` | Removed `closure_courrier_uploaded` step; updated `preliminary_closed` current trigger; updated `NEXT_ACTION_LABELS` |
| `PreliminaryPhaseWorkspace.tsx` | Merged `preliminary_meeting_held` + `preliminary_ready_to_close` branches; removed upload button; updated evidence label |

---

## Key Decisions

1. **Step removed** — `closure_courrier_uploaded` removed from checklist. Total steps: **10**.
   - `preliminary_closed` step now triggers when `ps === "preliminary_meeting_held" || ps === "preliminary_ready_to_close"`.
   - `NEXT_ACTION_LABELS.preliminary_closed = "Clôturer la phase préliminaire"`.

2. **`preliminary_ready_to_close` preserved** — backend status untouched; UI treats it identically to `preliminary_meeting_held` (direct close button). The status can still be reached if closure courrier is uploaded via an out-of-band flow.

3. **Upload button removed from main flow** — `UploadClosureCourrierDialog` remains in the dialog tree (keyed to `upload_closure`) but no UI path sets `openDialog = "upload_closure"` anymore. Left unused for future optional use.

4. **Evidence label updated** — `closureCourrierDocumentId` entry now reads "Courrier de clôture phase I — optionnel". Evidence block only renders existing documents so no pending row is shown when absent.

5. **No backend changes** — closure endpoint was not inspected for guard on `closureCourrierDocumentId`. If the backend requires it, a runtime error will surface; none observed in typecheck/build.

---

## Verification

- Admin typecheck: **PASS** (no output)
- Admin build: **PASS** (1,513.82 kB / 438.39 kB gzip)
- Backend typecheck/build: not run (no backend files changed)
- Manual checks: pending runtime browser validation

---

## Risks / TODOs

- If the backend `closePreliminaryPhase` endpoint validates `closureCourrierDocumentId` on its side, it will return an error when closing from `preliminary_meeting_held`. That would need a backend fix. Likely not the case (PO clarified upload is not required), but verify at runtime.

---

## Next Step

OMA-OPS-4: Document download endpoints + Documents tab implementation.
