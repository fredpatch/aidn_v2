export const AIDN_DEMAND_STATUSES = [
  'submitted',
  'waiting_dg_orientation',
  'oriented_to_dn',
  'dn_dossier_opened',
  'redirected',
  'rejected',
  'closed',
] as const;

export type AidnDemandStatus = (typeof AIDN_DEMAND_STATUSES)[number];

export const AIDN_INTERNAL_DEMANDE_STATUSES = [
  'draft',
  'submitted',
  'initial_mail_received',
  'in_dg_circuit',
  'dg_return_received',
  'dg_instruction_recorded',
  'ready_for_dn_dossier',
  'dn_dossier_opened',
  'redirected',
  'rejected',
  'closed',
] as const;

export type AidnInternalDemandeStatus = (typeof AIDN_INTERNAL_DEMANDE_STATUSES)[number];

export const AIDN_PORTAL_STATUSES = [
  'request_received',
  'administrative_review',
  'action_required',
  'meeting_to_schedule',
  'meeting_scheduled',
  'dossier_in_progress',
  'documents_under_review',
  'payment_expected',
  'inspection_under_review',
  'decision_available',
  'phase_closed',
  'certificate_preparation',
  'certificate_ready_for_collection',
  'certificate_collected',
  'request_rejected',
  'dossier_closed',
] as const;

export type AidnPortalStatus = (typeof AIDN_PORTAL_STATUSES)[number];

export const AIDN_ENTRY_CHANNELS = ['portal', 'physical_deposit', 'internal_entry', 'hybrid'] as const;
export type AidnEntryChannel = (typeof AIDN_ENTRY_CHANNELS)[number];

export const AIDN_MAIL_MODES = ['physical', 'digital'] as const;
export type AidnMailMode = (typeof AIDN_MAIL_MODES)[number];

export const AIDN_DG_DECISIONS = ['pending', 'oriented_to_dn', 'redirected', 'rejected'] as const;
export type AidnDgDecision = (typeof AIDN_DG_DECISIONS)[number];

export const AIDN_DOSSIER_STATUSES = ['open', 'in_progress', 'waiting_postulant', 'late', 'certificate_ready', 'closed'] as const;
export type AidnDossierStatus = (typeof AIDN_DOSSIER_STATUSES)[number];

export const AIDN_OMA_PHASE_KEYS = ['preliminary', 'formal_application', 'document_evaluation', 'onsite_demonstration', 'delivery'] as const;
export type AidnOmaPhaseKey = (typeof AIDN_OMA_PHASE_KEYS)[number];

export const AIDN_OMA_PHASE_STATUSES = ['not_started', 'in_progress', 'blocked', 'late', 'completed'] as const;
export type AidnOmaPhaseStatus = (typeof AIDN_OMA_PHASE_STATUSES)[number];

export const AIDN_DOCUMENT_STATUSES = ['missing', 'received', 'to_review', 'validated', 'rejected'] as const;
export type AidnDocumentStatus = (typeof AIDN_DOCUMENT_STATUSES)[number];

export const AIDN_DOCUMENT_SOURCES = ['postulant', 'dg', 'dn', 's5', 'r3'] as const;
export type AidnDocumentSource = (typeof AIDN_DOCUMENT_SOURCES)[number];

export const AIDN_PHASE_EVIDENCE_STATUSES = ['expected', 'received', 'scanned', 'pending_review', 'validated', 'missing', 'not_applicable'] as const;
export type AidnPhaseEvidenceStatus = (typeof AIDN_PHASE_EVIDENCE_STATUSES)[number];

export const AIDN_EVIDENCE_KINDS = [
  'required_document',
  'formal_courrier',
  'meeting_report',
  'invoice',
  'payment_proof',
  'r3_opinion',
  'certificate_artifact',
  'notification',
] as const;
export type AidnEvidenceKind = (typeof AIDN_EVIDENCE_KINDS)[number];

export const AIDN_CERTIFICATE_STATUSES = ['to_prepare', 'printed', 'signed_stamped', 'scanned_in_aidn', 'ready_for_collection', 'collected', 'archived'] as const;
export type AidnCertificateStatus = (typeof AIDN_CERTIFICATE_STATUSES)[number];
