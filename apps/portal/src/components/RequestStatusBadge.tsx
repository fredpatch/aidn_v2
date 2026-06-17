import { PortalStatusBadge } from "./PortalStatusBadge";
import type { PortalRequestStatus } from "../lib/api/requests";

const statusLabels: Record<PortalRequestStatus, string> = {
  draft: "Brouillon",
  courrier_uploaded: "Demande reçue",
  courrier_physical_declared: "Demande reçue",
  submitted: "Demande reçue",
  intake_in_review: "En attente d’orientation administrative",
  intake_requires_correction: "Action requise",
  initial_sent_to_dg: "En attente d’orientation administrative",
  initial_dg_returned: "En cours de traitement administratif",
  initial_dg_decision_recorded: "En cours de traitement administratif",
  oriented_to_dn: "Transmise à la Direction de la Navigabilité",
  rejected: "Demande annulée",
  reoriented: "En cours de traitement administratif",
  dossier_opened: "Dossier en cours de traitement",
  closed: "Dossier en cours de traitement",
};

const statusTones: Record<
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

export function getRequestStatusLabel(status: PortalRequestStatus): string {
  return statusLabels[status] ?? "Statut en cours de mise à jour";
}

export function RequestStatusBadge({
  status,
  label,
}: {
  status: PortalRequestStatus;
  label?: string;
}): React.JSX.Element {
  return (
    <PortalStatusBadge
      label={label ?? getRequestStatusLabel(status)}
      tone={statusTones[status] ?? "neutral"}
    />
  );
}
