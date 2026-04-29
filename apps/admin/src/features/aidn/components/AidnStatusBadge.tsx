import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AidnDemandStatus, AidnDossierStatus, AidnEntryChannel, AidnInternalDemandeStatus, AidnPortalStatus } from '../types/aidn.enums';

const legacyDemandStatusLabels: Record<AidnDemandStatus, string> = {
  submitted: 'Soumise',
  waiting_dg_orientation: 'En attente DG',
  oriented_to_dn: 'Orientee DN',
  dn_dossier_opened: 'Dossier ouvert',
  redirected: 'Reorientee',
  rejected: 'Rejetee',
  closed: 'Cloturee',
};

const dossierStatusLabels: Record<AidnDossierStatus, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  waiting_postulant: 'Attente postulant',
  late: 'En retard',
  certificate_ready: 'Certificat pret',
  closed: 'Cloture',
};

const internalDemandeStatusLabels: Record<AidnInternalDemandeStatus, string> = {
  draft: 'Brouillon',
  submitted: 'Soumise',
  initial_mail_received: 'Courrier initial recu',
  in_dg_circuit: 'En circuit DG',
  dg_return_received: 'Retour DG recu',
  dg_instruction_recorded: 'Instruction DG enregistree',
  ready_for_dn_dossier: 'Prete pour ouverture dossier DN',
  dn_dossier_opened: 'Dossier DN ouvert',
  redirected: 'Reorientee',
  rejected: 'Rejetee',
  closed: 'Cloturee',
};

const portalStatusLabels: Record<AidnPortalStatus, string> = {
  request_received: 'Demande recue',
  administrative_review: "En cours d'examen administratif",
  action_required: 'Action requise de votre part',
  meeting_to_schedule: 'Reunion a planifier',
  meeting_scheduled: 'Reunion programmee',
  dossier_in_progress: 'Dossier en cours de traitement',
  documents_under_review: "Documents en cours d'analyse",
  payment_expected: 'Paiement attendu',
  inspection_under_review: 'Inspection / analyse en cours',
  decision_available: 'Decision disponible',
  phase_closed: 'Phase cloturee',
  certificate_preparation: 'Certificat en preparation',
  certificate_ready_for_collection: 'Certificat pret au retrait',
  certificate_collected: 'Certificat remis',
  request_rejected: 'Demande non retenue',
  dossier_closed: 'Dossier cloture',
};

const entryChannelLabels: Record<AidnEntryChannel, string> = {
  portal: 'Portail',
  physical_deposit: 'Depot physique ANAC',
  internal_entry: 'Saisie interne',
  hybrid: 'Hybride',
};

const classNames: Partial<Record<AidnDemandStatus | AidnDossierStatus | AidnInternalDemandeStatus, string>> = {
  waiting_dg_orientation: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  in_dg_circuit: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  dg_return_received: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  dg_instruction_recorded: 'border-primary/20 bg-primary/10 text-primary',
  ready_for_dn_dossier: 'border-primary/20 bg-primary/10 text-primary',
  oriented_to_dn: 'border-primary/20 bg-primary/10 text-primary',
  dn_dossier_opened: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  rejected: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  late: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
};

export function getInternalDemandeStatusLabel(status: AidnInternalDemandeStatus): string {
  return internalDemandeStatusLabels[status];
}

export function getPortalStatusLabel(status: AidnPortalStatus): string {
  return portalStatusLabels[status];
}

export function getEntryChannelLabel(channel: AidnEntryChannel): string {
  return entryChannelLabels[channel];
}

interface AidnStatusBadgeProps {
  status: AidnDemandStatus | AidnDossierStatus | AidnInternalDemandeStatus;
  className?: string;
}

export function AidnStatusBadge({ status, className }: AidnStatusBadgeProps): React.JSX.Element {
  const label =
    internalDemandeStatusLabels[status as AidnInternalDemandeStatus] ??
    legacyDemandStatusLabels[status as AidnDemandStatus] ??
    dossierStatusLabels[status as AidnDossierStatus];

  return (
    <Badge variant="outline" className={cn(classNames[status], className)}>
      {label}
    </Badge>
  );
}
