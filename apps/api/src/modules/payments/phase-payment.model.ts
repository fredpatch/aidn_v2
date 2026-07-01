import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const phasePaymentSchema = new Schema(
  {
    dossierId: { type: Schema.Types.ObjectId, ref: "Dossier", required: true, index: true },
    phaseId: { type: Schema.Types.ObjectId, ref: "OmaPhase", required: true, index: true },
    phaseKey: {
      type: String,
      enum: ["document_evaluation", "inspection", "delivery"],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["study_fee", "audit_fee", "certificate_delivery_fee"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "invoice_pending",
        "invoice_sent",
        "payment_proof_submitted",
        "payment_proof_validated",
        "payment_proof_rejected",
      ],
      required: true,
      default: "invoice_pending",
      index: true,
    },
    invoiceDocumentId: { type: Schema.Types.ObjectId, ref: "Document", default: null },
    paymentProofDocumentId: { type: Schema.Types.ObjectId, ref: "Document", default: null },
    invoiceUploadedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    paymentProofUploadedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    invoiceSentAt: { type: Date, default: null },
    paymentProofSubmittedAt: { type: Date, default: null },
    paymentProofValidatedAt: { type: Date, default: null },
    paymentProofValidatedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    paymentProofRejectedAt: { type: Date, default: null },
    paymentProofRejectedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    paymentProofRejectionReason: { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

phasePaymentSchema.index(
  { dossierId: 1, phaseId: 1, phaseKey: 1, paymentType: 1 },
  { unique: true },
);
phasePaymentSchema.index({ phaseKey: 1, status: 1 });

export type PhasePayment = InferSchemaType<typeof phasePaymentSchema> & {
  _id: Types.ObjectId;
};
export const PhasePaymentModel = model("PhasePayment", phasePaymentSchema, "phase_payments");
