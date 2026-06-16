import type { PortalRequestType } from "../lib/api/portal.api";

const requestTypeLabels: Record<PortalRequestType, string> = {
  oma_recognition: "Certificat de reconnaissance OMA",
  oma_approval: "Certificat d’agrément OMA",
  oma_renewal: "Renouvellement de Certificat OMA",
  oma_modification: "Modification de Certificat OMA",
};

export function getRequestTypeLabel(type: PortalRequestType): string {
  return requestTypeLabels[type] ?? type;
}

export function RequestTypeLabel({
  type,
}: {
  type: PortalRequestType;
}): React.JSX.Element {
  return <>{getRequestTypeLabel(type)}</>;
}
