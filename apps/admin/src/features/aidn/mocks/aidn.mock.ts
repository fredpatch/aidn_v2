import type { AidnCertificate, AidnCourrier, AidnDemande, AidnDgDecisionRecord, AidnDocument, AidnDossier, AidnMeeting, AidnOmaPhase, AidnPhaseEvidenceItem, AidnPhaseNextAction, AidnTimelineEvent } from '../types/aidn.types';
import type { AidnEntryChannel, AidnInternalDemandeStatus, AidnOmaPhaseKey, AidnOmaPhaseStatus, AidnPortalStatus } from '../types/aidn.enums';

const aidnDemandeSeeds: Array<Omit<AidnDemande, 'internalStatus' | 'portalStatus' | 'entryChannel'>> = [
  { id: 'demande-001', reference: 'OMA-2026-001', postulantName: 'Aero Service Gabon', organizationName: 'Aero Service Gabon SARL', submittedAt: '2026-01-08T09:20:00Z', status: 'submitted', requestType: 'Agrément initial OMA', origin: 'guichet_digital', description: 'Soumission initiale en attente de pré-vérification DN.' },
  { id: 'demande-002', reference: 'OMA-2026-002', postulantName: 'Libreville Maintenance', organizationName: 'Libreville Maintenance SA', submittedAt: '2026-01-12T11:35:00Z', status: 'waiting_dg_orientation', requestType: 'Extension de périmètre', origin: 'bureau_courrier', description: 'Courrier physique enregistré et transmis au circuit DG.' },
  { id: 'demande-003', reference: 'OMA-2026-003', postulantName: 'Equateur Aviation', organizationName: 'Equateur Aviation Maintenance', submittedAt: '2026-01-18T08:05:00Z', status: 'oriented_to_dn', requestType: 'Agrément initial OMA', origin: 'email', description: 'Décision DG favorable, dossier DN à consolider.' },
  { id: 'demande-004', reference: 'OMA-2026-004', postulantName: 'Port-Gentil AeroTech', organizationName: 'Port-Gentil AeroTech', submittedAt: '2026-01-23T14:10:00Z', status: 'dn_dossier_opened', requestType: 'Renouvellement OMA', origin: 'guichet_digital', description: 'Dossier DN ouvert après orientation favorable.' },
  { id: 'demande-005', reference: 'OMA-2026-005', postulantName: 'Maintenance Nord', organizationName: 'Maintenance Nord Gabon', submittedAt: '2026-02-02T10:50:00Z', status: 'redirected', requestType: 'Demande technique', origin: 'bureau_courrier', description: 'Réorientée vers une autre direction compétente.' },
  { id: 'demande-006', reference: 'OMA-2026-006', postulantName: 'Sky Gabon Support', organizationName: 'Sky Gabon Support', submittedAt: '2026-02-08T13:15:00Z', status: 'rejected', requestType: 'Agrément initial OMA', origin: 'email', description: 'Rejetée après avis DG pour dossier non recevable.' },
  { id: 'demande-007', reference: 'OMA-2026-007', postulantName: 'Oyem Air Workshop', organizationName: 'Oyem Air Workshop', submittedAt: '2026-02-15T07:45:00Z', status: 'closed', requestType: 'Modification organisation', origin: 'guichet_digital', description: 'Demande clôturée après retrait du postulant.' },
  { id: 'demande-008', reference: 'OMA-2026-008', postulantName: 'National Aero Maintenance', organizationName: 'National Aero Maintenance', submittedAt: '2026-03-01T09:00:00Z', status: 'dn_dossier_opened', requestType: 'Agrément initial OMA', origin: 'bureau_courrier', description: 'Instruction OMA active à la DN.' },
  { id: 'demande-009', reference: 'OMA-2026-009', postulantName: 'Franceville Aviation Services', organizationName: 'Franceville Aviation Services', submittedAt: '2026-03-14T12:25:00Z', status: 'waiting_dg_orientation', requestType: 'Ajout capacité moteur', origin: 'guichet_digital', description: 'Attente retour DG après transmission.' },
  { id: 'demande-010', reference: 'OMA-2026-010', postulantName: 'Atlantic Aero Gabon', organizationName: 'Atlantic Aero Gabon', submittedAt: '2026-03-22T15:40:00Z', status: 'oriented_to_dn', requestType: 'Renouvellement OMA', origin: 'email', description: 'Orientation DN enregistrée, ouverture dossier préparée.' },
];

