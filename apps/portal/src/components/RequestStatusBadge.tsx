import { PortalStatusBadge } from "./PortalStatusBadge";
import type { PortalRequestStatus } from "../lib/api/requests";
import {
  getRequestStatusLabel,
  getStatusTone,
} from "../pages/request-detail/status.helpers";

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
      tone={getStatusTone(status)}
    />
  );
}
