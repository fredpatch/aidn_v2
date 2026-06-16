import { getInternalDemandeStatusLabel } from '../components/aidn-status-labels';
import { AIDN_INTERNAL_DEMANDE_STATUSES } from '../types/aidn.enums';
import type { AidnCertificate, AidnDashboardSummary, AidnDemande, AidnDossier, AidnOmaPhase } from '../types/aidn.types';
import { aidnCertificates, aidnDemandes, aidnDossiers, aidnOmaPhases, aidnTimelineEvents } from './aidn.mock';

interface DashboardStateSource {
  demandes: AidnDemande[];
  dossiers: AidnDossier[];
  omaPhases: AidnOmaPhase[];
  certificates: AidnCertificate[];
}

export function mockGetAidnDashboardSummary(source?: DashboardStateSource): AidnDashboardSummary {
  const demandes = source?.demandes ?? aidnDemandes;
  const dossiers = source?.dossiers ?? aidnDossiers;
  const omaPhases = source?.omaPhases ?? aidnOmaPhases;
  const certificates = source?.certificates ?? aidnCertificates;

  return {
    demandesTotal: demandes.length,
    demandesWaitingDg: demandes.filter((demande) => demande.internalStatus === 'in_dg_circuit').length,
    dossiersOpen: dossiers.filter((dossier) => dossier.globalStatus !== 'closed').length,
    dossiersActive: dossiers.filter((dossier) => ['open', 'in_progress', 'waiting_postulant', 'late'].includes(dossier.globalStatus)).length,
    phasesLate: omaPhases.filter((phase) => phase.status === 'late').length,
    certificatesIssued: certificates.filter((certificate) => certificate.status === 'collected' || Boolean(certificate.collectedAt)).length,
    statusDistribution: AIDN_INTERNAL_DEMANDE_STATUSES.map((status) => ({
      label: getInternalDemandeStatusLabel(status),
      count: demandes.filter((demande) => demande.internalStatus === status).length,
    })),
    recentActivity: [...aidnTimelineEvents].sort((first, second) => second.occurredAt.localeCompare(first.occurredAt)).slice(0, 8),
  };
}