const demandeStatusLayerById: Record<string, { internalStatus: AidnInternalDemandeStatus; portalStatus: AidnPortalStatus; entryChannel: AidnEntryChannel }> = {
  'demande-001': { internalStatus: 'submitted', portalStatus: 'request_received', entryChannel: 'portal' },
  'demande-002': { internalStatus: 'in_dg_circuit', portalStatus: 'administrative_review', entryChannel: 'physical_deposit' },
  'demande-003': { internalStatus: 'dn_dossier_opened', portalStatus: 'dossier_in_progress', entryChannel: 'hybrid' },
  'demande-004': { internalStatus: 'dn_dossier_opened', portalStatus: 'documents_under_review', entryChannel: 'portal' },
  'demande-005': { internalStatus: 'redirected', portalStatus: 'request_rejected', entryChannel: 'physical_deposit' },
  'demande-006': { internalStatus: 'rejected', portalStatus: 'request_rejected', entryChannel: 'hybrid' },
  'demande-007': { internalStatus: 'closed', portalStatus: 'dossier_closed', entryChannel: 'portal' },
  'demande-008': { internalStatus: 'dn_dossier_opened', portalStatus: 'inspection_under_review', entryChannel: 'physical_deposit' },
  'demande-009': { internalStatus: 'in_dg_circuit', portalStatus: 'administrative_review', entryChannel: 'portal' },
  'demande-010': { internalStatus: 'ready_for_dn_dossier', portalStatus: 'dossier_in_progress', entryChannel: 'hybrid' },
};

export const aidnDemandes: AidnDemande[] = aidnDemandeSeeds.map((demande) => ({
  ...demande,
  ...demandeStatusLayerById[demande.id],
}));

export const aidnCourriers: AidnCourrier[] = [
  { id: 'courrier-001', demandeId: 'demande-001', reference: 'CR-2026-001', mode: 'digital', objet: 'Demande OMA initiale', dateDepot: '2026-01-08', scannedAt: '2026-01-08T09:35:00Z', decisionDg: 'pending', scanCourrierUrl: '/mock/courriers/cr-2026-001.pdf' },
  { id: 'courrier-002', demandeId: 'demande-002', reference: 'CR-2026-002', mode: 'physical', objet: 'Extension de périmètre OMA', dateDepot: '2026-01-12', scannedAt: '2026-01-12T11:50:00Z', dateEnvoiDg: '2026-01-13', decisionDg: 'pending', scanCourrierUrl: '/mock/courriers/cr-2026-002.pdf' },
  { id: 'courrier-003', demandeId: 'demande-003', reference: 'CR-2026-003', mode: 'digital', objet: 'Orientation vers DN', dateDepot: '2026-01-18', scannedAt: '2026-01-18T08:20:00Z', dateEnvoiDg: '2026-01-19', dateRetourDg: '2026-01-21', decisionDg: 'oriented_to_dn', directionOrientee: 'Direction de la Navigabilité', scanCourrierUrl: '/mock/courriers/cr-2026-003.pdf' },
  { id: 'courrier-004', demandeId: 'demande-004', reference: 'CR-2026-004', mode: 'digital', objet: 'Renouvellement OMA', dateDepot: '2026-01-23', scannedAt: '2026-01-23T14:25:00Z', dateEnvoiDg: '2026-01-24', dateRetourDg: '2026-01-27', decisionDg: 'oriented_to_dn', directionOrientee: 'Direction de la Navigabilité', scanCourrierUrl: '/mock/courriers/cr-2026-004.pdf' },
  { id: 'courrier-005', demandeId: 'demande-005', reference: 'CR-2026-005', mode: 'physical', objet: 'Demande technique hors périmètre DN', dateDepot: '2026-02-02', scannedAt: '2026-02-02T11:05:00Z', dateEnvoiDg: '2026-02-03', dateRetourDg: '2026-02-07', decisionDg: 'redirected', directionOrientee: 'Direction du Transport Aérien', scanCourrierUrl: '/mock/courriers/cr-2026-005.pdf' },
  { id: 'courrier-006', demandeId: 'demande-006', reference: 'CR-2026-006', mode: 'digital', objet: 'Dossier incomplet', dateDepot: '2026-02-08', scannedAt: '2026-02-08T13:30:00Z', dateEnvoiDg: '2026-02-09', dateRetourDg: '2026-02-13', decisionDg: 'rejected', scanCourrierUrl: '/mock/courriers/cr-2026-006.pdf' },
  { id: 'courrier-007', demandeId: 'demande-008', reference: 'CR-2026-008', mode: 'physical', objet: 'Agrément initial OMA', dateDepot: '2026-03-01', scannedAt: '2026-03-01T09:15:00Z', dateEnvoiDg: '2026-03-02', dateRetourDg: '2026-03-05', decisionDg: 'oriented_to_dn', directionOrientee: 'Direction de la Navigabilité', scanCourrierUrl: '/mock/courriers/cr-2026-008.pdf' },
  { id: 'courrier-008', demandeId: 'demande-010', reference: 'CR-2026-010', mode: 'digital', objet: 'Renouvellement OMA', dateDepot: '2026-03-22', scannedAt: '2026-03-22T16:00:00Z', dateEnvoiDg: '2026-03-23', dateRetourDg: '2026-03-25', decisionDg: 'oriented_to_dn', directionOrientee: 'Direction de la Navigabilité', scanCourrierUrl: '/mock/courriers/cr-2026-010.pdf' },
];

