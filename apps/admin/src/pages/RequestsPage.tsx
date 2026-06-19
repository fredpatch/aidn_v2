import { RefreshCcw } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { SplitView } from '../components/ui/split-view';
import { useAuth } from '../hooks/useAuth';
import {
  downloadRequestOrientationDocument,
  getRequest,
  listRequests,
  type AdminRequest,
  type AdminRequestDetail,
} from '../lib/api/requests';
import { hasPermission } from '../lib/auth/permissions';
import { isMockMode } from '../lib/data/data-mode';
import { ActionDialog, type ActionDialogState } from './requests/ActionDialog';
import { RequestDetailPanel } from './requests/RequestDetailPanel';
import { RequestsKpis, type RequestStats } from './requests/RequestsKpis';
import { RequestsListPanel } from './requests/RequestsListPanel';
import {
  isAwaitingDgAction,
  isCancelledByDg,
  isDgSignedAvailable,
} from './requests/requests.helpers';

export function RequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminRequest[]>([]);
  const [selected, setSelected] = useState<AdminRequestDetail | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [requestType, setRequestType] = useState('');
  const [courrierSource, setCourrierSource] = useState('');
  const [dialog, setDialog] = useState<ActionDialogState | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const permissions = useMemo(
    () => ({
      canReview: hasPermission(user, 'REQUEST_INTAKE_REVIEW'),
      canRegister: hasPermission(user, 'COURRIER_REGISTER_PHYSICAL'),
      canHandleDg: hasPermission(user, 'DG_CIRCUIT_HANDLE'),
    }),
    [user],
  );

  const stats: RequestStats = useMemo(
    () => ({
      submitted: items.filter((item) => item.status === 'submitted').length,
      portalUploads: items.filter((item) => item.courrierSource === 'portal_upload').length,
      physicalDepositsPlanned: items.filter(
        (item) =>
          item.courrierSource === 'physical_deposit' &&
          item.physicalDeposit?.status !== 'received',
      ).length,
      physicalDepositsReceived: items.filter(
        (item) =>
          item.courrierSource === 'physical_deposit' &&
          item.physicalDeposit?.status === 'received',
      ).length,
      awaitingDg: items.filter(isAwaitingDgAction).length,
      dgSignedAvailable: items.filter(isDgSignedAvailable).length,
      cancelledByDg: items.filter(isCancelledByDg).length,
    }),
    [items],
  );

  const loadRequests = async (autoSelectFirst = false) => {
    setError('');
    setIsLoading(true);
    try {
      if (isMockMode()) {
        setItems([]);
        return;
      }
      const response = await listRequests({ search, status, requestType, courrierSource });
      setItems(response.items);
      if (autoSelectFirst && response.items.length > 0) {
        try {
          setSelected(await getRequest(response.items[0].id));
        } catch {
          // auto-select failure is non-fatal
        }
      }
    } catch {
      setError('Impossible de charger les demandes recues.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests(true);
  }, []);

  const refreshDetail = async (id: string) => {
    if (isMockMode()) return;
    setSelected(await getRequest(id));
  };

  const refreshAfterMutation = async (id: string, message: string) => {
    await loadRequests();
    await refreshDetail(id).catch(() => setSelected(null));
    setSuccess(message);
  };

  const openDetails = async (request: AdminRequest) => {
    setError('');
    try {
      if (isMockMode()) {
        setSelected({ request });
        return;
      }
      setSelected(await getRequest(request.id));
    } catch {
      setError('Impossible de charger le detail de la demande.');
    }
  };

  const consultOrientationCourrier = (requestId: string, documentId: string) => {
    const previewWindow = window.open('about:blank', '_blank');
    setError('');
    void (async () => {
      try {
        const { blob, fileName } = await downloadRequestOrientationDocument(requestId, documentId);
        const url = URL.createObjectURL(blob);
        const targetWindow =
          previewWindow && !previewWindow.closed
            ? previewWindow
            : window.open('about:blank', '_blank');
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
        setError("Impossible d'ouvrir le courrier DG signe.");
      }
    })();
  };

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadRequests();
  };

  const openDgCircuit = (
    target: AdminRequest,
    bucket: 'to_transmit' | 'awaiting_return',
  ) => {
    const params = new URLSearchParams({
      bucket,
      source: 'initial_request',
      search: target.subject,
    });
    navigate(`/circuit-dg?${params.toString()}`);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Demandes</h1>
          <p className="page-subtitle">Suivi des demandes initiales avant signature DG.</p>
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => void loadRequests()}
          disabled={isLoading}
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Actualiser
        </button>
      </div>

      <RequestsKpis stats={stats} />

      {success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
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
            onSelectRequest={(request) => void openDetails(request)}
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
          onError={setError}
          onDone={async (id, message) => {
            setDialog(null);
            await refreshAfterMutation(id, message);
          }}
        />
      ) : null}
    </div>
  );
}
