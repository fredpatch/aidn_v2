import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const dgReviewSchema = new Schema(
  {
    targetType: {
      type: String,
      enum: ["initial_request", "pre_evaluation_form", "formal_request", "phase_closure_document", "certificate_document"],
      required: true,
      index: true
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    requestId: { type: Schema.Types.ObjectId, ref: "Request", index: true },
    dossierId: { type: Schema.Types.ObjectId, ref: "Dossier", index: true },
    phaseId: { type: Schema.Types.ObjectId, ref: "OmaPhase" },
    status: {
      type: String,
      enum: ["created", "sent_to_dg_circuit", "awaiting_return", "returned_scanned", "decision_recorded", "cancelled"],
      default: "created",
      index: true
    },
    handledByRole: {
      type: String,
      enum: ["dg_secretariat", "reception", "bureau_courrier", "dn_agent", "admin"],
      required: true
    },
    handledById: { type: Schema.Types.ObjectId, ref: "User" },
    sentToDgAt: { type: Date },
    returnedFromDgAt: { type: Date },
    decision: { type: String, enum: ["oriented_to_dn", "approved", "rejected", "reoriented", "pending", null], default: null },
    orientedDirection: { type: String, trim: true },
    observations: { type: String, trim: true },
    outgoingDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    returnedScannedDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    decisionRecordedById: { type: Schema.Types.ObjectId, ref: "User" },
    decisionRecordedAt: { type: Date }
  },
  { timestamps: true }
);

export type DGReview = InferSchemaType<typeof dgReviewSchema> & { _id: Types.ObjectId };
export const DGReviewModel = model("DGReview", dgReviewSchema, "dg_reviews");