export const aidnDgDecisionRecords: AidnDgDecisionRecord[] = [
  { id: 'dg-001', demandeId: 'demande-003', courrierId: 'courrier-003', decision: 'oriented_to_dn', decidedAt: '2026-01-21T16:00:00Z', directionOrientee: 'Direction de la Navigabilité', notes: 'Instruction OMA à poursuivre par la DN.', recordedBy: 'Secrétariat DN' },
  { id: 'dg-002', demandeId: 'demande-004', courrierId: 'courrier-004', decision: 'oriented_to_dn', decidedAt: '2026-01-27T10:30:00Z', directionOrientee: 'Direction de la Navigabilité', notes: 'Renouvellement recevable pour ouverture dossier.', recordedBy: 'Agent DN' },
  { id: 'dg-003', demandeId: 'demande-005', courrierId: 'courrier-005', decision: 'redirected', decidedAt: '2026-02-07T09:10:00Z', directionOrientee: 'Direction du Transport Aérien', notes: 'Objet hors périmètre OMA DN.', recordedBy: 'Secrétariat DG' },
  { id: 'dg-004', demandeId: 'demande-006', courrierId: 'courrier-006', decision: 'rejected', decidedAt: '2026-02-13T14:20:00Z', notes: 'Dossier non recevable à ce stade.', recordedBy: 'Secrétariat DG' },
  { id: 'dg-005', demandeId: 'demande-008', courrierId: 'courrier-007', decision: 'oriented_to_dn', decidedAt: '2026-03-05T11:45:00Z', directionOrientee: 'Direction de la Navigabilité', notes: 'Priorité donnée à l’instruction initiale.', recordedBy: 'Agent DN' },
  { id: 'dg-006', demandeId: 'demande-010', courrierId: 'courrier-008', decision: 'oriented_to_dn', decidedAt: '2026-03-25T08:50:00Z', directionOrientee: 'Direction de la Navigabilité', notes: 'Ouverture dossier DN autorisée.', recordedBy: 'Secrétariat DN' },
];

export const aidnDossiers: AidnDossier[] = [
  { id: 'dossier-001', demandeId: 'demande-003', reference: 'DN-OMA-2026-001', currentPhase: 'formal_application', assignedAgent: 'M. Obame', globalStatus: 'in_progress', progressPercent: 34, openedAt: '2026-01-22T09:00:00Z', deadlineStatus: 'on_track' },
  { id: 'dossier-002', demandeId: 'demande-004', reference: 'DN-OMA-2026-002', currentPhase: 'document_evaluation', assignedAgent: 'Mme Ndong', globalStatus: 'waiting_postulant', progressPercent: 52, openedAt: '2026-01-28T08:30:00Z', deadlineStatus: 'at_risk' },
  { id: 'dossier-003', demandeId: 'demande-008', reference: 'DN-OMA-2026-003', currentPhase: 'onsite_demonstration', assignedAgent: 'M. Mba', globalStatus: 'late', progressPercent: 71, openedAt: '2026-03-06T10:00:00Z', deadlineStatus: 'late' },
  { id: 'dossier-004', demandeId: 'demande-010', reference: 'DN-OMA-2026-004', currentPhase: 'preliminary', assignedAgent: 'Mme Ella', globalStatus: 'open', progressPercent: 12, openedAt: '2026-03-26T09:15:00Z', deadlineStatus: 'on_track' },
];

