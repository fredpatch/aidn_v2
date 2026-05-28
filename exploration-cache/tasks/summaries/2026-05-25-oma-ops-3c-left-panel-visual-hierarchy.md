# OMA-OPS-3C - Phases OMA left panel visual hierarchy

Date: 2026-05-25
Status: **Complete - typecheck PASS, build PASS**

---

## Objective

Improve left column visual hierarchy in the Phases OMA tab. Two distinct
cards, compact checklist, phase navigation clearly separated from progression.

---

## Files Changed

| File                            | Change                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `PreliminaryPhaseChecklist.tsx` | Added `compact?: boolean` prop + `getCompactSteps` helper                                            |
| `DossierPhasesTab.tsx`          | Stepper → Card, progression → Card with ratio + current step + compact checklist, placeholder → Card |

---

## Key Decisions

1. **Compact step window** - `getCompactSteps(steps)` returns:
   `steps[currentIdx - 1 ... currentIdx + 3]` (1 before + current + 3 after).
   If no current step (all done), returns last 3 done steps.
   Result: 4–5 visible steps instead of 11.

2. **Icon/text scaling in compact mode** - icons shrink from `h-4 w-4` to
   `h-3 w-3`, text from `text-sm py-1.5 px-2` to `text-xs py-1 px-1`.

3. **Progression Card structure** - header: "Progression phase active" (xs
   uppercase muted); body: ratio (`N / 11 étapes`) + current step label +
   compact checklist. This gives quick scan without opening the full list.

4. **Non-preliminary placeholder** - now wrapped in a `Card` for visual
   consistency (was a bare `<p>`).

5. **Phase stepper `bg-muted/30` removed** on non-selected items inside card
   (switched to `hover:bg-muted/60` only) since the card background already
   provides context. Selected items retain `bg-primary/5`.

---

## Verification

- Admin typecheck: **PASS** (no output)
- Admin build: **PASS** (1,442.41 kB / 416.28 kB gzip)
- Manual checks: pending runtime browser validation

---

## Next Step

OMA-OPS-4: Document download endpoints + Documents tab implementation.
