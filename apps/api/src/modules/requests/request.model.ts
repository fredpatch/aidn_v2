import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const requestSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "PostulantOrganization", required: true, index: true },
    submittedById: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requestType: {
      type: String,
      enum: ["oma_approval", "oma_recognition", "oma_renewal", "oma_modification"],
      required: true
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "courrier_uploaded",
        "courrier_physical_declared",
        "intake_in_review",
        "intake_requires_correction",
        "initial_sent_to_dg",
        "initial_dg_returned",
        "initial_dg_decision_recorded",
        "oriented_to_dn",
        "rejected",
        "reoriented",
        "dossier_opened",
        "closed"
      ],
      default: "draft",
      index: true
    },
    courrierSource: { type: String, enum: ["portal_upload", "physical_deposit"] },
    initialCourrierId: { type: Schema.Types.ObjectId, ref: "Courrier" },
    initialDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    physicalDeposit: {
      declaredAt: { type: Date },
      declaredById: { type: Schema.Types.ObjectId, ref: "User" },
      expectedDepositDate: { type: Date },
      physicalDepositDate: { type: Date },
      location: { type: String, enum: ["ANAC", "DG", "DN", "other"] },
      notes: { type: String, trim: true }
    },
    intake: {
      startedAt: { type: Date },
      startedById: { type: Schema.Types.ObjectId, ref: "User" },
      correctionRequestedAt: { type: Date },
      correctionRequestedById: { type: Schema.Types.ObjectId, ref: "User" },
      correctionReason: { type: String, trim: true },
      printedForDgAt: { type: Date },
      printedForDgById: { type: Schema.Types.ObjectId, ref: "User" },
      sentToDgAt: { type: Date },
      sentToDgById: { type: Schema.Types.ObjectId, ref: "User" },
      notes: { type: String, trim: true }
    },
    initialDgReviewId: { type: Schema.Types.ObjectId, ref: "DGReview" },
    dossierId: { type: Schema.Types.ObjectId, ref: "Dossier" },
    submittedAt: { type: Date },
    closedAt: { type: Date }
  },
  { timestamps: true }
);

requestSchema.index({ submittedAt: 1 });
requestSchema.index({ createdAt: 1 });

export type AidnRequest = InferSchemaType<typeof requestSchema> & { _id: Types.ObjectId };
export const RequestModel = model("Request", requestSchema, "requests");
