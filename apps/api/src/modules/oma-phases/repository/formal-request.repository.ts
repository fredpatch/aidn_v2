/**
 * Formal request repository.
 *
 * Centralizes model reads shared by Phase II slices so services stay focused
 * on workflow rules and mutations. Writes remain explicit in services unless
 * the operation is a simple read/update helper already owned by another module.
 */
import { Types } from "mongoose";

import { CourrierModel } from "../../courriers/courrier.model.js";
import { DGReviewModel } from "../../dg-reviews/dg-review.model.js";
import { DocumentModel } from "../../documents/document.model.js";
import { DocumentRequirementModel } from "../../documents/document-requirement.model.js";
import { DocumentSubmissionModel } from "../../documents/document-submission.model.js";
import { DossierModel } from "../../dossiers/dossier.model.js";
import { MeetingModel } from "../../meetings/meeting.model.js";
import { OmaPhaseModel } from "../models/oma-phase.model.js";
import type { GenericRecord } from "../types/oma.types.js";

export const formalRequestRepository = {
  findDossierById: (dossierId: Types.ObjectId) =>
    DossierModel.findById(dossierId),

  findDossierByIdLean: async (dossierId: Types.ObjectId) =>
    (await DossierModel.findById(dossierId).lean()) as GenericRecord | null,

  findFormalPhaseByDossierId: (dossierId: Types.ObjectId) =>
    OmaPhaseModel.findOne({
      dossierId,
      phaseKey: "formal_request",
    }),

  findFormalPhaseByDossierIdLean: async (dossierId: Types.ObjectId) =>
    (await OmaPhaseModel.findOne({
      dossierId,
      phaseKey: "formal_request",
    }).lean()) as unknown as GenericRecord | null,

  findFormalRequirements: async () =>
    (await DocumentRequirementModel.find({
      phaseKey: "formal_request",
      isActive: true,
    })
      .sort({ sortOrder: 1 })
      .lean()) as unknown as GenericRecord[],

  findFormalSubmissionsByDossierId: async (dossierId: Types.ObjectId) =>
    (await DocumentSubmissionModel.find({
      dossierId,
      phaseKey: "formal_request",
    }).lean()) as unknown as GenericRecord[],

  findCourrierById: async (courrierId: unknown) =>
    (await CourrierModel.findById(courrierId).lean()) as GenericRecord | null,

  findMeetingById: (meetingId: unknown) => MeetingModel.findById(meetingId),

  findMeetingByIdLean: async (meetingId: unknown) =>
    (await MeetingModel.findById(meetingId).lean()) as GenericRecord | null,

  findDgReviewById: async (reviewId: unknown) =>
    (await DGReviewModel.findById(reviewId).lean()) as GenericRecord | null,

  findRequirementById: async (requirementId: Types.ObjectId) =>
    (await DocumentRequirementModel.findById(
      requirementId,
    ).lean()) as GenericRecord | null,

  findFormalGateRequirement: async () =>
    (await DocumentRequirementModel.findOne({
      phaseKey: "formal_request",
      code: "formal_request_letter",
      requirementLevel: "gate",
      isActive: true,
    }).lean()) as GenericRecord | null,

  findActiveSubmissionForRequirement: async (
    phaseId: unknown,
    requirementId: Types.ObjectId,
    statuses: string[],
  ) =>
    (await DocumentSubmissionModel.findOne({
      phaseId,
      requirementId,
      status: { $in: statuses },
    })
      .sort({ createdAt: -1 })
      .lean()) as GenericRecord | null,

  findSubmissionById: (submissionId: Types.ObjectId) =>
    DocumentSubmissionModel.findById(submissionId),

  findDocumentById: (documentId: Types.ObjectId) =>
    DocumentModel.findById(documentId),

  findPhaseById: (phaseId: unknown) => OmaPhaseModel.findById(phaseId),

  findDocumentEvaluationPhaseByDossierId: (dossierId: Types.ObjectId) =>
    OmaPhaseModel.findOne({
      dossierId,
      phaseKey: "document_evaluation",
    }),
};
