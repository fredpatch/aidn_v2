import { Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { Permissions } from "../../shared/permissions/permissions.js";
import { storageAdapter } from "../../shared/storage/storage.adapter.js";
import { saveDocument } from "../../shared/utils/document.helpers.js";
import { ensureObjectId, toId, toIso } from "../../shared/utils/service.helpers.js";
import { CourrierModel } from "../courriers/courrier.model.js";
import { DocumentModel } from "../documents/document.model.js";
import { DossierModel } from "../dossiers/dossier.model.js";
import { DGReviewModel } from "../dg-reviews/dg-review.model.js";
import { OmaPhaseModel } from "../oma-phases/oma-phase.model.js";
import { RequestModel } from "../requests/request.model.js";

type Actor = {
  id: string;
  role: string;
  userType: "internal" | "postulant";
  permissions: string[];
};

type TaskBucket = "to_transmit" | "awaiting_return" | "returned_scanned" | "decision_recorded";
type TaskSource = "initial_request" | "pre_evaluation" | "formal_request";
type GenericRecord = Record<string, unknown> & { _id: Types.ObjectId };
type DgReviewHandledByRole = "dg_secretariat" | "reception" | "bureau_courrier" | "dn_agent" | "admin";

const DG_TASK_PERMISSIONS = [
  Permissions.DG_CIRCUIT_HANDLE,
  Permissions.COURRIER_REGISTER_PHYSICAL,
  Permissions.PRE_EVAL_DG_CIRCUIT_HANDLE,
  Permissions.DG_DECISION_RECORD,
] as const;

const ensureInternalActor = (actor: Actor) => {
  if (actor.userType !== "internal") {
    throw new HttpError(403, "Internal access required");
  }
};

export const canViewDgCircuitTasks = (actor: Actor) =>
  DG_TASK_PERMISSIONS.some((permission) => actor.permissions.includes(permission));

const ensureCanViewTasks = (actor: Actor) => {
  ensureInternalActor(actor);
  if (!canViewDgCircuitTasks(actor)) {
    throw new HttpError(403, "Missing DG circuit task permission");
  }
};

const can = (actor: Actor, permission: string) => actor.permissions.includes(permission);

const toDgRole = (role: string): DgReviewHandledByRole => {
  const allowed: DgReviewHandledByRole[] = [
    "dg_secretariat",
    "reception",
    "bureau_courrier",
    "dn_agent",
    "admin",
  ];
  return allowed.includes(role as DgReviewHandledByRole) ? (role as DgReviewHandledByRole) : "admin";
};

const taskMatches = (
  task: { bucket: TaskBucket; source: TaskSource; subject: string; organizationName?: string; applicantName?: string; reference?: string },
  filters: { bucket?: string; source?: string; search?: string },
) => {
  if (filters.bucket) {
    if (filters.bucket === "returns_to_register") {
      if (task.bucket !== "awaiting_return") return false;
    } else if (filters.bucket === "processed") {
      // backward compat: "processed" covers returned_scanned + decision_recorded
      if (task.bucket !== "returned_scanned" && task.bucket !== "decision_recorded") return false;
    } else {
      if ((task.bucket as string) !== filters.bucket) return false;
    }
  }
  if (filters.source && task.source !== filters.source) return false;
  if (!filters.search) return true;

  const haystack = [
    task.subject,
    task.organizationName,
    task.applicantName,
    task.reference,
  ].join(" ").toLowerCase();

  return haystack.includes(filters.search.toLowerCase());
};

const organizationName = (source: unknown) => {
  if (!source || source instanceof Types.ObjectId) return undefined;
  return String((source as GenericRecord).canonicalName ?? "");
};

const userName = (source: unknown) => {
  if (!source || source instanceof Types.ObjectId) return undefined;
  return String((source as GenericRecord).fullName ?? "");
};

// ── Generic DG review operations ─────────────────────────────────────────────

export const createDgReview = async (params: {
  targetType: string;
  targetId: Types.ObjectId;
  requestId?: Types.ObjectId;
  dossierId?: Types.ObjectId;
  phaseId?: Types.ObjectId;
  handledByRole: string;
  handledById?: Types.ObjectId;
  outgoingDocumentId?: Types.ObjectId;
  sentToDgAt?: Date;
  observations?: string;
}): Promise<{ _id: Types.ObjectId }> => {
  const review = await DGReviewModel.findOneAndUpdate(
    { targetId: params.targetId, targetType: params.targetType },
    {
      $set: {
        targetType: params.targetType,
        targetId: params.targetId,
        requestId: params.requestId,
        dossierId: params.dossierId,
        phaseId: params.phaseId,
        status: "awaiting_return",
        handledByRole: toDgRole(params.handledByRole),
        handledById: params.handledById,
        sentToDgAt: params.sentToDgAt ?? new Date(),
        outgoingDocumentId: params.outgoingDocumentId,
        observations: params.observations,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return { _id: review._id };
};

export const markSentToDg = async (params: {
  reviewId: Types.ObjectId;
  actorId?: Types.ObjectId;
  sentToDgAt?: Date;
}): Promise<void> => {
  await DGReviewModel.updateOne(
    { _id: params.reviewId },
    {
      $set: {
        status: "awaiting_return",
        sentToDgAt: params.sentToDgAt ?? new Date(),
        handledById: params.actorId,
      },
    },
  );
};

export const recordDgReturn = async (params: {
  reviewId: Types.ObjectId;
  file: Express.Multer.File;
  returnedFromDgAt?: Date;
  uploadedById: Types.ObjectId;
  title: string;
  documentType: string;
  ownerType: string;
  ownerId: Types.ObjectId;
  ownerPath: string;
}): Promise<{ documentId: Types.ObjectId }> => {
  const documentId = await saveDocument({
    file: params.file,
    ownerPath: params.ownerPath,
    ownerType: params.ownerType,
    ownerId: params.ownerId,
    category: "decision",
    documentType: params.documentType,
    title: params.title,
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: params.uploadedById,
  });

  await DGReviewModel.updateOne(
    { _id: params.reviewId },
    {
      $set: {
        status: "returned_scanned",
        returnedFromDgAt: params.returnedFromDgAt ?? new Date(),
        returnedScannedDocumentId: documentId,
      },
    },
  );

  return { documentId };
};

export const recordDgDecision = async (params: {
  reviewId: Types.ObjectId;
  decision: string;
  orientedDirection?: string;
  observations?: string;
  actorId: Types.ObjectId;
  handledByRole?: string;
  decidedAt?: Date;
}): Promise<void> => {
  const setFields: Record<string, unknown> = {
    status: "decision_recorded",
    decision: params.decision,
    orientedDirection: params.orientedDirection,
    observations: params.observations,
    decisionRecordedById: params.actorId,
    decisionRecordedAt: params.decidedAt ?? new Date(),
  };
  if (params.handledByRole) {
    setFields.handledByRole = toDgRole(params.handledByRole);
    setFields.handledById = params.actorId;
  }
  await DGReviewModel.updateOne({ _id: params.reviewId }, { $set: setFields });
};

// ── Task list ─────────────────────────────────────────────────────────────────

export const listDgCircuitTasks = async (
  filters: { bucket?: string; source?: string; search?: string; limit?: number },
  actor: Actor,
) => {
  ensureCanViewTasks(actor);

  const tasks: Array<Record<string, unknown> & { bucket: TaskBucket; source: TaskSource; subject: string }> = [];

  // ── Initial requests ───────────────────────────────────────────────────────
  // Query all DGReviews for initial_request first so historical records are included.
  const allReviews = await DGReviewModel.find({ targetType: "initial_request" })
    .sort({ createdAt: -1 })
    .lean() as unknown as GenericRecord[];

  const reviewByRequestId = new Map<string, GenericRecord>();
  for (const review of allReviews) {
    const reqId = toId(review.requestId);
    if (reqId && !reviewByRequestId.has(reqId)) {
      reviewByRequestId.set(reqId, review);
    }
  }

  const reviewedRequestIds = [...reviewByRequestId.keys()].map((id) => new Types.ObjectId(id));

  const [reviewedRequests, pendingRequests] = await Promise.all([
    reviewedRequestIds.length
      ? RequestModel.find({ _id: { $in: reviewedRequestIds } })
          .populate("organizationId", "canonicalName")
          .populate("submittedById", "fullName")
          .lean()
      : Promise.resolve([]),
    // Pending: no DGReview yet, waiting to enter circuit
    RequestModel.find({
      _id: { $nin: reviewedRequestIds },
      courrierSource: { $in: ["portal_upload", "physical_deposit"] },
      status: { $in: ["submitted", "intake_in_review"] },
    })
      .populate("organizationId", "canonicalName")
      .populate("submittedById", "fullName")
      .lean(),
  ]);

  const allRequests = [...reviewedRequests, ...pendingRequests] as unknown as GenericRecord[];

  for (const request of allRequests) {
    const review = reviewByRequestId.get(request._id.toString());
    const reviewStatus = review ? String(review.status ?? "") : null;
    const courrierSource = String(request.courrierSource ?? "");
    const physicalDeposit = request.physicalDeposit as { status?: string } | undefined;
    let bucket: TaskBucket | null = null;
    const actions: string[] = [];

    if (reviewStatus === "decision_recorded") {
      bucket = "decision_recorded";
      if (can(actor, Permissions.DG_CIRCUIT_HANDLE) && review?.returnedScannedDocumentId) {
        actions.push("download_annotated_return");
      }
    } else if (reviewStatus === "returned_scanned") {
      bucket = "returned_scanned";
      if (can(actor, Permissions.DG_CIRCUIT_HANDLE) && review?.returnedScannedDocumentId) {
        actions.push("download_annotated_return");
      }
    } else if (reviewStatus === "awaiting_return" || reviewStatus === "sent_to_dg_circuit") {
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
      // No DGReview — determine bucket from request state
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
      orientedDirection: review?.orientedDirection ? String(review.orientedDirection) : undefined,
      observations: review?.observations ? String(review.observations) : undefined,
      handledByRole: review?.handledByRole ? String(review.handledByRole) : undefined,
      availableActions: actions,
    });
  }

  // ── Pre-evaluation items ───────────────────────────────────────────────────
  // Include all phases that have ever entered the pre-eval DG circuit.
  const phases = await OmaPhaseModel.find({
    phaseKey: "preliminary",
    $or: [
      {
        preliminaryStatus: {
          $in: ["pre_eval_form_submitted", "pre_eval_sent_to_dg", "pre_eval_dg_decision_recorded"],
        },
      },
      { preEvaluationSentToDgAt: { $exists: true, $ne: null } },
    ],
  })
    .sort({ updatedAt: -1 })
    .lean();

  const dossierIds = phases.map((phase) => phase.dossierId).filter(Boolean) as Types.ObjectId[];
  const dossiers = dossierIds.length
    ? await DossierModel.find({ _id: { $in: dossierIds } })
        .populate("organizationId", "canonicalName")
        .populate("postulantUserId", "fullName")
        .lean()
    : [];
  const dossierById = new Map<string, GenericRecord>();
  for (const dossier of dossiers as unknown as GenericRecord[]) {
    dossierById.set(dossier._id.toString(), dossier);
  }

  for (const phase of phases as unknown as GenericRecord[]) {
    const preliminaryStatus = String(phase.preliminaryStatus ?? "");
    const dossier = dossierById.get(toId(phase.dossierId) ?? "");
    let bucket: TaskBucket | null = null;
    const actions: string[] = [];

    if (preliminaryStatus === "pre_eval_form_submitted" && phase.completedPreEvaluationDocumentId) {
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
      (phase.preEvaluationSentToDgAt && phase.preEvaluationDgAnnotatedDocumentId)
    ) {
      // No decision field exists on OmaPhase for pre-eval — map to returned_scanned (closest available)
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
  const formalRequestPhases = await OmaPhaseModel.find({
    phaseKey: "formal_request",
    formalRequestCourrierId: { $exists: true, $ne: null },
  })
    .sort({ updatedAt: -1 })
    .lean() as unknown as GenericRecord[];

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
    formalDossierIds.length
      ? DossierModel.find({ _id: { $in: formalDossierIds } })
          .populate("organizationId", "canonicalName")
          .populate("postulantUserId", "fullName")
          .lean()
      : Promise.resolve([]),
    formalDgReviewIds.length
      ? DGReviewModel.find({ _id: { $in: formalDgReviewIds } }).lean()
      : Promise.resolve([]),
    formalCourrierIds.length
      ? CourrierModel.find({ _id: { $in: formalCourrierIds } }).select("_id documentId").lean()
      : Promise.resolve([]),
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
        const courrier = courrierId ? formalCourrierById.get(courrierId) : undefined;
        if (courrier?.documentId) actions.push("download_outgoing");
        actions.push("mark_transmitted");
      }
    } else if (reviewStatus === "awaiting_return") {
      bucket = "awaiting_return";
      if (can(actor, Permissions.DG_CIRCUIT_HANDLE)) {
        actions.push("record_annotated_return");
      }
    } else if (reviewStatus === "returned_scanned") {
      bucket = "returned_scanned";
      if (can(actor, Permissions.DG_CIRCUIT_HANDLE) && review?.returnedScannedDocumentId) {
        actions.push("download_annotated_return");
      }
      if (can(actor, Permissions.DG_DECISION_RECORD)) {
        actions.push("record_dg_decision");
      }
    } else if (reviewStatus === "decision_recorded") {
      bucket = "decision_recorded";
      if (can(actor, Permissions.DG_CIRCUIT_HANDLE) && review?.returnedScannedDocumentId) {
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
        const courrier = courrierId ? formalCourrierById.get(courrierId) : undefined;
        return courrier ? toId(courrier.documentId) : undefined;
      })(),
      annotatedReturnDocumentId: toId(review?.returnedScannedDocumentId),
      submittedAt: toIso(phase.formalRequestReceivedAt ?? phase.updatedAt),
      transmittedAt: toIso(phase.formalSentToDgAt),
      returnedAt: toIso(phase.formalDgReturnedAt),
      processedAt:
        reviewStatus === "decision_recorded"
          ? toIso(review?.decisionRecordedAt ?? phase.formalDgReturnedAt ?? phase.updatedAt)
          : undefined,
      sentToDgAt: toIso(phase.formalSentToDgAt),
      returnedFromDgAt: toIso(phase.formalDgReturnedAt),
      decisionRecordedAt: toIso(review?.decisionRecordedAt),
      decision: review?.decision != null ? String(review.decision) : undefined,
      orientedDirection: review?.orientedDirection ? String(review.orientedDirection) : undefined,
      observations: review?.observations ? String(review.observations) : undefined,
      handledByRole: review?.handledByRole ? String(review.handledByRole) : undefined,
      availableActions: actions,
    });
  }

  const toTransmit = tasks.filter((t) => t.bucket === "to_transmit").length;
  const awaitingReturn = tasks.filter((t) => t.bucket === "awaiting_return").length;
  const returnedScanned = tasks.filter((t) => t.bucket === "returned_scanned").length;
  const decisionRecorded = tasks.filter((t) => t.bucket === "decision_recorded").length;

  const counts = {
    toTransmit,
    awaitingReturn,
    returnedScanned,
    decisionRecorded,
    processed: returnedScanned + decisionRecorded, // backward compat
  };

  const limit = Number.isFinite(filters.limit) ? Math.max(1, Math.min(Number(filters.limit), 200)) : 100;

  return {
    items: tasks
      .filter((task) => taskMatches(task, filters))
      .slice(0, limit),
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
    const request = await RequestModel.findById(ownerId).lean();
    if (!request) throw new HttpError(404, "Tache introuvable");
    const review = await DGReviewModel.findOne({ requestId: request._id, targetType: "initial_request" })
      .sort({ createdAt: -1 })
      .lean();
    const isOutgoing = request.initialDocumentId?.toString() === docObjectId.toString();
    const isAnnotated = review?.returnedScannedDocumentId?.toString() === docObjectId.toString();

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
    const phase = await OmaPhaseModel.findById(ownerId).lean();
    if (!phase) throw new HttpError(404, "Tache introuvable");
    const isOutgoing = phase.completedPreEvaluationDocumentId?.toString() === docObjectId.toString();
    const isAnnotated = phase.preEvaluationDgAnnotatedDocumentId?.toString() === docObjectId.toString();

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
    const phase = await OmaPhaseModel.findById(ownerId).lean();
    if (!phase) throw new HttpError(404, "Tache introuvable");

    let isOutgoing = false;
    let isAnnotated = false;

    if (phase.formalRequestCourrierId) {
      const courrier = await CourrierModel.findById(phase.formalRequestCourrierId)
        .select("documentId")
        .lean() as unknown as { documentId?: Types.ObjectId } | null;
      isOutgoing = courrier?.documentId?.toString() === docObjectId.toString();
    }

    if (phase.formalRequestDgReviewId) {
      const review = await DGReviewModel.findById(phase.formalRequestDgReviewId)
        .lean() as unknown as GenericRecord | null;
      isAnnotated =
        review?.returnedScannedDocumentId?.toString() === docObjectId.toString();
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

  const doc = await DocumentModel.findById(docObjectId).lean();
  if (!doc) throw new HttpError(404, "Document introuvable");

  const buffer = await storageAdapter.getBuffer(doc.storageKey as string);
  return { buffer, mimeType: doc.mimeType as string, fileName: doc.fileName as string };
};
