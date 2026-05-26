import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const documentSubmissionSchema = new Schema(
  {
    dossierId: { type: Schema.Types.ObjectId, ref: "Dossier", required: true, index: true },
    phaseId: { type: Schema.Types.ObjectId, ref: "OmaPhase", required: true },
    phaseKey: {
      type: String,
      enum: ["preliminary", "formal_request", "document_evaluation", "inspection", "delivery"],
      required: true,
    },
    requirementId: { type: Schema.Types.ObjectId, ref: "DocumentRequirement" },
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    submittedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedByRole: {
      type: String,
      enum: [
        "postulant",
        "dn_agent",
        "dn_supervisor",
        "admin",
        "dg_secretariat",
        "reception",
        "bureau_courrier",
      ],
      required: true,
    },
    source: {
      type: String,
      enum: ["portal_upload", "physical_deposit", "internal_scan"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "validated",
        "rejected",
        "requires_correction",
        "replaced",
        "archived",
      ],
      required: true,
      default: "submitted",
      index: true,
    },
    reviewComment: { type: String, trim: true },
    reviewedById: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

documentSubmissionSchema.index({ dossierId: 1, phaseKey: 1 });
documentSubmissionSchema.index({ phaseId: 1, requirementId: 1 });
documentSubmissionSchema.index({ documentId: 1 });

export type DocumentSubmission = InferSchemaType<typeof documentSubmissionSchema> & {
  _id: Types.ObjectId;
};
export const DocumentSubmissionModel = model(
  "DocumentSubmission",
  documentSubmissionSchema,
  "document_submissions",
);
