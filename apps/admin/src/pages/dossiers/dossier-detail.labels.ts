import type {
  DossierStatus,
  DossierType,
  OmaPhaseKey,
  PreliminaryStatus,
} from "@/lib/api/dossiers.api";

export const dossierTypeLabels: Record<DossierType, string> = {
  oma_recognition: "Certificat de reconnaissance OMA",
  oma_approval: "Certificat d'agrément OMA",
  oma_renewal: "Renouvellement de Certificat OMA",
  oma_modification: "Modification de Certificat OMA",
};

export const dossierStatusLabels: Record<DossierStatus, string> = {
  opened: "Ouvert",
  preliminary_phase: "Phase préliminaire",
  formal_request_phase: "Demande formelle",
  document_evaluation_phase: "Évaluation documents",
  inspection_phase: "Inspection",
  delivery_phase: "Délivrance",
  closed: "Clôturé",
  suspended: "Suspendu",
  cancelled: "Annulé",
};

export const phaseKeyLabels: Record<OmaPhaseKey, string> = {
  preliminary: "Phase - Préliminaire",
  formal_request: "Phase - Demande formelle",
  document_evaluation: "Phase - Évaluation approfondie",
  inspection: "Phase - Inspection / R3",
  delivery: "Phase - Délivrance",
};

export const phaseStatusLabels: Record<string, string> = {
  not_started: "Non démarrée",
  in_progress: "En cours",
  waiting_postulant: "Attente postulant",
  waiting_dg: "Attente DG",
  waiting_meeting: "Attente réunion",
  ready_to_close: "Prête à clore",
  closed: "Clôturée",
  suspended: "Suspendue",
};

export const preliminaryStatusLabels: Record<PreliminaryStatus, string> = {
  preliminary_not_started: "Non démarrée",
  preliminary_started: "Phase préliminaire démarrée",
  first_meeting_invited: "Première réunion planifiée",
  first_meeting_held: "Première réunion tenue",
  pre_eval_form_available: "Formulaire pré-évaluation disponible",
  pre_eval_form_submitted: "Formulaire pré-évaluation soumis",
  pre_eval_sent_to_dg: "Pré-évaluation mise en circuit DG",
  pre_eval_dg_decision_recorded: "Retour DG pré-évaluation enregistré",
  preliminary_meeting_invited: "Réunion préliminaire planifiée",
  preliminary_meeting_held: "Réunion préliminaire tenue",
  preliminary_ready_to_close: "Prêt à clôturer",
  preliminary_closed: "Phase préliminaire clôturée",
};

export const meetingStatusLabels: Record<string, string> = {
  planned: "Planifiée",
  invited: "Invitation envoyée",
  held: "Tenue",
  postponed: "Reportée",
  cancelled: "Annulée",
};

export const PHASE_ORDER: OmaPhaseKey[] = [
  "preliminary",
  "formal_request",
  "document_evaluation",
  "inspection",
  "delivery",
];

export const documentEvaluationStatusLabels: Record<string, string> = {
  document_evaluation_waiting_invoice: "En attente de facture",
  document_evaluation_waiting_payment: "En attente du paiement",
  document_evaluation_payment_proof_submitted: "Preuve de paiement reçue",
  document_evaluation_study_in_progress: "Évaluation en cours",
  document_evaluation_waiting_corrections: "Corrections demandées",
  document_evaluation_ready_to_close: "Prête à clôturer",
  document_evaluation_closed: "Phase III clôturée",
};

export const phasePaymentStatusLabels: Record<string, string> = {
  invoice_pending: "Facture en attente",
  invoice_sent: "Facture envoyée",
  payment_proof_submitted: "Preuve de paiement reçue",
};

export const documentEvaluationReviewStatusLabels: Record<string, string> = {
  pending: "En attente d'évaluation",
  satisfaisant: "Satisfaisant",
  non_satisfaisant: "Non satisfaisant",
  correction_submitted: "Correction reçue",
};

export function formatDate(value?: string): string {
  if (!value) return "Non renseigné";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}
