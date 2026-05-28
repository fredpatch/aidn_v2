import { apiGet, apiGetBlob, apiPost, apiPostForm } from './client';

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
  | 'formal_documents_tracking'
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

export function listDossiers(filters: {
  status?: string;
  dossierType?: string;
  search?: string;
}): Promise<{ items: AdminDossierSummary[] }> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.dossierType) params.set('dossierType', filters.dossierType);
  if (filters.search) params.set('search', filters.search);
  const query = params.toString();
  return apiGet<{ items: AdminDossierSummary[] }>(
    `/api/v1/admin/dossiers${query ? `?${query}` : ''}`,
  );
}

export function getDossier(id: string): Promise<AdminDossierDetail> {
  return apiGet<AdminDossierDetail>(`/api/v1/admin/dossiers/${id}`);
}

export function getAdminFormalRequestPhase(
  id: string,
): Promise<AdminFormalRequestPhaseState> {
  return apiGet<AdminFormalRequestPhaseState>(
    `/api/v1/admin/dossiers/${id}/phases/formal-request`,
  );
}

export function uploadFormalRequestCourrier(
  id: string,
  formData: FormData,
): Promise<AdminFormalRequestPhaseState> {
  return apiPostForm<AdminFormalRequestPhaseState>(
    `/api/v1/admin/dossiers/${id}/phases/formal-request/courrier`,
    formData,
  );
}

export function sendFormalRequestToDg(
  id: string,
): Promise<AdminFormalRequestPhaseState> {
  return apiPost<AdminFormalRequestPhaseState>(
    `/api/v1/admin/dossiers/${id}/phases/formal-request/send-to-dg`,
    {},
  );
}

export function recordFormalRequestDgReturn(
  id: string,
  formData: FormData,
): Promise<AdminFormalRequestPhaseState> {
  return apiPostForm<AdminFormalRequestPhaseState>(
    `/api/v1/admin/dossiers/${id}/phases/formal-request/dg-return`,
    formData,
  );
}

export function recordFormalRequestDgDecision(
  id: string,
  payload: {
    decision: AdminFormalRequestDgDecision;
    orientedDirection?: string;
    observations?: string;
    decisionRecordedAt?: string;
  },
): Promise<AdminFormalRequestPhaseState> {
  return apiPost<AdminFormalRequestPhaseState>(
    `/api/v1/admin/dossiers/${id}/phases/formal-request/dg-decision`,
    payload,
  );
}

export function inviteFirstMeeting(
  id: string,
  payload: { scheduledAt?: string; location?: string; notes?: string },
): Promise<{ meeting: AdminMeetingSummary }> {
  return apiPost(`/api/v1/admin/dossiers/${id}/preliminary/invite-first-meeting`, payload);
}

export function recordFirstMeeting(
  id: string,
  formData: FormData,
): Promise<{ meeting: AdminMeetingSummary }> {
  return apiPostForm(`/api/v1/admin/dossiers/${id}/preliminary/record-first-meeting`, formData);
}

export function publishPreEvaluationForm(id: string): Promise<{ documentId: string }> {
  return apiPost(
    `/api/v1/admin/dossiers/${id}/preliminary/publish-pre-evaluation-form`,
    {},
  );
}

export function sendPreEvalToDg(
  id: string,
  payload: { sentAt?: string; notes?: string },
): Promise<{ ok: boolean }> {
  return apiPost(`/api/v1/admin/dossiers/${id}/preliminary/send-pre-eval-to-dg`, payload);
}

export function recordPreEvalDgReturn(
  id: string,
  formData: FormData,
): Promise<{ documentId: string }> {
  return apiPostForm(
    `/api/v1/admin/dossiers/${id}/preliminary/record-pre-eval-dg-return`,
    formData,
  );
}

export function downloadDossierDocument(
  id: string,
  documentId: string,
): Promise<{ blob: Blob; fileName: string }> {
  return apiGetBlob(`/api/v1/admin/dossiers/${id}/documents/${documentId}`);
}

export function invitePreliminaryMeeting(
  id: string,
  payload: { scheduledAt?: string; location?: string; notes?: string },
): Promise<{ meeting: AdminMeetingSummary }> {
  return apiPost(
    `/api/v1/admin/dossiers/${id}/preliminary/invite-preliminary-meeting`,
    payload,
  );
}

export function recordPreliminaryMeeting(
  id: string,
  formData: FormData,
): Promise<{ meeting: AdminMeetingSummary }> {
  return apiPostForm(
    `/api/v1/admin/dossiers/${id}/preliminary/record-preliminary-meeting`,
    formData,
  );
}

export function uploadClosureCourrier(
  id: string,
  formData: FormData,
): Promise<{ documentId: string }> {
  return apiPostForm(
    `/api/v1/admin/dossiers/${id}/preliminary/upload-closure-courrier`,
    formData,
  );
}

export function closePreliminaryPhase(id: string): Promise<{ ok: boolean }> {
  return apiPost(`/api/v1/admin/dossiers/${id}/preliminary/close`, {});
}

export function inviteFormalMeeting(
  id: string,
  payload: { scheduledAt?: string; location?: string; notes?: string },
): Promise<AdminFormalRequestPhaseState> {
  return apiPost<AdminFormalRequestPhaseState>(
    `/api/v1/admin/dossiers/${id}/phases/formal-request/meeting`,
    payload,
  );
}

export function markFormalMeetingHeld(
  id: string,
  payload: { heldAt?: string; notes?: string },
): Promise<AdminFormalRequestPhaseState> {
  return apiPost<AdminFormalRequestPhaseState>(
    `/api/v1/admin/dossiers/${id}/phases/formal-request/meeting/mark-held`,
    payload,
  );
}

export function uploadFormalMeetingReport(
  id: string,
  formData: FormData,
): Promise<AdminFormalRequestPhaseState> {
  return apiPostForm<AdminFormalRequestPhaseState>(
    `/api/v1/admin/dossiers/${id}/phases/formal-request/meeting-report`,
    formData,
  );
}

export function closeFormalRequestPhase(
  id: string,
  payload: {
    notes?: string;
    completeness?: "complete" | "partial";
    comment?: string;
  },
): Promise<AdminFormalRequestPhaseState> {
  return apiPost<AdminFormalRequestPhaseState>(
    `/api/v1/admin/dossiers/${id}/phases/formal-request/close`,
    payload,
  );
}

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

export function adminReviewFormalRequestDocument(
  submissionId: string,
  payload: {
    status: "validated" | "requires_correction" | "incomplete";
    comment?: string;
  },
): Promise<ReviewFormalDocumentResult> {
  return apiPost<ReviewFormalDocumentResult>(
    `/api/v1/admin/document-submissions/${submissionId}/review`,
    payload,
  );
}
