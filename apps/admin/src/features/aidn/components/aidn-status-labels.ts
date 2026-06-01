import type { AidnDemandStatus, AidnDossierStatus, AidnEntryChannel, AidnInternalDemandeStatus, AidnPortalStatus } from '../types/aidn.enums';

export const legacyDemandStatusLabels: Record<AidnDemandStatus, string> = {
  submitted: 'Soumise',
  waiting_dg_orientation: 'En attente DG',
  oriented_to_dn: 'Orientee DN',
  dn_dossier_opened: 'Dossier ouvert',
  redirected: 'Legacy: hors MVP',
  rejected: 'Rejetee',
  closed: 'Cloturee',
};

export const dossierStatusLabels: Record<AidnDossierStatus, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  waiting_postulant: 'Attente postulant',
  late: 'En retard',
  certificate_ready: 'Certificat pret',
  closed: 'Cloture',
};

export const internalDemandeStatusLabels: Record<AidnInternalDemandeStatus, string> = {
  draft: 'Brouillon',
  submitted: 'Soumise',
  initial_mail_received: 'Courrier initial recu',
  in_dg_circuit: 'En circuit DG',
  dg_return_received: 'Retour DG recu',
  dg_instruction_recorded: 'Instruction DG enregistree',
  ready_for_dn_dossier: 'Prete pour ouverture dossier DN',
  dn_dossier_opened: 'Dossier DN ouvert',
  redirected: 'Legacy: hors MVP',
  rejected: 'Rejetee',
  closed: 'Cloturee',
};

export const portalStatusLabels: Record<AidnPortalStatus, string> = {
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

export const entryChannelLabels: Record<AidnEntryChannel, string> = {
  portal: 'Portail',
  physical_deposit: 'Depot physique ANAC',
  internal_entry: 'Saisie interne',
  hybrid: 'Hybride',
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
