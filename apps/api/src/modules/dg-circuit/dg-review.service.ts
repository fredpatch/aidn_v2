import { Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { saveDocument } from "../../shared/utils/document.helpers.js";
import { DGReviewModel } from "../dg-reviews/dg-review.model.js";
import { toDgRole } from "./dg-circuit.helpers.js";

const DG_REVIEW_TERMINAL_STATUSES = [
  "returned_scanned",
  "decision_recorded",
  "cancelled",
] as const;

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
  const existingReview = await DGReviewModel.findOne({
    targetId: params.targetId,
    targetType: params.targetType,
  }).lean();

  if (
    existingReview?.status &&
    DG_REVIEW_TERMINAL_STATUSES.includes(
      existingReview.status as (typeof DG_REVIEW_TERMINAL_STATUSES)[number],
    )
  ) {
    throw new HttpError(409, "Le circuit DG est deja cloture pour cet element.");
  }

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
