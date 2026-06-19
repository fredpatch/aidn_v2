import { apiGet, apiGetBlob, apiPatch, apiPost, apiPostForm } from '../client';
import type {
  AdminDocumentEvaluationCloseResult,
  AdminDocumentEvaluationPaymentState,
  AdminDocumentEvaluationReviewPayload,
  AdminDocumentEvaluationReviewResult,
  AdminDocumentEvaluationState,
  AdminDossierDetail,
  AdminDossierSummary,
  AdminFormalRequestDgDecision,
  AdminFormalRequestPhaseState,
  AdminMeetingSummary,
  ListDossiersFilters,
  ReviewFormalDocumentResult,
} from './types';
import {
  buildDocumentEvaluationPath,
  buildDocumentEvaluationReviewPath,
  buildDocumentSubmissionReviewPath,
  buildDossierDocumentPath,
  buildDossierPath,
  buildDossiersPath,
  buildFormalRequestPath,
  buildPreliminaryPath,
} from './utils';

export type {
  AdminDocumentEvaluationCloseResult,
  AdminDocumentEvaluationItem,
  AdminDocumentEvaluationPayment,
  AdminDocumentEvaluationPaymentState,
  AdminDocumentEvaluationPhase,
  AdminDocumentEvaluationProgress,
  AdminDocumentEvaluationRequirement,
  AdminDocumentEvaluationReviewPayload,
  AdminDocumentEvaluationReviewResult,
  AdminDocumentEvaluationState,
  AdminDocumentEvaluationSubmission,
  AdminDossierCourriers,
  AdminDossierDetail,
  AdminDossierDocumentEvidence,
  AdminDossierSummary,
  AdminFormalRequestCourrierSource,
  AdminFormalRequestDgDecision,
  AdminFormalRequestPhaseState,
  AdminFormalRequestRequirement,
  AdminFormalRequestSubmission,
  AdminMeetingSummary,
  AdminOmaPhase,
  DocumentEvaluationPhaseStatus,
  DocumentEvaluationStatus,
  DossierStatus,
  DossierType,
  FormalDocumentSource,
  FormalRequirementLevel,
  FormalRequestStatus,
  FormalSubmissionStatus,
  ListDossiersFilters,
  OmaPhaseKey,
  PhasePaymentStatus,
  PreliminaryStatus,
  ReviewFormalDocumentResult,
} from './types';

export function listDossiers(filters: ListDossiersFilters): Promise<{ items: AdminDossierSummary[] }> {
  return apiGet<{ items: AdminDossierSummary[] }>(buildDossiersPath(filters));
}

export function getDossier(id: string): Promise<AdminDossierDetail> {
  return apiGet<AdminDossierDetail>(buildDossierPath(id));
}

export function getAdminFormalRequestPhase(
  id: string,
): Promise<AdminFormalRequestPhaseState> {
  return apiGet<AdminFormalRequestPhaseState>(buildFormalRequestPath(id));
}

export function uploadFormalRequestCourrier(
  id: string,
  formData: FormData,
): Promise<AdminFormalRequestPhaseState> {
  return apiPostForm<AdminFormalRequestPhaseState>(
    buildFormalRequestPath(id, 'courrier'),
    formData,
  );
}

export function sendFormalRequestToDg(
  id: string,
): Promise<AdminFormalRequestPhaseState> {
  return apiPost<AdminFormalRequestPhaseState>(
    buildFormalRequestPath(id, 'send-to-dg'),
    {},
  );
}

export function recordFormalRequestDgReturn(
  id: string,
  formData: FormData,
): Promise<AdminFormalRequestPhaseState> {
  return apiPostForm<AdminFormalRequestPhaseState>(
    buildFormalRequestPath(id, 'dg-return'),
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
    buildFormalRequestPath(id, 'dg-decision'),
    payload,
  );
}

export function inviteFirstMeeting(
  id: string,
  payload: { scheduledAt?: string; location?: string; notes?: string },
): Promise<{ meeting: AdminMeetingSummary }> {
  return apiPost(buildPreliminaryPath(id, 'invite-first-meeting'), payload);
}

export function recordFirstMeeting(
  id: string,
  formData: FormData,
): Promise<{ meeting: AdminMeetingSummary }> {
  return apiPostForm(buildPreliminaryPath(id, 'record-first-meeting'), formData);
}

export function publishPreEvaluationForm(id: string): Promise<{ documentId: string }> {
  return apiPost(buildPreliminaryPath(id, 'publish-pre-evaluation-form'), {});
}

export function sendPreEvalToDg(
  id: string,
  payload: { sentAt?: string; notes?: string },
): Promise<{ ok: boolean }> {
  return apiPost(buildPreliminaryPath(id, 'send-pre-eval-to-dg'), payload);
}