const phaseLabels: Record<AidnOmaPhaseKey, string> = {
  preliminary: 'Phase préliminaire',
  formal_application: 'Demande formelle',
  document_evaluation: 'Évaluation approfondie des documents',
  onsite_demonstration: 'Démonstration et inspection sur site',
  delivery: 'Délivrance',
};

function phase(id: string, dossierId: string, key: AidnOmaPhaseKey, order: number, status: AidnOmaPhaseStatus, startedAt?: string, completedAt?: string, dueAt?: string): AidnOmaPhase {
  return { id, dossierId, key, label: phaseLabels[key], order, status, startedAt, completedAt, dueAt };
}

export const aidnOmaPhases: AidnOmaPhase[] = [
  phase('phase-001-1', 'dossier-001', 'preliminary', 1, 'completed', '2026-01-22', '2026-01-29', '2026-01-30'),
  phase('phase-001-2', 'dossier-001', 'formal_application', 2, 'in_progress', '2026-01-30', undefined, '2026-04-30'),
  phase('phase-001-3', 'dossier-001', 'document_evaluation', 3, 'not_started', undefined, undefined, '2026-05-20'),
  phase('phase-001-4', 'dossier-001', 'onsite_demonstration', 4, 'not_started', undefined, undefined, '2026-06-18'),
  phase('phase-001-5', 'dossier-001', 'delivery', 5, 'not_started', undefined, undefined, '2026-07-15'),
  phase('phase-002-1', 'dossier-002', 'preliminary', 1, 'completed', '2026-01-28', '2026-02-04', '2026-02-05'),
  phase('phase-002-2', 'dossier-002', 'formal_application', 2, 'completed', '2026-02-05', '2026-02-28', '2026-03-01'),
  phase('phase-002-3', 'dossier-002', 'document_evaluation', 3, 'blocked', '2026-03-02', undefined, '2026-04-25'),
  phase('phase-002-4', 'dossier-002', 'onsite_demonstration', 4, 'not_started', undefined, undefined, '2026-05-28'),
  phase('phase-002-5', 'dossier-002', 'delivery', 5, 'not_started', undefined, undefined, '2026-06-20'),
  phase('phase-003-1', 'dossier-003', 'preliminary', 1, 'completed', '2026-03-06', '2026-03-13', '2026-03-14'),
  phase('phase-003-2', 'dossier-003', 'formal_application', 2, 'completed', '2026-03-14', '2026-03-31', '2026-04-01'),
  phase('phase-003-3', 'dossier-003', 'document_evaluation', 3, 'completed', '2026-04-01', '2026-04-20', '2026-04-22'),
  phase('phase-003-4', 'dossier-003', 'onsite_demonstration', 4, 'late', '2026-04-21', undefined, '2026-04-27'),
  phase('phase-003-5', 'dossier-003', 'delivery', 5, 'not_started', undefined, undefined, '2026-05-18'),
  phase('phase-004-1', 'dossier-004', 'preliminary', 1, 'in_progress', '2026-03-26', undefined, '2026-05-06'),
  phase('phase-004-2', 'dossier-004', 'formal_application', 2, 'not_started', undefined, undefined, '2026-05-28'),
  phase('phase-004-3', 'dossier-004', 'document_evaluation', 3, 'not_started', undefined, undefined, '2026-06-25'),
  phase('phase-004-4', 'dossier-004', 'onsite_demonstration', 4, 'not_started', undefined, undefined, '2026-07-20'),
  phase('phase-004-5', 'dossier-004', 'delivery', 5, 'not_started', undefined, undefined, '2026-08-15'),
];

