import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const documentTemplateSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    title: { type: String, required: true, trim: true },
    phaseKey: { type: String, enum: ["preliminary", "formal_request", "document_evaluation", "inspection", "delivery"] },
    documentType: {
      type: String,
      enum: ["pre_evaluation_blank_form", "certificate_template", "letter_template", "other"],
      required: true
    },
    fileDocumentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    isActive: { type: Boolean, default: true, index: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export type DocumentTemplate = InferSchemaType<typeof documentTemplateSchema> & { _id: Types.ObjectId };
export const DocumentTemplateModel = model("DocumentTemplate", documentTemplateSchema, "document_templates");
