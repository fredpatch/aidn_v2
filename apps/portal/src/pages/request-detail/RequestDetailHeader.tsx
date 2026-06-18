import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { RequestStatusBadge } from "../../components/RequestStatusBadge";
import { RequestTypeLabel } from "../../components/RequestTypeLabel";
import type { PortalRequest } from "../../lib/api/requests";

type RequestDetailHeaderProps = {
  request: PortalRequest;
  backTo: string;
};

export function RequestDetailHeader({
  request,
  backTo,
}: RequestDetailHeaderProps): React.JSX.Element {
  return (
    <div>
      <Link className="btn btn-secondary mb-4 w-fit" to={backTo}>
        <ArrowLeft size={16} aria-hidden="true" />
        Mes demandes
      </Link>
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="page-title">
            <RequestTypeLabel type={request.requestType} />
          </h1>
          <RequestStatusBadge
            status={request.status}
            label={request.portalStatusLabel}
          />
        </div>
        <p className="page-subtitle line-clamp-1">{request.subject}</p>
      </div>
    </div>
  );
}
