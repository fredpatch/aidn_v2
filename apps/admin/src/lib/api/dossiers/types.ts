export type DossierType =
  | 'oma_approval'
  | 'oma_recognition'
  | 'oma_renewal'
  | 'oma_modification';

export type DossierStatus =
  | 'opened'
  | 'preliminary_phase'
  | 'formal_request_phase'
  | 'document_evaluation_phase'
  | 'inspection_phase'
  | 'delivery_phase'
  | 'closed'
  | 'suspended'
  | 'cancelled';

export type OmaPhaseKey =
  | 'preliminary'
  | 'formal_request'
  | 'document_evaluation'
  | 'inspection'
  | 'delivery';

export type PreliminaryStatus =
  | 'preliminary_not_started'
  | 'preliminary_started'
  | 'first_meeting_invited'
  | 'first_meeting_held'
  | 'pre_eval_form_available'
  | 'pre_eval_form_submitted'
  | 'pre_eval_sent_to_dg'
  | 'pre_eval_dg_decision_recorded'
  | 'preliminary_meeting_invited'
  | 'preliminary_meeting_held'
  | 'preliminary_ready_to_close'
  | 'preliminary_closed';

export type AdminDossierSummary = {
  id: string;
  dossierNumber?: string;
  dossierType: DossierType;
  status: DossierStatus;
  openedAt?: string;
  closedAt?: string;
  organization?: { id: string; canonicalName?: string; status?: string };
  postulant?: { id: string; fullName?: string; email?: string };
  requestId?: string;
  assignedDnAgentId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminOmaPhase = {
  id: string;
  dossierId?: string;
  phaseKey: OmaPhaseKey;
  status: string;
  preliminaryStatus: PreliminaryStatus | null;
  firstMeetingId?: string;
  preliminaryMeetingId?: string;
  preEvaluationTemplateDocumentId?: string;
  completedPreEvaluationDocumentId?: string;
  preEvaluationDgAnnotatedDocumentId?: string;
  preEvaluationSentToDgAt?: string;
  preEvaluationReturnedFromDgAt?: string;
  firstMeetingReportDocumentId?: string;
  preliminaryMeetingReportDocumentId?: string;
  closureCourrierDocumentId?: string;
  startedAt?: string;
  closedAt?: string;
};

export type AdminDossierDocumentEvidence = {
  id: string;
  title?: string;
  fileName?: string;
  documentType?: string;
  category?: string;
  uploadedAt?: string;
  uploadedById?: string;
  visibility?: 'internal_only' | 'postulant_visible';
  status?: string;
};

export type AdminMeetingSummary = {
  id: string;
  phaseId?: string;
  dossierId?: string;
  meetingType: string;
  title: string;
  status: string;
  scheduledAt?: string;
  heldAt?: string;
  location?: string;
  outlookEmailStatus?: string;
  reportDocumentId?: string;
  reportRequired?: boolean;
  notes?: string;
  createdAt?: string;
};

export type AdminDossierCourriers = {
  initialCourrier?: {
    requestId: string;
    documentId?: string;
    title?: string;
    source?: string;
    reference?: string;
    date?: string;
  };
  initialDgOrientation?: {
    requestId: string;
    documentId?: string;
    title?: string;
    decision?: string;
    returnedAt?: string;
    observations?: string;
  };
};

export type FormalRequestStatus =
  | 'formal_not_started'
  | 'formal_waiting_request'
  | 'formal_request_received'
  | 'formal_sent_to_dg'
  | 'formal_dg_returned'
  | 'formal_dg_decision_recorded'
  | 'formal_meeting_invited'
  | 'formal_meeting_held'
  | 'formal_recevability_recorded'
  | 'formal_ready_to_close'
  | 'formal_requires_correction'
  | 'formal_closed';

export type FormalRequirementLevel =
  | 'gate'
  | 'expected'
  | 'optional'
  | 'conditional';

export type FormalSubmissionStatus =
  | 'missing'
  | 'submitted'
  | 'under_review'
  | 'validated'
  | 'requires_correction'
  | 'incomplete'
  | 'rejected'
  | 'replaced'
  | 'not_applicable'
  | string;

export type FormalDocumentSource =
  | 'portal_upload'
  | 'physical_deposit'
  | 'internal_scan'
  | string;

export type AdminFormalRequestCourrierSource =
  | 'physical_deposit'
  | 'internal_scan';

export type AdminFormalRequestDgDecision =
  | 'approved'
  | 'rejected'
  | 'reoriented'
  | 'pending';

export type AdminFormalRequestSubmission = {
  submissionId: string;
  documentId: string;
  uploadedAt?: string;
  status: FormalSubmissionStatus;
  uploadedById?: string | null;
  source?: FormalDocumentSource;
  reviewComment?: string;
};

export type AdminFormalRequestRequirement = {
  requirementId: string;
  code: string;
  label: string;
  formCode?: string;
  requirementLevel: FormalRequirementLevel;
  documentType: string;
  isRepeatable: boolean;
  status: FormalSubmissionStatus;
  submissions: AdminFormalRequestSubmission[];
};

export type AdminFormalRequestPhaseState = {
  phase: {
    id: string;
    phaseKey: 'formal_request';
    status: string;
    formalRequestStatus: FormalRequestStatus | null;
    canSendToDg: boolean;
    canInviteFormalMeeting: boolean;
    canClosePhase: boolean;
  };
  gate: {
    exists: boolean;
    formalRequestCourrierId?: string | null;
    source?: FormalDocumentSource;
    receivedAt?: string;
  };
  requirements: AdminFormalRequestRequirement[];
  meeting: {
    id: string;
    status: string;
    scheduledAt?: string;
    location?: string;
    outlookEmailStatus?: string;
    outlookEmailSentAt?: string;
    reportDocumentId?: string | null;
  } | null;
  progress: {
    totalTracked: number;
    submitted: number;
    validated: number;
    missing: number;
    completionRate: number;
    blockingMissing: boolean;
  };
  closure: {
    recevabilityCourrierDocumentId?: string | null;
    phaseClosureCourrierDocumentId?: string | null;
    canClosePhase: boolean;
  };
};

export type AdminDossierDetail = {
  dossier: Omit<AdminDossierSummary, 'organization' | 'postulant'> & {
    organization?: {
      id: string;
      canonicalName?: string;
      status?: string;
      legalAddress?: string;
      email?: string;
      phone?: string;
    };
    postulant?: {
      id: string;
      fullName?: string;
      email?: string;
      phone?: string;
    };
  };
  phases: AdminOmaPhase[];
  preliminary: {
    phase: AdminOmaPhase;
    firstMeeting: AdminMeetingSummary | null;
    preliminaryMeeting: AdminMeetingSummary | null;
    documentEvidence?: {
      preEvaluationTemplateDocument: AdminDossierDocumentEvidence | null;
      completedPreEvaluationDocument: AdminDossierDocumentEvidence | null;
      preEvaluationDgAnnotatedDocument: AdminDossierDocumentEvidence | null;
      firstMeetingReportDocument: AdminDossierDocumentEvidence | null;
      preliminaryMeetingReportDocument: AdminDossierDocumentEvidence | null;
      closureCourrierDocument: AdminDossierDocumentEvidence | null;
    } | null;
  } | null;
  courriers?: AdminDossierCourriers;
};

export type ListDossiersFilters = {
  status?: string;
  dossierType?: string;
  search?: string;
};

export type ReviewFormalDocumentResult = {
  submission: {
    id: string;
    status: string;
    reviewComment?: string;
    reviewedAt: string;
    reviewedById: string;
  };
  document: { id: string; status: string };
};

export type DocumentEvaluationStatus =
  | 'pending'
  | 'satisfaisant'
  | 'non_satisfaisant'
  | 'correction_submitted';

export type DocumentEvaluationPhaseStatus =
  | 'document_evaluation_waiting_invoice'
  | 'document_evaluation_waiting_payment'
  | 'document_evaluation_payment_proof_submitted'
  | 'document_evaluation_study_in_progress'
  | 'document_evaluation_waiting_corrections'
  | 'document_evaluation_ready_to_close'
  | 'document_evaluation_closed';

export type PhasePaymentStatus =
  | 'invoice_pending'
  | 'invoice_sent'
  | 'payment_proof_submitted';

export type AdminDocumentEvaluationPhase = {
  id: string;
  phaseKey: 'document_evaluation';
  status: string;
  documentEvaluationStatus: DocumentEvaluationPhaseStatus | null;
  startedAt?: string | null;
  closedAt?: string | null;
};

export type AdminDocumentEvaluationPayment = {
  id?: string;
  paymentType: string;
  status: PhasePaymentStatus;
  invoiceDocumentId?: string | null;
  paymentProofDocumentId?: string | null;
  invoiceSentAt?: string | null;
  paymentProofSubmittedAt?: string | null;
};

export type AdminDocumentEvaluationPaymentState = {
  phase: AdminDocumentEvaluationPhase;
  payment: AdminDocumentEvaluationPayment;
  canStartDocumentEvaluation: boolean;
};

export type AdminDocumentEvaluationRequirement = {
  code: string;
  label: string;
  requirementLevel: string;
  documentType: string;
};

export type AdminDocumentEvaluationSubmission = {
  documentId: string | null;
  status: string;
};

export type AdminDocumentEvaluationItem = {
  id: string;
  status: DocumentEvaluationStatus;
  annotation?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  requirementId?: string | null;
  submissionId?: string | null;
  correctionSubmissionId?: string | null;
  correctionDocument?: { documentId: string | null } | null;
  requirement: AdminDocumentEvaluationRequirement | null;
  submission: AdminDocumentEvaluationSubmission | null;
};

export type AdminDocumentEvaluationProgress = {
  total: number;
  pending: number;
  satisfaisant: number;
  nonSatisfaisant: number;
};

export type AdminDocumentEvaluationState = {
  phase: AdminDocumentEvaluationPhase;
  evaluations: AdminDocumentEvaluationItem[];
  progress: AdminDocumentEvaluationProgress;
};

export type AdminDocumentEvaluationReviewPayload = {
  status: 'satisfaisant' | 'non_satisfaisant';
  annotation?: string;
};

export type AdminDocumentEvaluationReviewResult = {
  id: string;
  status: DocumentEvaluationStatus;
  annotation: string | null;
  reviewedById: string;
  reviewedAt: string;
  phase: AdminDocumentEvaluationPhase;
};

export type AdminDocumentEvaluationCloseResult = {
  phase: AdminDocumentEvaluationPhase & { closedAt: string };
  nextPhase: {
    id: string;
    phaseKey: 'inspection';
    status: string;
  };
  dossier: {
    id: string;
    status: 'inspection_phase';
  };
};
