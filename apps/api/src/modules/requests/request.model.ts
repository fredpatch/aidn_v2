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
        "courrier_physical_recorded",
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
    initialDgReviewId: { type: Schema.Types.ObjectId, ref: "DGReview" },
    dossierId: { type: Schema.Types.ObjectId, ref: "Dossier" },
    submittedAt: { type: Date },
    closedAt: { type: Date }
  },
  { timestamps: true }
);

export type AidnRequest = InferSchemaType<typeof requestSchema> & { _id: Types.ObjectId };
export const RequestModel = model("Request", requestSchema, "requests");