export const aidnDocuments: AidnDocument[] = [
  { id: 'doc-001', title: 'Lettre de demande initiale', source: 'postulant', status: 'validated', demandeId: 'demande-003', dossierId: 'dossier-001', phaseKey: 'preliminary', receivedAt: '2026-01-18', updatedAt: '2026-01-29T10:00:00Z' },
  { id: 'doc-002', title: 'Courrier orientation DG', source: 'dg', status: 'validated', demandeId: 'demande-003', dossierId: 'dossier-001', receivedAt: '2026-01-21', updatedAt: '2026-01-21T16:30:00Z' },
  { id: 'doc-003', title: 'Manuel organisme maintenance', source: 'postulant', status: 'to_review', demandeId: 'demande-003', dossierId: 'dossier-001', phaseKey: 'formal_application', receivedAt: '2026-02-04', updatedAt: '2026-04-12T09:00:00Z' },
  { id: 'doc-004', title: 'Note de recevabilité DN', source: 'dn', status: 'validated', demandeId: 'demande-004', dossierId: 'dossier-002', phaseKey: 'preliminary', receivedAt: '2026-01-30', updatedAt: '2026-02-04T11:00:00Z' },
  { id: 'doc-005', title: 'Référentiel procédures S5', source: 's5', status: 'received', dossierId: 'dossier-002', phaseKey: 'document_evaluation', receivedAt: '2026-03-12', updatedAt: '2026-03-12T15:30:00Z' },
  { id: 'doc-006', title: 'Complément justificatif R3', source: 'r3', status: 'missing', dossierId: 'dossier-002', phaseKey: 'document_evaluation', updatedAt: '2026-04-18T08:00:00Z' },
  { id: 'doc-007', title: 'Plan inspection site', source: 'dn', status: 'validated', dossierId: 'dossier-003', phaseKey: 'onsite_demonstration', receivedAt: '2026-04-21', updatedAt: '2026-04-22T10:15:00Z' },
  { id: 'doc-008', title: 'Rapport démonstration atelier', source: 'postulant', status: 'rejected', dossierId: 'dossier-003', phaseKey: 'onsite_demonstration', receivedAt: '2026-04-24', updatedAt: '2026-04-26T14:45:00Z' },
  { id: 'doc-009', title: 'Décision DG renouvellement', source: 'dg', status: 'validated', demandeId: 'demande-010', dossierId: 'dossier-004', receivedAt: '2026-03-25', updatedAt: '2026-03-25T09:15:00Z' },
  { id: 'doc-010', title: 'Checklist phase préliminaire', source: 'dn', status: 'to_review', dossierId: 'dossier-004', phaseKey: 'preliminary', receivedAt: '2026-03-27', updatedAt: '2026-04-10T12:30:00Z' },
  { id: 'doc-011', title: 'Courrier physique reçu', source: 'postulant', status: 'received', demandeId: 'demande-002', receivedAt: '2026-01-12', updatedAt: '2026-01-12T11:45:00Z' },
  { id: 'doc-012', title: 'Avis de réorientation', source: 'dg', status: 'validated', demandeId: 'demande-005', receivedAt: '2026-02-07', updatedAt: '2026-02-07T10:10:00Z' },
  { id: 'doc-013', title: 'Notification rejet', source: 'dg', status: 'validated', demandeId: 'demande-006', receivedAt: '2026-02-13', updatedAt: '2026-02-13T15:00:00Z' },
  { id: 'doc-014', title: 'Projet certificat OMA', source: 'dn', status: 'to_review', dossierId: 'dossier-003', phaseKey: 'delivery', updatedAt: '2026-04-27T13:00:00Z' },
];

export const aidnMeetings: AidnMeeting[] = [
  { id: 'meeting-001', dossierId: 'dossier-001', phaseKey: 'preliminary', title: 'Réunion de cadrage OMA', scheduledAt: '2026-02-06T09:00:00Z', location: 'Salle DN 1', participants: ['M. Obame', 'Aero Service Gabon'], outcome: 'held', convocationSentAt: '2026-02-02T10:00:00Z', convocationChannel: 'Email mock', reportDocumentId: 'doc-001' },
  { id: 'meeting-002', dossierId: 'dossier-002', phaseKey: 'document_evaluation', title: 'Point documentaire', scheduledAt: '2026-03-18T10:30:00Z', location: 'Visioconférence', participants: ['Mme Ndong', 'Port-Gentil AeroTech'], outcome: 'held', convocationSentAt: '2026-03-14T09:30:00Z', convocationChannel: 'AIDN', reportDocumentId: 'doc-005' },
  { id: 'meeting-003', dossierId: 'dossier-003', phaseKey: 'onsite_demonstration', title: 'Préparation inspection site', scheduledAt: '2026-04-22T08:30:00Z', location: 'Bureau DN', participants: ['M. Mba', 'National Aero Maintenance'], outcome: 'held', convocationSentAt: '2026-04-18T10:00:00Z', convocationChannel: 'AIDN', reportDocumentId: 'doc-007' },
  { id: 'meeting-004', dossierId: 'dossier-003', phaseKey: 'onsite_demonstration', title: 'Inspection atelier', scheduledAt: '2026-04-29T07:30:00Z', location: 'Site postulant', participants: ['M. Mba', 'Inspecteur S5', 'National Aero Maintenance'], outcome: 'planned', convocationSentAt: '2026-04-24T08:00:00Z', convocationChannel: 'Outlook' },
  { id: 'meeting-005', dossierId: 'dossier-004', phaseKey: 'preliminary', title: 'Lancement dossier DN', scheduledAt: '2026-05-03T11:00:00Z', location: 'Salle DN 2', participants: ['Mme Ella', 'Atlantic Aero Gabon'], outcome: 'planned' },
];

