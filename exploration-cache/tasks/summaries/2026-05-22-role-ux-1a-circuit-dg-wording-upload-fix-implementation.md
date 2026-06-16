# ROLE-UX-1A Circuit DG Wording + Upload Fix - Implementation

Date: 2026-05-22

## Objective

Fix two runtime validation issues in `/circuit-dg`: misleading physical DG circuit wording and a multipart field mismatch on pre-evaluation DG annotated return upload.

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

- `apps/admin/src/pages/DgCircuitPage.tsx`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-22-role-ux-1a-circuit-dg-wording-upload-fix-implementation.md`
- `exploration-cache/tasks/history/2026-05-22-role-ux-1a-circuit-dg-wording-upload-fix-implementation.md`
- `exploration-cache/manifest.json`

## Key decisions

- Backend multipart field names remain unchanged:
  - Initial request DG return expects `returnedScannedDocument`.
  - Preliminary pre-evaluation DG return expects `file`.
- Frontend now sends only the expected file field for the target endpoint.
- The physical circuit action now avoids digital-send wording.

## Implementation details

- `DgReturnDialog` now appends `returnedScannedDocument` only for `initial_request` tasks.
- `DgReturnDialog` now appends `file` only for `pre_evaluation` tasks.
- Circuit DG outgoing action label changed from `Transmettre` to `Marquer mis en circuit`.
- Outgoing action helper text now explains print -> physical DG/parapheur circuit -> mark as placed in circuit.
- Date metadata label changed from `Transmis:` to `Mis en circuit:`.

## Verification commands run

- `rg -n "Transmettre|Transmis|returnedScannedDocument|form\\.set\\('file'|Marquer mis en circuit|Mis en circuit|parapheur" apps/admin/src/pages/DgCircuitPage.tsx` - PASS; no `Transmettre`/`Transmis` remains and field usage is source-specific.
- `npm run build` in `apps/api` - PASS.
- `npx tsc --noEmit` in `apps/admin` - PASS.
- `npm run build` in `apps/admin` - initial sandbox failure due known Tailwind native Windows binary / `spawn EPERM`; outside-sandbox rerun PASS.

## Manual checks run or not run

- Live DG return upload was not run; no running seeded pre-evaluation DG task was available in this turn.

## Known risks / TODOs

- Runtime acceptance still needs a live pre-evaluation task in `pre_eval_sent_to_dg` to confirm the task moves to processed/next workflow state after upload.
- Existing French text in surrounding files has mixed encoding; this pass kept the change narrow.

## Next step

Run live runtime validation: upload a DG-annotated pre-evaluation return from `/circuit-dg` and confirm no `Unexpected field`, task processing advances, and DN can proceed after annotated return registration.
