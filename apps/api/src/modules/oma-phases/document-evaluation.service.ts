import { type HydratedDocument, Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { saveDocument } from "../../shared/utils/document.helpers.js";
import { ensureObjectId, toId, toIso } from "../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../audit/audit.service.js";
import { DocumentEvaluationModel } from "../document-evaluations/document-evaluation.model.js";
import { DocumentRequirementModel } from "../documents/document-requirement.model.js";
import { DocumentSubmissionModel } from "../documents/document-submission.model.js";
import { DossierModel } from "../dossiers/dossier.model.js";
import { NotificationModel } from "../notifications/notification.model.js";
import { PhasePaymentModel } from "../payments/phase-payment.model.js";
import { getOwnedDossier } from "./oma-phase.service.js";
import { OmaPhaseModel, type OmaPhase } from "./oma-phase.model.js";

export type Actor = {
  id: string;
  role: string;
  userType: "internal" | "postulant";
};

type GenericRecord = Record<string, unknown> & { _id: Types.ObjectId };

const ensureInternalActor = (actor: Actor) => {
  if (actor.userType !== "internal") {
    throw new HttpError(403, "Accès interne requis.");
  }
};

// ── Internal helper: load Phase 3 or throw ────────────────────────────────────

const loadDocEvalPhaseOrThrow = async (dossierObjId: Types.ObjectId) => {
  const phase = await OmaPhaseModel.findOne({
    dossierId: dossierObjId,
    phaseKey: "document_evaluation",
  });
  if (!phase) {
    throw new HttpError(404, "Phase d'évaluation approfondie non initialisée.");
  }
  if (phase.status === "closed") {
    throw new HttpError(409, "La phase d'évaluation approfondie est déjà clôturée.");
  }
  return phase;
};

// ── Internal helper: find or initialise PhasePayment for study fee ─────────────

const findOrInitPayment = async (
  dossierObjId: Types.ObjectId,
  phaseObjId: Types.ObjectId,
) => {
  let payment = await PhasePaymentModel.findOne({
    dossierId: dossierObjId,
    phaseId: phaseObjId,
    phaseKey: "document_evaluation",
    paymentType: "study_fee",
  });
  if (!payment) {
    payment = await PhasePaymentModel.create({
      dossierId: dossierObjId,
      phaseId: phaseObjId,
      phaseKey: "document_evaluation",
      paymentType: "study_fee",
      status: "invoice_pending",
    });
  }
  return payment;
};

// ── Internal helper: compute canStart ─────────────────────────────────────────

const computeCanStart = (payment: GenericRecord) =>
  !!(payment.invoiceDocumentId && payment.paymentProofDocumentId);

// ── Serialise payment for admin response ──────────────────────────────────────

const serializePayment = (payment: GenericRecord) => ({
  id: payment._id.toString(),
  paymentType: String(payment.paymentType),
  status: String(payment.status) as "invoice_pending" | "invoice_sent" | "payment_proof_submitted",
  invoiceDocumentId: toId(payment.invoiceDocumentId),
  paymentProofDocumentId: toId(payment.paymentProofDocumentId),
  invoiceSentAt: toIso(payment.invoiceSentAt),
  paymentProofSubmittedAt: toIso(payment.paymentProofSubmittedAt),
});

// ── OMA-EVAL-1: Get admin Phase 3 payment state ───────────────────────────────

export const getDocumentEvaluationPaymentState = async (
  dossierId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");

  const dossier = await DossierModel.findById(dossierObjId).lean();
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadDocEvalPhaseOrThrow(dossierObjId);

  const payment = await findOrInitPayment(
    dossierObjId,
    phase._id as Types.ObjectId,
  );
  const paymentRecord = payment as unknown as GenericRecord;

  return {
    phase: {
      id: (phase._id as Types.ObjectId).toString(),
      phaseKey: "document_evaluation" as const,
      status: String(phase.status),
      documentEvaluationStatus:
        (phase.documentEvaluationStatus as string | null | undefined) ?? null,
    },
    payment: serializePayment(paymentRecord),
    canStartDocumentEvaluation: computeCanStart(paymentRecord),
  };
};

// ── OMA-EVAL-1: Portal — get Phase 3 payment state ───────────────────────────

export const getPortalDocumentEvaluationPaymentState = async (
  dossierId: string,
  actor: Actor,
) => {
  const { dossier } = await getOwnedDossier(dossierId, actor);
  const dossierObjId = dossier._id as Types.ObjectId;

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossierObjId,
    phaseKey: "document_evaluation",
  }).lean();

  if (!phase) {
    throw new HttpError(404, "Phase d'évaluation approfondie non disponible.");
  }

  const payment = await PhasePaymentModel.findOne({
    dossierId: dossierObjId,
    phaseKey: "document_evaluation",
    paymentType: "study_fee",
  }).lean() as unknown as GenericRecord | null;

  const paymentStatus = payment
    ? (String(payment.status) as "invoice_pending" | "invoice_sent" | "payment_proof_submitted")
    : "invoice_pending";

  const canUploadPaymentProof =
    paymentStatus === "invoice_sent" || paymentStatus === "payment_proof_submitted";

  return {
    phaseStatus: String(phase.status),
    documentEvaluationStatus:
      ((phase as unknown as GenericRecord).documentEvaluationStatus as string | null) ?? null,
    payment: {
      status: paymentStatus,
      invoiceDocumentId: payment ? toId(payment.invoiceDocumentId) : undefined,
      paymentProofDocumentId: payment ? toId(payment.paymentProofDocumentId) : undefined,
      invoiceSentAt: payment ? toIso(payment.invoiceSentAt) : undefined,
      paymentProofSubmittedAt: payment ? toIso(payment.paymentProofSubmittedAt) : undefined,
    },
    canUploadPaymentProof,
  };
};

