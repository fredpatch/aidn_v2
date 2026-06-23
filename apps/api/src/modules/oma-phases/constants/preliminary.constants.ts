/**
 * Preliminary phase constants.
 *
 * Shared status labels and visibility/download field sets for Phase I read
 * models and download guards. Keep workflow branching in services.
 */
export const PRELIMINARY_STATUS_PORTAL_LABELS: Record<string, string> = {
  preliminary_not_started: "En cours de traitement par l'ANAC",
  preliminary_started: "En cours de traitement par l'ANAC",
  first_meeting_invited: "Rendez-vous programmé",
  first_meeting_held: "En cours d'examen",
  pre_eval_form_available: "Formulaire de pré-évaluation à compléter",
  pre_eval_form_submitted: "En cours d'examen",
  pre_eval_sent_to_dg: "En cours d'examen",
  pre_eval_dg_decision_recorded: "En cours d'examen",
  preliminary_meeting_invited: "Rendez-vous programmé",
  preliminary_meeting_held: "En cours d'examen",
  preliminary_ready_to_close: "En cours d'examen",
  preliminary_closed: "Phase préliminaire clôturée",
};

export const PRE_EVAL_VISIBLE_STATUSES = new Set([
  "pre_eval_form_available",
  "pre_eval_form_submitted",
  "pre_eval_sent_to_dg",
  "pre_eval_dg_decision_recorded",
  "preliminary_meeting_invited",
  "preliminary_meeting_held",
  "preliminary_ready_to_close",
  "preliminary_closed",
]);

export const FORMAL_REQUEST_PORTAL_LABELS: Record<string, string> = {
  formal_not_started: "Demande formelle attendue",
  formal_waiting_request: "Demande formelle attendue",
  formal_request_received: "Demande formelle reçue",
  formal_documents_tracking: "Demande formelle reçue",
  formal_sent_to_dg: "Demande formelle en cours d'examen",
  formal_dg_returned: "Demande formelle en cours d'examen",
  formal_dg_decision_recorded: "Demande formelle en cours d'examen",
  formal_meeting_invited: "Réunion formelle programmée",
  formal_meeting_held: "Documents de demande formelle à compléter",
  formal_recevability_recorded: "Demande formelle en cours d'examen",
  formal_ready_to_close: "En attente de finalisation par l'ANAC",
  formal_requires_correction: "Action requise",
  formal_closed: "Phase de demande formelle clôturée",
};

export const ADMIN_PRELIMINARY_DOWNLOAD_FIELDS = [
  "firstMeetingReportDocumentId",
  "preEvaluationTemplateDocumentId",
  "completedPreEvaluationDocumentId",
  "preEvaluationDgAnnotatedDocumentId",
  "preliminaryMeetingReportDocumentId",
  "closureCourrierDocumentId",
] as const;

export const REPORT_REQUIRED_MEETING_TYPES = new Set([
  "first_contact_meeting",
  "preliminary_meeting",
]);