export const aidnCertificates: AidnCertificate[] = [
  { id: 'cert-001', dossierId: 'dossier-001', certificateNumber: 'OMA-GA-PREP-001', certificateType: 'initial', status: 'printed', preparedAt: '2026-04-08', printedAt: '2026-04-09', preparedBy: 'M. Obame', holderName: 'Equateur Aviation', linkedDocumentId: 'doc-003' },
  { id: 'cert-002', dossierId: 'dossier-002', certificateNumber: 'OMA-GA-SIGNED-002', certificateType: 'renewal', status: 'signed_stamped', preparedAt: '2026-04-12', printedAt: '2026-04-14', signedAt: '2026-04-18', stampedAt: '2026-04-19', preparedBy: 'Mme Ndong', signedBy: 'Directeur DN', holderName: 'Port-Gentil AeroTech', linkedDocumentId: 'doc-005' },
  { id: 'cert-003', dossierId: 'dossier-003', certificateNumber: 'OMA-GA-2026-003', certificateType: 'initial', status: 'collected', preparedAt: '2026-04-20', printedAt: '2026-04-22', signedAt: '2026-04-23', stampedAt: '2026-04-23', scannedAt: '2026-04-23', readyForCollectionAt: '2026-04-23', collectedAt: '2026-04-24', deliveredAt: '2026-04-24', issuedAt: '2026-04-24', validUntil: '2027-04-24', holderName: 'National Aero Maintenance', linkedDocumentId: 'doc-014', scannedDocumentId: 'doc-014', preparedBy: 'M. Mba', signedBy: 'Directeur DN', collectedBy: 'Responsable qualite postulant', collectionNote: 'Certificat remis au postulant apres verification identite.' },
  { id: 'cert-004', dossierId: 'dossier-004', certificateNumber: 'OMA-GA-READY-004', certificateType: 'renewal', status: 'ready_for_collection', preparedAt: '2026-04-26', printedAt: '2026-04-27', signedAt: '2026-04-28', stampedAt: '2026-04-28', scannedAt: '2026-04-28', readyForCollectionAt: '2026-04-29', holderName: 'Atlantic Aero Gabon', linkedDocumentId: 'doc-009', scannedDocumentId: 'doc-009', preparedBy: 'Mme Ella', signedBy: 'Directeur DN', collectionNote: 'Invitation retrait simulee dans AIDN.' },
];

type EvidenceSeed = Omit<AidnPhaseEvidenceItem, 'id' | 'dossierId' | 'phaseKey'>;

