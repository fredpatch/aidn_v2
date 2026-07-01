export const REQUEST_TYPES = [
  "oma_approval",
  "oma_recognition",
  "oma_renewal",
  "oma_modification",
] as const;

export const REQUEST_STATUSES = [
  "draft",
  "courrier_uploaded",
  "courrier_physical_declared",
  "submitted",
  "intake_in_review",
  "intake_requires_correction",
  "initial_sent_to_dg",
  "initial_dg_returned",
  "initial_dg_decision_recorded",
  "oriented_to_dn",
  "rejected",
  "reoriented",
  "dossier_opened",
  "closed",
] as const;

export const EDITABLE_STATUSES = [
  "draft",
  "courrier_uploaded",
  "courrier_physical_declared",
] as const;

export const INTAKE_MUTABLE_STATUSES = [
  "submitted",
  "intake_in_review",
  "intake_requires_correction",
] as const;

export const LOCATIONS = ["ANAC", "DG", "DN", "other"] as const;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const DG_RETURN_REQUIRED_MESSAGE =
  "Le courrier signe DG doit etre enregistre avant de demarrer la verification DN.";

export const PHASE_KEYS = [
  "preliminary",
  "formal_request",
  "document_evaluation",
  "inspection",
  "delivery",
] as const;

export const PHASE_INITIAL_STATUS: Record<(typeof PHASE_KEYS)[number], string> =
  {
    preliminary: "in_progress",
    formal_request: "not_started",
    document_evaluation: "not_started",
    inspection: "not_started",
    delivery: "not_started",
  };
