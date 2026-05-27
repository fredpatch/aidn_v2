# OMA-FORMAL-12 — Replace Phase 2 Closure Courrier Requirement with DN Closure Decision

Date: 2026-05-27
Status: Complete

## Objective

Remove the courrier de recevabilité/clôture requirement from Phase 2 closure.
Replace with: formal request + DG evidence + meeting held + compte rendu uploaded → DN can close.
Add document completeness warning in closure dialog (partial close with reserves).

## Files changed

| File | Change |
|------|--------|
| `apps/api/src/modules/oma-phases/formal-request.service.ts` | Fix `canClosePhase` (remove dgDecisionApproved + courrier check, add dgEvidenceReady + meetingReportUploaded); fix `closeFormalRequestPhase` guards (remove decision===approved + courrier check, add meetingReportDocumentId check); add `completeness`/`comment` to payload + audit |
| `apps/api/src/modules/admin/admin.routes.ts` | Parse `completeness` and `comment` from request body |
| `apps/admin/src/lib/api/dossiers.api.ts` | Add `completeness?: "complete" \| "partial"` + `comment?: string` to `closeFormalRequestPhase` payload |
| `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx` | `CloseFormalRequestPhaseDialog`: takes `progress` prop; shows completeness summary; amber warning if partial; optional comment field; "Clôturer avec réserves" label when partial |
| `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx` | Pass `state.progress` to dialog; update "else" fallback wording |

## Backend changes

### canClosePhase (getAdminFormalRequestPhase)

**Before**: required `dgDecisionApproved` (always false) + recevabilityCourrierDocumentId || phaseClosureCourrierDocumentId

**After**:
```typescript
const dgEvidenceReady = DG_EVIDENCE_STATUSES.has(formalRequestStatus);
const meetingReportUploaded = Boolean(phase.formalMeetingReportDocumentId);
const canClosePhase = !!(
  phase.formalRequestCourrierId && dgEvidenceReady && meetingHeld && meetingReportUploaded
);
```

### closeFormalRequestPhase guards

- **Removed**: `dgReview.decision !== "approved"` check (always blocked)
- **Kept**: `dgReview.status !== "decision_recorded"` (valid — DG return scan sets this)
- **Removed**: `!recevabilityCourrierDocumentId && !phaseClosureCourrierDocumentId` check
- **Added**: `!phase.formalMeetingReportDocumentId` → 409

### Payload expanded

```typescript
payload: { notes?, completeness?: "complete" | "partial", comment? }
```

Stored in audit metadata only (no new model fields).

## Frontend changes

### CloseFormalRequestPhaseDialog

- New prop: `progress: AdminFormalRequestPhaseState["progress"]`
- Completeness derived: `isComplete = validated >= totalTracked && missing === 0`
- If `!isComplete`: amber warning block + optional comment field + "Clôturer avec réserves" button label
- If `isComplete`: normal "Clôturer la Phase 2" label
- `completeness` passed to API

### FormalRequestPhaseWorkspace

- Passes `state.progress` to `CloseFormalRequestPhaseDialog`
- "else" fallback: "Compte rendu joint. La phase peut être clôturée par la DN."

## Phase 2 closure flow (after)

1. Meeting held + compte rendu uploaded → `canClosePhase = true`
2. DN sees "Clôturer la Phase 2" button
3. Dialog shows document completeness summary
4. If all validated → normal close
5. If documents missing/unvalidated → amber warning + "Clôturer avec réserves"
6. On close: Phase 2 = closed, dossier → document_evaluation_phase, Phase 3 started

## Verification results

```
cd apps/api
npm run typecheck  → PASS
npm run build      → PASS

cd apps/admin
npx tsc --noEmit   → PASS
npm run build      → PASS (built in 1.21s)
```

## Manual checks

Not run; no live browser session.

## Known risks / TODOs

- `recevabilityCourrierDocumentId` / `phaseClosureCourrierDocumentId` fields still present in model and API response — existing uploaded documents still displayed in closure section (no data loss)
- `uploadFormalRecevabilityCourrier` / `uploadFormalClosureCourrier` endpoints preserved
- `completeness` stored in audit log only — no model field added (minimal approach)

## Next step

Manual browser validation of Phase 2 full flow, or proceed to Phase 3 implementation.
