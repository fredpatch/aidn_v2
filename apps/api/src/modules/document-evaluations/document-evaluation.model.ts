import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const documentEvaluationSchema = new Schema(
  {
    dossierId: { type: Schema.Types.ObjectId, ref: "Dossier", required: true, index: true },
    phaseId: { type: Schema.Types.ObjectId, ref: "OmaPhase", required: true, index: true },
    formalPhaseId: { type: Schema.Types.ObjectId, ref: "OmaPhase", required: true },
    requirementId: {
      type: Schema.Types.ObjectId,
      ref: "DocumentRequirement",
      required: true,
    },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "DocumentSubmission",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "satisfaisant", "non_satisfaisant", "correction_submitted"],
      required: true,
      default: "pending",
      index: true,
    },
    annotation: { type: String, trim: true, default: null },
    reviewedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    correctionRequestedAt: { type: Date, default: null },
    correctionSubmissionId: {
      type: Schema.Types.ObjectId,
      ref: "DocumentSubmission",
      default: null,
    },
    correctionSubmittedAt: { type: Date, default: null },
    correctionSubmittedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

documentEvaluationSchema.index({ phaseId: 1, requirementId: 1 }, { unique: true });
documentEvaluationSchema.index({ dossierId: 1, phaseId: 1, status: 1 });

export type DocumentEvaluation = InferSchemaType<typeof documentEvaluationSchema> & {
  _id: Types.ObjectId;
};
export const DocumentEvaluationModel = model(
  "DocumentEvaluation",
  documentEvaluationSchema,
  "document_evaluations",
);
