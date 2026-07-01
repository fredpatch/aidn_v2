import type { ListDossiersFilters } from './types';

export function buildDossiersPath(filters: ListDossiersFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.dossierType) params.set('dossierType', filters.dossierType);
  if (filters.search) params.set('search', filters.search);

  const query = params.toString();
  return `/api/v1/admin/dossiers${query ? `?${query}` : ''}`;
}

export function buildDossierPath(id: string): string {
  return `/api/v1/admin/dossiers/${id}`;
}

export function buildDossierDocumentPath(id: string, documentId: string): string {
  return `${buildDossierPath(id)}/documents/${documentId}`;
}

export function buildPreliminaryPath(id: string, action: string): string {
  return `${buildDossierPath(id)}/preliminary/${action}`;
}

export function buildFormalRequestPath(id: string, action = ''): string {
  const base = `${buildDossierPath(id)}/phases/formal-request`;
  return action ? `${base}/${action}` : base;
}

export function buildDocumentEvaluationPath(dossierId: string, action: string): string {
  return `${buildDossierPath(dossierId)}/phases/document-evaluation/${action}`;
}

export function buildInspectionPath(dossierId: string, action: string): string {
  return `${buildDossierPath(dossierId)}/phases/inspection/${action}`;
}

export function buildDocumentEvaluationReviewPath(
  dossierId: string,
  evaluationId: string,
): string {
  return buildDocumentEvaluationPath(dossierId, `evaluations/${evaluationId}`);
}

export function buildDocumentSubmissionReviewPath(submissionId: string): string {
  return `/api/v1/admin/document-submissions/${submissionId}/review`;
}
