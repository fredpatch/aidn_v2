import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const documentRequirementSchema = new Schema(
  {
    phaseKey: {
      type: String,
      enum: ["preliminary", "formal_request", "document_evaluation", "inspection", "delivery"],
      required: true,
      index: true,
    },
    code: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    formCode: { type: String, trim: true },
    requirementLevel: {
      type: String,
      enum: ["gate", "expected", "optional", "conditional"],
      required: true,
    },
    documentType: {
      type: String,
      enum: [
        "formal_request_letter",
        "oma_approval_form",
        "management_personnel_acceptance_form",
        "cv",
        "qualification",
        "certification_staff_list",
        "mpm",
        "quality_manual",
        "sgs_manual",
        "capability_list",
        "training_program",
        "subcontractor_contract",
        "technical_structure_document",
        "compliance_statement",
        "other",
      ],
      required: true,
    },
    appliesToRequestTypes: {
      type: [String],
      enum: ["oma_approval", "oma_recognition", "oma_renewal", "oma_modification"],
    },
    isRepeatable: { type: Boolean, required: true, default: false },
    sortOrder: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true },
);

documentRequirementSchema.index({ phaseKey: 1, code: 1 }, { unique: true });
documentRequirementSchema.index({ phaseKey: 1, isActive: 1, sortOrder: 1 });

export type DocumentRequirement = InferSchemaType<typeof documentRequirementSchema> & {
  _id: Types.ObjectId;
};
export const DocumentRequirementModel = model(
  "DocumentRequirement",
  documentRequirementSchema,
  "document_requirements",
);
