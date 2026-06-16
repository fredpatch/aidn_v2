# DG Orientation

## Current implementation
- Courrier records keep DG decision field (pending/oriented_to_dn/redirected/rejected), but `redirected` is legacy/deferred compatibility and is not part of the MVP UI path.
- Separate DG decision records are available via aidnDgDecisionRecords.

## Files involved
- apps/admin/src/features/aidn/mocks/aidn.mock.ts
- apps/admin/src/features/aidn/types/aidn.enums.ts
- apps/admin/src/pages/CourriersPage.tsx

## Statuses observed
- pending
- oriented_to_dn
- rejected
- redirected (legacy/deferred compatibility only)

## User-facing labels
- Portal avoids exposing DG jargon directly.
- External statuses map to administrative review/action required style wording.
- Reorientation is not exposed as a normal user-facing workflow label in the current MVP pass.

## Demo actions / state transitions
- DG orientation is seeded; no runtime edit flow for DG decision records exposed in portal.

## Known gaps
- No integrated physical courrier scanning workflow service.

## Safe next improvements
- Add explicit scanned-return timestamp and actor fields in DG cycle UI.