export function recordPreEvalDgReturn(
  id: string,
  formData: FormData,
): Promise<{ documentId: string }> {
  return apiPostForm(buildPreliminaryPath(id, 'record-pre-eval-dg-return'), formData);
}

export function downloadDossierDocument(
  id: string,
  documentId: string,
): Promise<{ blob: Blob; fileName: string }> {
  return apiGetBlob(buildDossierDocumentPath(id, documentId));
}

export function invitePreliminaryMeeting(
  id: string,
  payload: { scheduledAt?: string; location?: string; notes?: string },
): Promise<{ meeting: AdminMeetingSummary }> {
  return apiPost(buildPreliminaryPath(id, 'invite-preliminary-meeting'), payload);
}

export function recordPreliminaryMeeting(
  id: string,
  formData: FormData,
): Promise<{ meeting: AdminMeetingSummary }> {
  return apiPostForm(buildPreliminaryPath(id, 'record-preliminary-meeting'), formData);
}

export function uploadClosureCourrier(
  id: string,
  formData: FormData,
): Promise<{ documentId: string }> {
  return apiPostForm(buildPreliminaryPath(id, 'upload-closure-courrier'), formData);
}

export function closePreliminaryPhase(id: string): Promise<{ ok: boolean }> {
  return apiPost(buildPreliminaryPath(id, 'close'), {});
}

export function inviteFormalMeeting(
  id: string,
  payload: { scheduledAt?: string; location?: string; notes?: string },
): Promise<AdminFormalRequestPhaseState> {
  return apiPost<AdminFormalRequestPhaseState>(
    buildFormalRequestPath(id, 'meeting'),
    payload,
  );
}

export function markFormalMeetingHeld(
  id: string,
  payload: { heldAt?: string; notes?: string },
): Promise<AdminFormalRequestPhaseState> {
  return apiPost<AdminFormalRequestPhaseState>(
    buildFormalRequestPath(id, 'meeting/mark-held'),
    payload,
  );
}

export function uploadFormalMeetingReport(
  id: string,
  formData: FormData,
): Promise<AdminFormalRequestPhaseState> {
  return apiPostForm<AdminFormalRequestPhaseState>(
    buildFormalRequestPath(id, 'meeting-report'),
    formData,
  );
}

export function closeFormalRequestPhase(
  id: string,
  payload: {
    notes?: string;
    completeness?: 'complete' | 'partial';
    comment?: string;
  },
): Promise<AdminFormalRequestPhaseState> {
  return apiPost<AdminFormalRequestPhaseState>(
    buildFormalRequestPath(id, 'close'),
    payload,
  );
}

export function adminReviewFormalRequestDocument(
  submissionId: string,
  payload: {
    status: 'validated' | 'requires_correction' | 'incomplete';
    comment?: string;
  },
): Promise<ReviewFormalDocumentResult> {
  return apiPost<ReviewFormalDocumentResult>(
    buildDocumentSubmissionReviewPath(submissionId),
    payload,
  );
}

export function getDocumentEvaluationPaymentState(
  dossierId: string,
): Promise<AdminDocumentEvaluationPaymentState> {
  return apiGet<AdminDocumentEvaluationPaymentState>(
    buildDocumentEvaluationPath(dossierId, 'payment'),
  );
}

export function uploadStudyFeeInvoice(
  dossierId: string,
  formData: FormData,
): Promise<AdminDocumentEvaluationPaymentState> {
  return apiPostForm<AdminDocumentEvaluationPaymentState>(
    buildDocumentEvaluationPath(dossierId, 'invoice'),
    formData,
  );
}

export function getDocumentEvaluations(
  dossierId: string,
): Promise<AdminDocumentEvaluationState> {
  return apiGet<AdminDocumentEvaluationState>(
    buildDocumentEvaluationPath(dossierId, 'evaluations'),
  );
}

export function reviewDocumentEvaluation(
  dossierId: string,
  evaluationId: string,
  payload: AdminDocumentEvaluationReviewPayload,
): Promise<AdminDocumentEvaluationReviewResult> {
  return apiPatch<AdminDocumentEvaluationReviewResult>(
    buildDocumentEvaluationReviewPath(dossierId, evaluationId),
    payload,
  );
}

export function closeDocumentEvaluationPhase(
  dossierId: string,
): Promise<AdminDocumentEvaluationCloseResult> {
  return apiPost<AdminDocumentEvaluationCloseResult>(
    buildDocumentEvaluationPath(dossierId, 'close'),
    {},
  );
}

// TODO(OMA-EVAL-5B): downloadAdminDossierDocument only covers Phase 1+2 documents.
// Phase 3 invoice/proof (ownerType=phase_payment) and correction docs (ownerType=phase)
// will return 403. A new admin download endpoint or an extension to the existing one
// is required before the Phase 3 workspace can serve document downloads.
