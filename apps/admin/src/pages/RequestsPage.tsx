import {
  FileCheck2,
  FileUp,
  FolderOpen,
  Eye,
  Printer,
  Search,
  MessageSquareWarning,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';

import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../lib/auth/permissions';
import { isMockMode } from '../lib/data/data-mode';
import {
  getRequest,
  listRequests,
  markPrintedForDg,
  openDossierDn,
  recordDgReturn,
  registerPhysicalCourrier,
  requestCorrection,
  type AdminDgReview,
  type AdminDocument,
  type AdminRequest,
  type AdminRequestDetail,
  type AdminRequestStatus,
  type AdminRequestType,
  type CourrierSource,
} from '../lib/api/requests.api';

const requestTypeLabels: Record<AdminRequestType, string> = {
  oma_recognition: 'Certificat de reconnaissance OMA',
  oma_approval: "Certificat d'agrément OMA",
  oma_renewal: 'Renouvellement de Certificat OMA',
  oma_modification: 'Modification de Certificat OMA',
};

const statusLabels: Record<AdminRequestStatus, string> = {
  draft: 'Brouillon',
  courrier_uploaded: 'Courrier ajoute',
  courrier_physical_declared: 'Depot physique declare',
  submitted: 'Demande soumise',
  intake_in_review: 'Verification interne',
  intake_requires_correction: 'Correction demandee',
  initial_sent_to_dg: "En attente d'orientation DG",
  initial_dg_returned: 'Retour DG recu',
  initial_dg_decision_recorded: 'Decision DG enregistree',
  oriented_to_dn: 'Orientée vers DN',
  rejected: 'Annulée par DG',
  reoriented: 'Legacy: hors MVP',
  dossier_opened: 'Dossier ouvert',
  closed: 'Cloturee',
};

const visibleStatusOptions = Object.entries(statusLabels).filter(([value]) => value !== 'reoriented');

const sourceLabels: Record<CourrierSource, string> = {
  portal_upload: 'Televerse portail',
  physical_deposit: 'Depot physique',
  internal_scan: 'Scan interne',
  generated_from_template: 'Genere',
};

function getStatusLabel(request: AdminRequest): string {
  if (
    request.courrierSource === 'physical_deposit' &&
    request.physicalDeposit?.status !== 'received' &&
    request.status === 'submitted'
  ) {
    return 'Depot physique prevu';
  }

  if (
    request.courrierSource === 'physical_deposit' &&
    request.physicalDeposit?.status === 'received' &&
    beforeDgStatuses.includes(request.status as (typeof beforeDgStatuses)[number])
  ) {
    return 'Courrier physique recu';
  }

  return statusLabels[request.status];
}

const beforeDgStatuses = ['submitted', 'intake_in_review', 'intake_requires_correction'] as const;

function formatDate(value?: string): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function optional(value: string): string | undefined {
  const next = value.trim();
  return next ? next : undefined;
}

function statusBadgeVariant(
  status: AdminRequestStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'initial_sent_to_dg' || status === 'oriented_to_dn') return 'default';
  if (status === 'intake_requires_correction' || status === 'rejected') return 'destructive';
  if (status === 'intake_in_review') return 'secondary';
  return 'outline';
}

function isDgReturnComplete(request: AdminRequest, dgReview?: AdminDgReview): boolean {
  const review = dgReview ?? request.dgReview;

  return (
    request.status === 'oriented_to_dn' &&
    review?.decision === 'oriented_to_dn' &&
    Boolean(review.returnedScannedDocumentId)
  );
}

function canOpenDossier(request: AdminRequest, dgReview?: AdminDgReview): boolean {
  return isDgReturnComplete(request, dgReview) && !request.dossierId;
}

function canRequestCorrection(request: AdminRequest): boolean {
  return request.status === 'submitted' || request.status === 'intake_in_review';
}

