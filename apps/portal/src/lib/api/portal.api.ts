import { portalGet, portalGetBlob, portalPatch, portalPost, portalPostForm } from "./http";

export type PortalUser = {
  id: string;
  userType: "postulant";
  fullName: string;
  email: string;
  phone?: string;
  role: "postulant";
  organizationId: string;
};

export type PortalLoginResponse = {
  user: PortalUser;
};

type PortalMeResponse = PortalUser | { user: PortalUser };

export type SubmitAccountRequestPayload = {
  requestedOrganizationName: string;
  requestedLegalAddress?: string;
  requestedEmail?: string;
  requestedPhone?: string;
  approvalNumberOrigin?: string;
  contactFullName: string;
  contactEmail: string;
  contactPhone?: string;
  password: string;
  website?: string;
  formStartedAt: number;
};

export type SubmitAccountRequestResponse = {
  request: {
    id: string;
    requestedOrganizationName: string;
    contactFullName: string;
    contactEmail: string;
    status: "submitted";
    createdAt: string;
  };
};

export function submitAccountRequest(
  payload: SubmitAccountRequestPayload,
): Promise<SubmitAccountRequestResponse> {
  return portalPost<SubmitAccountRequestResponse>(
    "/api/v1/portal/account-requests",
    payload,
    { auth: false },
  );
}

export function loginPortal(
  payload: {
    email: string;
    password: string;
  },
): Promise<{ user: PortalUser }> {
  return portalPost<PortalLoginResponse>(
    "/api/v1/portal/auth/login",
    payload,
  ).then(({ user }) => ({ user }));
}

export function getPortalMe(): Promise<{ user: PortalUser }> {
  return portalGet<PortalMeResponse>("/api/v1/portal/auth/me").then(
    (response) => ("user" in response ? response : { user: response }),
  );
}

export function logoutPortal(): Promise<{ ok: true }> {
  return portalPost<{ ok: true }>("/api/v1/portal/auth/logout", {});
}

export type PortalRequestType =
  | "oma_approval"
  | "oma_recognition"
  | "oma_renewal"
  | "oma_modification";

export type PortalRequestStatus =
  | "draft"
  | "courrier_uploaded"
  | "courrier_physical_declared"
  | "submitted"
  | "intake_in_review"
  | "intake_requires_correction"
  | "initial_sent_to_dg"
  | "initial_dg_returned"
  | "initial_dg_decision_recorded"
  | "oriented_to_dn"
  | "rejected"
  | "reoriented"
  | "dossier_opened"
  | "closed";

export type PortalRequest = {
  id: string;
  organizationId: string;
  submittedById: string;
  requestType: PortalRequestType;
  subject: string;
  message?: string;
  status: PortalRequestStatus;
  portalStatusLabel: string;
  courrierSource?: "portal_upload" | "physical_deposit";
  initialCourrierId?: string;
  initialDocumentId?: string;
  dossierId?: string;
  physicalDeposit?: {
    declaredAt?: string;
    declaredById?: string;
    status?: "planned" | "received";
    expectedDepositDate?: string;
    physicalDepositDate?: string;
    location?: "ANAC" | "DG" | "DN" | "other";
    notes?: string;
  };
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PortalDossierMeeting = {
  scheduledAt: string | null;
  location: string | null;
  status: string;
  notes: string | null;
};

export type PortalDossierPreliminary = {
  status: string | null;
  portalLabel: string;
  preEvaluationFormDocumentId: string | null;
  firstMeetingReportDocumentId: string | null;
  hasCompletedForm: boolean;
  canSubmitForm: boolean;
  firstMeeting: PortalDossierMeeting | null;
  preliminaryMeeting: PortalDossierMeeting | null;
};

export type PortalFormalRequestSubmission = {
  submissionId: string;
  uploadedAt: string;
  status: string;
  reviewComment?: string;
};

export type PortalFormalRequestTemplate = {
  templateId: string;
  title: string;
  fileName: string;
};

export type PortalFormalRequestRequirement = {
  requirementId: string;
  code: string;
  label: string;
  formCode?: string;
  requirementLevel: "expected" | "optional" | "conditional";
  isRepeatable: boolean;
  template?: PortalFormalRequestTemplate;
  status: "missing" | "submitted" | "under_review" | "validated" | "requires_correction" | "incomplete" | "rejected";
  submissions: PortalFormalRequestSubmission[];
};

export type PortalFormalRequestProgress = {
  totalTracked: number;
  submitted: number;
  validated: number;
  missing: number;
};

export type PortalDossierFormalRequest = {
  status: string | null;
  portalLabel: string;
  hasFormalRequestCourrier: boolean;
  canUploadFormalRequestCourrier: boolean;
  requirements: PortalFormalRequestRequirement[];
  progress: PortalFormalRequestProgress;
  formalMeeting: PortalDossierMeeting | null;
};

export type PortalDossierDetail = {
  dossier: {
    id: string;
    dossierNumber: string;
    dossierType: string;
    status: string;
    openedAt: string;
  };
  preliminary: PortalDossierPreliminary;
  formalRequest?: PortalDossierFormalRequest;
};

export type PortalCourrier = {
  id: string;
  requestId: string;
  type: "initial_request_courrier";
  source: "portal_upload" | "physical_deposit";
  physicalDepositDate?: string;
  uploadedAt?: string;
  documentId?: string;
  registeredById?: string;
  notes?: string;
};

export type PortalDocument = {
  id: string;
  ownerType: "request";
  ownerId: string;
  category: "courrier";
  documentType: "initial_courrier";
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  visibility: "internal_only" | "postulant_visible";
  status: string;
  version: number;
  uploadedAt: string;
};

export function createRequest(payload: {
  requestType: PortalRequestType;
  subject: string;
  message?: string;
}): Promise<{ request: PortalRequest }> {
  return portalPost<{ request: PortalRequest }>("/api/v1/portal/requests", payload);
}

export function listRequests(filters: {
  status?: PortalRequestStatus;
  requestType?: PortalRequestType;
  search?: string;
  from?: string;
  to?: string;
} = {}): Promise<{ items: PortalRequest[]; total?: number }> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return portalGet<{ items: PortalRequest[]; total?: number }>(
    `/api/v1/portal/requests${query ? `?${query}` : ""}`,
  );
}

