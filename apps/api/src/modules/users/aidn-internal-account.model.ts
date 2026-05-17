import { Schema, model, type InferSchemaType, type Types } from "mongoose";

import { Roles } from "../../shared/permissions/permissions.js";

const aidnInternalAccountSchema = new Schema(
  {
    personnelSource: { type: String, enum: ["official_personnel_db"], required: true },
    personnelId: { type: String, required: true },
    matricule: { type: String, required: true, trim: true, uppercase: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: Object.values(Roles), required: true },
    status: { type: String, enum: ["active", "disabled"], default: "active", index: true },
    activatedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    disabledById: { type: Schema.Types.ObjectId, ref: "User" },
    disabledAt: { type: Date },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

aidnInternalAccountSchema.index({ personnelSource: 1, personnelId: 1 }, { unique: true });
aidnInternalAccountSchema.index({ matricule: 1 }, { unique: true });

export type AidnInternalAccount = InferSchemaType<typeof aidnInternalAccountSchema> & { _id: Types.ObjectId };
export const AidnInternalAccountModel = model(
  "AidnInternalAccount",
  aidnInternalAccountSchema,
  "aidn_internal_accounts"
);
