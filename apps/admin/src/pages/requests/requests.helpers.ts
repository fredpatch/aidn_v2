import type {
  AdminDgReview,
  AdminDocument,
  AdminRequest,
  AdminRequestStatus,
  AdminRequestType,
  CourrierSource,
} from '../../lib/api/requests.api';

export const requestTypeLabels: Record<AdminRequestType, string> = {
  oma_recognition: 'Certificat de reconnaissance OMA',
  oma_approval: "Certificat d'agrément OMA",
  oma_renewal: 'Renouvellement de Certificat OMA',
  oma_modification: 'Modification de Certificat OMA',
};

export const statusLabels: Record<AdminRequestStatus, string> = {
  draft: 'Brouillon',
  courrier_uploaded: 'Courrier ajouté',
  courrier_physical_declared: 'Dépôt physique déclaré',
  submitted: 'Demande soumise',
  intake_in_review: 'Vérification interne',
  intake_requires_correction: 'Correction demandée',
  initial_sent_to_dg: "En attente signature DG",
  initial_dg_returned: 'Courrier DG signe disponible',
  initial_dg_decision_recorded: 'Décision DG enregistrée',
  oriented_to_dn: 'Courrier DG signe disponible',
  rejected: 'Annulée par DG',
  reoriented: 'Legacy: hors MVP',
  dossier_opened: 'Dossier ouvert',
  closed: 'Clôturée',
};

export const visibleStatusOptions = Object.entries(statusLabels).filter(
  ([value]) => value !== 'reoriented',
);

export const sourceLabels: Record<CourrierSource, string> = {
  portal_upload: 'Téléversé portail',
  physical_deposit: 'Dépôt physique',
  internal_scan: 'Scan interne',
  generated_from_template: 'Généré',
};

export const beforeDgStatuses = [
  'submitted',
  'intake_in_review',
  'intake_requires_correction',
] as const;

export function getStatusLabel(request: AdminRequest): string {
  if (
    request.courrierSource === 'physical_deposit' &&
    request.physicalDeposit?.status !== 'received' &&
    request.status === 'submitted'
  ) {
    return 'Dépôt physique prévu';
  }
  if (
    request.courrierSource === 'physical_deposit' &&
    request.physicalDeposit?.status === 'received' &&
    beforeDgStatuses.includes(request.status as (typeof beforeDgStatuses)[number])
  ) {
    return 'Courrier physique reçu';
  }
  return statusLabels[request.status];
}

export function formatDate(value?: string): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(value));
}

export function optional(value: string): string | undefined {
  const next = value.trim();
  return next ? next : undefined;
}

export function statusBadgeVariant(
  status: AdminRequestStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'initial_sent_to_dg' || status === 'initial_dg_returned' || status === 'oriented_to_dn') return 'default';
  if (status === 'intake_requires_correction' || status === 'rejected') return 'destructive';
  if (status === 'intake_in_review') return 'secondary';
  return 'outline';
}

export function listCardAccentBorder(status: AdminRequestStatus): string {
  if (status === 'initial_dg_returned' || status === 'oriented_to_dn' || status === 'dossier_opened') return 'border-l-emerald-400';
  if (status === 'intake_requires_correction' || status === 'rejected') return 'border-l-red-400';
  if (status === 'initial_sent_to_dg') return 'border-l-blue-400';
  if (status === 'submitted' || status === 'intake_in_review') return 'border-l-amber-400';
  return 'border-l-slate-300';
}

export function hasEvidence(request: AdminRequest): boolean {
  if (request.courrierSource === 'physical_deposit') {
    return Boolean(request.initialDocumentId && request.physicalDeposit?.status === 'received');
  }
  return Boolean(
    request.initialDocumentId || request.initialCourrierId || request.physicalDeposit?.declaredAt,
  );
}

export function isDgReturnComplete(request: AdminRequest, dgReview?: AdminDgReview): boolean {
  const review = dgReview ?? request.dgReview;
  return (
    (request.status === 'initial_dg_returned' || request.status === 'oriented_to_dn') &&
    (review?.status === 'returned_scanned' || review?.status === 'decision_recorded') &&
    Boolean(review.returnedScannedDocumentId)
  );
}

export function canOpenDossier(request: AdminRequest, dgReview?: AdminDgReview): boolean {
  return isDgReturnComplete(request, dgReview) && !request.dossierId;
}

export function canRequestCorrection(request: AdminRequest): boolean {
  return request.status === 'submitted' || request.status === 'intake_in_review';
}

export function canRegisterPhysical(request: AdminRequest): boolean {
  return (
    request.courrierSource === 'physical_deposit' &&
    request.physicalDeposit?.status !== 'received' &&
    beforeDgStatuses.includes(request.status as (typeof beforeDgStatuses)[number])
  );
}

export function canMarkPrinted(request: AdminRequest): boolean {
  return (
    request.courrierSource !== 'physical_deposit' &&
    hasEvidence(request) &&
    !request.intake?.printedForDgAt &&
    (request.status === 'submitted' || request.status === 'intake_in_review')
  );
}

export function isAwaitingDgAction(request: AdminRequest): boolean {
  return request.status === 'initial_sent_to_dg';
}

export function isDgSignedAvailable(request: AdminRequest): boolean {
  return request.status === 'initial_dg_returned' || request.status === 'oriented_to_dn' || request.status === 'dossier_opened';
}

export function isCancelledByDg(request: AdminRequest): boolean {
  return request.status === 'rejected';
}

export function canRecordDgReturn(request: AdminRequest): boolean {
  return request.status === 'initial_sent_to_dg';
}

export function documentSummary(document?: AdminDocument): string {
  if (!document) return '-';
  return `${document.fileName} (${Math.ceil(document.fileSize / 1024)} Ko)`;
}
