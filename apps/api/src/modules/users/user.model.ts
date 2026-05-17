import { Schema, model, type InferSchemaType, type Types } from "mongoose";

import { Roles } from "../../shared/permissions/permissions.js";

const userSchema = new Schema(
  {
    userType: { type: String, enum: ["internal", "postulant"], required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: Object.values(Roles), required: true, index: true },
    externalSource: { type: String, enum: ["official_personnel_db"] },
    externalUserId: { type: String, index: true },
    matricule: { type: String, trim: true, uppercase: true, index: true },
    service: { type: String, trim: true },
    direction: { type: String, trim: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "PostulantOrganization" },
    passwordHash: { type: String },
    isActive: { type: Boolean, default: false, index: true },
    lastLoginAt: { type: Date },
    lastSyncedAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.index({ externalSource: 1, externalUserId: 1 }, { unique: true, sparse: true });

export type User = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
export const UserModel = model("User", userSchema, "users");
