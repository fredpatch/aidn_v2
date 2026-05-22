import { Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { Permissions } from "../../shared/permissions/permissions.js";
import { storageAdapter } from "../../shared/storage/storage.adapter.js";
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

type TaskBucket = "to_transmit" | "awaiting_return" | "returns_to_register" | "processed";
type TaskSource = "initial_request" | "pre_evaluation";
type GenericRecord = Record<string, unknown> & { _id: Types.ObjectId };

const DG_TASK_PERMISSIONS = [
  Permissions.DG_CIRCUIT_HANDLE,
  Permissions.COURRIER_REGISTER_PHYSICAL,
  Permissions.PRE_EVAL_DG_CIRCUIT_HANDLE,
] as const;

const toId = (value: unknown) => value?.toString();
const toIso = (value: unknown) =>
  value instanceof Date ? value.toISOString() : value ? new Date(String(value)).toISOString() : undefined;

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

const taskMatches = (
  task: { bucket: TaskBucket; source: TaskSource; subject: string; organizationName?: string; applicantName?: string; reference?: string },
  filters: { bucket?: string; source?: string; search?: string },
) => {
  if (filters.bucket) {
    const requestedBucket = filters.bucket === "returns_to_register" ? "awaiting_return" : filters.bucket;
    if (task.bucket !== requestedBucket) return false;
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

const latestReviewByRequestId = async (requestIds: Types.ObjectId[]) => {
  const reviews = requestIds.length
    ? await DGReviewModel.find({ requestId: { $in: requestIds }, targetType: "initial_request" })
      .sort({ createdAt: -1 })
      .lean()
    : [];
  const byRequestId = new Map<string, GenericRecord>();

  for (const review of reviews as unknown as GenericRecord[]) {
    const requestId = toId(review.requestId);
    if (requestId && !byRequestId.has(requestId)) {
      byRequestId.set(requestId, review);
    }
  }

  return byRequestId;
};

export const listDgCircuitTasks = async (
  filters: { bucket?: string; source?: string; search?: string; limit?: number },
  actor: Actor,
) => {
  ensureCanViewTasks(actor);

  const tasks: Array<Record<string, unknown> & { bucket: TaskBucket; source: TaskSource; subject: string }> = [];

  const requestStatuses = ["submitted", "intake_in_review", "initial_sent_to_dg", "oriented_to_dn", "rejected"];
  const requests = await RequestModel.find({
    status: { $in: requestStatuses },
    courrierSource: { $in: ["portal_upload", "physical_deposit"] },
  })
    .populate("organizationId", "canonicalName")
    .populate("submittedById", "fullName")
    .sort({ updatedAt: -1 })
    .lean();

  const reviewByRequestId = await latestReviewByRequestId(requests.map((request) => request._id));

  for (const request of requests as unknown as GenericRecord[]) {
    const review = reviewByRequestId.get(request._id.toString());
    const status = String(request.status);
    const courrierSource = String(request.courrierSource ?? "");
    let bucket: TaskBucket | null = null;
    const actions: string[] = [];
    const physicalDeposit = request.physicalDeposit as { status?: string } | undefined;

    if (
      ["submitted", "intake_in_review"].includes(status) &&
      courrierSource === "portal_upload" &&
      request.initialDocumentId
    ) {
      bucket = "to_transmit";
      if (can(actor, Permissions.DG_CIRCUIT_HANDLE)) {
        actions.push("download_outgoing", "mark_transmitted");
      }
    } else if (
      status === "submitted" &&
      courrierSource === "physical_deposit" &&
      physicalDeposit?.status === "planned"
    ) {
      bucket = "to_transmit";
      if (can(actor, Permissions.COURRIER_REGISTER_PHYSICAL)) {
        actions.push("record_physical_receipt");
      }
    } else if (status === "initial_sent_to_dg") {
      bucket = "awaiting_return";
      if (can(actor, Permissions.DG_CIRCUIT_HANDLE)) {
        actions.push("record_annotated_return");
      }
    } else if (["oriented_to_dn", "rejected"].includes(status) && review?.returnedScannedDocumentId) {
      bucket = "processed";
      if (can(actor, Permissions.DG_CIRCUIT_HANDLE)) {
        actions.push("download_annotated_return");
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
      status,
      documentToTransmitId: toId(request.initialDocumentId),
      annotatedReturnDocumentId: toId(review?.returnedScannedDocumentId),
      submittedAt: toIso(request.submittedAt),
      transmittedAt: toIso((request.intake as Record<string, unknown> | undefined)?.sentToDgAt),
      returnedAt: toIso(review?.returnedFromDgAt),
      processedAt: toIso(review?.decisionRecordedAt),
      availableActions: actions,
    });
  }

  const phases = await OmaPhaseModel.find({
    phaseKey: "preliminary",
    preliminaryStatus: {
      $in: ["pre_eval_form_submitted", "pre_eval_sent_to_dg", "pre_eval_dg_decision_recorded"],
    },
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
    } else if (preliminaryStatus === "pre_eval_dg_decision_recorded" && phase.preEvaluationDgAnnotatedDocumentId) {
      bucket = "processed";
      if (can(actor, Permissions.PRE_EVAL_DG_RETURN_CONSULT)) {
        actions.push("download_annotated_return");
      }
    }

    if (!bucket) continue;

    tasks.push({
      id: `pre_evaluation:${phase._id.toString()}`,
      source: "pre_evaluation",
      bucket,
      subject: "Formulaire de pre-evaluation",
      organizationName: organizationName(dossier?.organizationId),
      applicantName: userName(dossier?.postulantUserId),
      reference: String(dossier?.dossierNumber ?? ""),
      dossierId: toId(phase.dossierId),
      phaseId: phase._id.toString(),
      status: preliminaryStatus,
      documentToTransmitId: toId(phase.completedPreEvaluationDocumentId),
      annotatedReturnDocumentId: toId(phase.preEvaluationDgAnnotatedDocumentId),
      submittedAt: toIso(phase.updatedAt),
      transmittedAt: preliminaryStatus === "pre_eval_sent_to_dg" ? toIso(phase.updatedAt) : undefined,
      processedAt: preliminaryStatus === "pre_eval_dg_decision_recorded" ? toIso(phase.updatedAt) : undefined,
      availableActions: actions,
    });
  }

  const counts = {
    toTransmit: tasks.filter((task) => task.bucket === "to_transmit").length,
    awaitingReturn: tasks.filter((task) => task.bucket === "awaiting_return").length,
    processed: tasks.filter((task) => task.bucket === "processed").length,
  };
  const limit = Number.isFinite(filters.limit) ? Math.max(1, Math.min(Number(filters.limit), 200)) : 100;

  return {
    items: tasks
      .filter((task) => taskMatches(task, filters))
      .slice(0, limit),
    counts,
  };
};

const ensureObjectId = (id: string, label: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, `${label} is invalid`);
  }
  return new Types.ObjectId(id);
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
  } else {
    throw new HttpError(400, "taskId is invalid");
  }

  const doc = await DocumentModel.findById(docObjectId).lean();
  if (!doc) throw new HttpError(404, "Document introuvable");

  const buffer = await storageAdapter.getBuffer(doc.storageKey as string);
  return { buffer, mimeType: doc.mimeType as string, fileName: doc.fileName as string };
};
