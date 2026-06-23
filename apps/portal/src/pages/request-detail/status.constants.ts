import type { PortalRequestStatus } from "../../lib/api/requests";

/**
 * Request status display labels (French)
 * Maps all possible request statuses to user-friendly labels
 */
export const REQUEST_STATUS_LABELS: Record<PortalRequestStatus, string> = {
  draft: "Brouillon",
  courrier_uploaded: "Demande reçue",
  courrier_physical_declared: "Demande reçue",
  submitted: "Demande reçue",
  intake_in_review: "En attente d'orientation administrative",
  intake_requires_correction: "Action requise",
  initial_sent_to_dg: "En attente d'orientation administrative",
  initial_dg_returned: "En cours de traitement administratif",
  initial_dg_decision_recorded: "En cours de traitement administratif",
  oriented_to_dn: "Transmise à la Direction de la Navigabilité",
  rejected: "Demande annulée",
  reoriented: "En cours de traitement administratif",
  dossier_opened: "Dossier en cours de traitement",
  closed: "Dossier en cours de traitement",
};

/**
 * Status color tones for visual differentiation
 * Maps request statuses to one of: neutral, info, success, warning
 */
export const STATUS_TONES: Record<
  PortalRequestStatus,
  "neutral" | "info" | "success" | "warning"
> = {
  draft: "neutral",
  courrier_uploaded: "info",
  courrier_physical_declared: "info",
  submitted: "success",
  intake_in_review: "info",
  intake_requires_correction: "warning",
  initial_sent_to_dg: "warning",
  initial_dg_returned: "warning",
  initial_dg_decision_recorded: "warning",
  oriented_to_dn: "info",
  rejected: "warning",
  reoriented: "warning",
  dossier_opened: "info",
  closed: "neutral",
};

/**
 * Preliminary phase status display labels (French)
 * Maps backend preliminary.status values to specific, actionable user messages
 */
export const PRELIMINARY_STATUS_LABELS: Record<string, string> = {
  preliminary_not_started: "En cours de traitement par l'ANAC",
  preliminary_started: "En attente de première réunion de contact",
  first_meeting_invited: "Première réunion programmée",
  first_meeting_held: "Première réunion tenue",
  pre_eval_form_available: "Formulaire pré-évaluation à compléter",
  pre_eval_form_submitted: "Formulaire soumis en examen",
  pre_eval_sent_to_dg: "Pré-évaluation en examen",
  pre_eval_dg_decision_recorded: "Pré-évaluation examinée",
  preliminary_meeting_invited: "Réunion préliminaire programmée",
  preliminary_meeting_held: "Réunion préliminaire tenue",
  preliminary_ready_to_close: "Phase préliminaire en attente de clôture",
  preliminary_closed: "Phase préliminaire clôturée",
};

/**
 * Preliminary phase sub-steps for progress tracking
 * Represents the logical flow through the preliminary phase
 */
export const PRELIMINARY_STEPS = {
  START: "start",
  FIRST_MEETING: "first_meeting",
  PRE_EVAL_FORM: "pre_eval_form",
  PRELIMINARY_MEETING: "preliminary_meeting",
  CLOSED: "closed",
} as const;

export type PreliminaryStep =
  (typeof PRELIMINARY_STEPS)[keyof typeof PRELIMINARY_STEPS];

/**
 * Map preliminary statuses to their corresponding step
 */
export const STATUS_TO_PRELIMINARY_STEP: Record<string, PreliminaryStep> = {
  preliminary_not_started: PRELIMINARY_STEPS.START,
  preliminary_started: PRELIMINARY_STEPS.FIRST_MEETING,
  first_meeting_invited: PRELIMINARY_STEPS.FIRST_MEETING,
  first_meeting_held: PRELIMINARY_STEPS.PRE_EVAL_FORM,
  pre_eval_form_available: PRELIMINARY_STEPS.PRE_EVAL_FORM,
  pre_eval_form_submitted: PRELIMINARY_STEPS.PRE_EVAL_FORM,
  pre_eval_sent_to_dg: PRELIMINARY_STEPS.PRE_EVAL_FORM,
  pre_eval_dg_decision_recorded: PRELIMINARY_STEPS.PRELIMINARY_MEETING,
  preliminary_meeting_invited: PRELIMINARY_STEPS.PRELIMINARY_MEETING,
  preliminary_meeting_held: PRELIMINARY_STEPS.PRELIMINARY_MEETING,
  preliminary_ready_to_close: PRELIMINARY_STEPS.PRELIMINARY_MEETING,
  preliminary_closed: PRELIMINARY_STEPS.CLOSED,
};

/**
 * Request status values that indicate a request is in preliminary phase
 */
export const PRELIMINARY_PHASE_STATUS = new Set(["dossier_opened"]);

/**
 * Request status values that require immediate action
 */
export const ACTION_REQUIRED_STATUSES = new Set(["intake_requires_correction"]);
