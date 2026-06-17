import { AlertCircle, ArrowRight, FolderOpen } from "lucide-react";

import { RequestStatusBadge } from "../../components/RequestStatusBadge";
import { RequestTypeLabel } from "../../components/RequestTypeLabel";
import { Badge } from "../../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import type { PortalRequest } from "../../lib/api/requests";
import { formatRequestDate } from "./my-requests.helpers";

export function RequestCardGrid({
  requests,
  onOpen,
}: {
  requests: PortalRequest[];
  onOpen: (request: PortalRequest) => void;
}): React.JSX.Element {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {requests.map((request) => {
        const hasAction = request.status === "intake_requires_correction";

        return (
          <button
            key={request.id}
            type="button"
            onClick={() => onOpen(request)}
            className="group text-left"
          >
            <Card className="h-full rounded-lg transition-colors group-hover:bg-slate-50">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      <RequestTypeLabel type={request.requestType} />
                    </p>
                    <CardTitle className="mt-1 line-clamp-2 text-base">
                      {request.subject}
                    </CardTitle>
                  </div>
                  <ArrowRight
                    size={15}
                    className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                    aria-hidden="true"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {request.message ? (
                  <p className="line-clamp-2 text-sm text-slate-600">
                    {request.message}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <RequestStatusBadge
                    status={request.status}
                    label={request.portalStatusLabel}
                  />
                  {request.dossierId ? (
                    <Badge variant="outline" className="gap-1">
                      <FolderOpen size={12} aria-hidden="true" />
                      Dossier ouvert
                    </Badge>
                  ) : null}
                  {hasAction ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle size={12} aria-hidden="true" />
                      Action requise
                    </Badge>
                  ) : null}
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="font-semibold text-slate-500">Date</dt>
                    <dd className="text-slate-950">
                      {formatRequestDate(request.submittedAt ?? request.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Accès</dt>
                    <dd className="font-medium text-slate-950">
                      Consulter
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
