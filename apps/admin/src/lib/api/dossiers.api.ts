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