const phaseEvidenceTemplates: Record<AidnOmaPhaseKey, EvidenceSeed[]> = {
  preliminary: [
    { kind: 'formal_courrier', label: 'Courrier DG vise/scanne', sourceActor: 'DG / DN', status: 'scanned', documentId: 'doc-002', receivedAt: '2026-01-21', isRequired: true, notes: 'Preuve du retour DG dans le dossier.' },
    { kind: 'notification', label: 'Convocation reunion', sourceActor: 'DN', status: 'validated', isRequired: true },
    { kind: 'meeting_report', label: 'Compte rendu signe', sourceActor: 'DN / Postulant', status: 'validated', documentId: 'doc-001', isRequired: true },
    { kind: 'required_document', label: 'Formulaire pre-evaluation', sourceActor: 'Postulant', status: 'received', isRequired: true },
    { kind: 'formal_courrier', label: 'Formulaire pre-evaluation vise', sourceActor: 'DG / DN', status: 'scanned', isRequired: true },
    { kind: 'formal_courrier', label: 'Decision DN', sourceActor: 'DN', status: 'validated', isRequired: true },
    { kind: 'formal_courrier', label: 'Courrier cloture Phase 1', sourceActor: 'EC / DN', status: 'validated', isRequired: true },
    { kind: 'notification', label: 'Notification cloture Phase 1', sourceActor: 'AIDN mock', status: 'validated', isRequired: true },
  ],
  formal_application: [
    { kind: 'required_document', label: 'Checklist dossier formel', sourceActor: 'DN', status: 'pending_review', isRequired: true },
    { kind: 'formal_courrier', label: 'Courrier DG vise', sourceActor: 'DG / DN', status: 'scanned', isRequired: true },
    { kind: 'notification', label: 'Convocation reunion formelle', sourceActor: 'DN', status: 'validated', isRequired: true },
    { kind: 'meeting_report', label: 'Compte rendu reunion formelle', sourceActor: 'DN', status: 'received', isRequired: true },
    { kind: 'formal_courrier', label: 'Courrier recevabilite', sourceActor: 'DN', status: 'pending_review', isRequired: true },
    { kind: 'formal_courrier', label: 'Courrier cloture Phase 2', sourceActor: 'DN', status: 'expected', isRequired: true },
  ],
  document_evaluation: [
    { kind: 'invoice', label: "Facture frais d'etude", sourceActor: 'S5 / compta', status: 'received', documentId: 'doc-005', isRequired: true },
    { kind: 'payment_proof', label: 'Quittance/preuve paiement', sourceActor: 'Postulant / assistant DN', status: 'pending_review', isRequired: true },
    { kind: 'formal_courrier', label: 'Lettre cloture Phase 3', sourceActor: 'DN', status: 'expected', isRequired: true },
  ],
  onsite_demonstration: [
    { kind: 'invoice', label: 'Facture audit', sourceActor: 'S5 / compta', status: 'expected', isRequired: true },
    { kind: 'payment_proof', label: 'Quittance audit', sourceActor: 'Postulant / assistant DN', status: 'missing', isRequired: true },
    { kind: 'r3_opinion', label: 'Avis R3 conformite', sourceActor: 'R3', status: 'pending_review', documentId: 'doc-006', isRequired: true },
    { kind: 'formal_courrier', label: 'Lettre cloture Phase 4', sourceActor: 'DN', status: 'expected', isRequired: true },
  ],
  delivery: [
    { kind: 'invoice', label: 'Facture delivrance', sourceActor: 'S5 / compta', status: 'expected', isRequired: true },
    { kind: 'payment_proof', label: 'Quittance delivrance', sourceActor: 'Postulant / assistant DN', status: 'expected', isRequired: true },
    { kind: 'formal_courrier', label: 'Lettre cloture Phase 5', sourceActor: 'DN', status: 'expected', isRequired: true },
    { kind: 'formal_courrier', label: 'Approbations / acceptations', sourceActor: 'DN', status: 'expected', isRequired: true },
    { kind: 'certificate_artifact', label: 'Certificat signe scanne', sourceActor: 'DN', status: 'pending_review', documentId: 'doc-014', isRequired: true },
    { kind: 'notification', label: 'Invitation retrait', sourceActor: 'DN', status: 'expected', isRequired: true },
    { kind: 'certificate_artifact', label: 'Preuve remise', sourceActor: 'DN', status: 'expected', isRequired: true },
  ],
};

function adaptEvidenceStatus(template: EvidenceSeed, phaseStatus: AidnOmaPhaseStatus): AidnPhaseEvidenceItem['status'] {
  if (phaseStatus === 'completed' && template.status !== 'not_applicable') return 'validated';
  if (phaseStatus === 'not_started') return template.isRequired ? 'expected' : 'not_applicable';
  if (phaseStatus === 'blocked' && template.kind === 'payment_proof') return 'missing';
  return template.status;
}

export const aidnPhaseEvidenceItems: AidnPhaseEvidenceItem[] = aidnOmaPhases.flatMap((phaseItem) =>
  phaseEvidenceTemplates[phaseItem.key].map((template, index) => ({
    ...template,
    id: `evidence-${phaseItem.id}-${index + 1}`,
    dossierId: phaseItem.dossierId,
    phaseKey: phaseItem.key,
    status: adaptEvidenceStatus(template, phaseItem.status),
    dueDate: template.dueDate ?? phaseItem.dueAt,
    receivedAt: template.receivedAt ?? (phaseItem.status === 'completed' ? phaseItem.completedAt : template.receivedAt),
  })),
);

