export const ACTIVE_SUBMISSION_STATUSES = new Set([
  "submitted",
  "under_review",
  "validated",
  "requires_correction",
  "incomplete",
]);

/**
 * Phase 2 statuses that confirm DG evidence is recorded.
 * Used by both canClosePhase and the closeFormalRequestPhase guard
 * so they always apply the same rule.
 */
export const FORMAL_DG_EVIDENCE_STATUSES = new Set([
  "formal_dg_returned",
  "formal_dg_decision_recorded",
  "formal_meeting_invited",
  "formal_meeting_held",
  "formal_recevability_recorded",
  "formal_ready_to_close",
  "formal_requires_correction",
  "formal_closed",
]);

export const SUPPORTING_DOC_CATEGORY: Record<string, string> = {
  oma_approval_form: "form",
  management_personnel_acceptance: "form",
  compliance_statement: "form",
};

export const ACTIVE_SUBMISSION_STATUS_SET = new Set([
  "submitted",
  "under_review",
  "validated",
  "requires_correction",
  "incomplete",
]);

export const REVIEW_STATUSES = new Set([
  "validated",
  "requires_correction",
  "incomplete",
]);
