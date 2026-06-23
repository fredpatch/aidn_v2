import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { RequestStatusBadge } from "../../components/RequestStatusBadge";
import { RequestTypeLabel } from "../../components/RequestTypeLabel";
import type { PortalDossierDetail } from "../../lib/api/dossiers";
import type { PortalRequest } from "../../lib/api/requests";
import {
  getPreliminaryStatusLabel,
  isPreliminaryPhaseActive,
} from "./status.helpers";

type RequestDetailHeaderProps = {
  request: PortalRequest;
  dossierDetail?: PortalDossierDetail | null;
  backTo: string;
};

export function RequestDetailHeader({
  request,
  dossierDetail,
  backTo,
}: RequestDetailHeaderProps): React.JSX.Element {
  // Use specific preliminary phase status when in preliminary phase
  let displayLabel = request.portalStatusLabel;
  if (
    request.status === "dossier_opened" &&
    isPreliminaryPhaseActive(dossierDetail)
  ) {
    displayLabel = getPreliminaryStatusLabel(
      dossierDetail?.preliminary.status ?? null,
    );
  }

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
          <RequestStatusBadge status={request.status} label={displayLabel} />
        </div>
        <p className="page-subtitle line-clamp-1">{request.subject}</p>
      </div>
    </div>
  );
}
