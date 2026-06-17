import { ClipboardList, LayoutGrid, List, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { PortalApiError } from "../lib/api/http";
import type { PortalRequest } from "../lib/api/requests";
import { usePortalRequests } from "../lib/query";
import { portalRoutes } from "../lib/routes";
import {
  countRequestsByBucket,
  filterRequestsByBucket,
  getInitialBucket,
  requestBuckets,
  type RequestBucket,
  type RequestViewMode,
} from "./my-requests/my-requests.helpers";
import { CreateRequestDialog } from "./my-requests/CreateRequestDialog";
import { RequestCardGrid } from "./my-requests/RequestCardGrid";
import { RequestTableList } from "./my-requests/RequestTableList";

const getErrorMessage = (caught: unknown) =>
  caught instanceof PortalApiError
    ? caught.message
    : "Une erreur est survenue. Veuillez réessayer.";

export function MyRequestsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [bucket, setBucket] = useState<RequestBucket>("active");
  const [viewMode, setViewMode] = useState<RequestViewMode>("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data, error, isLoading } = usePortalRequests();
  const requests = data?.items ?? [];
  const counts = useMemo(() => countRequestsByBucket(requests), [requests]);
  const visibleRequests = useMemo(
    () => filterRequestsByBucket(requests, bucket),
    [bucket, requests],
  );
  const activeBucket =
    requestBuckets.find((option) => option.value === bucket) ??
    requestBuckets[0];
  const errorMessage = error ? getErrorMessage(error) : "";

  useEffect(() => {
    if (!requests.length) {
      return;
    }

    if (counts[bucket] === 0) {
      setBucket(getInitialBucket(requests));
    }
  }, [bucket, counts, requests]);

  const openRequest = (request: PortalRequest) => {
    navigate(portalRoutes.requestDetail(request.id));
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="page-title">Mes demandes</h1>
          <p className="page-subtitle">
            Consultez vos demandes en cours, vos brouillons et l'historique de
            vos dossiers depuis le portail.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="w-fit gap-1"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus size={16} aria-hidden="true" />
          Nouvelle demande
        </Button>
      </div>

      <CreateRequestDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {requestBuckets.map((option) => {
            const isSelected = bucket === option.value;

            return (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={isSelected ? "default" : "outline"}
                onClick={() => setBucket(option.value)}
                className="gap-2"
              >
                {option.label}
                <Badge
                  variant={isSelected ? "secondary" : "outline"}
                  className="h-4 px-1.5 text-[11px]"
                >
                  {counts[option.value]}
                </Badge>
              </Button>
            );
          })}
        </div>

        <div className="flex w-fit rounded-lg border border-slate-200 bg-slate-50 p-1">
          <Button
            type="button"
            size="icon-sm"
            variant={viewMode === "grid" ? "default" : "ghost"}
            onClick={() => setViewMode("grid")}
            aria-label="Vue grille"
            title="Vue grille"
          >
            <LayoutGrid size={15} aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant={viewMode === "list" ? "default" : "ghost"}
            onClick={() => setViewMode("list")}
            aria-label="Vue liste"
            title="Vue liste"
          >
            <List size={15} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="surface rounded-lg p-5 text-sm font-semibold text-slate-600">
          Chargement des demandes...
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucune demande enregistrée."
          description="Créez une nouvelle demande pour initier le dépôt de votre courrier."
        />
      ) : visibleRequests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={activeBucket.emptyTitle}
          description={activeBucket.emptyDescription}
        />
      ) : viewMode === "grid" ? (
        <RequestCardGrid requests={visibleRequests} onOpen={openRequest} />
      ) : (
        <RequestTableList requests={visibleRequests} onOpen={openRequest} />
      )}
    </section>
  );
}
