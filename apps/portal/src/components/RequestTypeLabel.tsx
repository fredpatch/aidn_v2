import type { PortalRequestType } from "../lib/api/portal.api";

const requestTypeLabels: Record<PortalRequestType, string> = {
  oma_approval: "Agrement OMA",
  oma_recognition: "Reconnaissance OMA",
  oma_renewal: "Renouvellement OMA",
  oma_modification: "Modification OMA",
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

