# Query Duplication Audit: Document-Evaluation and OMA-Phase Services

**Date:** 2026-06-23  
**Finding:** Repository extraction IS warranted. High-frequency duplicated queries justify a focused repository layer.

## Document-Evaluation Services: Query Patterns

### Highly Duplicated Reads

1. **DossierModel.findById(dossierObjId)**
   - `document-evaluation-payment.service.ts` line 38 (getDocumentEvaluationPaymentState)
   - `document-evaluation-review.service.ts` line 39 (getDocumentEvaluations)
   - `document-evaluation-review.service.ts` line 172 (reviewDocumentEvaluation)
   - `document-evaluation-closure.service.ts` line 29 (closeDocumentEvaluationPhase)
   - **4 independent `findById` calls per affected flow**

2. **loadDocEvalPhaseOrThrow(dossierObjId)**
   - `document-evaluation-payment.service.ts` line 41 (getDocumentEvaluationPaymentState)
   - `document-evaluation-payment.service.ts` line 138 (uploadStudyFeeInvoice)
   - `document-evaluation-review.service.ts` line 42 (getDocumentEvaluations)
   - `document-evaluation-review.service.ts` line 175 (reviewDocumentEvaluation)
   - `document-evaluation-closure.service.ts` line 32 (closeDocumentEvaluationPhase)
   - **5 independent calls per affected flow** (helper wraps `OmaPhaseModel.findOne`)

3. **PhasePaymentModel.findOne(dossierId, phaseKey, paymentType)**
   - `document-evaluation-payment.service.ts` lines 80–84 (getPortalDocumentEvaluationPaymentState)
   - `document-evaluation-payment.service.ts` lines 254–258 (uploadStudyFeePaymentProof)
   - `document-evaluation-correction.service.ts` lines 196–200 (getPortalDocumentEvaluationState)
   - **3 independent queries, often unindexed by the trio (dossierId, phaseKey, paymentType)**

4. **OmaPhaseModel.findOne(dossierId, phaseKey: "document_evaluation")**
   - `document-evaluation-payment.service.ts` lines 69–72 (getPortalDocumentEvaluationPaymentState)
   - `document-evaluation-correction.service.ts` lines 180–183 (getPortalDocumentEvaluationState)
   - `document-evaluation-closure.service.ts` lines 69–72 (closeDocumentEvaluationPhase, for inspection phase)
   - **3+ independent queries**

5. **DocumentEvaluationModel.find(phaseId)**
   - `document-evaluation-review.service.ts` lines 49–53 (getDocumentEvaluations)
   - `document-evaluation-correction.service.ts` lines 235–239 (getPortalDocumentEvaluationState)
   - **2 independent queries with identical filter and sort**

6. **DocumentEvaluationModel.findById(evaluationObjId) + phaseId guard**
   - `document-evaluation-review.service.ts` lines 178–181 (reviewDocumentEvaluation)
   - `document-evaluation-correction.service.ts` line 42 (uploadDocumentEvaluationCorrection)
   - **2 independent lookups per evaluation action**

7. **DocumentRequirementModel.find({ \_id: { $in: reqIds } })**
   - `document-evaluation-review.service.ts` lines 65–66 (getDocumentEvaluations)
   - `document-evaluation-correction.service.ts` lines 243–245 (getPortalDocumentEvaluationState)
   - **2 independent queries with identical pattern**

8. **DocumentSubmissionModel.find** (multiple variants)
   - `document-evaluation-review.service.ts` lines 67–72 (for submissions and corrections)
   - `document-evaluation-correction.service.ts` used within `uploadDocumentEvaluationCorrection`
   - **Multiple parallel reads for the same phase**

### Impact Summary

- **Per admin operation:** 1 dossier + 1–2 phase lookups + 1–2 payment queries + multiple evaluation/requirement fetches
- **Per portal operation:** Dossier + phase + payment + evaluations + requirements all re-fetched independently
- **N+1 risk:** Requirement/submission lookups happen per-evaluation in loops

---

## OMA-Phase Services: Query Patterns

From `oma-phase-admin-read.service.ts` (lines 32–80):

1. **DocumentModel.findById** in loop (buildPreliminaryDocumentEvidence, lines 44–58)
   - `Promise.all` mitigates but still 6 separate queries per dossier detail view
   - No batching; queries are independent `findById` calls

2. **RequestModel.findById(requestId)** + CourrierModel queries (buildDossierCourriers, lines 68–79)
   - Typical setup: fetch request, then fetch courrier by ID or requestId
   - These patterns repeat across DN detail views

3. **DossierModel.findById** (implied in access checks across `oma-phase-access.service.ts`)

4. **OmaPhaseModel.find** (filtering by dossierId, phaseKey)
   - Used in portal overview, admin detail, formal-request-overview, etc.

---

## Recommendation: Extract Repository

**Extract `oma-phases/repository/document-evaluation.repository.ts`** with these methods:

```typescript
// Core reads
await findPhasePaymentOrNull(dossierId, phaseKey, paymentType);
await findPhasePaymentOrThrow(dossierId, phaseKey, paymentType);
await findDocEvalPhaseOrThrow(dossierId);
await findDossierOrThrow(dossierId);

// Batch reads (reduce N+1)
await findDocumentsByIds(docIds);
await findRequirementsByIds(requirementIds);
await findSubmissionsByIds(submissionIds);

// Evaluation reads
await findEvaluationsByPhaseId(phaseId);
await findEvaluationByIdInPhase(evaluationId, phaseId);
await countEvaluationsByStatus(phaseId);

// Grouped/aggregated reads
await getEvaluationProgress(phaseId); // returns counts by status
```

**Also extract `oma-phases/repository/oma-phase.repository.ts`:**

```typescript
// Core phase reads
await findOmaPhaseByKey(dossierId, phaseKey);
await findAllOmaPhases(dossierId);

// Document evidence batch
await findDocumentsByIds(docIds); // shared with doc-eval repo
```

---

## Risk & Benefit

| Aspect      | Detail                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Benefit** | Eliminates 8–12 duplicate queries per admin workflow. Reduces N+1 risk in list/detail views. Centralizes model access so future indexing changes happen once. |
| **Risk**    | Medium. Repositories own data shaping; callers must trust return types. Cache validation becomes repository responsibility.                                   |
| **Timing**  | Extract after backend tests pass (Step 8). Repositories will stabilize read logic so tests can mock consistently.                                             |

---

## Deferred vs. Extracted

**Why document-evaluation repository WAS deferred initially:**

- Service split was the first pass; focus was on separation of concerns, not optimization.
- Helpers/constants were extracted first to unblock UI refactoring (which didn't depend on repository).

**Why extraction is now justified:**

- 4 services (payment, review, correction, closure) all re-fetch the same phase, payment, dossier, and evaluation records.
- Portal and admin flows both re-run identical queries.
- Multiple `.find()` calls inside loops without batching (N+1 pattern).
- Formal-request.repository already exists and has proven the pattern works in this codebase.

---

## Next Steps

1. Create `repository/document-evaluation.repository.ts` with batch read methods.
2. Update document-evaluation services to delegate core reads to repository.
3. Rerun `npm run typecheck` to verify exports.
4. (Optional) Create `repository/oma-phase.repository.ts` for preliminary and formal phase reads.
5. Prioritize before adding caching or query optimization—repository becomes the caching boundary.
