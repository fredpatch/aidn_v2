/**
 * Document evaluation shared helpers.
 *
 * Owns Phase III loading, payment response formatting, evaluation bootstrap,
 * and status synchronization used by the focused document-evaluation services.
 */
import { type HydratedDocument, Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { toId, toIso } from "../../../shared/utils/service.helpers.js";
import { DocumentEvaluationModel } from "../../document-evaluations/document-evaluation.model.js";
import { DocumentRequirementModel } from "../../documents/document-requirement.model.js";
import { DocumentSubmissionModel } from "../../documents/document-submission.model.js";
import { PhasePaymentModel } from "../../payments/phase-payment.model.js";
import { DOCUMENT_EVALUATION_PAYMENT_PASSED_STATUSES } from "../constants/document-evaluation.constants.js";
import { OmaPhaseModel, type OmaPhase } from "../models/oma-phase.model.js";
import type { GenericRecord } from "../types/oma.types.js";

export type DocumentEvaluationStatus =
  | "pending"
  | "satisfaisant"
  | "non_satisfaisant"
  | "correction_submitted";

export type OmaPhaseDoc = HydratedDocument<OmaPhase>;

export const loadDocEvalPhaseOrThrow = async (
  dossierObjId: Types.ObjectId,
) => {
  const phase = await OmaPhaseModel.findOne({
    dossierId: dossierObjId,
    phaseKey: "document_evaluation",
  });
  if (!phase) {
    throw new HttpError(
      404,
      "Phase d'evaluation approfondie non initialisee.",
    );
  }
  if (phase.status === "closed") {
    throw new HttpError(
      409,
      "La phase d'evaluation approfondie est deja cloturee.",
    );
  }
  return phase;
};

export const findOrInitDocumentEvaluationPayment = async (
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

export const computeDocumentEvaluationCanStart = (payment: GenericRecord) =>
  String(payment.status) === "payment_proof_validated";

export const serializeDocumentEvaluationPayment = (payment: GenericRecord) => ({
  id: payment._id.toString(),
  paymentType: String(payment.paymentType),
  status: String(payment.status) as
    | "invoice_pending"
    | "invoice_sent"
    | "payment_proof_submitted"
    | "payment_proof_validated"
    | "payment_proof_rejected",
  invoiceDocumentId: toId(payment.invoiceDocumentId),
  paymentProofDocumentId: toId(payment.paymentProofDocumentId),
  invoiceSentAt: toIso(payment.invoiceSentAt),
  paymentProofSubmittedAt: toIso(payment.paymentProofSubmittedAt),
  paymentProofValidatedAt: toIso(payment.paymentProofValidatedAt),
  paymentProofRejectedAt: toIso(payment.paymentProofRejectedAt),
  paymentProofRejectionReason:
    (payment.paymentProofRejectionReason as string | null | undefined) ??
    undefined,
});

export const computeDocumentEvaluationProgress = <
  T extends { status: DocumentEvaluationStatus },
>(
  evaluations: T[],
) => ({
  total: evaluations.length,
  pending: evaluations.filter((e) => e.status === "pending").length,
  satisfaisant: evaluations.filter((e) => e.status === "satisfaisant").length,
  nonSatisfaisant: evaluations.filter((e) => e.status === "non_satisfaisant")
    .length,
  correctionSubmitted: evaluations.filter(
    (e) => e.status === "correction_submitted",
  ).length,
});

export const initializeDocumentEvaluations = async (
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
    requirements
      .filter((r) => r.requirementLevel === "gate")
      .map((r) => r._id.toString()),
  );

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
    phase.documentEvaluationStatus =
      "document_evaluation_study_in_progress" as never;
    await phase.save();
  }
};

export const syncEvaluationStatus = async (
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
  } else if (
    pending === 0 &&
    correctionSubmitted === 0 &&
    satisfaisant === total
  ) {
    next = "document_evaluation_ready_to_close";
  } else {
    next = "document_evaluation_study_in_progress";
  }

  if (next && String(phase.documentEvaluationStatus ?? "") !== next) {
    phase.documentEvaluationStatus = next as never;
    await phase.save();
  }
};

export const hasDocumentEvaluationPaymentGatePassed = (status: string) =>
  DOCUMENT_EVALUATION_PAYMENT_PASSED_STATUSES.has(status);
