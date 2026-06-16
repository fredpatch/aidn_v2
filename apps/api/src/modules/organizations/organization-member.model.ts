import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const organizationMemberSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "PostulantOrganization", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    memberRole: { type: String, enum: ["primary_contact", "representative", "viewer"], required: true },
    status: { type: String, enum: ["active", "pending", "revoked"], default: "pending", index: true },
    approvedById: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date }
  },
  { timestamps: true }
);

organizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export type OrganizationMember = InferSchemaType<typeof organizationMemberSchema> & { _id: Types.ObjectId };
export const OrganizationMemberModel = model("OrganizationMember", organizationMemberSchema, "organization_members");
