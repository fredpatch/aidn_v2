import { Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { Permissions } from "../../shared/permissions/permissions.js";
import {
  ensureObjectId,
  toId,
  toIso,
} from "../../shared/utils/service.helpers.js";
import {
  can,
  ensureCanViewTasks,
  organizationName,
  taskMatches,
  userName,
} from "./dg-circuit.helpers.js";
import { dgCircuitRepository } from "./dg-circuit.repository.js";
import type {
  Actor,
  DgCircuitTaskFilters,
  GenericRecord,
  TaskBucket,
  TaskSource,
} from "./dg-circuit.types.js";

export { canViewDgCircuitTasks } from "./dg-circuit.helpers.js";
export {
  createDgReview,
  markSentToDg,
  recordDgDecision,
  recordDgReturn,
} from "./dg-review.service.js";

// Task list
export const listDgCircuitTasks = async (
  filters: DgCircuitTaskFilters,
  actor: Actor,
) => {
  ensureCanViewTasks(actor);

  const tasks: Array<
    Record<string, unknown> & {
      bucket: TaskBucket;
      source: TaskSource;
      subject: string;
    }
  > = [];

  // ── Initial requests ───────────────────────────────────────────────────────
  // Query all DGReviews for initial_request first so historical records are included.
  const allReviews = await dgCircuitRepository.findInitialRequestReviews();

  const reviewByRequestId = new Map<string, GenericRecord>();
  for (const review of allReviews) {
    const reqId = toId(review.requestId);
    if (reqId && !reviewByRequestId.has(reqId)) {
      reviewByRequestId.set(reqId, review);
    }
  }

  const reviewedRequestIds = [...reviewByRequestId.keys()].map(
    (id) => new Types.ObjectId(id),
  );

  const [reviewedRequests, pendingRequests] = await Promise.all([
    dgCircuitRepository.findRequestsByIds(reviewedRequestIds),
    dgCircuitRepository.findPendingInitialRequests(reviewedRequestIds),
  ]);

  const allRequests = [
    ...reviewedRequests,
    ...pendingRequests,
  ] as unknown as GenericRecord[];

  for (const request of allRequests) {
    const review = reviewByRequestId.get(request._id.toString());
    const reviewStatus = review ? String(review.status ?? "") : null;
    const courrierSource = String(request.courrierSource ?? "");
    const physicalDeposit = request.physicalDeposit as
      | { status?: string }
      | undefined;
    let bucket: TaskBucket | null = null;
    const actions: string[] = [];

    if (reviewStatus === "decision_recorded") {
      bucket = "decision_recorded";
      if (
        can(actor, Permissions.DG_CIRCUIT_HANDLE) &&
        review?.returnedScannedDocumentId
      ) {
        actions.push("download_annotated_return");
      }
    } else if (reviewStatus === "returned_scanned") {
      bucket = "returned_scanned";
      if (
        can(actor, Permissions.DG_CIRCUIT_HANDLE) &&
        review?.returnedScannedDocumentId
      ) {
        actions.push("download_annotated_return");
      }
    } else if (
      reviewStatus === "awaiting_return" ||
      reviewStatus === "sent_to_dg_circuit"
    ) {
      bucket = "awaiting_return";
      if (can(actor, Permissions.DG_CIRCUIT_HANDLE)) {
        actions.push("record_annotated_return");
      }
    } else if (reviewStatus === "created") {
      bucket = "to_transmit";
      if (can(actor, Permissions.DG_CIRCUIT_HANDLE)) {
        actions.push("download_outgoing", "mark_transmitted");
      }
    } else {
      // No DGReview - determine bucket from request state
      const reqStatus = String(request.status ?? "");
      if (
        ["submitted", "intake_in_review"].includes(reqStatus) &&
        courrierSource === "portal_upload" &&
        request.initialDocumentId
      ) {
        bucket = "to_transmit";
        if (can(actor, Permissions.DG_CIRCUIT_HANDLE)) {
          actions.push("download_outgoing", "mark_transmitted");
        }
      } else if (
        reqStatus === "submitted" &&
        courrierSource === "physical_deposit" &&
        physicalDeposit?.status === "planned"
      ) {
        bucket = "to_transmit";
        if (can(actor, Permissions.COURRIER_REGISTER_PHYSICAL)) {
          actions.push("record_physical_receipt");
        }
      }
    }

    if (!bucket) continue;

    tasks.push({
      id: `initial_request:${request._id.toString()}`,
      source: "initial_request",
      bucket,
      subject: String(request.subject ?? "Demande initiale"),
      organizationName: organizationName(request.organizationId),
      applicantName: userName(request.submittedById),
      requestId: request._id.toString(),
      status: reviewStatus ?? String(request.status ?? ""),
      documentToTransmitId: toId(request.initialDocumentId),
      annotatedReturnDocumentId: toId(review?.returnedScannedDocumentId),
      submittedAt: toIso(request.submittedAt),
      transmittedAt: toIso(review?.sentToDgAt),
      returnedAt: toIso(review?.returnedFromDgAt),
      processedAt: toIso(review?.decisionRecordedAt),
      sentToDgAt: toIso(review?.sentToDgAt),
      returnedFromDgAt: toIso(review?.returnedFromDgAt),
      decisionRecordedAt: toIso(review?.decisionRecordedAt),
      decision: review?.decision != null ? String(review.decision) : undefined,
      orientedDirection: review?.orientedDirection
        ? String(review.orientedDirection)
        : undefined,
      observations: review?.observations
        ? String(review.observations)
        : undefined,
      handledByRole: review?.handledByRole
        ? String(review.handledByRole)
        : undefined,
      availableActions: actions,
    });
  }

  // ── Pre-evaluation items ───────────────────────────────────────────────────
  // Include all phases that have ever entered the pre-eval DG circuit.
  const phases = await dgCircuitRepository.findPreliminaryDgPhases();

  const dossierIds = phases
    .map((phase) => phase.dossierId)
    .filter(Boolean) as Types.ObjectId[];
  const dossiers = await dgCircuitRepository.findDossiersByIds(dossierIds);
  const dossierById = new Map<string, GenericRecord>();
  for (const dossier of dossiers as unknown as GenericRecord[]) {
    dossierById.set(dossier._id.toString(), dossier);
  }

  for (const phase of phases as unknown as GenericRecord[]) {
    const preliminaryStatus = String(phase.preliminaryStatus ?? "");
    const dossier = dossierById.get(toId(phase.dossierId) ?? "");
    let bucket: TaskBucket | null = null;
    const actions: string[] = [];

    if (
      preliminaryStatus === "pre_eval_form_submitted" &&
      phase.completedPreEvaluationDocumentId
    ) {
      bucket = "to_transmit";
      if (can(actor, Permissions.PRE_EVAL_DG_CIRCUIT_HANDLE)) {
        actions.push("download_outgoing", "mark_transmitted");
      }
    } else if (preliminaryStatus === "pre_eval_sent_to_dg") {
      bucket = "awaiting_return";
      if (can(actor, Permissions.PRE_EVAL_DG_CIRCUIT_HANDLE)) {
        actions.push("record_annotated_return");
      }
    } else if (
      preliminaryStatus === "pre_eval_dg_decision_recorded" ||
      (phase.preEvaluationSentToDgAt &&
        phase.preEvaluationDgAnnotatedDocumentId)
    ) {
      // No decision field exists on OmaPhase for pre-eval - map to returned_scanned (closest available)
      bucket = "returned_scanned";
      if (can(actor, Permissions.PRE_EVAL_DG_RETURN_CONSULT)) {
        actions.push("download_annotated_return");
      }
    }

    if (!bucket) continue;

    tasks.push({
      id: `pre_evaluation:${phase._id.toString()}`,
      source: "pre_evaluation",
      bucket,
      subject: "Formulaire de pré-évaluation",
      organizationName: organizationName(dossier?.organizationId),
      applicantName: userName(dossier?.postulantUserId),
      reference: String(dossier?.dossierNumber ?? ""),
      dossierId: toId(phase.dossierId),
      phaseId: phase._id.toString(),
      status: preliminaryStatus,
      documentToTransmitId: toId(phase.completedPreEvaluationDocumentId),
      annotatedReturnDocumentId: toId(phase.preEvaluationDgAnnotatedDocumentId),
      submittedAt: toIso(phase.updatedAt),
      transmittedAt: toIso(phase.preEvaluationSentToDgAt),
      returnedAt: toIso(phase.preEvaluationReturnedFromDgAt),
      processedAt:
        preliminaryStatus === "pre_eval_dg_decision_recorded"
          ? toIso(phase.preEvaluationReturnedFromDgAt ?? phase.updatedAt)
          : undefined,
      sentToDgAt: toIso(phase.preEvaluationSentToDgAt),
      returnedFromDgAt: toIso(phase.preEvaluationReturnedFromDgAt),
      decisionRecordedAt: undefined,
      decision: undefined,
      orientedDirection: undefined,
      observations: undefined,
      handledByRole: undefined,
      availableActions: actions,
    });
  }

  // ── Formal request items ──────────────────────────────────────────────────────
  // Include all OmaPhase records with phaseKey='formal_request' that have the gate courrier.
  const formalRequestPhases =
    await dgCircuitRepository.findFormalRequestPhases();

  const formalDossierIds = formalRequestPhases
    .map((p) => p.dossierId)
    .filter(Boolean) as Types.ObjectId[];

  const formalDgReviewIds = formalRequestPhases
    .map((p) => p.formalRequestDgReviewId)
    .filter(Boolean) as Types.ObjectId[];

  const formalCourrierIds = formalRequestPhases
    .map((p) => p.formalRequestCourrierId)
    .filter(Boolean) as Types.ObjectId[];

  const [formalDossiers, formalDgReviews, formalCourriers] = await Promise.all([
    dgCircuitRepository.findDossiersByIds(formalDossierIds),
    dgCircuitRepository.findDgReviewsByIds(formalDgReviewIds),
    dgCircuitRepository.findCourriersByIds(formalCourrierIds),
  ]);

  const formalDossierById = new Map<string, GenericRecord>();
  for (const d of formalDossiers as unknown as GenericRecord[]) {
    formalDossierById.set(d._id.toString(), d);
  }

  const formalDgReviewById = new Map<string, GenericRecord>();
  for (const r of formalDgReviews as unknown as GenericRecord[]) {
    formalDgReviewById.set(r._id.toString(), r);
  }

  const formalCourrierById = new Map<string, GenericRecord>();
  for (const c of formalCourriers as unknown as GenericRecord[]) {
    formalCourrierById.set(c._id.toString(), c);
  }

  for (const phase of formalRequestPhases) {
    const dossier = formalDossierById.get(toId(phase.dossierId) ?? "");
    const review = phase.formalRequestDgReviewId
      ? formalDgReviewById.get(phase.formalRequestDgReviewId.toString())
      : undefined;
    const reviewStatus = review ? String(review.status ?? "") : null;
    let bucket: TaskBucket | null = null;
    const actions: string[] = [];

    if (!phase.formalRequestDgReviewId) {
      // Gate courrier exists but not yet sent to DG circuit
      bucket = "to_transmit";
      if (can(actor, Permissions.DG_CIRCUIT_HANDLE)) {
        const courrierId = toId(phase.formalRequestCourrierId);
        const courrier = courrierId
          ? formalCourrierById.get(courrierId)
          : undefined;
        if (courrier?.documentId) actions.push("download_outgoing");
        actions.push("mark_transmitted");
      }
    } else if (reviewStatus === "awaiting_return") {
      bucket = "awaiting_return";
      if (can(actor, Permissions.DG_CIRCUIT_HANDLE)) {
        actions.push("record_annotated_return");
      }
    } else if (reviewStatus === "returned_scanned") {
      // MVP: for formal_request, scanned return = decision evidence - present as decision_recorded.
      // No separate record_dg_decision step is required.
      bucket = "decision_recorded";
      if (
        can(actor, Permissions.DG_CIRCUIT_HANDLE) &&
        review?.returnedScannedDocumentId
      ) {
        actions.push("download_annotated_return");
      }
    } else if (reviewStatus === "decision_recorded") {
      bucket = "decision_recorded";
      if (
        can(actor, Permissions.DG_CIRCUIT_HANDLE) &&
        review?.returnedScannedDocumentId
      ) {
        actions.push("download_annotated_return");
      }
    }

    if (!bucket) continue;

    tasks.push({
      id: `formal_request:${phase._id.toString()}`,
      source: "formal_request",
      bucket,
      subject: "Demande formelle",
      organizationName: organizationName(dossier?.organizationId),
      applicantName: userName(dossier?.postulantUserId),
      reference: String(dossier?.dossierNumber ?? ""),
      dossierId: toId(phase.dossierId),
      phaseId: phase._id.toString(),
      status: String(phase.formalRequestStatus ?? ""),
      documentToTransmitId: (() => {
        const courrierId = toId(phase.formalRequestCourrierId);
        const courrier = courrierId
          ? formalCourrierById.get(courrierId)
          : undefined;
        return courrier ? toId(courrier.documentId) : undefined;
      })(),
      annotatedReturnDocumentId: toId(review?.returnedScannedDocumentId),
      submittedAt: toIso(phase.formalRequestReceivedAt ?? phase.updatedAt),
      transmittedAt: toIso(phase.formalSentToDgAt),
      returnedAt: toIso(phase.formalDgReturnedAt),
      processedAt:
        reviewStatus === "decision_recorded" ||
        reviewStatus === "returned_scanned"
          ? toIso(
              review?.decisionRecordedAt ??
                phase.formalDgReturnedAt ??
                phase.updatedAt,
            )
          : undefined,
      sentToDgAt: toIso(phase.formalSentToDgAt),
      returnedFromDgAt: toIso(phase.formalDgReturnedAt),
      decisionRecordedAt: toIso(review?.decisionRecordedAt),
      decision: review?.decision != null ? String(review.decision) : undefined,
      orientedDirection: review?.orientedDirection
        ? String(review.orientedDirection)
        : undefined,
      observations: review?.observations
        ? String(review.observations)
        : undefined,
      handledByRole: review?.handledByRole
        ? String(review.handledByRole)
        : undefined,
      availableActions: actions,
    });
  }

  const toTransmit = tasks.filter((t) => t.bucket === "to_transmit").length;
  const awaitingReturn = tasks.filter(
    (t) => t.bucket === "awaiting_return",
  ).length;
  const returnedScanned = tasks.filter(
    (t) => t.bucket === "returned_scanned",
  ).length;
  const decisionRecorded = tasks.filter(
    (t) => t.bucket === "decision_recorded",
  ).length;

  const counts = {
    toTransmit,
    awaitingReturn,
    returnedScanned,
    decisionRecorded,
    processed: returnedScanned + decisionRecorded, // backward compat
  };

  const limit = Number.isFinite(filters.limit)
    ? Math.max(1, Math.min(Number(filters.limit), 200))
    : 100;

  return {
    items: tasks.filter((task) => taskMatches(task, filters)).slice(0, limit),
    counts,
  };
};

export const downloadDgCircuitTaskDocument = async (
  taskId: string,
  documentId: string,
  actor: Actor,
) => {
  ensureCanViewTasks(actor);

  const [source, rawOwnerId] = taskId.split(":");
  const ownerId = ensureObjectId(rawOwnerId ?? "", "taskId");
  const docObjectId = ensureObjectId(documentId, "documentId");

  if (source === "initial_request") {
    const request = await dgCircuitRepository.findRequestById(ownerId);
    if (!request) throw new HttpError(404, "Tache introuvable");
    const review = await dgCircuitRepository.findInitialRequestReview(
      request._id,
    );
    const isOutgoing =
      request.initialDocumentId?.toString() === docObjectId.toString();
    const isAnnotated =
      review?.returnedScannedDocumentId?.toString() === docObjectId.toString();

    if (isOutgoing && !can(actor, Permissions.DG_CIRCUIT_HANDLE)) {
      throw new HttpError(403, "Document non accessible");
    }
    if (isAnnotated && !can(actor, Permissions.DG_CIRCUIT_HANDLE)) {
      throw new HttpError(403, "Document non accessible");
    }
    if (!isOutgoing && !isAnnotated) {
      throw new HttpError(403, "Document non accessible");
    }
  } else if (source === "pre_evaluation") {
    const phase = await dgCircuitRepository.findPhaseById(ownerId);
    if (!phase) throw new HttpError(404, "Tache introuvable");
    const isOutgoing =
      phase.completedPreEvaluationDocumentId?.toString() ===
      docObjectId.toString();
    const isAnnotated =
      phase.preEvaluationDgAnnotatedDocumentId?.toString() ===
      docObjectId.toString();

    if (isOutgoing && !can(actor, Permissions.PRE_EVAL_DG_CIRCUIT_HANDLE)) {
      throw new HttpError(403, "Document non accessible");
    }
    if (isAnnotated && !can(actor, Permissions.PRE_EVAL_DG_RETURN_CONSULT)) {
      throw new HttpError(403, "Document non accessible");
    }
    if (!isOutgoing && !isAnnotated) {
      throw new HttpError(403, "Document non accessible");
    }
  } else if (source === "formal_request") {
    const phase = await dgCircuitRepository.findPhaseById(ownerId);
    if (!phase) throw new HttpError(404, "Tache introuvable");

    let isOutgoing = false;
    let isAnnotated = false;

    if (phase.formalRequestCourrierId) {
      const courrier = await dgCircuitRepository.findCourrierDocumentById(
        phase.formalRequestCourrierId as Types.ObjectId,
      );
      isOutgoing = courrier?.documentId?.toString() === docObjectId.toString();
    }

    if (phase.formalRequestDgReviewId) {
      const review = await dgCircuitRepository.findDgReviewById(
        phase.formalRequestDgReviewId as Types.ObjectId,
      );
      isAnnotated =
        review?.returnedScannedDocumentId?.toString() ===
        docObjectId.toString();
    }

    if (isOutgoing && !can(actor, Permissions.DG_CIRCUIT_HANDLE)) {
      throw new HttpError(403, "Document non accessible");
    }
    if (isAnnotated && !can(actor, Permissions.DG_CIRCUIT_HANDLE)) {
      throw new HttpError(403, "Document non accessible");
    }
    if (!isOutgoing && !isAnnotated) {
      throw new HttpError(403, "Document non accessible");
    }
  } else {
    throw new HttpError(400, "taskId is invalid");
  }

  const doc = await dgCircuitRepository.findDocumentById(docObjectId);
  if (!doc) throw new HttpError(404, "Document introuvable");

  const buffer = await dgCircuitRepository.getDocumentBuffer(
    doc.storageKey as string,
  );
  return {
    buffer,
    mimeType: doc.mimeType as string,
    fileName: doc.fileName as string,
  };
};
