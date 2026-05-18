import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const postulantOrganizationSchema = new Schema(
  {
    canonicalName: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true, lowercase: true, index: true },
    aliases: [{ type: String, trim: true }],
    legalAddress: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    approvalNumberOrigin: { type: String, trim: true },
    status: { type: String, enum: ["active", "suspended", "archived"], default: "active", index: true }
  },
  { timestamps: true }
);

postulantOrganizationSchema.index(
  { normalizedName: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

export type PostulantOrganization = InferSchemaType<typeof postulantOrganizationSchema> & { _id: Types.ObjectId };
export const PostulantOrganizationModel = model(
  "PostulantOrganization",
  postulantOrganizationSchema,
  "postulant_organizations"
);
