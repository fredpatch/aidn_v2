import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const omaPhaseSchema = new Schema(
  {
    dossierId: {
      type: Schema.Types.ObjectId,
      ref: "Dossier",
      required: true,
      index: true,
    },
    phaseKey: {
      type: String,
      enum: [
        "preliminary",
        "formal_request",
        "document_evaluation",
        "inspection",
        "delivery",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "not_started",
        "in_progress",
        "waiting_postulant",
        "waiting_dg",
        "waiting_meeting",
        "ready_to_close",
        "closed",
        "suspended",
      ],
      default: "not_started",
      index: true,
    },
    preliminaryStatus: {
      type: String,
      enum: [
        "preliminary_not_started",
        "preliminary_started",
        "first_meeting_invited",
        "first_meeting_held",
        "pre_eval_form_available",
        "pre_eval_form_submitted",
        "pre_eval_sent_to_dg",
        "pre_eval_dg_decision_recorded",
        "preliminary_meeting_invited",
        "preliminary_meeting_held",
        "preliminary_ready_to_close",
        "preliminary_closed",
        null,
      ],
      default: null,
    },
    firstMeetingId: { type: Schema.Types.ObjectId, ref: "Meeting" },
    preliminaryMeetingId: { type: Schema.Types.ObjectId, ref: "Meeting" },
    preEvaluationTemplateDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
    completedPreEvaluationDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
    preEvaluationDgReviewId: { type: Schema.Types.ObjectId, ref: "DGReview" },
    preEvaluationDgAnnotatedDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
    preEvaluationSentToDgAt: { type: Date },
    preEvaluationReturnedFromDgAt: { type: Date },
    firstMeetingReportDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
    preliminaryMeetingReportDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
    closureCourrierDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    // ── Phase 2 - Demande formelle ───────────────────────────────────────────
    formalRequestStatus: {
      type: String,
      enum: [
        "formal_not_started",
        "formal_waiting_request",
        "formal_request_received",
        "formal_documents_tracking",
        "formal_sent_to_dg",
        "formal_dg_returned",
        "formal_dg_decision_recorded",
        "formal_meeting_invited",
        "formal_meeting_held",
        "formal_recevability_recorded",
        "formal_ready_to_close",
        "formal_closed",
        "formal_requires_correction",
        "formal_suspended",
        null,
      ],
      default: null,
    },
    formalRequestCourrierId: { type: Schema.Types.ObjectId, ref: "Courrier" },
    formalRequestDgReviewId: { type: Schema.Types.ObjectId, ref: "DGReview" },
    formalMeetingId: { type: Schema.Types.ObjectId, ref: "Meeting" },
    formalMeetingReportDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
    recevabilityCourrierDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
    phaseClosureCourrierDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
    formalRequestReceivedAt: { type: Date },
    formalSentToDgAt: { type: Date },
    formalDgReturnedAt: { type: Date },
    formalMeetingHeldAt: { type: Date },
    formalClosedAt: { type: Date },
    // ── Phase 3 - Évaluation approfondie ─────────────────────────────────────
    documentEvaluationStatus: {
      type: String,
      enum: [
        "document_evaluation_waiting_invoice",
        "document_evaluation_waiting_payment",
        "document_evaluation_payment_proof_submitted",
        "document_evaluation_study_in_progress",
        "document_evaluation_waiting_corrections",
        "document_evaluation_ready_to_close",
        "document_evaluation_closed",
        null,
      ],
      default: null,
    },
    // ── Phase 4 - Démonstration et inspection sur site ───────────────────────
    inspectionStatus: {
      type: String,
      enum: [
        "inspection_waiting_invoice",
        "inspection_waiting_payment",
        "inspection_payment_proof_submitted",
        "inspection_awaiting_r3_avis",
        "inspection_ready_to_close",
        "inspection_closed",
        null,
      ],
      default: null,
    },
    r3AvisDecision: {
      type: String,
      enum: ["conforme", "non_conforme", null],
      default: null,
    },
    r3AvisObservations: { type: String, trim: true, default: null },
    r3AvisDocumentId: { type: Schema.Types.ObjectId, ref: "Document", default: null },
    r3AvisRecordedAt: { type: Date, default: null },
    r3AvisRecordedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    inspectionClosureCourrierDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },
    // ── Phase 5 - Délivrance ───────────────────────────────────────────────
    // deliveryStatus only tracks the payment sub-flow. Once payment is
    // validated the certificate is created and its own lifecycle
    // (CertificateModel.status) drives everything until collection - the
    // phase deliberately stays "in progress" through print/sign/archive/
    // collection because time-to-deliver is the KPI being tracked here.
    deliveryStatus: {
      type: String,
      enum: [
        "delivery_waiting_invoice",
        "delivery_waiting_payment",
        "delivery_payment_proof_submitted",
        "delivery_certificate_in_progress",
        "delivery_closed",
        null,
      ],
      default: null,
    },
    deliveryClosureCourrierDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },
    deliveryApprovalDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },
    // ── Shared lifecycle ──────────────────────────────────────────────────────
    startedAt: { type: Date },
    closedAt: { type: Date },
    startedById: { type: Schema.Types.ObjectId, ref: "User" },
    closedById: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

omaPhaseSchema.index({ dossierId: 1, phaseKey: 1 }, { unique: true });

export type OmaPhase = InferSchemaType<typeof omaPhaseSchema> & {
  _id: Types.ObjectId;
};
export const OmaPhaseModel = model("OmaPhase", omaPhaseSchema, "oma_phases");
