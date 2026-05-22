# ROLE-UX-1A Circuit DG Wording + Upload Fix - Planning

Date: 2026-05-22

## Objective

Plan the correction for two runtime issues in `/circuit-dg`: misleading digital-send wording and pre-evaluation DG annotated return upload failing with `MulterError: Unexpected field`.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`

## Source files inspected

- `apps/admin/src/pages/DgCircuitPage.tsx`
- `apps/admin/src/lib/api/dg-circuit.api.ts`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/api/src/modules/admin/admin.routes.ts`

## Files changed

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-22-role-ux-1a-circuit-dg-wording-upload-fix-planning.md`

## Key decisions

- Keep backend multipart route field names unchanged:
  - Initial request DG return uses `returnedScannedDocument`.
  - Preliminary pre-evaluation DG return uses `file`.
- Fix the frontend form construction to append only the field expected by the target endpoint.
- Replace digital-send wording with physical circuit/parapheur wording.
- Avoid broader page redesign or permission changes.

## Implementation details

Planned changes:

1. In `DgCircuitPage`, change the `mark_transmitted` button label from `Transmettre` to `Marquer mis en circuit` or `Imprime / mis en circuit DG`.
2. Add helper text near outgoing task actions:
   - print the document;
   - place it in the physical DG/parapheur circuit;
   - then mark it as placed in circuit.
3. Change display metadata from `Transmis:` to `Mis en circuit:`.
4. In `DgReturnDialog.submit`, append multipart file conditionally:
   - `task.source === "initial_request"` -> `returnedScannedDocument`
   - `task.source === "pre_evaluation"` -> `file`
5. Keep `recordPreEvalDgReturn` helper unchanged because it posts the provided `FormData` to the route that expects `file`.

## Verification commands run

- None during planning.

## Manual checks run or not run

- Runtime upload not run during planning.

## Known risks / TODOs

- Acceptance asks to confirm upload succeeds and task moves forward; that requires live API/data. If no runtime fixture is available, implementation pass should report static fix plus build results and mark runtime validation pending.
- Existing files contain mixed encoding in some French labels; implementation should keep changes narrow.

## Next step

Await approval, then implement the wording and field-name fixes, run builds/type checks, and update cache.
