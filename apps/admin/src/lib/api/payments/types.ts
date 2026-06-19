export type PhasePaymentTaskStatus =
  | 'invoice_pending'
  | 'invoice_sent'
  | 'payment_proof_submitted';

export type PhasePaymentPhaseKey =
  | 'document_evaluation'
  | 'inspection'
  | 'delivery';

export type PhasePaymentType =
  | 'study_fee'
  | 'audit_fee'
  | 'certificate_delivery_fee';

export type PhasePaymentTask = {
  dossierId: string;
  dossierNumber?: string | null;
  dossierStatus: string;

  organizationId?: string | null;
  organizationName: string;

  postulantUserId?: string | null;
  postulantName: string;
  postulantEmail?: string | null;

  phaseId: string;
  phaseKey: PhasePaymentPhaseKey;

  paymentId?: string | null;
  paymentType: PhasePaymentType;
  paymentStatus: PhasePaymentTaskStatus;

  invoiceDocumentId?: string | null;
  paymentProofDocumentId?: string | null;

  invoiceSentAt?: string | null;
  paymentProofSubmittedAt?: string | null;
  lastActivityAt?: string | null;
};

export type PhasePaymentTaskCounts = Record<'all' | PhasePaymentTaskStatus, number>;

export type PhasePaymentTaskFilters = {
  status?: PhasePaymentTaskStatus | 'all';
  phaseKey?: PhasePaymentPhaseKey | 'all';
  paymentType?: PhasePaymentType | 'all';
};

export type PhasePaymentTaskList = {
  items: PhasePaymentTask[];
  counts: PhasePaymentTaskCounts;
};