function nextActionForPhase(phaseItem: AidnOmaPhase): AidnPhaseNextAction {
  const base = {
    id: `next-${phaseItem.id}`,
    dossierId: phaseItem.dossierId,
    phaseKey: phaseItem.key,
  };

  if (phaseItem.status === 'completed') {
    return { ...base, label: 'Verifier le courrier de cloture et maintenir les preuves archivees.', recommendedActor: 'DN', priority: 'low', status: 'done' };
  }
  if (phaseItem.status === 'blocked' || phaseItem.status === 'late') {
    return { ...base, label: 'Relancer le touchpoint concerne et documenter la cause du blocage.', recommendedActor: phaseTouchpointActor(phaseItem.key), priority: 'high', status: 'pending' };
  }
  if (phaseItem.status === 'in_progress') {
    return { ...base, label: 'Completer la checklist de preuves et preparer le courrier de cloture.', recommendedActor: 'DN', priority: 'medium', status: 'pending' };
  }
  return { ...base, label: 'Preparer les prealables avant lancement de phase.', recommendedActor: 'DN', priority: 'low', status: 'simulated' };
}

function phaseTouchpointActor(phaseKey: AidnOmaPhaseKey): string {
  if (phaseKey === 'document_evaluation' || phaseKey === 'delivery') return 'S5 / compta';
  if (phaseKey === 'onsite_demonstration') return 'S5 / R3 / DN';
  return 'DN';
}

export const aidnPhaseNextActions: AidnPhaseNextAction[] = aidnOmaPhases.map(nextActionForPhase);

export const aidnTimelineEvents: AidnTimelineEvent[] = [
  { id: 'event-001', demandeId: 'demande-001', type: 'demande_submitted', label: 'Demande soumise', description: 'Aero Service Gabon a soumis une demande initiale.', occurredAt: '2026-01-08T09:20:00Z', actor: 'Postulant' },
  { id: 'event-002', demandeId: 'demande-002', type: 'courrier_received', label: 'Courrier reçu physiquement', description: 'Extension de périmètre déposée au bureau courrier.', occurredAt: '2026-01-12T11:35:00Z', actor: 'Bureau courrier' },
  { id: 'event-003', demandeId: 'demande-002', type: 'courrier_sent_to_dg', label: 'Courrier transmis au DG', description: 'Courrier CR-2026-002 transmis pour orientation.', occurredAt: '2026-01-13T08:45:00Z', actor: 'Secrétariat DN' },
  { id: 'event-004', demandeId: 'demande-003', type: 'dg_decision_recorded', label: 'Décision DG enregistrée', description: 'Orientation favorable vers la DN.', occurredAt: '2026-01-21T16:00:00Z', actor: 'Secrétariat DN' },
  { id: 'event-005', demandeId: 'demande-003', dossierId: 'dossier-001', type: 'dossier_opened', label: 'Dossier DN ouvert', description: 'Création du dossier DN-OMA-2026-001.', occurredAt: '2026-01-22T09:00:00Z', actor: 'M. Obame' },
  { id: 'event-006', demandeId: 'demande-004', dossierId: 'dossier-002', type: 'phase_completed', label: 'Phase OMA clôturée', description: 'Phase demande formelle clôturée.', occurredAt: '2026-02-28T16:20:00Z', actor: 'Mme Ndong' },
  { id: 'event-007', dossierId: 'dossier-002', type: 'document_received', label: 'Document reçu', description: 'Référentiel procédures S5 ajouté au dossier.', occurredAt: '2026-03-12T15:30:00Z', actor: 'S5' },
  { id: 'event-008', dossierId: 'dossier-003', type: 'meeting_scheduled', label: 'Réunion planifiée', description: 'Inspection atelier planifiée sur site.', occurredAt: '2026-04-18T10:00:00Z', actor: 'M. Mba' },
  { id: 'event-009', dossierId: 'dossier-003', type: 'phase_completed', label: 'Phase documentaire clôturée', description: 'Évaluation approfondie des documents validée.', occurredAt: '2026-04-20T17:10:00Z', actor: 'M. Mba' },
  { id: 'event-010', dossierId: 'dossier-003', type: 'certificate_issued', label: 'Certificat délivré', description: 'Certificat OMA-GA-2026-003 délivré.', occurredAt: '2026-04-24T12:00:00Z', actor: 'DN' },
  { id: 'event-011', demandeId: 'demande-010', type: 'dg_decision_recorded', label: 'Décision DG enregistrée', description: 'Renouvellement orienté vers la DN.', occurredAt: '2026-03-25T08:50:00Z', actor: 'Secrétariat DN' },
  { id: 'event-012', demandeId: 'demande-010', dossierId: 'dossier-004', type: 'dossier_opened', label: 'Dossier DN ouvert', description: 'Ouverture du dossier renouvellement Atlantic Aero Gabon.', occurredAt: '2026-03-26T09:15:00Z', actor: 'Mme Ella' },
];