export function getRequest(id: string): Promise<{
  request: PortalRequest;
  courrier?: PortalCourrier;
  document?: PortalDocument;
}> {
  return portalGet(`/api/v1/portal/requests/${id}`);
}

export function updateRequest(
  id: string,
  payload: {
    requestType?: PortalRequestType;
    subject?: string;
    message?: string;
  },
): Promise<{ request: PortalRequest }> {
  return portalPatch<{ request: PortalRequest }>(`/api/v1/portal/requests/${id}`, payload);
}

export function uploadRequestCourrier(
  id: string,
  payload: { file: File; notes?: string },
): Promise<{ request: PortalRequest; courrier: PortalCourrier; document: PortalDocument }> {
  const form = new FormData();
  form.set("file", payload.file);
  if (payload.notes) {
    form.set("notes", payload.notes);
  }

  return portalPostForm(`/api/v1/portal/requests/${id}/courrier`, form);
}

export function declarePhysicalDeposit(
  id: string,
  payload: {
    expectedDepositDate?: string;
    physicalDepositDate?: string;
    location?: "ANAC" | "DG" | "DN" | "other";
    notes?: string;
  },
): Promise<{ request: PortalRequest; courrier: PortalCourrier }> {
  return portalPost(`/api/v1/portal/requests/${id}/physical-deposit`, payload);
}

export function submitRequest(id: string): Promise<{ request: PortalRequest }> {
  return portalPost(`/api/v1/portal/requests/${id}/submit`, {});
}

export function getPortalDossier(id: string): Promise<PortalDossierDetail> {
  return portalGet<PortalDossierDetail>(`/api/v1/portal/dossiers/${id}`);
}

export function uploadPreEvaluationForm(
  dossierId: string,
  file: File,
): Promise<{ ok: boolean }> {
  const form = new FormData();
  form.set("file", file);
  return portalPostForm(
    `/api/v1/portal/dossiers/${dossierId}/preliminary/upload-pre-evaluation-form`,
    form,
  );
}

export function uploadFormalRequestCourrier(
  dossierId: string,
  formData: FormData,
): Promise<{
  phase: {
    id: string;
    phaseKey: "formal_request";
    status: string;
    formalRequestStatus: string;
    canSendToDg: boolean;
  };
  gate: {
    exists: boolean;
    formalRequestCourrierId?: string;
    source: "portal_upload";
    receivedAt?: string;
  };
  progress: {
    blockingMissing: boolean;
    completionRate: number | null;
  };
}> {
  return portalPostForm(
    `/api/v1/portal/dossiers/${dossierId}/phases/formal-request/courrier`,
    formData,
  );
}

