/**
 * Document evaluation repository.
 *
 * Centralizes Phase III data reads shared by payment, review, correction, and
 * closure services so they stay focused on workflow rules and mutations. Batch
 * methods reduce N+1 queries for evaluation/requirement/submission lookups.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { DocumentEvaluationModel } from "../../document-evaluations/document-evaluation.model.js";
import { DocumentRequirementModel } from "../../documents/document-requirement.model.js";
import { DocumentSubmissionModel } from "../../documents/document-submission.model.js";
import { DocumentModel } from "../../documents/document.model.js";
import { DossierModel } from "../../dossiers/dossier.model.js";
import { PhasePaymentModel } from "../../payments/phase-payment.model.js";
import { OmaPhaseModel } from "../models/oma-phase.model.js";
import type { GenericRecord } from "../types/oma.types.js";

export const documentEvaluationRepository = {
  // Dossier reads
  findDossierById: (dossierId: Types.ObjectId) =>
    DossierModel.findById(dossierId),

  findDossierByIdLean: async (dossierId: Types.ObjectId) =>
    (await DossierModel.findById(dossierId).lean()) as GenericRecord | null,

  // OMA Phase reads
  findPhaseById: (phaseId: unknown) => OmaPhaseModel.findById(phaseId),

  findPhaseByKeyLean: async (dossierId: Types.ObjectId, phaseKey: string) =>
    (await OmaPhaseModel.findOne({
      dossierId,
      phaseKey,
    }).lean()) as GenericRecord | null,

  findPhaseByKey: (dossierId: Types.ObjectId, phaseKey: string) =>
    OmaPhaseModel.findOne({
      dossierId,
      phaseKey,
    }),

  findDocEvalPhaseByDossierIdLean: async (dossierId: Types.ObjectId) => {
    const phase = await OmaPhaseModel.findOne({
      dossierId,
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
  },

  findInspectionPhaseByDossierIdLean: async (dossierId: Types.ObjectId) => {
    const phase = await OmaPhaseModel.findOne({
      dossierId,
      phaseKey: "inspection",
    });
    if (!phase) {
      throw new HttpError(404, "Phase d'inspection non initialisee.");
    }
    if (phase.status === "closed") {
      throw new HttpError(409, "La phase d'inspection est deja cloturee.");
    }
    return phase;
  },

  findDeliveryPhaseByDossierIdLean: async (dossierId: Types.ObjectId) => {
    const phase = await OmaPhaseModel.findOne({
      dossierId,
      phaseKey: "delivery",
    });
    if (!phase) {
      throw new HttpError(404, "Phase de delivrance non initialisee.");
    }
    if (phase.status === "closed") {
      throw new HttpError(409, "La phase de delivrance est deja cloturee.");
    }
    return phase;
  },

  // Phase payment reads
  findPhasePaymentOrNull: async (
    dossierId: Types.ObjectId,
    phaseKey: string,
    paymentType: string,
  ) =>
    (await PhasePaymentModel.findOne({
      dossierId,
      phaseKey,
      paymentType,
    }).lean()) as GenericRecord | null,

  findPhasePaymentOrThrow: async (
    dossierId: Types.ObjectId,
    phaseKey: string,
    paymentType: string,
  ) => {
    const payment = await PhasePaymentModel.findOne({
      dossierId,
      phaseKey,
      paymentType,
    }).lean();
    if (!payment) {
      throw new HttpError(
        409,
        "Aucun enregistrement de paiement n'existe pour cette phase.",
      );
    }
    return payment as GenericRecord;
  },

  // Document evaluation reads
  findDocumentEvaluationById: (evaluationId: Types.ObjectId) =>
    DocumentEvaluationModel.findById(evaluationId),

  findDocumentEvaluationByIdInPhase: (
    evaluationId: Types.ObjectId,
    phaseId: Types.ObjectId,
  ) =>
    DocumentEvaluationModel.findOne({
      _id: evaluationId,
      phaseId,
    }),

  findDocumentEvaluationByIdInPhaseLean: async (
    evaluationId: Types.ObjectId,
    phaseId: Types.ObjectId,
  ) =>
    (await DocumentEvaluationModel.findOne({
      _id: evaluationId,
      phaseId,
    }).lean()) as GenericRecord | null,

  findDocumentEvaluationsByPhaseId: (phaseId: Types.ObjectId) =>
    DocumentEvaluationModel.find({
      phaseId,
    }).sort({ createdAt: 1 }),

  findDocumentEvaluationsByPhaseIdLean: async (phaseId: Types.ObjectId) =>
    (await DocumentEvaluationModel.find({
      phaseId,
    })
      .sort({ createdAt: 1 })
      .lean()) as GenericRecord[],

  countDocumentEvaluationsByStatus: async (phaseId: Types.ObjectId) => {
    const counts = await DocumentEvaluationModel.aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: { phaseId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(counts.map((c) => [c._id, c.count]));
  },

  // Batch reads to reduce N+1
  findDocumentRequirementsByIds: async (requirementIds: Types.ObjectId[]) =>
    (await DocumentRequirementModel.find({
      _id: { $in: requirementIds },
    }).lean()) as GenericRecord[],

  findDocumentSubmissionsByIds: async (submissionIds: Types.ObjectId[]) =>
    (await DocumentSubmissionModel.find({
      _id: { $in: submissionIds },
    }).lean()) as GenericRecord[],

  findDocumentsByIds: async (documentIds: Types.ObjectId[]) =>
    (await DocumentModel.find({
      _id: { $in: documentIds },
    }).lean()) as GenericRecord[],

  findDocumentSubmissionsByPhaseId: async (phaseId: Types.ObjectId) =>
    (await DocumentSubmissionModel.find({
      phaseId,
    }).lean()) as GenericRecord[],
};
