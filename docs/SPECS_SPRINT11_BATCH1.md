# Specs — Sprint 11 Cleanup Batch 1

Format: explore → plan → implement → report. No blind code dumps — stop after explore+plan and show me the plan before touching code, unless I say "go straight through."

---

## SPEC A — DN can explicitly close a request as DG-rejected

### Context (do not re-derive, just verify against current code)
The DG's decision on the initial courrier is a physical annotation. The app never parses it — DN staff read the scanned return and act. `isDgReturnComplete()` in `apps/api/src/modules/requests/helpers/request.validators.ts` correctly gates "can open dossier" on scan presence only, not a decision value — that part is correct by design, do not change it.

The actual gap: once a request reaches `initial_dg_returned`, the only staff action available is `openAdminDossierDn` (`apps/api/src/modules/requests/services/admin-request.service.ts`). If DN reads the scan and the DG's annotation is a rejection, there is no action to take — no reject/close endpoint exists for the initial-courrier circuit. The status enum already has `rejected` in `REQUEST_STATUSES` (`apps/api/src/modules/requests/constants/request.constants.ts`) but nothing sets it on this path. Compare against the Phase 2 formal-request DG review, which already has a working `approved/rejected/reoriented` decision endpoint (`admin.routes.ts` ~line 672) — use that as the reference pattern for permissions/audit shape, not as code to copy verbatim (different domain model).

### Task
1. **Explore**: read `admin-request.service.ts` fully (both `recordAdminRequestDgReturn` and `openAdminDossierDn`), the formal-request DG decision endpoint it's being modeled after, and the frontend request-detail action panel that currently only renders "Ouvrir dossier" after DG return. Confirm there's genuinely no reject path today (don't trust my summary — verify).
2. **Plan**: propose the new endpoint (route, permission — likely `DG_CIRCUIT_HANDLE` or `COURRIER_REGISTER_PHYSICAL`, check which role realistically reads the physical scan), the status transition (`initial_dg_returned` → `rejected`), what happens to a rejected request afterward (is it terminal? can it be reoriented/resubmitted — check if the business process allows re-submission after a DG rejection, the cahier des charges doesn't say explicitly, flag as an open question if unclear), audit log shape, and the frontend action (a second button next to "Ouvrir dossier" — "Marquer rejeté par le DG" or similar, French wording per house style).
3. Show me the plan. I confirm or adjust before implementation.
4. **Implement**: backend endpoint + guard + audit log, frontend action + confirmation modal (this is a terminal/destructive action, needs a confirm step), update `exploration-cache/06-workflows` doc for this workflow.
5. **Report**: what changed, verification run (`typecheck`/`build` for touched apps), what I should manually check in the browser.

### Explicit boundaries
- Do not touch the Phase 2 formal-request DG review flow — different code path, out of scope.
- Do not add any parsing/OCR of the scanned document — decision stays 100% human-entered.
- No new phase/status values beyond using the existing `rejected` enum value unless you find during explore that it's insufficient — flag before adding new ones.

---

## SPEC B — Payment proof requires internal validation before Phase 3 unlocks

### Context
`computeDocumentEvaluationCanStart` in `apps/api/src/modules/oma-phases/helpers/document-evaluation.helpers.ts` currently returns `true` as soon as `paymentProofDocumentId` exists — i.e., the postulant uploading any file as proof immediately unlocks Phase 3 document evaluation. Confirmed: proof needs an internal validation step by receptionist, admin, or agent_dn before the phase can start. This is the same pattern already used for DG-return scans (evidence uploaded ≠ automatically trusted) — use that as the shape reference, not as code to copy (different domain).

### Task
1. **Explore**: read `document-evaluation-payment.service.ts` end to end (both admin-side `getDocumentEvaluationPaymentState` and portal-side `getPortalDocumentEvaluationPaymentState`), the `PhasePaymentModel` schema (`apps/api/src/modules/payments/phase-payment.model.ts`), and the frontend `DocumentEvaluationPhaseWorkspace`/`Phase2DocumentChecklist`-equivalent for Phase 3 to see what admin UI already exists around payment (if any read-only view exists to extend into an action).
2. **Plan**: propose the new payment status value (e.g. `payment_proof_validated` inserted between `payment_proof_submitted` and start-eligible), which permission gates the validation action (confirm receptionist/admin/agent_dn roles map to real permission constants — check `shared/permissions/permissions.ts`), the validation endpoint (admin-only, needs actor + timestamp + optional rejection path if proof is bad — mirror the DG-return-rejection question from Spec A: what happens if staff reject the proof? Does postulant get notified to re-upload?), and update `computeDocumentEvaluationCanStart` to require the validated status, not just presence.
3. Show me the plan first.
4. **Implement**: backend validation endpoint + updated gate logic + audit log + notification on validate/reject, admin UI action, portal UI reflecting "en attente de validation" vs "validé" vs "à renvoyer" states.
5. **Report**: what changed, verification run, manual check list.

### Explicit boundaries
- Same phase-payment pattern will likely recur for Phase 4 (inspection) and Phase 5 (delivery) fees later — build the validation status/endpoint shape generically enough to reuse, but don't build out Phase 4/5 now, that's separate scope.
- Don't touch the invoice-sending side (`invoice_pending`→`invoice_sent`), only the proof-submitted→validated transition.
