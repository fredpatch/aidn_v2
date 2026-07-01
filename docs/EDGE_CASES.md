# AIDN v2 — Edge Case Audit

Generated: 2026-07-01. Method: read actual service code (not cache docs), traced state-machine guards end to end for the three highest-risk gates. File/line refs point at `apps/api/src`.

## P0 — Confirmed in code, business-rule integrity risk

### 1. DG rejection has no code path on the initial-courrier circuit
`requests/helpers/request.validators.ts:84 isDgReturnComplete()` only checks: request status is `initial_dg_returned`/`oriented_to_dn`, the DGReview has a scan, and `returnedScannedDocumentId` exists. It never inspects a decision value.
`requests/services/admin-request.service.ts recordAdminRequestDgReturn()` records the scan and moves status straight to `initial_dg_returned` — no `decision` field in the payload at all.
`openAdminDossierDn()` only gates on `isDgReturnComplete()`.

**Consequence:** the enum has `rejected` and `reoriented` as valid `RequestStatus` values, but nothing in `admin.routes.ts` or `admin-request.service.ts` ever sets them for the *initial* request circuit. If the DG's physical annotation is a rejection, a staffer can still click through and open a DN dossier — the system has no structured capture of "DG said no" for this specific gate, it only trusts whoever uploaded the scan to also not proceed.
Note: the *later* formal-request (Phase 2) DG review does have a proper `approved/rejected/reoriented` decision endpoint (`admin.routes.ts:672`) — this gap is specific to the Phase 1 initial-courrier circuit, so it's not a missing concept, it's an inconsistently-applied one.

**Fix shape:** add a `decision` field to `record-dg-return` (or a follow-up action) and branch `rejected` → terminal status, blocking `openAdminDossierDn`.

### 2. Payment-proof upload alone unlocks the paid phase — no finance validation step
`oma-phases/helpers/document-evaluation.helpers.ts:71`
```
computeDocumentEvaluationCanStart = (payment) => !!(payment.invoiceDocumentId && payment.paymentProofDocumentId)
```
This is existence-of-file, not verified-by-staff. A postulant uploading any file as "preuve de paiement" (even a blank PDF) sets `paymentProofDocumentId` and immediately flips `canStartDocumentEvaluation` to `true` — Phase 3 opens before anyone at ANAC has reconciled the payment.

**Fix shape:** this needs a `payment_proof_validated` status set by an internal actor (`REPORT_VIEW`/finance-equivalent permission) between "proof submitted" and "can start," mirroring the pattern already used for DG-return scans.

### 3. TOCTOU race on status-gated mutations (no locking, no transactions)
Pattern repeats across `admin-request.service.ts`: read record → check `status === X` in JS → mutate → `.save()`. No Mongo transaction, no `findOneAndUpdate` with a status filter in the same atomic op. Two concurrent requests (double-click, retried network call, two staff on the same request) can both pass the status check before either write lands — second write silently wins, first uploaded document becomes orphaned in the Documents registry but still referenced nowhere.
Same shape in `dg-review.service.ts createDgReview()`/`recordDgReturn()` — no optimistic lock (`version`/`updatedAt` check) on the upsert.

**Fix shape:** not urgent to fix everywhere, but the two P0 gates above are the ones worth wrapping in `findOneAndUpdate({ _id, status: expectedStatus }, ...)` so a stale-read write fails loudly (409) instead of silently overwriting.

## P1 — Confirmed structural, lower immediate risk

### 4. Phase-key naming drift between legacy mock layer and real backend
Real backend/admin types: `formal_request`, `inspection`, `delivery` (`apps/admin/src/lib/api/dossiers/types.ts:17`, `apps/api/.../request.constants.ts PHASE_KEYS`).
Legacy Sprint-0 mock layer still uses `formal_application`, `onsite_demonstration` (`apps/admin/src/features/aidn/types/aidn.enums.ts`, `aidn.mock.ts`, and still referenced live in `ReunionsPage.tsx`, `WorkflowOmaPage.tsx`, `DocumentsPage.tsx`, `ReportsPage.tsx`).
Those four pages haven't been migrated to the real `DossierPhasesTab` data model yet — worth confirming whether they're still reachable in nav, because if so they're showing phase data under names the backend doesn't produce.

### 5. File upload validation is per-endpoint, not centralized
MIME allow-list (`ALLOWED_MIME_TYPES`) and size limit (`getPortalRequestMaxFileSizeBytes()`) are correctly enforced on the endpoints I checked (DG return, portal courrier). Not yet verified whether every other upload endpoint (Phase 2 supporting docs, Phase 3 payment proof, DG return counter-scans) reuses the same constant or has independently drifted limits. Worth a quick grep-and-diff pass before Phase 4/5 add more upload surfaces.

## P2 — Future cases (Phase 4 "inspection" / Phase 5 "delivery" — not built yet)
Nothing to audit in code since it's a placeholder, but the two P0 patterns above will recur here by construction unless the gate pattern is fixed once and reused:
- Inspection outcome will need the same "structured decision, not just evidence-uploaded" treatment as finding #1 — an on-site inspection has a pass/fail/conditional outcome, not just "a report exists."
- Certificate delivery is currently demo/localStorage-simulated; when it gets a real backend it will need the same finance-validation treatment as finding #2 if there's a final fee — don't let "document exists" imply "obligation satisfied" again.

## Not yet audited (flag, not claim)
- `auth.service.ts` (389 lines) — personnel/MariaDB adapter edge cases (adapter down, personnel found but no AIDN account, matricule reuse) not traced this pass.
- `account-request.service.ts` (619 lines) — heavily touched in the latest commit (+329 lines in `InternalAccountsPage.tsx` alone); duplicate-personnel/role-conflict edge cases not traced.
- `meetings`/`notifications` modules — not opened this pass.
