import type {
  AidnCertificateStatus,
  AidnDgDecision,
  AidnDocumentSource,
  AidnDocumentStatus,
  AidnDossierStatus,
  AidnDemandStatus,
  AidnEntryChannel,
  AidnEvidenceKind,
  AidnInternalDemandeStatus,
  AidnMailMode,
  AidnOmaPhaseKey,
  AidnOmaPhaseStatus,
  AidnPhaseEvidenceStatus,
  AidnPortalStatus,
} from './aidn.enums';

export interface AidnDemande {
  id: string;
  reference: string;
  postulantName: string;
  organizationName: string;
  submittedAt: string;
  internalStatus: AidnInternalDemandeStatus;
  portalStatus: AidnPortalStatus;
  entryChannel: AidnEntryChannel;
  /** Compatibility alias while older mock-driven pages are migrated. */
  status: AidnDemandStatus;
  requestType: string;
  origin: 'guichet_digital' | 'bureau_courrier' | 'email';
  description: string;
}

export interface AidnCourrier {
  id: string;
  demandeId: string;
  reference: string;
  mode: AidnMailMode;
  objet: string;
  dateDepot: string;
  scannedAt?: string;
  dateEnvoiDg?: string;
  dateRetourDg?: string;
  decisionDg: AidnDgDecision;
  directionOrientee?: string;
  scanCourrierUrl?: string;
}

export interface AidnDgDecisionRecord {
  id: string;
  demandeId: string;
  courrierId: string;
  decision: AidnDgDecision;
  decidedAt: string;
  directionOrientee?: string;
  notes: string;
  recordedBy: string;
}

export interface AidnDossier {
  id: string;
  demandeId: string;
  reference: string;
  currentPhase: AidnOmaPhaseKey;
  assignedAgent: string;
  globalStatus: AidnDossierStatus;
  progressPercent: number;
  openedAt: string;
  deadlineStatus: 'on_track' | 'at_risk' | 'late';
}

export interface AidnOmaPhase {
  id: string;
  dossierId: string;
  key: AidnOmaPhaseKey;
  label: string;
  order: number;
  status: AidnOmaPhaseStatus;
  startedAt?: string;
  completedAt?: string;
  dueAt?: string;
}

export interface AidnDocument {
  id: string;
  title: string;
  source: AidnDocumentSource;
  status: AidnDocumentStatus;
  demandeId?: string;
  dossierId?: string;
  phaseKey?: AidnOmaPhaseKey;
  receivedAt?: string;
  updatedAt: string;
}

export interface AidnPhaseEvidenceItem {
  id: string;
  dossierId: string;
  phaseKey: AidnOmaPhaseKey;
  kind: AidnEvidenceKind;
  label: string;
  sourceActor: string;
  status: AidnPhaseEvidenceStatus;
  documentId?: string;
  dueDate?: string;
  receivedAt?: string;
  notes?: string;
  isRequired: boolean;
}

export interface AidnPhaseNextAction {
  id: string;
  dossierId: string;
  phaseKey: AidnOmaPhaseKey;
  label: string;
  recommendedActor: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'simulated' | 'done';
}

export interface AidnMeeting {
  id: string;
  dossierId: string;
  phaseKey?: AidnOmaPhaseKey;
  title: string;
  scheduledAt: string;
  location: string;
  participants: string[];
  outcome: 'planned' | 'held' | 'postponed' | 'cancelled';
  convocationSentAt?: string;
  convocationChannel?: 'AIDN' | 'Outlook' | 'Email mock';
  reportDocumentId?: string;
}

export interface AidnCertificate {
  id: string;
  dossierId: string;
  certificateNumber: string;
  certificateType: 'initial' | 'renewal' | 'extension';
  status: AidnCertificateStatus;
  preparedAt?: string;
  printedAt?: string;
  signedAt?: string;
  stampedAt?: string;
  scannedAt?: string;
  readyForCollectionAt?: string;
  collectedAt?: string;
  archivedAt?: string;
  deliveredAt?: string;
  issuedAt?: string;
  validUntil?: string;
  holderName: string;
  linkedDocumentId?: string;
  scannedDocumentId?: string;
  preparedBy?: string;
  signedBy?: string;
  collectedBy?: string;
  collectionNote?: string;
}

export interface AidnTimelineEvent {
  id: string;
  demandeId?: string;
  dossierId?: string;
  type:
    | 'demande_submitted'
    | 'courrier_received'
    | 'courrier_sent_to_dg'
    | 'dg_decision_recorded'
    | 'dossier_opened'
    | 'phase_completed'
    | 'document_received'
    | 'meeting_scheduled'
    | 'certificate_issued';
  label: string;
  description: string;
  occurredAt: string;
  actor: string;
}

export interface AidnDashboardSummary {
  demandesTotal: number;
  demandesWaitingDg: number;
  dossiersOpen: number;
  dossiersActive: number;
  phasesLate: number;
  certificatesIssued: number;
  statusDistribution: Array<{
    label: string;
    count: number;
  }>;
  recentActivity: AidnTimelineEvent[];
}
