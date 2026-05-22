import { AlertCircle, ClipboardList, Eye, FolderOpen, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";
import { RequestStatusBadge } from "../components/RequestStatusBadge";
import { RequestTypeLabel } from "../components/RequestTypeLabel";
import { listRequests, type PortalRequest } from "../lib/api/portal.api";
import { PortalApiError } from "../lib/api/http";
import { portalRoutes } from "../lib/routes";

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "-";

function RequestPreviewPanel({
  request,
}: {
  request: PortalRequest;
}): React.JSX.Element {
  const hasAction = request.status === "intake_requires_correction";

  return (
    <div className="surface flex flex-col gap-4 rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-slate-400">
            <RequestTypeLabel type={request.requestType} />
          </p>
          <p className="mt-1 font-semibold text-slate-950">{request.subject}</p>
        </div>
        <RequestStatusBadge
          status={request.status}
          label={request.portalStatusLabel}
        />
      </div>

      {request.message ? (
        <p className="text-sm text-slate-600">{request.message}</p>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="font-semibold text-slate-500">Date</dt>
          <dd className="text-slate-950">
            {formatDate(request.submittedAt ?? request.createdAt)}
          </dd>
        </div>
        {request.dossierId ? (
          <div>
            <dt className="font-semibold text-slate-500">Dossier</dt>
            <dd className="flex items-center gap-1 text-emerald-700">
              <FolderOpen size={14} aria-hidden="true" />
              Ouvert
            </dd>
          </div>
        ) : null}
      </dl>

      {hasAction ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          <AlertCircle size={14} aria-hidden="true" />
          Action requise : correction demandée.
        </div>
      ) : null}

      <Link
        className="btn btn-primary w-fit"
        to={portalRoutes.requestDetail(request.id)}
      >
        <Eye size={16} aria-hidden="true" />
        Ouvrir la demande
      </Link>
    </div>
  );
}

export function MyRequestsPage(): React.JSX.Element {
  const [requests, setRequests] = useState<PortalRequest[]>([]);
  const [selected, setSelected] = useState<PortalRequest | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    listRequests()
      .then(({ items }) => {
        if (isMounted) {
          setRequests(items);
          if (items.length > 0) setSelected(items[0]);
        }
      })
      .catch((caught) => {
        if (isMounted) {
          setError(
            caught instanceof PortalApiError
              ? caught.message
              : "Une erreur est survenue. Veuillez réessayer.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="page-title">Mes demandes</h1>
          <p className="page-subtitle">
            Suivez vos brouillons et demandes soumises depuis le portail.
          </p>
        </div>
        <Link className="btn btn-primary w-fit" to={portalRoutes.newRequest}>
          <Plus size={16} aria-hidden="true" />
          Nouvelle demande
        </Link>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="surface rounded-lg p-5 text-sm font-semibold text-slate-600">
          Chargement des demandes…
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucune demande enregistrée."
          description="Créez une nouvelle demande pour initier le dépôt de votre courrier."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Left panel – request list */}
          <div className="surface divide-y divide-slate-100 overflow-hidden rounded-lg">
            {requests.map((request) => {
              const hasAction =
                request.status === "intake_requires_correction";
              const isSelected = selected?.id === request.id;

              return (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setSelected(request)}
                  className={`flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? "bg-slate-950 text-white"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold uppercase ${isSelected ? "text-slate-300" : "text-slate-400"}`}
                    >
                      <RequestTypeLabel type={request.requestType} />
                    </span>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      {request.dossierId ? (
                        <FolderOpen
                          size={12}
                          className={
                            isSelected
                              ? "text-emerald-300"
                              : "text-emerald-600"
                          }
                          aria-label="Dossier ouvert"
                        />
                      ) : null}
                      {hasAction ? (
                        <AlertCircle
                          size={12}
                          className={
                            isSelected ? "text-amber-300" : "text-amber-500"
                          }
                          aria-label="Action requise"
                        />
                      ) : null}
                    </div>
                  </div>
                  <p
                    className={`line-clamp-1 text-sm font-semibold ${isSelected ? "text-white" : "text-slate-950"}`}
                  >
                    {request.subject}
                  </p>
                  <span
                    className={`text-xs ${isSelected ? "text-slate-300" : "text-slate-500"}`}
                  >
                    {formatDate(request.submittedAt ?? request.createdAt)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right panel – preview */}
          {selected ? <RequestPreviewPanel request={selected} /> : null}
        </div>
      )}
    </section>
  );
}
