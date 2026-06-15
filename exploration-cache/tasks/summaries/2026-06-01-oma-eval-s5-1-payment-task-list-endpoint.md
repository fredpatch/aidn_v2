# OMA-EVAL-S5-1 — Backend S5 Payment Task List Endpoint

Date: 2026-06-01
Type: implementation (backend)
Status: Complete — typecheck 0 errors

---

## Objective

Implement `listPhasePaymentTasks` service and `GET /api/v1/admin/payments/phase-payments` route
for the internal S5 facturation workspace queue.

---

## Cache files read

- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-s5-0-internal-payment-workspace-planning.md`

---

## Source files inspected

- `apps/api/src/modules/dossiers/dossier.model.ts` — dossierNumber, organizationId, postulantUserId
- `apps/api/src/modules/users/user.model.ts` — fullName, email fields
- `apps/api/src/modules/organizations/postulant-organization.model.ts` — canonicalName field
- `apps/api/src/modules/admin/admin.routes.ts` — import/route patterns, Phase 3 section location
- `apps/api/src/shared/utils/service.helpers.ts` — toIso, toId helpers

---

## Files changed

**New:**
- `apps/api/src/modules/payments/phase-payment.service.ts`

**Modified:**
- `apps/api/src/modules/admin/admin.routes.ts`
  - Added import: `listPhasePaymentTasks`, `PhasePaymentTaskFilters`
  - Added route: `GET /payments/phase-payments` [PAYMENT_VIEW]

---

## Key decisions

1. **OmaPhase-first query** — Queries OmaPhase (not PhasePayment) to capture dossiers where no payment row exists yet, synthesizing `invoice_pending` for those. This is critical for the "À facturer" tab.

2. **Separate service file** — Created `phase-payment.service.ts` (not extending doc-eval service) for Phase 4/5 reuse.

3. **Defaults** — `phaseKey=document_evaluation`, `paymentType=study_fee`, `status=all` when filters are omitted or "all".

4. **Counts before filter** — `counts` object reflects all tasks for the phaseKey/paymentType combination; status filter applies only to `items`. This lets UI tabs show correct totals.

5. **Sort order** — `invoice_pending` first (priority action), then `invoice_sent`, then `payment_proof_submitted`; secondary sort by `lastActivityAt` descending.

6. **Security** — `ensureInternalActor` (internal-only), `requirePermission(PAYMENT_VIEW)` at route level. No storage keys or unrelated document metadata exposed.

---

## Implementation details

### Service query strategy (5 parallel batches)

1. `OmaPhaseModel.find({ phaseKey, status: { $ne: "closed" } })`
2. `DossierModel.find({ _id: { $in: dossierIds } })`
3. `PhasePaymentModel.find({ phaseId: { $in: phaseIds }, paymentType })`
4. `PostulantOrganizationModel.find({ _id: { $in: orgIds } })`
5. `UserModel.find({ _id: { $in: userIds } })`

Batches 2+3 run in parallel; 4+5 run in parallel after 2+3.

### Response shape

```ts
{
  items: Array<{
    dossierId, dossierNumber, dossierStatus,
    organizationId, organizationName,
    postulantUserId, postulantName, postulantEmail,
    phaseId, phaseKey,
    paymentId, paymentType, paymentStatus,
    invoiceDocumentId, paymentProofDocumentId,
    invoiceSentAt, paymentProofSubmittedAt, lastActivityAt
  }>;
  counts: { all, invoice_pending, invoice_sent, payment_proof_submitted };
}
```

### Route added

```
GET /api/v1/admin/payments/phase-payments?status=...&phaseKey=...&paymentType=...
Permission: PAYMENT_VIEW
```

---

## Verification commands run

```
npm run typecheck  →  0 errors
```

---

## Manual checks run

Not run — no runtime environment.

---

## Known risks / TODOs

- `dossierNumber` is `required: true` on the Dossier schema, so it should always be present. The `?? null` fallback is defensive.
- If a Phase 3 OmaPhase has `status = "in_progress"` but was closed by a direct DB fix (bypassing service), it would appear in the queue. Accept as acceptable edge case.
- No pagination. If volume grows beyond ~500 dossiers, add cursor-based pagination.

---

## Next step

**OMA-EVAL-S5-2** — Frontend API client types + methods + nav route entry:
- Add `PhasePaymentTask`, `PhasePaymentTaskList` types in `dossiers.api.ts` (or new `payments.api.ts`)
- Add `listPhasePaymentTasks(filters?)` API method
- Add route `/facturation-s5` in `App.tsx`
- Add nav entry in `nav.tsx`
