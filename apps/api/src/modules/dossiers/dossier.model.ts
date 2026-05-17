import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const dossierSchema = new Schema(
  {
    requestId: { type: Schema.Types.ObjectId, ref: "Request", required: true, unique: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "PostulantOrganization", required: true, index: true },
    postulantUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dossierNumber: { type: String, required: true, trim: true, unique: true },
    dossierType: {
      type: String,
      enum: ["oma_approval", "oma_recognition", "oma_renewal", "oma_modification"],
      required: true
    },
    status: {
      type: String,
      enum: [
        "opened",
        "preliminary_phase",
        "formal_request_phase",
        "document_evaluation_phase",
        "inspection_phase",
        "delivery_phase",
        "closed",
        "suspended",
        "cancelled"
      ],
      default: "opened",
      index: true
    },
    assignedDnAgentId: { type: Schema.Types.ObjectId, ref: "User" },
    supervisorId: { type: Schema.Types.ObjectId, ref: "User" },
    openedAt: { type: Date, required: true },
    closedAt: { type: Date }
  },
  { timestamps: true }
);

export type Dossier = InferSchemaType<typeof dossierSchema> & { _id: Types.ObjectId };
export const DossierModel = model("Dossier", dossierSchema, "dossiers");
