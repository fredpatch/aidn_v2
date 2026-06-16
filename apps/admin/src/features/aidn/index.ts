export { aidnApi } from './api/aidn.api';
export { AidnStatusBadge } from './components/AidnStatusBadge';
export { getEntryChannelLabel, getInternalDemandeStatusLabel, getPortalStatusLabel } from './components/aidn-status-labels';
export { DgDecisionBadge } from './components/DgDecisionBadge';
export { OmaPhaseBadge } from './components/OmaPhaseBadge';
export { useAidnCertificates, useAidnDashboardSummary, useAidnDocuments, useAidnMeetings, useAidnPhaseEvidence, useAidnPhaseNextActions, useAidnTimelineEvents } from './hooks/use-aidn-dashboard';
export { useCourriers, useDgDecisionRecords } from './hooks/use-courriers';
export { useDemandes } from './hooks/use-demandes';
export { useAidnOmaPhases, useDossier, useDossiers } from './hooks/use-dossiers';
export {
  advanceCertificateLifecycle,
  getNextCertificateLifecycleActionLabel,
  getNextCertificateLifecycleStatus,
  markMeetingReportAvailable,
  markMeetingScheduled,
  markPaymentEvidenceReceived,
  markPaymentEvidenceValidated,
  markPhaseNextActionDone,
  resetAidnDemoData,
  setCertificateLifecycleStatus,
  updatePhaseEvidenceStatus,
} from './storage/aidn-demo-actions';
export { AIDN_DEMO_STORAGE_KEY, getAidnDemoState, resetAidnDemoState, setAidnDemoState, updateAidnDemoState, type AidnDemoState } from './storage/aidn-demo-storage';
export * from './types/aidn.enums';
export type * from './types/aidn.types';
