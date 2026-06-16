import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Eye,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';

import {
  approveAccountRequest,
  getAccountRequest,
  listAccountRequests,
  listPostulantOrganizations,
  rejectAccountRequest,
  type AccountRequestListItem,
  type AccountRequestStatus,
  type MemberRole,
  type PostulantOrganization,
} from '../lib/api/account-requests.api';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { isMockMode } from '../lib/data/data-mode';

const statusLabels: Record<AccountRequestStatus, string> = {
  submitted: 'Soumise',
  under_review: 'En revue',
  approved: 'Approuvee',
  rejected: 'Rejetee',
};

const memberRoleOptions: { value: MemberRole; label: string }[] = [
  { value: 'primary_contact', label: 'Contact principal' },
  { value: 'representative', label: 'Representant' },
  { value: 'viewer', label: 'Lecteur' },
];

const mockRequests: AccountRequestListItem[] = [
  {
    id: 'demo-request',
    requestedOrganizationName: 'Afrijet Demo',
    requestedLegalAddress: 'Libreville',
    requestedEmail: 'contact@afrijet.example',
    requestedPhone: '+24100000000',
    approvalNumberOrigin: 'AG-001',
    contactFullName: 'Boris Klinton',
    contactEmail: 'boris@gmail.com',
    contactPhone: '+24101010101',
    status: 'submitted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function HeaderLabel({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4" aria-hidden={true} />
      {children}
    </span>
  );
}

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
  status: AccountRequestStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'approved') return 'default';
  if (status === 'rejected') return 'destructive';
  if (status === 'under_review') return 'secondary';
  return 'outline';
}

function isFinalized(request: AccountRequestListItem): boolean {
  return request.status === 'approved' || request.status === 'rejected';
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
      <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
        {value || '-'}
      </dd>
    </div>
  );
}