function canRegisterPhysical(request: AdminRequest): boolean {
  return (
    request.courrierSource === 'physical_deposit' &&
    request.physicalDeposit?.status !== 'received' &&
    beforeDgStatuses.includes(request.status as (typeof beforeDgStatuses)[number])
  );
}

function canMarkPrinted(request: AdminRequest): boolean {
  return (
    request.courrierSource !== 'physical_deposit' &&
    hasEvidence(request) &&
    !request.intake?.printedForDgAt &&
    (request.status === 'submitted' || request.status === 'intake_in_review')
  );
}

function isAwaitingDgAction(request: AdminRequest): boolean {
  return request.status === 'initial_sent_to_dg';
}

function isOrientedToDn(request: AdminRequest): boolean {
  return request.status === 'oriented_to_dn' || request.status === 'dossier_opened';
}

function isCancelledByDg(request: AdminRequest): boolean {
  return request.status === 'rejected';
}

function canRecordDgReturn(request: AdminRequest): boolean {
  return request.status === 'initial_sent_to_dg';
}

function hasEvidence(request: AdminRequest): boolean {
  if (request.courrierSource === 'physical_deposit') {
    return Boolean(request.initialDocumentId && request.physicalDeposit?.status === 'received');
  }

  return Boolean(
    request.initialDocumentId ||
      request.initialCourrierId ||
      request.physicalDeposit?.declaredAt,
  );
}

function documentSummary(document?: AdminDocument): string {
  if (!document) return '-';
  return `${document.fileName} (${Math.ceil(document.fileSize / 1024)} Ko)`;
}

