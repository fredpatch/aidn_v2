export type PortalDocumentEvaluationStatus =
  | "pending"
  | "satisfaisant"
  | "non_satisfaisant"
  | "correction_submitted";

export type PortalDocumentEvaluationPhaseStatus =
  | "document_evaluation_waiting_invoice"
  | "document_evaluation_waiting_payment"
  | "document_evaluation_payment_proof_submitted"
  | "document_evaluation_study_in_progress"
  | "document_evaluation_waiting_corrections"
  | "document_evaluation_ready_to_close"
  | "document_evaluation_closed";

export type PortalPhasePaymentStatus =
  | "invoice_pending"
  | "invoice_sent"
  | "payment_proof_submitted";

export type PortalDocumentEvaluationPhase = {
  id: string;
  phaseKey: "document_evaluation";
  status: string;
  documentEvaluationStatus: PortalDocumentEvaluationPhaseStatus | null;
};

export type PortalPhase3Payment = {
  status: PortalPhasePaymentStatus;
  invoiceDocumentId?: string | null;
  paymentProofDocumentId?: string | null;
  invoiceSentAt?: string | null;
  paymentProofSubmittedAt?: string | null;
};

export type PortalDocumentEvaluationEntry = {
  evaluationId: string;
  requirementLabel: string;
  requirementCode?: string | null;
  formCode?: string | null;
  status: PortalDocumentEvaluationStatus;
  annotation?: string | null;
  correctionRequestedAt?: string | null;
  correctionSubmittedAt?: string | null;
  canUploadCorrection: boolean;
};

export type PortalDocumentEvaluationProgress = {
  total: number;
  pending: number;
  satisfaisant: number;
  nonSatisfaisant: number;
  correctionSubmitted: number;
};

export type PortalPhase3State = {
  phase: PortalDocumentEvaluationPhase;
  payment: PortalPhase3Payment;
  canUploadPaymentProof: boolean;
  evaluations: PortalDocumentEvaluationEntry[];
  progress: PortalDocumentEvaluationProgress;
};

export type PortalPaymentProofUploadResult = {
  phaseStatus: string;
  documentEvaluationStatus: string;
  payment: PortalPhase3Payment;
  canUploadPaymentProof: boolean;
};

export type PortalCorrectionUploadResult = {
  uploaded: boolean;
  evaluation: {
    id: string;
    status: "correction_submitted";
    correctionSubmissionId?: string | null;
    currentSubmissionId?: string | null;
    currentDocumentId?: string | null;
  };
  document?: {
    id: string;
    fileName?: string;
  };
  submission?: {
    id: string;
    status: string;
  };
};
