import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const documentSchema = new Schema(
  {
    ownerType: {
      type: String,
      enum: ["account_request", "request", "dossier", "phase", "meeting", "dg_review", "certificate", "document_template"],
      required: true,
      index: true
    },
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
    category: {
      type: String,
      enum: ["courrier", "form", "meeting_report", "decision", "closure_letter", "invoice", "payment_proof", "certificate", "template", "other"],
      required: true
    },
    documentType: {
      type: String,
      enum: [
        "initial_courrier",
        "dg_annotated_courrier",
        "pre_evaluation_blank_form",
        "pre_evaluation_completed_form",
        "pre_evaluation_dg_return",
        "meeting_report",
        "phase_closure_letter",
        "certificate_template",
        "other"
      ],
      required: true
    },
    title: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    fileSize: { type: Number, required: true, min: 0 },
    storageKey: { type: String, required: true, trim: true, unique: true },
    uploadedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uploadedAt: { type: Date, required: true },
    visibility: { type: String, enum: ["internal_only", "postulant_visible"], default: "internal_only", index: true },
    status: {
      type: String,
      enum: ["uploaded", "available_to_postulant", "under_review", "validated", "rejected", "requires_correction", "archived"],
      default: "uploaded",
      index: true
    },
    version: { type: Number, default: 1, min: 1 },
    replacedByDocumentId: { type: Schema.Types.ObjectId, ref: "Document" }
  },
  { timestamps: true }
);

export type AidnDocument = InferSchemaType<typeof documentSchema> & { _id: Types.ObjectId };
export const DocumentModel = model("Document", documentSchema, "documents");
