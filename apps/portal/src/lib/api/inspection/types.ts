export type PortalInspectionPhaseStatus =
  | "inspection_waiting_invoice"
  | "inspection_waiting_payment"
  | "inspection_payment_proof_submitted"
  | "inspection_awaiting_r3_avis"
  | "inspection_ready_to_close"
  | "inspection_closed";

export type PortalInspectionPaymentStatus =
  | "invoice_pending"
  | "invoice_sent"
  | "payment_proof_submitted"
  | "payment_proof_validated"
  | "payment_proof_rejected";

export type PortalInspectionPhase = {
  id: string;
  phaseKey: "inspection";
  status: string;
  inspectionStatus: PortalInspectionPhaseStatus | null;
};

export type PortalInspectionPayment = {
  status: PortalInspectionPaymentStatus;
  invoiceDocumentId?: string | null;
  paymentProofDocumentId?: string | null;
  invoiceSentAt?: string | null;
  paymentProofSubmittedAt?: string | null;
  paymentProofRejectionReason?: string | null;
};

export type PortalInspectionState = {
  phaseStatus: string;
  inspectionStatus: string | null;
  payment: PortalInspectionPayment;
  canUploadPaymentProof: boolean;
};

export type PortalInspectionPaymentProofUploadResult = {
  phaseStatus: string;
  inspectionStatus: string;
  payment: PortalInspectionPayment;
  canUploadPaymentProof: boolean;
};
