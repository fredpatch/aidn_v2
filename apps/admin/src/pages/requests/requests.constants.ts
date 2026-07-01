import type {
  AdminRequestStatus,
  AdminRequestType,
  CourrierSource,
} from "../../lib/api/requests";

// Request type labels for display
export const requestTypeLabels: Record<AdminRequestType, string> = {
  oma_recognition: "Certificat de reconnaissance OMA",
  oma_approval: "Certificat d'agrément OMA",
  oma_renewal: "Renouvellement de Certificat OMA",
  oma_modification: "Modification de Certificat OMA",
};

// Request status labels for display
export const statusLabels: Record<AdminRequestStatus, string> = {
  draft: "Brouillon",
  courrier_uploaded: "Courrier ajouté",
  courrier_physical_declared: "Dépôt physique déclaré",
  submitted: "Demande soumise",
  intake_in_review: "Vérification interne",
  intake_requires_correction: "Correction demandée",
  initial_sent_to_dg: "En attente signature DG",
  initial_dg_returned: "Courrier DG signé disponible",
  initial_dg_decision_recorded: "Décision DG enregistrée",
  oriented_to_dn: "Courrier DG signé disponible",
  rejected: "Annulée par DG",
  reoriented: "Legacy: hors MVP",
  dossier_opened: "Dossier ouvert",
  closed: "Clôturée",
};

// Visible status options for filters (excludes legacy statuses)
export const visibleStatusOptions = Object.entries(statusLabels).filter(
  ([value]) => value !== "reoriented",
);

// Courrier source labels for display
export const sourceLabels: Record<CourrierSource, string> = {
  portal_upload: "Téléversé portail",
  physical_deposit: "Dépôt physique",
  internal_scan: "Scan interne",
  generated_from_template: "Généré",
};

// Statuses that occur before DG signature
export const beforeDgStatuses = [
  "submitted",
  "intake_in_review",
  "intake_requires_correction",
] as const;

// Statuses that indicate DG return is complete
export const dgReturnCompleteStatuses = [
  "initial_dg_returned",
  "oriented_to_dn",
] as const;

// Statuses that indicate DG signature is available
export const dgSignedAvailableStatuses = [
  "initial_dg_returned",
  "oriented_to_dn",
  "dossier_opened",
] as const;
