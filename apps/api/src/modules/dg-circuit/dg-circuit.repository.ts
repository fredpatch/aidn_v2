import { Types } from "mongoose";

import { storageAdapter } from "../../shared/storage/storage.adapter.js";
import { CourrierModel } from "../courriers/courrier.model.js";
import { DocumentModel } from "../documents/document.model.js";
import { DossierModel } from "../dossiers/dossier.model.js";
import { DGReviewModel } from "../dg-reviews/dg-review.model.js";
import { OmaPhaseModel } from "../oma-phases/index.js";
import { RequestModel } from "../requests/request.model.js";
import type { GenericRecord } from "./dg-circuit.types.js";

export const dgCircuitRepository = {
  findInitialRequestReviews: async () =>
    (await DGReviewModel.find({ targetType: "initial_request" })
      .sort({ createdAt: -1 })
      .lean()) as unknown as GenericRecord[],

  findRequestsByIds: async (ids: Types.ObjectId[]) =>
    ids.length
      ? ((await RequestModel.find({ _id: { $in: ids } })
          .populate("organizationId", "canonicalName")
          .populate("submittedById", "fullName")
          .lean()) as unknown as GenericRecord[])
      : [],

  findPendingInitialRequests: async (excludedIds: Types.ObjectId[]) =>
    (await RequestModel.find({
      _id: { $nin: excludedIds },
      courrierSource: { $in: ["portal_upload", "physical_deposit"] },
      status: { $in: ["submitted", "intake_in_review"] },
    })
      .populate("organizationId", "canonicalName")
      .populate("submittedById", "fullName")
      .lean()) as unknown as GenericRecord[],

  findPreliminaryDgPhases: async () =>
    (await OmaPhaseModel.find({
      phaseKey: "preliminary",
      $or: [
        {
          preliminaryStatus: {
            $in: [
              "pre_eval_form_submitted",
              "pre_eval_sent_to_dg",
              "pre_eval_dg_decision_recorded",
            ],
          },
        },
        { preEvaluationSentToDgAt: { $exists: true, $ne: null } },
      ],
    })
      .sort({ updatedAt: -1 })
      .lean()) as unknown as GenericRecord[],

  findDossiersByIds: async (ids: Types.ObjectId[]) =>
    ids.length
      ? ((await DossierModel.find({ _id: { $in: ids } })
          .populate("organizationId", "canonicalName")
          .populate("postulantUserId", "fullName")
          .lean()) as unknown as GenericRecord[])
      : [],

  findFormalRequestPhases: async () =>
    (await OmaPhaseModel.find({
      phaseKey: "formal_request",
      formalRequestCourrierId: { $exists: true, $ne: null },
    })
      .sort({ updatedAt: -1 })
      .lean()) as unknown as GenericRecord[],

  findDgReviewsByIds: async (ids: Types.ObjectId[]) =>
    ids.length
      ? ((await DGReviewModel.find({ _id: { $in: ids } }).lean()) as unknown as GenericRecord[])
      : [],

  findCourriersByIds: async (ids: Types.ObjectId[]) =>
    ids.length
      ? ((await CourrierModel.find({ _id: { $in: ids } })
          .select("_id documentId")
          .lean()) as unknown as GenericRecord[])
      : [],

  findRequestById: async (id: Types.ObjectId) =>
    (await RequestModel.findById(id).lean()) as unknown as GenericRecord | null,

  findInitialRequestReview: async (requestId: Types.ObjectId) =>
    (await DGReviewModel.findOne({
      requestId,
      targetType: "initial_request",
    })
      .sort({ createdAt: -1 })
      .lean()) as unknown as GenericRecord | null,

  findPhaseById: async (id: Types.ObjectId) =>
    (await OmaPhaseModel.findById(id).lean()) as unknown as GenericRecord | null,

  findCourrierDocumentById: async (id: Types.ObjectId) =>
    (await CourrierModel.findById(id)
      .select("documentId")
      .lean()) as unknown as { documentId?: Types.ObjectId } | null,

  findDgReviewById: async (id: Types.ObjectId) =>
    (await DGReviewModel.findById(id).lean()) as unknown as GenericRecord | null,

  findDocumentById: async (id: Types.ObjectId) =>
    (await DocumentModel.findById(id).lean()) as unknown as GenericRecord | null,

  getDocumentBuffer: (storageKey: string) => storageAdapter.getBuffer(storageKey),
};

