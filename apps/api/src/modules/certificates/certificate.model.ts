import { Schema, model, type InferSchemaType, type Types } from "mongoose";

// Corrected lifecycle (per business rule clarification - the phase stays
// open through this whole sequence because time-to-deliver is the KPI
// being tracked, not just payment turnaround):
//
//   to_prepare          - created the moment payment is validated; staff
//                          confirms the info that will go on the certificate
//   printed             - staff marks printed
//   sent_for_dg_signature - staff marks sent for physical DG signature
//                          (status flip only, no document yet)
//   ready_for_collection - DN uploads the signed certificate back into the
//                          app; this single action both archives the signed
//                          document (signedDocumentId) and marks the
//                          certificate ready for pickup - there is no
//                          separate "signed"/"scanned" click
//   collected           - postulant appears in person, staff confirms
//                          identity; collectionVerifiedById is always the
//                          confirming staff member, never a named
//                          collector, since only the postulant may collect
//   archived            - optional terminal housekeeping state
const certificateSchema = new Schema(
  {
    dossierId: { type: Schema.Types.ObjectId, ref: "Dossier", required: true, index: true },
    phaseId: { type: Schema.Types.ObjectId, ref: "OmaPhase", required: true, index: true },
    certificateNumber: { type: String, required: true, trim: true, unique: true },
    certificateType: {
      type: String,
      enum: ["agrement", "reconnaissance", "renewal", "modification"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "to_prepare",
        "printed",
        "sent_for_dg_signature",
        "ready_for_collection",
        "collected",
        "archived",
      ],
      required: true,
      default: "to_prepare",
      index: true,
    },
    holderName: { type: String, trim: true, required: true },
    validUntil: { type: Date, default: null },

    linkedDocumentId: { type: Schema.Types.ObjectId, ref: "Document", default: null },
    signedDocumentId: { type: Schema.Types.ObjectId, ref: "Document", default: null },

    printedAt: { type: Date, default: null },
    printedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    sentForSignatureAt: { type: Date, default: null },
    sentForSignatureById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    signedUploadedAt: { type: Date, default: null },
    signedUploadedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    readyForCollectionAt: { type: Date, default: null },

    collectedAt: { type: Date, default: null },
    collectionVerifiedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    collectionNote: { type: String, trim: true, default: null },

    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

certificateSchema.index({ dossierId: 1 }, { unique: true });

export type Certificate = InferSchemaType<typeof certificateSchema> & {
  _id: Types.ObjectId;
};
export const CertificateModel = model("Certificate", certificateSchema, "certificates");