export function AccountRequestsPage(): React.JSX.Element {
  const [items, setItems] = useState<AccountRequestListItem[]>([]);
  const [selected, setSelected] = useState<AccountRequestListItem | null>(null);
  const [approveTarget, setApproveTarget] = useState<AccountRequestListItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AccountRequestListItem | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadRequests = async () => {
    setError('');
    setIsLoading(true);
    try {
      if (isMockMode()) {
        setItems(mockRequests);
        return;
      }

      const response = await listAccountRequests({ search, status, from, to });
      setItems(response.items);
    } catch {
      setError('Impossible de charger les demandes de compte.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadRequests();
  };

  const openDetails = async (request: AccountRequestListItem) => {
    setError('');
    try {
      if (isMockMode()) {
        setSelected(request);
        return;
      }

      const response = await getAccountRequest(request.id);
      setSelected(response.request);
    } catch {
      setError('Impossible de charger le detail de la demande.');
    }
  };

  const refreshAfterMutation = async (request?: AccountRequestListItem) => {
    await loadRequests();
    if (request) {
      try {
        const response = isMockMode()
          ? { request }
          : await getAccountRequest(request.id);
        setSelected(response.request);
      } catch {
        setSelected(null);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Demandes de compte postulant</h1>
          <p className="page-subtitle">
            Validation des demandes d'acces externes et rattachement aux
            organisations canoniques.
          </p>
        </div>
      </div>

      <form
        className="surface grid gap-3 rounded-lg p-4 md:grid-cols-[1fr_180px_150px_150px_auto]"
        onSubmit={handleFilter}
      >
        <input
          className="control"
          placeholder="Rechercher par organisme, contact ou email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="control"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          className="control"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          aria-label="Date debut"
        />
        <input
          className="control"
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          aria-label="Date fin"
        />
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
        <Table className="min-w-[980px]">
          <TableHeader className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <TableRow>
              <TableHead>
                <HeaderLabel icon={Building2}>Nom organisme</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={UserRound}>Contact</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={Mail}>Email contact</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={Phone}>Telephone</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={ShieldCheck}>Statut</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={CalendarClock}>Date de demande</HeaderLabel>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                  {item.requestedOrganizationName}
                </TableCell>
                <TableCell>{item.contactFullName}</TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">
                  {item.contactEmail}
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">
                  {item.contactPhone ?? '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(item.status)}>
                    {statusLabels[item.status]}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                  {formatDate(item.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => void openDetails(item)}
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Voir
                    </button>
                    <button
                      className="btn btn-primary"
                      type="button"
                      disabled={isFinalized(item)}
                      onClick={() => setApproveTarget(item)}
                    >
                      Approuver
                    </button>
                    <button
                      className="btn btn-danger"
                      type="button"
                      disabled={isFinalized(item)}
                      onClick={() => setRejectTarget(item)}
                    >
                      Rejeter
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!items.length ? (
              <TableRow>
                <TableCell
                  className="px-4 py-8 text-center text-slate-500"
                  colSpan={7}
                >
                  {isLoading
                    ? 'Chargement...'
                    : 'Aucune demande de compte postulant trouvee.'}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </section>

      {selected ? (
        <DetailModal
          request={selected}
          onClose={() => setSelected(null)}
          onApprove={() => setApproveTarget(selected)}
          onReject={() => setRejectTarget(selected)}
        />
      ) : null}

      {approveTarget ? (
        <ApproveDialog
          request={approveTarget}
          onClose={() => setApproveTarget(null)}
          onApproved={async (request) => {
            setApproveTarget(null);
            setSuccess('Demande approuvee. Le compte postulant a ete cree.');
            await refreshAfterMutation(request);
          }}
          onError={setError}
        />
      ) : null}

      {rejectTarget ? (
        <RejectDialog
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={async (request) => {
            setRejectTarget(null);
            setSuccess('Demande rejetee.');
            await refreshAfterMutation(request);
          }}
          onError={setError}
        />
      ) : null}
    </div>
  );
}

function DetailModal({
  request,
  onClose,
  onApprove,
  onReject,
}: {
  request: AccountRequestListItem;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
      <section className="surface h-full w-full max-w-2xl overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">
              Detail de la demande
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Donnees sanitisees de la demande postulant.
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Fermer
          </button>
        </div>

        <div className="mt-6 grid gap-6">
          <DetailSection title="Informations organisme">
            <DetailField
              label="Organisme demande"
              value={request.requestedOrganizationName}
            />
            <DetailField label="Adresse legale" value={request.requestedLegalAddress} />
            <DetailField label="Email organisme" value={request.requestedEmail} />
            <DetailField label="Telephone organisme" value={request.requestedPhone} />
            <DetailField
              label="N d'agrement d'origine"
              value={request.approvalNumberOrigin}
            />
          </DetailSection>

          <DetailSection title="Contact postulant">
            <DetailField label="Nom du contact" value={request.contactFullName} />
            <DetailField label="Email du contact" value={request.contactEmail} />
            <DetailField label="Telephone du contact" value={request.contactPhone} />
          </DetailSection>

          <DetailSection title="Statut de la demande">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Statut</dt>
              <dd className="mt-1">
                <Badge variant={statusBadgeVariant(request.status)}>
                  {statusLabels[request.status]}
                </Badge>
              </dd>
            </div>
            <DetailField
              label="Date de soumission"
              value={formatDate(request.createdAt)}
            />
            <DetailField label="Date de revue" value={formatDate(request.reviewedAt)} />
          </DetailSection>

          <DetailSection title="Decision">
            <DetailField label="Motif de rejet" value={request.rejectionReason} />
            <DetailField label="Organisation liee" value={request.matchedOrganizationId} />
            <DetailField label="Organisation creee" value={request.createdOrganizationId} />
            <DetailField label="Utilisateur cree" value={request.resultingUserId} />
          </DetailSection>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            className="btn btn-primary"
            type="button"
            disabled={isFinalized(request)}
            onClick={onApprove}
          >
            Approuver
          </button>
          <button
            className="btn btn-danger"
            type="button"
            disabled={isFinalized(request)}
            onClick={onReject}
          >
            Rejeter
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

function ApproveDialog({
  request,
  onClose,
  onApproved,
  onError,
}: {
  request: AccountRequestListItem;
  onClose: () => void;
  onApproved: (request: AccountRequestListItem) => Promise<void>;
  onError: (message: string) => void;
}): React.JSX.Element {
  const [mode, setMode] = useState<'existing' | 'create'>('create');
  const [memberRole, setMemberRole] = useState<MemberRole>('primary_contact');
  const [organizationSearch, setOrganizationSearch] = useState('');
  const [organizations, setOrganizations] = useState<PostulantOrganization[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [createForm, setCreateForm] = useState(() => ({
    canonicalName: request.requestedOrganizationName,
    legalAddress: request.requestedLegalAddress ?? '',
    email: request.requestedEmail ?? '',
    phone: request.requestedPhone ?? '',
    approvalNumberOrigin: request.approvalNumberOrigin ?? '',
  }));
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === organizationId),
    [organizationId, organizations],
  );

  const searchOrganizations = async () => {
    setLocalError('');
    setIsSearching(true);
    try {
      if (isMockMode()) {
        setOrganizations([]);
        return;
      }

      const response = await listPostulantOrganizations({
        search: organizationSearch,
        status: 'active',
      });
      setOrganizations(response.items);
      if (response.items.length && !organizationId) {
        setOrganizationId(response.items[0].id);
      }
    } catch {
      setLocalError('Impossible de charger les organisations.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (mode === 'existing') {
      void searchOrganizations();
    }
  }, [mode]);

  const handleSubmit = async () => {
    setLocalError('');

    if (mode === 'existing' && !organizationId) {
      setLocalError('Selectionnez une organisation existante.');
      return;
    }

    if (mode === 'create' && !createForm.canonicalName.trim()) {
      setLocalError('Le nom canonique est requis.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = isMockMode()
        ? {
            request: {
              ...request,
              status: 'approved' as const,
              reviewedAt: new Date().toISOString(),
            },
          }
        : await approveAccountRequest(
            request.id,
            mode === 'existing'
              ? {
                  organizationMode: 'existing',
                  organizationId,
                  memberRole,
                }
              : {
                  organizationMode: 'create',
                  organization: {
                    canonicalName: createForm.canonicalName.trim(),
                    legalAddress: optional(createForm.legalAddress),
                    email: optional(createForm.email),
                    phone: optional(createForm.phone),
                    approvalNumberOrigin: optional(createForm.approvalNumberOrigin),
                    aliases: [request.requestedOrganizationName],
                  },
                  memberRole,
                },
          );
      await onApproved(response.request);
    } catch {
      onError("Impossible d'approuver la demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4">
      <section className="surface max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              Approuver la demande
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {request.requestedOrganizationName} - {request.contactFullName}
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Annuler
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className={`btn ${mode === 'existing' ? 'btn-primary' : 'btn-secondary'}`}
              type="button"
              onClick={() => setMode('existing')}
            >
              Lier a une organisation existante
            </button>
            <button
              className={`btn ${mode === 'create' ? 'btn-primary' : 'btn-secondary'}`}
              type="button"
              onClick={() => setMode('create')}
            >
              Creer une organisation canonique
            </button>
          </div>

          {mode === 'existing' ? (
            <div className="grid gap-3">
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void searchOrganizations();
                }}
              >
                <input
                  className="control flex-1"
                  placeholder="Rechercher une organisation active"
                  value={organizationSearch}
                  onChange={(event) => setOrganizationSearch(event.target.value)}
                />
                <button className="btn btn-secondary" type="submit" disabled={isSearching}>
                  Rechercher
                </button>
              </form>
              <select
                className="control"
                value={organizationId}
                onChange={(event) => setOrganizationId(event.target.value)}
              >
                <option value="">Selectionner une organisation</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.canonicalName}
                  </option>
                ))}
              </select>
              {selectedOrganization ? (
                <p className="text-sm text-slate-500">
                  Organisation active selectionnee: {selectedOrganization.canonicalName}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Nom canonique
                <input
                  className="control mt-1"
                  value={createForm.canonicalName}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      canonicalName: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Adresse legale
                <input
                  className="control mt-1"
                  value={createForm.legalAddress}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      legalAddress: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Email
                <input
                  className="control mt-1"
                  type="email"
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Telephone
                <input
                  className="control mt-1"
                  value={createForm.phone}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
                N d'agrement d'origine
                <input
                  className="control mt-1"
                  value={createForm.approvalNumberOrigin}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      approvalNumberOrigin: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          )}

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Role du membre
            <select
              className="control mt-1"
              value={memberRole}
              onChange={(event) => setMemberRole(event.target.value as MemberRole)}
            >
              {memberRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {localError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {localError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Annuler
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? 'Approbation...' : 'Approuver'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function RejectDialog({
  request,
  onClose,
  onRejected,
  onError,
}: {
  request: AccountRequestListItem;
  onClose: () => void;
  onRejected: (request: AccountRequestListItem) => Promise<void>;
  onError: (message: string) => void;
}): React.JSX.Element {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReject = async () => {
    setLocalError('');
    if (!reason.trim()) {
      setLocalError('Le motif du rejet est requis.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = isMockMode()
        ? {
            request: {
              ...request,
              status: 'rejected' as const,
              rejectionReason: reason.trim(),
              reviewedAt: new Date().toISOString(),
            },
          }
        : await rejectAccountRequest(request.id, { reason: reason.trim() });

      await onRejected({
        ...request,
        status: response.request.status,
        rejectionReason: response.request.rejectionReason,
        reviewedAt: response.request.reviewedAt,
      });
    } catch {
      onError('Impossible de rejeter la demande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4">
      <section className="surface w-full max-w-lg rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              Rejeter la demande
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {request.requestedOrganizationName} - {request.contactFullName}
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Annuler
          </button>
        </div>

        <label className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Motif du rejet
          <textarea
            className="control mt-1 min-h-28"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Informations insuffisantes"
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
          <button
            className="btn btn-danger"
            type="button"
            onClick={handleReject}
            disabled={isSubmitting}
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Rejet...' : 'Rejeter'}
          </button>
        </div>
      </section>
    </div>
  );
}
