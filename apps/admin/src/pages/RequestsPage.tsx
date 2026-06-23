import { AlertCircle, RefreshCcw } from "lucide-react";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, AlertDescription } from "../components/ui/alert";
import { SplitView } from "../components/ui/split-view";
import { useAppToast } from "../hooks/useAppToast";
import { useAuth } from "../hooks/useAuth";
import {
  downloadRequestOrientationDocument,
  type AdminRequest,
  type AdminRequestDetail,
  type ListRequestsParams,
} from "../lib/api/requests";
import { useRequestDetail, useRequests } from "../lib/query";
import { hasPermission } from "../lib/auth/permissions";
import { isMockMode } from "../lib/data/data-mode";
import { ActionDialog, type ActionDialogState } from "./requests/ActionDialog";
import { RequestDetailPanel } from "./requests/RequestDetailPanel";
import { RequestsKpis, type RequestStats } from "./requests/RequestsKpis";
import { RequestsListPanel } from "./requests/RequestsListPanel";
import {
  isAwaitingDgAction,
  isCancelledByDg,
  isDgSignedAvailable,
} from "./requests/requests.helpers";

export function RequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useAppToast();

  // Filter state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [requestType, setRequestType] = useState("");
  const [courrierSource, setCourrierSource] = useState("");
  const [dialog, setDialog] = useState<ActionDialogState | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );

  // Build filter object for queries
  const filters = useMemo<ListRequestsParams>(
    () => ({
      search: search || undefined,
      status: status || undefined,
      requestType: requestType || undefined,
      courrierSource: courrierSource || undefined,
    }),
    [search, status, requestType, courrierSource],
  );

  // Query hooks
  const requestsQuery = useRequests(filters);
  const detailQuery = useRequestDetail(selectedRequestId);

  const permissions = useMemo(
    () => ({
      canReview: hasPermission(user, "REQUEST_INTAKE_REVIEW"),
      canRegister: hasPermission(user, "COURRIER_REGISTER_PHYSICAL"),
      canHandleDg: hasPermission(user, "DG_CIRCUIT_HANDLE"),
    }),
    [user],
  );

  const items = isMockMode() ? [] : (requestsQuery.data?.items ?? []);

  const stats: RequestStats = useMemo(
    () => ({
      submitted: items.filter((item) => item.status === "submitted").length,
      portalUploads: items.filter(
        (item) => item.courrierSource === "portal_upload",
      ).length,
      physicalDepositsPlanned: items.filter(
        (item) =>
          item.courrierSource === "physical_deposit" &&
          item.physicalDeposit?.status !== "received",
      ).length,
      physicalDepositsReceived: items.filter(
        (item) =>
          item.courrierSource === "physical_deposit" &&
          item.physicalDeposit?.status === "received",
      ).length,
      awaitingDg: items.filter(isAwaitingDgAction).length,
      dgSignedAvailable: items.filter(isDgSignedAvailable).length,
      cancelledByDg: items.filter(isCancelledByDg).length,
    }),
    [items],
  );

  const selected = isMockMode()
    ? selectedRequestId
      ? {
          request: items.find(
            (item) => item.id === selectedRequestId,
          ) as AdminRequest,
        }
      : null
    : (detailQuery.data ?? null);

  const isLoading = requestsQuery.isLoading || detailQuery.isLoading;
  const error =
    requestsQuery.error?.message || detailQuery.error?.message || "";

  const openDetails = useCallback((request: AdminRequest) => {
    setSelectedRequestId(request.id);
  }, []);

  const consultOrientationCourrier = useCallback(
    (requestId: string, documentId: string) => {
      const previewWindow = window.open("about:blank", "_blank");
      void (async () => {
        try {
          const { blob, fileName } = await downloadRequestOrientationDocument(
            requestId,
            documentId,
          );
          const url = URL.createObjectURL(blob);
          const targetWindow =
            previewWindow && !previewWindow.closed
              ? previewWindow
              : window.open("about:blank", "_blank");
          if (!targetWindow) {
            window.alert(
              "Impossible d'ouvrir l'apercu. Autorisez les fenetres contextuelles pour consulter le document.",
            );
            return;
          }
          targetWindow.location.href = url;
          targetWindow.document.title = fileName;
        } catch {
          previewWindow?.close();
          // Error handled silently; user sees dialog
        }
      })();
    },
    [],
  );

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    requestsQuery.refetch();
  };

  const openDgCircuit = useCallback(
    (target: AdminRequest, bucket: "to_transmit" | "awaiting_return") => {
      const params = new URLSearchParams({
        bucket,
        source: "initial_request",
        search: target.subject,
      });
      navigate(`/circuit-dg?${params.toString()}`);
    },
    [navigate],
  );

  const handleMutationSuccess = useCallback(
    (message: string) => {
      requestsQuery.refetch();
      if (selectedRequestId) {
        detailQuery.refetch();
      }
    },
    [selectedRequestId, requestsQuery, detailQuery],
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Demandes</h1>
          <p className="page-subtitle">
            Suivi des demandes initiales avant signature DG.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => requestsQuery.refetch()}
          disabled={isLoading}
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Actualiser
        </button>
      </div>

      <RequestsKpis stats={stats} />

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <SplitView
        left={
          <RequestsListPanel
            courrierSource={courrierSource}
            isLoading={isLoading}
            items={items}
            requestType={requestType}
            search={search}
            selectedRequestId={selected?.request.id}
            status={status}
            onCourrierSourceChange={setCourrierSource}
            onFilter={handleFilter}
            onRequestTypeChange={setRequestType}
            onSearchChange={setSearch}
            onSelectRequest={openDetails}
            onStatusChange={setStatus}
          />
        }
        right={
          <RequestDetailPanel
            detail={selected}
            permissions={permissions}
            onConsultOrientationCourrier={consultOrientationCourrier}
            onOpenDgCircuit={openDgCircuit}
            onSetDialog={setDialog}
          />
        }
      />

      {dialog ? (
        <ActionDialog
          state={dialog}
          onClose={() => setDialog(null)}
          onDone={(id, message) => {
            setDialog(null);
            setSelectedRequestId(id);
            handleMutationSuccess(message);
          }}
        />
      ) : null}
    </div>
  );
}
