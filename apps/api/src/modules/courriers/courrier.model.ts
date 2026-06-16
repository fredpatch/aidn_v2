import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const courrierSchema = new Schema(
  {
    requestId: { type: Schema.Types.ObjectId, ref: "Request", required: true, index: true },
    dossierId: { type: Schema.Types.ObjectId, ref: "Dossier", index: true },
    type: {
      type: String,
      enum: ["initial_request_courrier", "dg_annotated_courrier", "phase_closure_courrier", "formal_request_courrier", "other"],
      required: true
    },
    source: {
      type: String,
      enum: ["portal_upload", "physical_deposit", "internal_scan", "generated_from_template"],
      required: true
    },
    officialReference: { type: String, trim: true },
    physicalDepositDate: { type: Date },
    scannedAt: { type: Date },
    uploadedAt: { type: Date },
    documentId: { type: Schema.Types.ObjectId, ref: "Document" },
    registeredById: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

export type Courrier = InferSchemaType<typeof courrierSchema> & { _id: Types.ObjectId };
export const CourrierModel = model("Courrier", courrierSchema, "courriers");