export function downloadPortalDossierDocument(
  dossierId: string,
  documentId: string,
): Promise<Blob> {
  return portalGetBlob(
    `/api/v1/portal/dossiers/${dossierId}/documents/${documentId}`,
  );
}

export function uploadFormalRequestDocument(
  dossierId: string,
  requirementId: string,
  formData: FormData,
): Promise<{ ok: boolean }> {
  return portalPostForm(
    `/api/v1/portal/dossiers/${dossierId}/phases/formal-request/documents/${requirementId}`,
    formData,
  );
}

export function downloadFormalRequestTemplate(templateId: string): Promise<Blob> {
  return portalGetBlob(`/api/v1/portal/document-templates/${templateId}/download`);
}

export type PortalMeetingStatus =
  | "planned"
  | "invited"
  | "held"
  | "postponed"
  | "cancelled";

export type PortalMeeting = {
  id: string;
  dossierId: string;
  dossierNumber: string;
  dossierType: string;
  meetingType: string;
  title: string;
  scheduledAt?: string;
  location?: string;
  status: PortalMeetingStatus;
  notes?: string;
  phaseKey?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function listPortalMeetings(params: {
  from?: string;
  to?: string;
  status?: PortalMeetingStatus | "all";
} = {}): Promise<{ items: PortalMeeting[] }> {
  const query = new URLSearchParams();
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  return portalGet(`/api/v1/portal/meetings${qs ? `?${qs}` : ""}`);
}

export type PortalNotificationStatus = "unread" | "read";

export type PortalNotification = {
  id: string;
  title: string;
  message: string;
  relatedType: string;
  relatedId?: string;
  status: PortalNotificationStatus;
  createdAt: string;
  readAt?: string;
};

export function listPortalNotifications(params: {
  status?: "unread" | "read" | "all";
  limit?: number;
} = {}): Promise<{ items: PortalNotification[]; unreadCount: number }> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return portalGet(`/api/v1/portal/notifications${qs ? `?${qs}` : ""}`);
}

export function markPortalNotificationRead(
  id: string,
): Promise<{ notification: PortalNotification }> {
  return portalPost(`/api/v1/portal/notifications/${id}/read`, {});
}

export function markAllPortalNotificationsRead(): Promise<{
  updatedCount: number;
}> {
  return portalPost("/api/v1/portal/notifications/read-all", {});
}

// ── Phase 3 — Évaluation approfondie ─────────────────────────────────────────

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

export function getPortalPhase3State(
  dossierId: string,
): Promise<PortalPhase3State> {
  return portalGet<PortalPhase3State>(
    `/api/v1/portal/dossiers/${dossierId}/phases/document-evaluation`,
  );
}

export function uploadPortalPaymentProof(
  dossierId: string,
  formData: FormData,
): Promise<PortalPaymentProofUploadResult> {
  return portalPostForm<PortalPaymentProofUploadResult>(
    `/api/v1/portal/dossiers/${dossierId}/phases/document-evaluation/payment-proof`,
    formData,
  );
}

export function uploadPortalDocumentEvaluationCorrection(
  evaluationId: string,
  formData: FormData,
): Promise<PortalCorrectionUploadResult> {
  return portalPostForm<PortalCorrectionUploadResult>(
    `/api/v1/portal/document-evaluations/${evaluationId}/correction`,
    formData,
  );
}

export function submitRequestWithCourrier(
  id: string,
  payload: {
    requestType: PortalRequestType;
    subject: string;
    message?: string;
    courrierSource: "portal_upload" | "physical_deposit";
    file?: File;
    plannedPhysicalDepositDate?: string;
    depositLocation?: "ANAC" | "DG" | "DN" | "other";
    notes?: string;
  },
): Promise<{ request: PortalRequest }> {
  const form = new FormData();
  form.set("requestType", payload.requestType);
  form.set("subject", payload.subject);
  if (payload.message) form.set("message", payload.message);
  form.set("courrierSource", payload.courrierSource);
  if (payload.file) form.set("file", payload.file);
  if (payload.plannedPhysicalDepositDate) {
    form.set("plannedPhysicalDepositDate", payload.plannedPhysicalDepositDate);
  }
  if (payload.depositLocation) form.set("depositLocation", payload.depositLocation);
  if (payload.notes) form.set("notes", payload.notes);

  return portalPostForm(`/api/v1/portal/requests/${id}/submit`, form);
}
