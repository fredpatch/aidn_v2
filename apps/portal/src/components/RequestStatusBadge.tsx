import { PortalStatusBadge } from "./PortalStatusBadge";
import type { PortalRequestStatus } from "../lib/api/portal.api";

const statusLabels: Record<PortalRequestStatus, string> = {
  draft: "Brouillon",
  courrier_uploaded: "Courrier ajoute",
  courrier_physical_declared: "Depot physique declare",
  submitted: "Demande recue",
  intake_in_review: "Demande en verification",
  intake_requires_correction: "Action requise",
  initial_sent_to_dg: "En attente d'orientation administrative",
  initial_dg_returned: "En cours de traitement administratif",
  initial_dg_decision_recorded: "Decision administrative enregistree",
  oriented_to_dn: "Transmise a la Direction de la Navigabilite",
  rejected: "Demande non retenue",
  reoriented: "Demande reorientee",
  dossier_opened: "Dossier en cours de traitement",
  closed: "Cloturee",
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
  return statusLabels[status] ?? status;
}

export function RequestStatusBadge({
  status,
}: {
  status: PortalRequestStatus;
}): React.JSX.Element {
  return (
    <PortalStatusBadge
      label={getRequestStatusLabel(status)}
      tone={statusTones[status] ?? "neutral"}
    />
  );
}