function KpiCard({ title, value }: { title: string; value: number }): React.JSX.Element {
  return (
    <div className="surface rounded-lg p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

export function RequestsPage(): React.JSX.Element {
  const { user } = useAuth();
  const [items, setItems] = useState<AdminRequest[]>([]);
  const [selected, setSelected] = useState<AdminRequestDetail | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [requestType, setRequestType] = useState('');
  const [courrierSource, setCourrierSource] = useState('');
  const [dialog, setDialog] = useState<ActionDialogState | null>(null);
  const [registerTarget, setRegisterTarget] = useState<AdminRequest | null>(null);
  const [dgReturnTarget, setDgReturnTarget] = useState<AdminRequest | null>(null);
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

  const loadRequests = async () => {
    setError('');
    setIsLoading(true);
    try {
      if (isMockMode()) {
        setItems([]);
        return;
      }

      const response = await listRequests({
        search,
        status,
        requestType,
        courrierSource,
      });
      setItems(response.items);
    } catch {
      setError('Impossible de charger les demandes recues.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const stats = useMemo(
    () => ({
      submitted: items.filter((item) => item.status === 'submitted').length,
      portalUploads: items.filter((item) => item.courrierSource === 'portal_upload').length,
      physicalDepositsPlanned: items.filter(
        (item) => item.courrierSource === 'physical_deposit' && item.physicalDeposit?.status !== 'received',
      ).length,
      physicalDepositsReceived: items.filter(
        (item) => item.courrierSource === 'physical_deposit' && item.physicalDeposit?.status === 'received',
      ).length,
      awaitingDg: items.filter(isAwaitingDgAction).length,
      orientedToDn: items.filter(isOrientedToDn).length,
      cancelledByDg: items.filter(isCancelledByDg).length,
    }),
    [items],
  );

  const refreshDetail = async (id: string) => {
    if (isMockMode()) return;
    const nextDetail = await getRequest(id);
    setSelected(nextDetail);
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

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadRequests();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Demandes</h1>
          <p className="page-subtitle">
            Suivi des demandes initiales avant orientation DG.
          </p>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        <KpiCard title="Demandes soumises" value={stats.submitted} />
        <KpiCard title="Téléversées portail" value={stats.portalUploads} />
        <KpiCard title="Depots physiques prevus" value={stats.physicalDepositsPlanned} />
        <KpiCard title="Courriers physiques recus" value={stats.physicalDepositsReceived} />
        <KpiCard title="En attente DG" value={stats.awaitingDg} />
        <KpiCard title="Orientées DN" value={stats.orientedToDn} />
        <KpiCard title="Annulées DG" value={stats.cancelledByDg} />
      </section>

      <form
        className="surface grid gap-3 rounded-lg p-4 md:grid-cols-[1fr_190px_190px_190px_auto]"
        onSubmit={handleFilter}
      >
        <input
          className="control"
          placeholder="Rechercher par objet, organisation ou postulant..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="control"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Tous les statuts</option>
          {visibleStatusOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="control"
          value={requestType}
          onChange={(event) => setRequestType(event.target.value)}
        >
          <option value="">Tous les types</option>
          {Object.entries(requestTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="control"
          value={courrierSource}
          onChange={(event) => setCourrierSource(event.target.value)}
        >
          <option value="">Toutes les sources</option>
          <option value="portal_upload">Televerse portail</option>
          <option value="physical_deposit">Depot physique</option>
        </select>
        <button className="btn btn-primary" type="submit" disabled={isLoading}>
          <Search className="h-4 w-4" aria-hidden="true" />
          Filtrer
        </button>
      </form>

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

      <section className="surface overflow-hidden rounded-lg">
        <Table className="min-w-[1120px]">
          <TableHeader className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Postulant</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Objet</TableHead>
              <TableHead>Source courrier</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                  {formatDate(item.submittedAt ?? item.createdAt)}
                </TableCell>
                <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                  {item.organization?.canonicalName ?? item.organizationId}
                </TableCell>
                <TableCell>{item.submittedBy?.fullName ?? item.submittedBy?.email ?? item.submittedById}</TableCell>
                <TableCell>{requestTypeLabels[item.requestType]}</TableCell>
                <TableCell className="max-w-[220px] truncate">{item.subject}</TableCell>
                <TableCell>{item.courrierSource ? sourceLabels[item.courrierSource] : '-'}</TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(item.status)}>
                    {getStatusLabel(item)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button className="btn btn-secondary" type="button" onClick={() => void openDetails(item)}>
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Voir
                    </button>
                    {permissions.canReview && canOpenDossier(item) ? (
                      <button className="btn btn-secondary" type="button" onClick={() => setDialog({ kind: 'open_dossier', request: item })}>
                        <FolderOpen className="h-4 w-4" aria-hidden="true" />
                        Ouvrir dossier
                      </button>
                    ) : null}
                    {permissions.canHandleDg && canMarkPrinted(item) ? (
                      <button className="btn btn-secondary" type="button" onClick={() => setDialog({ kind: 'print', request: item })}>
                        <Printer className="h-4 w-4" aria-hidden="true" />
                        Imprimer
                      </button>
                    ) : null}
                    {permissions.canHandleDg && canRecordDgReturn(item) ? (
                      <button className="btn btn-primary" type="button" onClick={() => setDgReturnTarget(item)}>
                        <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                        Retour DG
                      </button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!items.length ? (
              <TableRow>
                <TableCell colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  {isLoading ? 'Chargement...' : 'Aucune demande recue trouvee.'}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </section>

      {selected ? (
        <DetailDrawer
          detail={selected}
          permissions={permissions}
          onClose={() => setSelected(null)}
          onStart={(request) => setDialog({ kind: 'open_dossier', request })}
          onCorrection={(request) => setDialog({ kind: 'correction', request })}
          onRegister={(request) => setRegisterTarget(request)}
          onPrint={(request) => setDialog({ kind: 'print', request })}
          onDgReturn={(request) => setDgReturnTarget(request)}
        />
      ) : null}

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

      {registerTarget ? (
        <RegisterPhysicalDialog
          request={registerTarget}
          onClose={() => setRegisterTarget(null)}
          onError={setError}
          onDone={async (id) => {
            setRegisterTarget(null);
            await refreshAfterMutation(id, 'Courrier physique enregistre.');
          }}
        />
      ) : null}

      {dgReturnTarget ? (
        <DgReturnDialog
          request={dgReturnTarget}
          onClose={() => setDgReturnTarget(null)}
          onError={setError}
          onDone={async (id) => {
            setDgReturnTarget(null);
            await refreshAfterMutation(id, 'Retour DG enregistre.');
          }}
        />
      ) : null}
    </div>
  );
}

function DetailDrawer({
  detail,
  permissions,
  onClose,
  onStart,
  onCorrection,
  onRegister,
  onPrint,
  onDgReturn,
}: {
  detail: AdminRequestDetail;
  permissions: { canReview: boolean; canRegister: boolean; canHandleDg: boolean };
  onClose: () => void;
  onStart: (request: AdminRequest) => void;
  onCorrection: (request: AdminRequest) => void;
  onRegister: (request: AdminRequest) => void;
  onPrint: (request: AdminRequest) => void;
  onDgReturn: (request: AdminRequest) => void;
}): React.JSX.Element {
  const { request, courrier, document, dgReview } = detail;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
      <section className="surface h-full w-full max-w-3xl overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">
              Detail de la demande
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {request.organization?.canonicalName ?? request.organizationId}
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Fermer
          </button>
        </div>

        <div className="mt-6 grid gap-5">
          <DetailSection title="Demande">
            <DetailField label="Type" value={requestTypeLabels[request.requestType]} />
            <DetailField label="Objet" value={request.subject} />
            <DetailField label="Message" value={request.message} />
            <DetailField label="Statut" value={getStatusLabel(request)} />
            <DetailField label="Creation" value={formatDate(request.createdAt)} />
            <DetailField label="Soumission" value={formatDate(request.submittedAt)} />
          </DetailSection>

          <DetailSection title="Postulant">
            <DetailField label="Nom" value={request.submittedBy?.fullName} />
            <DetailField label="Email" value={request.submittedBy?.email} />
            <DetailField label="Telephone" value={request.submittedBy?.phone} />
          </DetailSection>

          <DetailSection title="Organisation">
            <DetailField label="Nom canonique" value={request.organization?.canonicalName} />
            <DetailField label="Email" value={request.organization?.email} />
            <DetailField label="Telephone" value={request.organization?.phone} />
            <DetailField label="Adresse legale" value={request.organization?.legalAddress} />
          </DetailSection>

          <DetailSection title="Courrier">
            <DetailField label="Source" value={courrier?.source ? sourceLabels[courrier.source] : request.courrierSource ? sourceLabels[request.courrierSource] : undefined} />
            <DetailField label="Document" value={documentSummary(document)} />
            <DetailField label="Reference officielle" value={courrier?.officialReference} />
            <DetailField label="Date depot physique reel" value={formatDate(courrier?.physicalDepositDate ?? request.physicalDeposit?.physicalDepositDate)} />
            <DetailField label="Date prevue depot" value={formatDate(request.physicalDeposit?.expectedDepositDate)} />
            <DetailField label="Notes" value={courrier?.notes ?? request.physicalDeposit?.notes} />
          </DetailSection>

          <DetailSection title="Verification interne">
            <DetailField label="Demarree le" value={formatDate(request.intake?.startedAt)} />
            <DetailField label="Demarree par" value={request.intake?.startedBy?.fullName ?? request.intake?.startedById} />
            <DetailField label="Correction demandee le" value={formatDate(request.intake?.correctionRequestedAt)} />
            <DetailField label="Motif correction" value={request.intake?.correctionReason} />
            <DetailField label="Imprime le" value={formatDate(request.intake?.printedForDgAt)} />
            <DetailField label="Imprime par" value={request.intake?.printedForDgBy?.fullName ?? request.intake?.printedForDgById} />
            <DetailField label="Circuit DG depuis" value={formatDate(request.intake?.sentToDgAt ?? request.intake?.printedForDgAt)} />
            <DetailField label="Notes" value={request.intake?.notes} />
          </DetailSection>

          <DetailSection title="Retour DG">
            <DetailField label="Date retour" value={formatDate(dgReview?.returnedFromDgAt)} />
            <DetailField label="Decision" value={dgReview?.decision === 'oriented_to_dn' ? 'Orientée vers DN' : dgReview?.decision === 'rejected' ? 'Annulée par DG' : undefined} />
            <DetailField label="Observations" value={dgReview?.observations} />
            <DetailField label="Scan retour" value={dgReview?.returnedScannedDocumentId ? 'Document enregistre' : undefined} />
          </DetailSection>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {permissions.canReview && canOpenDossier(request, dgReview) ? (
            <button className="btn btn-secondary" type="button" onClick={() => onStart(request)}>
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
              Ouvrir le dossier DN
            </button>
          ) : null}
          {permissions.canReview && canRequestCorrection(request) ? (
            <button className="btn btn-danger" type="button" onClick={() => onCorrection(request)}>
              <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
              Demander correction
            </button>
          ) : null}
          {permissions.canRegister && canRegisterPhysical(request) ? (
            <button className="btn btn-secondary" type="button" onClick={() => onRegister(request)}>
              <FileUp className="h-4 w-4" aria-hidden="true" />
              Enregistrer reception courrier
            </button>
          ) : null}
          {permissions.canHandleDg && canMarkPrinted(request) ? (
            <button className="btn btn-secondary" type="button" onClick={() => onPrint(request)}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              Imprimer
            </button>
          ) : null}
          {permissions.canHandleDg && canRecordDgReturn(request) ? (
            <button className="btn btn-primary" type="button" onClick={() => onDgReturn(request)}>
              <FileCheck2 className="h-4 w-4" aria-hidden="true" />
              Enregistrer le retour DG
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

type ActionDialogState = {
  kind: 'open_dossier' | 'correction' | 'print';
  request: AdminRequest;
};

function ActionDialog({
  state,
  onClose,
  onDone,
  onError,
}: {
  state: ActionDialogState;
  onClose: () => void;
  onDone: (id: string, message: string) => Promise<void>;
  onError: (message: string) => void;
}): React.JSX.Element {
  const [text, setText] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = {
    open_dossier: {
      title: 'Ouvrir le dossier DN',
      label: 'Notes',
      button: 'Ouvrir le dossier',
      success: 'Dossier DN ouvert.',
      icon: FolderOpen,
    },
    correction: {
      title: 'Demander correction',
      label: 'Motif',
      button: 'Demander correction',
      success: 'Correction demandee au postulant.',
      icon: MessageSquareWarning,
    },
    print: {
      title: 'Imprimer',
      label: 'Notes',
      button: 'Imprimer',
      success: "Demande en attente d'orientation DG.",
      icon: Printer,
    },
  }[state.kind];
  const Icon = copy.icon;

  const handleSubmit = async () => {
    setLocalError('');

    if (state.kind === 'correction' && !text.trim()) {
      setLocalError('Le motif est requis.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isMockMode()) {
        if (state.kind === 'open_dossier') {
          await openDossierDn(state.request.id, { notes: optional(text) });
        } else if (state.kind === 'correction') {
          await requestCorrection(state.request.id, { reason: text.trim() });
        } else if (state.kind === 'print') {
          await markPrintedForDg(state.request.id, { notes: optional(text) });
        }
      }
      await onDone(state.request.id, copy.success);
    } catch {
      onError('Action impossible sur cette demande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4">
      <section className="surface w-full max-w-lg rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
              {copy.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{state.request.subject}</p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Annuler
          </button>
        </div>

        <label className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-200">
          {copy.label}
          <textarea
            className="control mt-1 min-h-28"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>

        {localError ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {localError}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" type="button" onClick={handleSubmit} disabled={isSubmitting}>
            <Icon className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Traitement...' : copy.button}
          </button>
        </div>
      </section>
    </div>
  );
}

function DgReturnDialog({
  request,
  onClose,
  onDone,
  onError,
}: {
  request: AdminRequest;
  onClose: () => void;
  onDone: (id: string) => Promise<void>;
  onError: (message: string) => void;
}): React.JSX.Element {
  const [decision, setDecision] = useState<'oriented_to_dn' | 'cancelled_by_dg'>('oriented_to_dn');
  const [returnedAt, setReturnedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [observations, setObservations] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setLocalError('');

    if (!file) {
      setLocalError('Le scan du retour DG est obligatoire.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isMockMode()) {
        const form = new FormData();
        form.set('decision', decision);
        if (returnedAt) form.set('returnedAt', returnedAt);
        if (observations.trim()) form.set('observations', observations.trim());
        form.set('returnedScannedDocument', file);
        await recordDgReturn(request.id, form);
      }
      await onDone(request.id);
    } catch {
      onError('Impossible d enregistrer le retour DG.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4">
      <section className="surface w-full max-w-xl rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
              <FileCheck2 className="h-5 w-5" aria-hidden="true" />
              Enregistrer le retour DG
            </h2>
            <p className="mt-1 text-sm text-slate-500">{request.subject}</p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Annuler
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Decision DG
            <select
              className="control mt-1"
              value={decision}
              onChange={(event) => setDecision(event.target.value as 'oriented_to_dn' | 'cancelled_by_dg')}
            >
              <option value="oriented_to_dn">Orientée vers DN</option>
              <option value="cancelled_by_dg">Annulée par DG</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Date retour
            <input
              className="control mt-1"
              type="date"
              value={returnedAt}
              onChange={(event) => setReturnedAt(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
            Scan du retour DG annoté *
            <input
              className="control mt-1"
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
            Observations
            <textarea
              className="control mt-1 min-h-24"
              value={observations}
              onChange={(event) => setObservations(event.target.value)}
            />
          </label>
        </div>

        {localError ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {localError}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" type="button" onClick={handleSubmit} disabled={isSubmitting}>
            <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </section>
    </div>
  );
}

function RegisterPhysicalDialog({
  request,
  onClose,
  onDone,
  onError,
}: {
  request: AdminRequest;
  onClose: () => void;
  onDone: (id: string) => Promise<void>;
  onError: (message: string) => void;
}): React.JSX.Element {
  const [physicalDepositDate, setPhysicalDepositDate] = useState('');
  const [officialReference, setOfficialReference] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setLocalError('');

    if (!physicalDepositDate) {
      setLocalError('La date de depot physique reel est requise.');
      return;
    }

    if (!file) {
      setLocalError('Le scan du courrier recu est obligatoire.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isMockMode()) {
        const form = new FormData();
        form.set('physicalDepositDate', physicalDepositDate);
        if (officialReference.trim()) form.set('officialReference', officialReference.trim());
        if (notes.trim()) form.set('notes', notes.trim());
        form.set('file', file);
        await registerPhysicalCourrier(request.id, form);
      }
      await onDone(request.id);
    } catch {
      onError('Impossible d enregistrer le courrier physique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4">
      <section className="surface w-full max-w-xl rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
              <FileCheck2 className="h-5 w-5" aria-hidden="true" />
              Enregistrer reception courrier
            </h2>
            <p className="mt-1 text-sm text-slate-500">{request.subject}</p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Annuler
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Date depot physique reel *
            <input
              className="control mt-1"
              type="date"
              required
              value={physicalDepositDate}
              onChange={(event) => setPhysicalDepositDate(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Reference officielle
            <input
              className="control mt-1"
              value={officialReference}
              onChange={(event) => setOfficialReference(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
            Scan du courrier recu *
            <input
              className="control mt-1"
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
            Notes
            <textarea
              className="control mt-1 min-h-24"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>

        {localError ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {localError}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" type="button" onClick={handleSubmit} disabled={isSubmitting}>
            <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </section>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h3 className="font-bold text-slate-950 dark:text-white">{title}</h3>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string;
}): React.JSX.Element {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-900 dark:text-slate-100">
        {value || '-'}
      </dd>
    </div>
  );
}
