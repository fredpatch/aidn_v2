import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, index: true },
    dossierId: { type: Schema.Types.ObjectId, ref: "Dossier", index: true },
    requestId: { type: Schema.Types.ObjectId, ref: "Request", index: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export type AuditLog = InferSchemaType<typeof auditLogSchema> & { _id: Types.ObjectId };
export const AuditLogModel = model("AuditLog", auditLogSchema, "audit_logs");
