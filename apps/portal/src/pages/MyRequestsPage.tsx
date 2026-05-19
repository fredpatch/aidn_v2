import { ClipboardList, Eye, Plus } from "lucide-react";
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
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
      }).format(new Date(value))
    : "-";

export function MyRequestsPage(): React.JSX.Element {
  const [requests, setRequests] = useState<PortalRequest[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    listRequests()
      .then(({ items }) => {
        if (isMounted) {
          setRequests(items);
        }
      })
      .catch((caught) => {
        if (isMounted) {
          setError(
            caught instanceof PortalApiError
              ? caught.message
              : "Une erreur est survenue. Veuillez reessayer.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
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
          Chargement des demandes...
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucune demande enregistree."
          description="Creez une nouvelle demande pour initier le depot de votre courrier."
        />
      ) : (
        <div className="surface overflow-hidden rounded-lg">
          <div className="hidden grid-cols-[1.2fr_2fr_1fr_1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500 md:grid">
            <span>Type</span>
            <span>Objet</span>
            <span>Statut</span>
            <span>Date</span>
            <span>Action</span>
          </div>
          <div className="divide-y divide-slate-200">
            {requests.map((request) => (
              <article
                key={request.id}
                className="grid gap-3 px-4 py-4 md:grid-cols-[1.2fr_2fr_1fr_1fr_auto] md:items-center"
              >
                <div className="text-sm font-semibold text-slate-950">
                  <RequestTypeLabel type={request.requestType} />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{request.subject}</p>
                  {request.message ? (
                    <p className="line-clamp-1 text-sm text-slate-500">
                      {request.message}
                    </p>
                  ) : null}
                </div>
                <RequestStatusBadge status={request.status} />
                <p className="text-sm text-slate-600">
                  {formatDate(request.submittedAt ?? request.createdAt)}
                </p>
                <Link
                  className="btn btn-secondary w-fit"
                  to={portalRoutes.requestDetail(request.id)}
                >
                  <Eye size={16} aria-hidden="true" />
                  Voir
                </Link>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
