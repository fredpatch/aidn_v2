import { apiGet, apiGetBlob, apiPost, apiPostForm } from './client';

export type AdminRequestType =
  | 'oma_approval'
  | 'oma_recognition'
  | 'oma_renewal'
  | 'oma_modification';

export type AdminRequestStatus =
  | 'draft'
  | 'courrier_uploaded'
  | 'courrier_physical_declared'
  | 'submitted'
  | 'intake_in_review'
  | 'intake_requires_correction'
  | 'initial_sent_to_dg'
  | 'initial_dg_returned'
  | 'initial_dg_decision_recorded'
  | 'oriented_to_dn'
  | 'rejected'
  | 'reoriented'
  | 'dossier_opened'
  | 'closed';

export type CourrierSource =
  | 'portal_upload'
  | 'physical_deposit'
  | 'internal_scan'
  | 'generated_from_template';

export type RelatedUser = {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
};

export type RelatedOrganization = {
  id: string;
  canonicalName?: string;
  status?: string;
  legalAddress?: string;
  email?: string;
  phone?: string;
};

export type AdminRequest = {
  id: string;
  organizationId: string;
  submittedById: string;
  requestType: AdminRequestType;
  subject: string;
  message?: string;
  status: AdminRequestStatus;
  portalStatusLabel?: string;
  courrierSource?: CourrierSource;
  initialCourrierId?: string;
  initialDocumentId?: string;
  physicalDeposit?: {
    declaredAt?: string;
    declaredById?: string;
    status?: 'planned' | 'received';
    expectedDepositDate?: string;
    physicalDepositDate?: string;
    location?: 'ANAC' | 'DG' | 'DN' | 'other';
    notes?: string;
  };
  intake?: {
    startedAt?: string;
    startedById?: string;
    startedBy?: RelatedUser;
    correctionRequestedAt?: string;
    correctionRequestedById?: string;
    correctionRequestedBy?: RelatedUser;
    correctionReason?: string;
    printedForDgAt?: string;
    printedForDgById?: string;
    printedForDgBy?: RelatedUser;
    sentToDgAt?: string;
    sentToDgById?: string;
    sentToDgBy?: RelatedUser;
    notes?: string;
  };
  dossierId?: string;
  organization?: RelatedOrganization;
  submittedBy?: RelatedUser;
  dgReview?: AdminDgReview;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminCourrier = {
  id: string;
  requestId: string;
  type: string;
  source: CourrierSource;
  officialReference?: string;
  physicalDepositDate?: string;
  scannedAt?: string;
  uploadedAt?: string;
  documentId?: string;
  registeredById?: string;
  notes?: string;
};

export type AdminDocument = {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  status: string;
  uploadedAt?: string;
  uploadedById?: string;
};

export type AdminDossier = {
  id: string;
  dossierNumber: string;
  dossierType: AdminRequestType;
  status: string;
  openedAt?: string;
};

export type AdminDgReview = {
  id: string;
  requestId?: string;
  status?: string;
  decision?: 'oriented_to_dn' | 'approved' | 'rejected' | 'reoriented' | 'pending' | null;
  returnedFromDgAt?: string;
  observations?: string;
  returnedScannedDocumentId?: string;
  decisionRecordedById?: string;
  decisionRecordedAt?: string;
};

export type AdminRequestDetail = {
  request: AdminRequest;
  courrier?: AdminCourrier;
  document?: AdminDocument;
  dgReview?: AdminDgReview;
};

export function listRequests(paramsInput: {
  status?: string;
  requestType?: string;
  courrierSource?: string;
  search?: string;
}): Promise<{ items: AdminRequest[] }> {
  const params = new URLSearchParams();
  if (paramsInput.status) params.set('status', paramsInput.status);
  if (paramsInput.requestType) params.set('requestType', paramsInput.requestType);
  if (paramsInput.courrierSource) params.set('courrierSource', paramsInput.courrierSource);
  if (paramsInput.search) params.set('search', paramsInput.search);
  const query = params.toString();

  return apiGet<{ items: AdminRequest[] }>(
    `/api/v1/admin/requests${query ? `?${query}` : ''}`,
  );
}

export function getRequest(id: string): Promise<AdminRequestDetail> {
  return apiGet<AdminRequestDetail>(`/api/v1/admin/requests/${id}`);
}

export function startIntake(
  id: string,
  payload: { notes?: string },
): Promise<{ request: AdminRequest }> {
  return apiPost(`/api/v1/admin/requests/${id}/start-intake`, payload);
}

export function requestCorrection(
  id: string,
  payload: { reason: string },
): Promise<{ request: AdminRequest }> {
  return apiPost(`/api/v1/admin/requests/${id}/request-correction`, payload);
}

export function registerPhysicalCourrier(
  id: string,
  formData: FormData,
): Promise<AdminRequestDetail> {
  return apiPostForm(`/api/v1/admin/requests/${id}/register-physical-courrier`, formData);
}

export function markPrintedForDg(
  id: string,
  payload: { notes?: string },
): Promise<{ request: AdminRequest }> {
  return apiPost(`/api/v1/admin/requests/${id}/mark-printed-for-dg`, payload);
}

export function recordDgReturn(
  id: string,
  formData: FormData,
): Promise<AdminRequestDetail> {
  return apiPostForm(`/api/v1/admin/requests/${id}/record-dg-return`, formData);
}

export function openDossierDn(
  id: string,
  payload: { notes?: string },
): Promise<{ request: AdminRequest; dossier: AdminDossier }> {
  return apiPost(`/api/v1/admin/requests/${id}/open-dossier-dn`, payload);
}

export function sendToDg(
  id: string,
  payload: { notes?: string },
): Promise<{ request: AdminRequest }> {
  return apiPost(`/api/v1/admin/requests/${id}/send-to-dg`, payload);
}

export function downloadRequestOrientationDocument(
  requestId: string,
  documentId: string,
): Promise<{ blob: Blob; fileName: string }> {
  return apiGetBlob(
    `/api/v1/admin/requests/${encodeURIComponent(requestId)}/documents/${encodeURIComponent(documentId)}`,
  );
}
