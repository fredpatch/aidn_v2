import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const omaPhaseSchema = new Schema(
  {
    dossierId: { type: Schema.Types.ObjectId, ref: "Dossier", required: true, index: true },
    phaseKey: {
      type: String,
      enum: ["preliminary", "formal_request", "document_evaluation", "inspection", "delivery"],
      required: true
    },
    status: {
      type: String,
      enum: [
        "not_started",
        "in_progress",
        "waiting_postulant",
        "waiting_dg",
        "waiting_meeting",
        "ready_to_close",
        "closed",
        "suspended"
      ],
      default: "not_started",
      index: true
    },
    preliminaryStatus: {
      type: String,
      enum: [
        "preliminary_not_started",
        "preliminary_started",
        "first_meeting_invited",
        "first_meeting_held",
        "pre_eval_form_available",
        "pre_eval_form_submitted",
        "pre_eval_sent_to_dg",
        "pre_eval_dg_returned",
        "pre_eval_dg_decision_recorded",
        "preliminary_meeting_invited",
        "preliminary_meeting_held",
        "preliminary_ready_to_close",
        "preliminary_closed",
        null
      ],
      default: null
    },
    firstMeetingId: { type: Schema.Types.ObjectId, ref: "Meeting" },
    preliminaryMeetingId: { type: Schema.Types.ObjectId, ref: "Meeting" },
    preEvaluationTemplateDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    completedPreEvaluationDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    preEvaluationDgReviewId: { type: Schema.Types.ObjectId, ref: "DGReview" },
    firstMeetingReportDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    preliminaryMeetingReportDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    closureCourrierDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    startedAt: { type: Date },
    closedAt: { type: Date },
    startedById: { type: Schema.Types.ObjectId, ref: "User" },
    closedById: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

omaPhaseSchema.index({ dossierId: 1, phaseKey: 1 }, { unique: true });

export type OmaPhase = InferSchemaType<typeof omaPhaseSchema> & { _id: Types.ObjectId };
export const OmaPhaseModel = model("OmaPhase", omaPhaseSchema, "oma_phases");