// ── OMA-EVAL-1: Admin/S5 — upload study fee invoice ──────────────────────────

export const uploadStudyFeeInvoice = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  payload: {
    invoiceReference?: string;
    issuedAt?: string;
    amount?: string;
    currency?: string;
    notes?: string;
  },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  if (!file) throw new HttpError(400, "Un fichier de facture est requis.");

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  const dossier = await DossierModel.findById(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadDocEvalPhaseOrThrow(dossierObjId);
  const phaseObjId = phase._id as Types.ObjectId;

  const payment = await findOrInitPayment(dossierObjId, phaseObjId);

  if (String(payment.status) === "payment_proof_submitted") {
    throw new HttpError(
      409,
      "Une preuve de paiement a déjà été déposée. La facture ne peut plus être modifiée.",
    );
  }

  const now = new Date();
  const title = `Facture frais d'étude — ${String(dossier.dossierNumber)}`;

  const invoiceDocumentId = await saveDocument({
    file,
    ownerPath: `dossiers/${dossierId}/phase-payments`,
    ownerType: "phase_payment",
    ownerId: payment._id,
    category: "invoice",
    documentType: "study_fee_invoice",
    title,
    visibility: "postulant_visible",
    status: "uploaded",
    uploadedById: actorObjId,
  });

  payment.invoiceDocumentId = invoiceDocumentId as unknown as typeof payment.invoiceDocumentId;
  payment.invoiceUploadedById = actorObjId as unknown as typeof payment.invoiceUploadedById;
  payment.invoiceSentAt = now as unknown as typeof payment.invoiceSentAt;
  payment.status = "invoice_sent" as never;
  await payment.save();

  phase.documentEvaluationStatus = "document_evaluation_waiting_payment" as never;
  await phase.save();

  // ── Notify postulant ──────────────────────────────────────────────────────

  if (dossier.postulantUserId) {
    await NotificationModel.create({
      recipientUserId: dossier.postulantUserId,
      channel: "in_app",
      title: "Facture de frais d'étude disponible",
      message:
        "Une facture de frais d'étude est disponible pour votre dossier. Veuillez la consulter et déposer votre preuve de paiement.",
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  // ── Audit ──────────────────────────────────────────────────────────────────

  await writeAuditLog({
    action: "document_evaluation.study_fee_invoice_uploaded",
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "phase",
    entityId: phaseObjId.toString(),
    metadata: {
      dossierId,
      invoiceDocumentId: invoiceDocumentId.toString(),
      invoiceReference: payload.invoiceReference,
    },
  });

  const paymentRecord = payment as unknown as GenericRecord;
  return {
    phase: {
      id: phaseObjId.toString(),
      phaseKey: "document_evaluation" as const,
      status: String(phase.status),
      documentEvaluationStatus: String(phase.documentEvaluationStatus),
    },
    payment: serializePayment(paymentRecord),
    canStartDocumentEvaluation: computeCanStart(paymentRecord),
  };
};

// ── OMA-EVAL-1: Portal — upload study fee payment proof ───────────────────────

export const uploadStudyFeePaymentProof = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  payload: {
    paymentReference?: string;
    paidAt?: string;
    notes?: string;
  },
  actor: Actor,
) => {
  const { dossier, portalUser } = await getOwnedDossier(dossierId, actor);

  if (!file) throw new HttpError(400, "Un fichier de preuve de paiement est requis.");

  const dossierObjId = dossier._id as Types.ObjectId;
  const postulantUserId = portalUser.userId as Types.ObjectId;

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossierObjId,
    phaseKey: "document_evaluation",
  });
  if (!phase) throw new HttpError(404, "Phase d'évaluation approfondie non disponible.");
  if (phase.status === "closed") {
    throw new HttpError(409, "La phase d'évaluation approfondie est déjà clôturée.");
  }

  const phaseObjId = phase._id as Types.ObjectId;

  const payment = await PhasePaymentModel.findOne({
    dossierId: dossierObjId,
    phaseKey: "document_evaluation",
    paymentType: "study_fee",
  });

  if (!payment) {
    throw new HttpError(409, "Aucune facture n'a encore été émise pour ce dossier.");
  }
  if (!payment.invoiceDocumentId) {
    throw new HttpError(409, "La facture doit être disponible avant de déposer la preuve de paiement.");
  }

  const now = new Date();
  const title = `Preuve de paiement — ${String((dossier as unknown as GenericRecord).dossierNumber)}`;

  const proofDocumentId = await saveDocument({
    file,
    ownerPath: `dossiers/${dossierId}/phase-payments`,
    ownerType: "phase_payment",
    ownerId: payment._id,
    category: "payment_proof",
    documentType: "study_fee_payment_proof",
    title,
    visibility: "postulant_visible",
    status: "uploaded",
    uploadedById: postulantUserId,
  });

  payment.paymentProofDocumentId = proofDocumentId as unknown as typeof payment.paymentProofDocumentId;
  payment.paymentProofUploadedById = postulantUserId as unknown as typeof payment.paymentProofUploadedById;
  payment.paymentProofSubmittedAt = now as unknown as typeof payment.paymentProofSubmittedAt;
  payment.status = "payment_proof_submitted" as never;
  await payment.save();

  phase.documentEvaluationStatus = "document_evaluation_payment_proof_submitted" as never;
  await phase.save();

  // ── Notify assigned DN agent if present ───────────────────────────────────

  const dossierRecord = dossier as unknown as GenericRecord;
  if (dossierRecord.assignedDnAgentId) {
    await NotificationModel.create({
      recipientUserId: dossierRecord.assignedDnAgentId,
      channel: "in_app",
      title: "Preuve de paiement reçue",
      message: `Une preuve de paiement a été déposée pour le dossier n° ${String(dossierRecord.dossierNumber)}.`,
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  // ── Audit ──────────────────────────────────────────────────────────────────

  await writeAuditLog({
    action: "document_evaluation.study_fee_payment_proof_uploaded",
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "phase",
    entityId: phaseObjId.toString(),
    metadata: {
      dossierId,
      proofDocumentId: proofDocumentId.toString(),
      paymentReference: payload.paymentReference,
    },
  });

  const paymentRecord = payment as unknown as GenericRecord;
  return {
    phaseStatus: String(phase.status),
    documentEvaluationStatus: String(phase.documentEvaluationStatus),
    payment: {
      status: String(payment.status) as "payment_proof_submitted",
      invoiceDocumentId: toId(paymentRecord.invoiceDocumentId),
      paymentProofDocumentId: toId(paymentRecord.paymentProofDocumentId),
      invoiceSentAt: toIso(paymentRecord.invoiceSentAt),
      paymentProofSubmittedAt: toIso(paymentRecord.paymentProofSubmittedAt),
    },
    canUploadPaymentProof: true,
  };
};

// ── OMA-EVAL-2 helpers ────────────────────────────────────────────────────────

type OmaPhaseDoc = HydratedDocument<OmaPhase>;

const PAYMENT_PASSED_STATUSES = new Set([
  "document_evaluation_payment_proof_submitted",
  "document_evaluation_study_in_progress",
  "document_evaluation_waiting_corrections",
  "document_evaluation_ready_to_close",
  "document_evaluation_closed",
]);

const initializeDocumentEvaluations = async (
  dossierObjId: Types.ObjectId,
  phase: OmaPhaseDoc,
) => {
  const formalPhase = await OmaPhaseModel.findOne({
    dossierId: dossierObjId,
    phaseKey: "formal_request",
  }).lean();
  if (!formalPhase) return;

  const submissions = await DocumentSubmissionModel.find({
    dossierId: dossierObjId,
    phaseId: formalPhase._id,
    requirementId: { $exists: true, $ne: null },
    status: { $nin: ["replaced", "archived"] },
  })
    .sort({ _id: 1 })
    .lean();

  if (submissions.length === 0) return;

  const reqObjIds = [
    ...new Set(submissions.map((s) => String(s.requirementId))),
  ].map((id) => new Types.ObjectId(id));

  const requirements = await DocumentRequirementModel.find({
    _id: { $in: reqObjIds },
  }).lean();
  const gateReqIds = new Set(
    requirements.filter((r) => r.requirementLevel === "gate").map((r) => r._id.toString()),
  );

  // Keep only the latest (highest _id) submission per non-gate requirement
  const latestByReq = new Map<string, (typeof submissions)[number]>();
  for (const sub of submissions) {
    const reqId = String(sub.requirementId);
    if (!gateReqIds.has(reqId)) {
      latestByReq.set(reqId, sub);
    }
  }

  if (latestByReq.size === 0) return;

  const formalPhaseObjId = formalPhase._id as Types.ObjectId;
  for (const sub of latestByReq.values()) {
    await DocumentEvaluationModel.updateOne(
      { phaseId: phase._id, requirementId: sub.requirementId },
      {
        $setOnInsert: {
          dossierId: dossierObjId,
          phaseId: phase._id,
          formalPhaseId: formalPhaseObjId,
          requirementId: sub.requirementId,
          submissionId: sub._id,
          status: "pending",
          annotation: null,
          reviewedById: null,
          reviewedAt: null,
          correctionSubmissionId: null,
        },
      },
      { upsert: true },
    );
  }

  const currentStatus = String(phase.documentEvaluationStatus ?? "");
  if (currentStatus === "document_evaluation_payment_proof_submitted") {
    phase.documentEvaluationStatus = "document_evaluation_study_in_progress" as never;
    await phase.save();
  }
};

// ── Compute and apply documentEvaluationStatus after a review ─────────────────

const syncEvaluationStatus = async (
  phaseObjId: Types.ObjectId,
  phase: OmaPhaseDoc,
) => {
  const counts = await DocumentEvaluationModel.aggregate<{
    _id: string;
    count: number;
  }>([
    { $match: { phaseId: phaseObjId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const pending = byStatus["pending"] ?? 0;
  const nonSatisfaisant = byStatus["non_satisfaisant"] ?? 0;
  const satisfaisant = byStatus["satisfaisant"] ?? 0;
  const correctionSubmitted = byStatus["correction_submitted"] ?? 0;

  let next: string | null = null;
  if (total === 0) {
    next = "document_evaluation_study_in_progress";
  } else if (nonSatisfaisant > 0) {
    next = "document_evaluation_waiting_corrections";
  } else if (pending === 0 && correctionSubmitted === 0 && satisfaisant === total) {
    next = "document_evaluation_ready_to_close";
  } else {
    next = "document_evaluation_study_in_progress";
  }

  if (next && String(phase.documentEvaluationStatus ?? "") !== next) {
    phase.documentEvaluationStatus = next as never;
    await phase.save();
  }
};

// ── OMA-EVAL-2: Admin — get document evaluations (+ auto-init) ─────────────────

export const getDocumentEvaluations = async (
  dossierId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");

  const dossier = await DossierModel.findById(dossierObjId).lean();
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadDocEvalPhaseOrThrow(dossierObjId);
  const phaseObjId = phase._id as Types.ObjectId;

  const docEvalStatus = String(phase.documentEvaluationStatus ?? "");
  if (PAYMENT_PASSED_STATUSES.has(docEvalStatus)) {
    await initializeDocumentEvaluations(dossierObjId, phase);
  }

  const evaluations = await DocumentEvaluationModel.find({
    phaseId: phaseObjId,
  })
    .sort({ createdAt: 1 })
    .lean();

  // Bulk-load requirements and submissions for join
  const reqIds = evaluations
    .map((e) => e.requirementId)
    .filter(Boolean) as Types.ObjectId[];
  const subIds = evaluations
    .map((e) => e.submissionId)
    .filter(Boolean) as Types.ObjectId[];

  const [requirements, submissions] = await Promise.all([
    DocumentRequirementModel.find({ _id: { $in: reqIds } }).lean(),
    DocumentSubmissionModel.find({ _id: { $in: subIds } }).lean(),
  ]);

  const reqMap = new Map(requirements.map((r) => [r._id.toString(), r]));
  const subMap = new Map(submissions.map((s) => [s._id.toString(), s]));

  const serialized = evaluations.map((ev) => {
    const req = reqMap.get(ev.requirementId?.toString() ?? "");
    const sub = subMap.get(ev.submissionId?.toString() ?? "");
    return {
      id: ev._id.toString(),
      status: String(ev.status) as "pending" | "satisfaisant" | "non_satisfaisant",
      annotation: ev.annotation ?? null,
      reviewedById: toId(ev.reviewedById as unknown as GenericRecord | null | undefined),
      reviewedAt: toIso(ev.reviewedAt as unknown as GenericRecord | null | undefined),
      requirementId: ev.requirementId?.toString() ?? null,
      requirement: req
        ? {
            code: String(req.code),
            label: String(req.label),
            requirementLevel: String(req.requirementLevel),
            documentType: String(req.documentType),
          }
        : null,
      submissionId: ev.submissionId?.toString() ?? null,
      submission: sub
        ? {
            documentId: sub.documentId?.toString() ?? null,
            status: String(sub.status),
          }
        : null,
      correctionSubmissionId: toId(
        ev.correctionSubmissionId as unknown as GenericRecord | null | undefined,
      ),
    };
  });

  const total = serialized.length;
  const pending = serialized.filter((e) => e.status === "pending").length;
  const satisfaisant = serialized.filter((e) => e.status === "satisfaisant").length;
  const nonSatisfaisant = serialized.filter((e) => e.status === "non_satisfaisant").length;

  return {
    phase: {
      id: phaseObjId.toString(),
      phaseKey: "document_evaluation" as const,
      status: String(phase.status),
      documentEvaluationStatus:
        (phase.documentEvaluationStatus as string | null | undefined) ?? null,
    },
    evaluations: serialized,
    progress: { total, pending, satisfaisant, nonSatisfaisant },
  };
};

// ── OMA-EVAL-2: Admin — review a document evaluation ─────────────────────────

export const reviewDocumentEvaluation = async (
  dossierId: string,
  evaluationId: string,
  payload: {
    status: "satisfaisant" | "non_satisfaisant";
    annotation?: string;
  },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  if (!["satisfaisant", "non_satisfaisant"].includes(payload.status)) {
    throw new HttpError(400, "Statut d'évaluation invalide.");
  }
  if (payload.status === "non_satisfaisant" && !payload.annotation?.trim()) {
    throw new HttpError(400, "Une annotation est requise pour un résultat non satisfaisant.");
  }

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const evaluationObjId = ensureObjectId(evaluationId, "Evaluation ID");
  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  const dossier = await DossierModel.findById(dossierObjId).lean();
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadDocEvalPhaseOrThrow(dossierObjId);
  const phaseObjId = phase._id as Types.ObjectId;

  const evaluation = await DocumentEvaluationModel.findOne({
    _id: evaluationObjId,
    phaseId: phaseObjId,
  });
  if (!evaluation) throw new HttpError(404, "Évaluation introuvable.");

  const now = new Date();
  evaluation.status = payload.status as never;
  evaluation.annotation = (payload.annotation?.trim() ?? null) as never;
  evaluation.reviewedById = actorObjId as unknown as typeof evaluation.reviewedById;
  evaluation.reviewedAt = now as unknown as typeof evaluation.reviewedAt;
  if (payload.status === "non_satisfaisant") {
    evaluation.correctionRequestedAt = now as unknown as typeof evaluation.correctionRequestedAt;
  }
  await evaluation.save();

  await syncEvaluationStatus(phaseObjId, phase);

  await writeAuditLog({
    action: `document_evaluation.evaluation_${payload.status}`,
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "phase",
    entityId: phaseObjId.toString(),
    metadata: {
      dossierId,
      evaluationId,
      status: payload.status,
      annotation: payload.annotation,
    },
  });

  return {
    id: evaluationObjId.toString(),
    status: payload.status,
    annotation: evaluation.annotation ?? null,
    reviewedById: actorObjId.toString(),
    reviewedAt: now.toISOString(),
    phase: {
      id: phaseObjId.toString(),
      phaseKey: "document_evaluation" as const,
      status: String(phase.status),
      documentEvaluationStatus:
        (phase.documentEvaluationStatus as string | null | undefined) ?? null,
    },
  };
};

// ── OMA-EVAL-4: Admin — close Phase 3 + unlock Phase 4 ───────────────────────

export const closeDocumentEvaluationPhase = async (
  dossierId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  const dossier = await DossierModel.findById(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  // loadDocEvalPhaseOrThrow throws 404 if missing, 409 if already closed
  const phase = await loadDocEvalPhaseOrThrow(dossierObjId);
  const phaseObjId = phase._id as Types.ObjectId;

  // ── Server-side readiness recomputation ──────────────────────────────────
  // Do not rely on stored documentEvaluationStatus — re-aggregate from DB.

  const evaluationCounts = await DocumentEvaluationModel.aggregate<{
    _id: string;
    count: number;
  }>([
    { $match: { phaseId: phaseObjId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const byStatus = Object.fromEntries(evaluationCounts.map((c) => [c._id, c.count]));
  const totalEvals = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const blocking =
    totalEvals === 0 ||
    (byStatus["pending"] ?? 0) > 0 ||
    (byStatus["non_satisfaisant"] ?? 0) > 0 ||
    (byStatus["correction_submitted"] ?? 0) > 0;

  if (blocking) {
    throw new HttpError(
      409,
      "Toutes les évaluations de documents doivent être satisfaisantes avant de clôturer la phase d'évaluation.",
    );
  }

  // ── Close Phase 3 ────────────────────────────────────────────────────────

  const now = new Date();

  phase.status = "closed" as never;
  phase.documentEvaluationStatus = "document_evaluation_closed" as never;
  phase.closedAt = now;
  phase.closedById = actorObjId;
  await phase.save();

  // ── Update dossier status ────────────────────────────────────────────────

  dossier.status = "inspection_phase" as never;
  await dossier.save();

  // ── Create/activate Phase 4 inspection ──────────────────────────────────

  let inspectionPhase = await OmaPhaseModel.findOne({
    dossierId: dossierObjId,
    phaseKey: "inspection",
  });

  if (!inspectionPhase) {
    inspectionPhase = await OmaPhaseModel.create({
      dossierId: dossierObjId,
      phaseKey: "inspection",
      status: "in_progress",
      startedAt: now,
      startedById: actorObjId,
    });
  } else if (String(inspectionPhase.status) === "not_started") {
    inspectionPhase.status = "in_progress" as never;
    if (!inspectionPhase.startedAt) inspectionPhase.startedAt = now;
    if (!inspectionPhase.startedById) inspectionPhase.startedById = actorObjId;
    await inspectionPhase.save();
  }

  const inspectionPhaseObjId = inspectionPhase._id as Types.ObjectId;

  // ── Notify postulant ─────────────────────────────────────────────────────

  if (dossier.postulantUserId) {
    await NotificationModel.create({
      recipientUserId: dossier.postulantUserId,
      channel: "in_app",
      title: "Phase d'évaluation approfondie clôturée",
      message:
        "La phase d'évaluation approfondie des documents de votre dossier est clôturée. La phase d'inspection va débuter.",
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  // ── Audit ────────────────────────────────────────────────────────────────

  await writeAuditLog({
    action: "document_evaluation.phase_closed",
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "dossier",
    entityId: dossierObjId,
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: phaseObjId.toString(),
      nextPhaseId: inspectionPhaseObjId.toString(),
      closedById: actor.id,
      previousStatus: String(phase.documentEvaluationStatus),
      newStatus: "document_evaluation_closed",
    },
  });

  return {
    phase: {
      id: phaseObjId.toString(),
      phaseKey: "document_evaluation" as const,
      status: "closed" as const,
      documentEvaluationStatus: "document_evaluation_closed" as const,
      closedAt: now.toISOString(),
    },
    nextPhase: {
      id: inspectionPhaseObjId.toString(),
      phaseKey: "inspection" as const,
      status: String(inspectionPhase.status) as "in_progress" | "not_started",
    },
    dossier: {
      id: dossierObjId.toString(),
      status: "inspection_phase" as const,
    },
  };
};

// ── OMA-EVAL-3: Portal — upload correction for a non_satisfaisant evaluation ───

export const uploadDocumentEvaluationCorrection = async (
  evaluationId: string,
  file: Express.Multer.File | undefined,
  payload: { notes?: string },
  actor: Actor,
) => {
  if (!file) throw new HttpError(400, "Un fichier de correction est requis.");

  const evaluationObjId = ensureObjectId(evaluationId, "Evaluation ID");

  const evaluation = await DocumentEvaluationModel.findById(evaluationObjId);
  if (!evaluation) throw new HttpError(404, "Évaluation introuvable.");

  const dossierObjId = evaluation.dossierId as unknown as Types.ObjectId;

  // Portal ownership check
  const { dossier, portalUser } = await getOwnedDossier(dossierObjId.toString(), actor);
  const postulantUserId = portalUser.userId as Types.ObjectId;

  // Load Phase 3
  const phase = await OmaPhaseModel.findById(evaluation.phaseId);
  if (!phase) throw new HttpError(404, "Phase d'évaluation introuvable.");
  if (String(phase.status) === "closed") {
    throw new HttpError(409, "La phase d'évaluation approfondie est déjà clôturée.");
  }

  const currentStatus = String(evaluation.status);
  if (currentStatus !== "non_satisfaisant") {
    throw new HttpError(
      409,
      "La correction ne peut être déposée que pour un document marqué non satisfaisant.",
    );
  }
  if (!evaluation.annotation?.trim()) {
    throw new HttpError(
      409,
      "Le document doit comporter une annotation DN avant de pouvoir déposer une correction.",
    );
  }

  const phaseObjId = phase._id as Types.ObjectId;
  const now = new Date();
  const dossierRecord = dossier as unknown as GenericRecord;
  const title = `Document corrigé — ${String(dossierRecord.dossierNumber)}`;

  const correctionDocumentId = await saveDocument({
    file,
    ownerPath: `dossiers/${dossierObjId.toString()}/evaluations/${evaluationId}`,
    ownerType: "phase",
    ownerId: phaseObjId,
    category: "form",
    documentType: "corrected_document",
    title,
    visibility: "postulant_visible",
    status: "uploaded",
    uploadedById: postulantUserId,
  });

  const submission = await DocumentSubmissionModel.create({
    dossierId: dossierObjId,
    phaseId: phaseObjId,
    phaseKey: "document_evaluation",
    requirementId: evaluation.requirementId,
    documentId: correctionDocumentId,
    submittedById: postulantUserId,
    submittedByRole: "postulant",
    source: "portal_upload",
    status: "submitted",
  });

  const oldSubmissionId = toId(evaluation.submissionId as unknown as GenericRecord | null | undefined);

  evaluation.submissionId = submission._id as unknown as typeof evaluation.submissionId;
  evaluation.correctionSubmissionId = submission._id as unknown as typeof evaluation.correctionSubmissionId;
  evaluation.correctionSubmittedAt = now as unknown as typeof evaluation.correctionSubmittedAt;
  evaluation.correctionSubmittedById = postulantUserId as unknown as typeof evaluation.correctionSubmittedById;
  evaluation.status = "correction_submitted" as never;
  await evaluation.save();

  await syncEvaluationStatus(phaseObjId, phase);

  // ── Notify assigned DN agent ───────────────────────────────────────────────

  if (dossierRecord.assignedDnAgentId) {
    await NotificationModel.create({
      recipientUserId: dossierRecord.assignedDnAgentId,
      channel: "in_app",
      title: "Document corrigé déposé",
      message: `Un document corrigé a été déposé pour le dossier n° ${String(dossierRecord.dossierNumber)}.`,
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  // ── Audit ──────────────────────────────────────────────────────────────────

  await writeAuditLog({
    action: "document_evaluation.correction_submitted",
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "phase",
    entityId: phaseObjId.toString(),
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: phaseObjId.toString(),
      evaluationId,
      requirementId: evaluation.requirementId?.toString(),
      oldSubmissionId,
      newSubmissionId: submission._id.toString(),
      newDocumentId: correctionDocumentId.toString(),
      submittedById: postulantUserId.toString(),
    },
  });

  return {
    uploaded: true,
    evaluation: {
      id: evaluationObjId.toString(),
      status: "correction_submitted" as const,
      correctionSubmissionId: submission._id.toString(),
      currentSubmissionId: submission._id.toString(),
      currentDocumentId: correctionDocumentId.toString(),
    },
    document: {
      id: correctionDocumentId.toString(),
      fileName: file.originalname,
    },
    submission: {
      id: submission._id.toString(),
      status: "submitted" as const,
    },
  };
};
