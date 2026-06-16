import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const accountRequestSchema = new Schema(
  {
    requestedOrganizationName: { type: String, required: true, trim: true },
    requestedLegalAddress: { type: String, trim: true },
    requestedEmail: { type: String, trim: true, lowercase: true },
    requestedPhone: { type: String, trim: true },
    approvalNumberOrigin: { type: String, trim: true },
    contactFullName: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["submitted", "under_review", "approved", "rejected"],
      default: "submitted",
      index: true
    },
    matchedOrganizationId: { type: Schema.Types.ObjectId, ref: "PostulantOrganization" },
    createdOrganizationId: { type: Schema.Types.ObjectId, ref: "PostulantOrganization" },
    resultingUserId: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedById: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true }
  },
  { timestamps: true }
);

accountRequestSchema.index({
  requestedOrganizationName: "text",
  contactFullName: "text",
  contactEmail: "text",
  requestedEmail: "text",
});
accountRequestSchema.index({ contactEmail: 1, status: 1 });

export type AccountRequest = InferSchemaType<typeof accountRequestSchema> & { _id: Types.ObjectId };
export const AccountRequestModel = model("AccountRequest", accountRequestSchema, "account_requests");
