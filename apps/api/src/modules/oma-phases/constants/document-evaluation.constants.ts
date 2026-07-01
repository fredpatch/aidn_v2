/**
 * Document evaluation workflow constants.
 *
 * Owns Phase III status sets shared by payment, review, correction, and portal
 * state slices. Keep status spelling aligned with the OMA phase model enum.
 */
export const DOCUMENT_EVALUATION_PAYMENT_PASSED_STATUSES = new Set([
  "document_evaluation_study_in_progress",
  "document_evaluation_waiting_corrections",
  "document_evaluation_ready_to_close",
  "document_evaluation_closed",
]);

export const DOCUMENT_EVALUATION_REVIEW_STATUSES = new Set([
  "satisfaisant",
  "non_satisfaisant",
]);
