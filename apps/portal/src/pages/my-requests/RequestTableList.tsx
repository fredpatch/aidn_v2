import { AlertCircle, ArrowRight, FolderOpen } from "lucide-react";

import { RequestStatusBadge } from "../../components/RequestStatusBadge";
import { RequestTypeLabel } from "../../components/RequestTypeLabel";
import type { PortalRequest } from "../../lib/api/requests";
import { formatRequestDate } from "./my-requests.helpers";

export function RequestTableList({
  requests,
  onOpen,
}: {
  requests: PortalRequest[];
  onOpen: (request: PortalRequest) => void;
}): React.JSX.Element {
  return (
    <div className="surface overflow-hidden rounded-lg">
      <div className="hidden grid-cols-[1.1fr_1.4fr_0.9fr_0.8fr_40px] gap-4 border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase text-slate-400 md:grid">
        <span>Type</span>
        <span>Objet</span>
        <span>Statut</span>
        <span>Date</span>
        <span />
      </div>

      <div className="divide-y divide-slate-100">
        {requests.map((request) => {
          const hasAction = request.status === "intake_requires_correction";

          return (
            <button
              key={request.id}
              type="button"
              onClick={() => onOpen(request)}
              className="grid w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-50 md:grid-cols-[1.1fr_1.4fr_0.9fr_0.8fr_40px] md:items-center md:gap-4"
            >
              <span className="text-xs font-bold uppercase text-slate-400">
                <RequestTypeLabel type={request.requestType} />
              </span>

              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-950">
                  {request.subject}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {request.dossierId ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <FolderOpen size={12} aria-hidden="true" />
                      Dossier ouvert
                    </span>
                  ) : null}
                  {hasAction ? (
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <AlertCircle size={12} aria-hidden="true" />
                      Action requise
                    </span>
                  ) : null}
                </span>
              </span>

              <span>
                <RequestStatusBadge
                  status={request.status}
                  label={request.portalStatusLabel}
                />
              </span>

              <span className="text-sm text-slate-600">
                {formatRequestDate(request.submittedAt ?? request.createdAt)}
              </span>

              <ArrowRight
                size={16}
                className="hidden text-slate-300 md:block"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
