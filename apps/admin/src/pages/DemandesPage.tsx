import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, FolderOpen, MailCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AIDN_INTERNAL_DEMANDE_STATUSES,
  AIDN_MAIL_MODES,
  AidnStatusBadge,
  getEntryChannelLabel,
  getInternalDemandeStatusLabel,
  getPortalStatusLabel,
  useAidnDocuments,
  useCourriers,
  useDemandes,
  useDossiers,
  type AidnCourrier,
  type AidnDemande,
  type AidnDocument,
  type AidnDossier,
  type AidnInternalDemandeStatus,
  type AidnMailMode,
} from '@/features/aidn';
import { DataTable, DataTablePagination, DataTableRowActions, createColumnHelper, type ColumnDef, type PaginationState, type RowAction, type SortingState } from '@/components/data-table';
import { ManagementFilterPanel, ManagementHeader, ManagementPageShell, ManagementToolbar, NoResultsState, type ActiveFilter } from '@/components/management';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type DemandeRow = AidnDemande & {
  courrier?: AidnCourrier;
  dossier?: AidnDossier;
  documents: AidnDocument[];
};

const helper = createColumnHelper<DemandeRow>();
const pageSize = 8;

const mailModeLabels: Record<AidnMailMode, string> = {
  physical: 'Physique',
  digital: 'Digital',
};

const visibleInternalDemandeStatuses = AIDN_INTERNAL_DEMANDE_STATUSES.filter(
  (item) => item !== 'redirected',
);

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}

function isInternalDemandeStatus(value: string | null): value is AidnInternalDemandeStatus {
  return AIDN_INTERNAL_DEMANDE_STATUSES.includes(value as AidnInternalDemandeStatus);
}

function isMailMode(value: string | null): value is AidnMailMode {
  return AIDN_MAIL_MODES.includes(value as AidnMailMode);
}

function KpiCard({ title, value, subtitle }: { title: string; value: number; subtitle: string }): React.JSX.Element {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function getNavigationSearch(state: unknown): string {
  return typeof state === 'object' && state !== null && 'aidnSearch' in state && typeof state.aidnSearch === 'string' ? state.aidnSearch : '';
}

function buildColumns(onView: (row: DemandeRow) => void, onViewCourrier: (row: DemandeRow) => void, onViewDossier: (row: DemandeRow) => void): ColumnDef<DemandeRow>[] {
  return [
    helper.accessor('reference', {
      header: 'Référence',
      cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
    }),
    helper.accessor('postulantName', {
      header: 'Postulant',
      cell: (info) => <span>{info.getValue()}</span>,
    }),
    helper.accessor('organizationName', {
      header: 'Organisme',
      meta: { hideOnMobile: true },
      cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
    }),
    helper.accessor('requestType', {
      header: 'Type',
      meta: { hideOnMobile: true },
      cell: (info) => <span>{info.getValue()}</span>,
    }),
    helper.display({
      id: 'mailMode',
      header: 'Mode courrier',
      cell: ({ row }) => (row.original.courrier ? <Badge variant="secondary">{mailModeLabels[row.original.courrier.mode]}</Badge> : <span className="text-muted-foreground">Non reçu</span>),
    }),
    helper.display({
      id: 'entryChannel',
      header: 'Canal d’entrée',
      meta: { hideOnMobile: true },
      cell: ({ row }) => <Badge variant="secondary">{getEntryChannelLabel(row.original.entryChannel)}</Badge>,
    }),
    helper.accessor('internalStatus', {
      header: 'Statut interne',
      cell: (info) => <AidnStatusBadge status={info.getValue()} />,
    }),
    helper.display({
      id: 'portalStatus',
      header: 'Statut postulant',
      meta: { hideOnMobile: true },
      cell: ({ row }) => <span className="text-muted-foreground">{getPortalStatusLabel(row.original.portalStatus)}</span>,
    }),
    helper.display({
      id: 'dossier',
      header: 'Dossier DN',
      cell: ({ row }) =>
        row.original.dossier ? (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              Ouvert
            </Badge>
            <span className="text-xs text-muted-foreground">{row.original.dossier.reference}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Non ouvert</span>
        ),
    }),
    helper.accessor('submittedAt', {
      header: 'Date soumission',
      meta: { hideOnMobile: true },
      cell: (info) => <span className="text-muted-foreground">{formatDate(info.getValue())}</span>,
    }),
    helper.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const actions: RowAction<DemandeRow>[] = [
          { label: 'Voir détails', onClick: onView },
          ...(row.original.courrier ? [{ label: 'Voir courrier / Orientation DG', onClick: onViewCourrier }] satisfies RowAction<DemandeRow>[] : []),
          ...(row.original.dossier ? [{ label: 'Voir dossier DN', onClick: onViewDossier, separated: true }] satisfies RowAction<DemandeRow>[] : []),
        ];

        return <DataTableRowActions row={row.original} actions={actions} triggerLabel={`Actions pour ${row.original.reference}`} />;
      },
    }),
  ] as ColumnDef<DemandeRow>[];
}

function DemandeDetailsDialog({
  row,
  open,
  onClose,
  onViewCourrier,
  onViewDossier,
}: {
  row: DemandeRow | null;
  open: boolean;
  onClose: () => void;
  onViewCourrier: (row: DemandeRow) => void;
  onViewDossier: (row: DemandeRow) => void;
}): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : onClose())}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row ? `Demande ${row.reference}` : 'Demande'}</DialogTitle>
          <DialogDescription>
            Lecture seule du circuit demande, courrier DG, documents et état du dossier DN.
          </DialogDescription>
        </DialogHeader>

        {row ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {row.courrier ? (
                <Button type="button" variant="outline" size="sm" onClick={() => onViewCourrier(row)}>
                  Voir courrier / Orientation DG
                </Button>
              ) : null}
              {row.dossier ? (
                <Button type="button" variant="outline" size="sm" onClick={() => onViewDossier(row)}>
                  Voir dossier DN
                </Button>
              ) : null}
            </div>
            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Informations demande</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Postulant</dt><dd className="font-medium">{row.postulantName}</dd></div>
                <div><dt className="text-muted-foreground">Organisme</dt><dd className="font-medium">{row.organizationName}</dd></div>
                <div><dt className="text-muted-foreground">Type</dt><dd>{row.requestType}</dd></div>
                <div><dt className="text-muted-foreground">Soumission</dt><dd>{formatDate(row.submittedAt)}</dd></div>
                <div><dt className="text-muted-foreground">Canal d’entrée</dt><dd>{getEntryChannelLabel(row.entryChannel)}</dd></div>
                <div><dt className="text-muted-foreground">Statut interne</dt><dd><AidnStatusBadge status={row.internalStatus} /></dd></div>
                <div className="sm:col-span-2"><dt className="text-muted-foreground">Statut postulant</dt><dd>{getPortalStatusLabel(row.portalStatus)}</dd></div>
                <div className="sm:col-span-2"><dt className="text-muted-foreground">Description</dt><dd>{row.description}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Le statut postulant est volontairement simplifié et ne détaille pas le circuit DG/DN.
              </p>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Circuit administratif</h2>
              {row.courrier ? (
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">Courrier</dt><dd className="font-medium">{row.courrier.reference}</dd></div>
                  <div><dt className="text-muted-foreground">Mode</dt><dd>{mailModeLabels[row.courrier.mode]}</dd></div>
                  <div><dt className="text-muted-foreground">Dépôt</dt><dd>{formatDate(row.courrier.dateDepot)}</dd></div>
                  <div><dt className="text-muted-foreground">Envoi DG</dt><dd>{row.courrier.dateEnvoiDg ? formatDate(row.courrier.dateEnvoiDg) : 'Non transmis'}</dd></div>
                  <div><dt className="text-muted-foreground">Retour DG</dt><dd>{row.courrier.dateRetourDg ? formatDate(row.courrier.dateRetourDg) : 'En attente'}</dd></div>
                  <div><dt className="text-muted-foreground">Direction orientée</dt><dd>{row.courrier.directionOrientee ?? 'Non définie'}</dd></div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun courrier lié à cette demande pour le moment.</p>
              )}
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Documents liés</h2>
              {row.documents.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {row.documents.map((document) => (
                    <li key={document.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-background px-3 py-2">
                      <span>{document.title}</span>
                      <span className="text-xs text-muted-foreground">{document.source} · {document.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun document lié.</p>
              )}
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Dossier DN state</h2>
              {row.dossier ? (
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">Référence</dt><dd className="font-medium">{row.dossier.reference}</dd></div>
                  <div><dt className="text-muted-foreground">Agent DN</dt><dd>{row.dossier.assignedAgent}</dd></div>
                  <div><dt className="text-muted-foreground">Progression</dt><dd>{row.dossier.progressPercent}%</dd></div>
                  <div><dt className="text-muted-foreground">Ouverture</dt><dd>{formatDate(row.dossier.openedAt)}</dd></div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">Non ouvert. Une demande ne devient pas automatiquement un dossier DN.</p>
              )}
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function DemandesPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState(() => getNavigationSearch(location.state));
  const [status, setStatus] = useState<AidnInternalDemandeStatus | ''>('');
  const [mailMode, setMailMode] = useState<AidnMailMode | ''>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRow, setSelectedRow] = useState<DemandeRow | null>(null);

  const demandesQuery = useDemandes();
  const courriersQuery = useCourriers();
  const dossiersQuery = useDossiers();
  const documentsQuery = useAidnDocuments();

  const rows = useMemo<DemandeRow[]>(() => {
    const courriersByDemande = new Map((courriersQuery.data ?? []).map((courrier) => [courrier.demandeId, courrier]));
    const dossiersByDemande = new Map((dossiersQuery.data ?? []).map((dossier) => [dossier.demandeId, dossier]));
    const documents = documentsQuery.data ?? [];

    return (demandesQuery.data ?? []).map((demande) => ({
      ...demande,
      courrier: courriersByDemande.get(demande.id),
      dossier: dossiersByDemande.get(demande.id),
      documents: documents.filter((document) => document.demandeId === demande.id || document.dossierId === dossiersByDemande.get(demande.id)?.id),
    }));
  }, [courriersQuery.data, demandesQuery.data, documentsQuery.data, dossiersQuery.data]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch = normalizedSearch
        ? [row.reference, row.postulantName, row.organizationName, row.requestType].some((value) => value.toLowerCase().includes(normalizedSearch))
        : true;
      const matchesStatus = status ? row.internalStatus === status : true;
      const matchesMailMode = mailMode ? row.courrier?.mode === mailMode : true;
      return matchesSearch && matchesStatus && matchesMailMode;
    });
  }, [mailMode, rows, search, status]);

  const activeFilters = useMemo((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    if (status) filters.push({ id: 'status', label: `Statut : ${getInternalDemandeStatusLabel(status)}`, onRemove: () => setStatus('') });
    if (mailMode) filters.push({ id: 'mailMode', label: `Mode : ${mailModeLabels[mailMode]}`, onRemove: () => setMailMode('') });
    return filters;
  }, [mailMode, status]);

  const kpis = useMemo(
    () => ({
      submitted: rows.filter((row) => row.internalStatus === 'submitted').length,
      portalUploads: rows.filter((row) => row.entryChannel === 'portal').length,
      physicalDepositsPlanned: rows.filter((row) => row.entryChannel === 'physical_deposit' && !row.courrier?.scannedAt).length,
      physicalDepositsReceived: rows.filter((row) => row.entryChannel === 'physical_deposit' && Boolean(row.courrier?.scannedAt)).length,
      awaitingDg: rows.filter((row) => row.internalStatus === 'in_dg_circuit' || row.internalStatus === 'dg_return_received').length,
      orientedToDn: rows.filter((row) => row.internalStatus === 'ready_for_dn_dossier' || row.internalStatus === 'dn_dossier_opened').length,
      cancelledByDg: rows.filter((row) => row.internalStatus === 'rejected').length,
    }),
    [rows],
  );

  const isLoading = demandesQuery.isLoading || courriersQuery.isLoading || dossiersQuery.isLoading || documentsQuery.isLoading;
  const error = demandesQuery.error ?? courriersQuery.error ?? dossiersQuery.error ?? documentsQuery.error;
  const hasActiveFilters = Boolean(search || status || mailMode);
  const showNoResults = !isLoading && !error && hasActiveFilters && filteredRows.length === 0;

  useEffect(() => {
    const nextSearch = getNavigationSearch(location.state);
    if (!nextSearch) return;
    setSearch(nextSearch);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [location.state]);

  const refetchAll = useCallback(() => {
    void demandesQuery.refetch();
    void courriersQuery.refetch();
    void dossiersQuery.refetch();
    void documentsQuery.refetch();
  }, [courriersQuery, demandesQuery, documentsQuery, dossiersQuery]);

  const handleClearAll = () => {
    setSearch('');
    setStatus('');
    setMailMode('');
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleViewCourrier = useCallback((row: DemandeRow) => {
    if (!row.courrier) return;
    setSelectedRow(null);
    navigate('/courriers', { state: { aidnSearch: row.courrier.reference } });
  }, [navigate]);

  const handleViewDossier = useCallback((row: DemandeRow) => {
    if (!row.dossier) return;
    setSelectedRow(null);
    navigate(`/dossiers/${row.dossier.id}`);
  }, [navigate]);

  const columns = useMemo(
    () => buildColumns(setSelectedRow, handleViewCourrier, handleViewDossier),
    [handleViewCourrier, handleViewDossier],
  );

  return (
    <ManagementPageShell
      className="page-container"
      header={
        <ManagementHeader
          title="Demandes"
          subtitle="Suivi des demandes initiales avant orientation DG et ouverture éventuelle d’un dossier DN."
          actionsSlot={
            <Button type="button" variant="outline" disabled>
              <FileText className="h-4 w-4" aria-hidden="true" />
              Lecture seule
            </Button>
          }
        />
      }
      toolbar={
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            <KpiCard title="Demandes soumises" value={kpis.submitted} subtitle="Demandes reçues dans le prototype" />
            <KpiCard title="Téléversées portail" value={kpis.portalUploads} subtitle="Demandes issues du portail" />
            <KpiCard title="Dépôts physiques prévus" value={kpis.physicalDepositsPlanned} subtitle="Annonce postulant sans scan" />
            <KpiCard title="Courriers physiques reçus" value={kpis.physicalDepositsReceived} subtitle="Scan courrier enregistré" />
            <KpiCard title="En attente DG" value={kpis.awaitingDg} subtitle="Orientation administrative en cours" />
            <KpiCard title="Orientées DN" value={kpis.orientedToDn} subtitle="Eligibles à un dossier DN" />
            <KpiCard title="Annulées DG" value={kpis.cancelledByDg} subtitle="Sans ouverture DN automatique" />
          </div>
          <ManagementToolbar
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder="Rechercher une référence, un postulant, un organisme..."
            filterCount={activeFilters.length}
            onFilterToggle={() => setIsFilterOpen((open) => !open)}
            isFilterOpen={isFilterOpen}
            onRefresh={refetchAll}
            isRefreshing={demandesQuery.isFetching || courriersQuery.isFetching || dossiersQuery.isFetching || documentsQuery.isFetching}
          />
        </div>
      }
      filterPanel={
        <ManagementFilterPanel isOpen={isFilterOpen} activeFilters={activeFilters} onClear={handleClearAll}>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-demand-status">Statut</label>
            <Select value={status || 'all'} onValueChange={(value) => setStatus(isInternalDemandeStatus(value) ? value : '')}>
              <SelectTrigger id="filter-demand-status" className="h-9 w-56"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {visibleInternalDemandeStatuses.map((item) => <SelectItem key={item} value={item}>{getInternalDemandeStatusLabel(item)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-mail-mode">Mode courrier</label>
            <Select value={mailMode || 'all'} onValueChange={(value) => setMailMode(isMailMode(value) ? value : '')}>
              <SelectTrigger id="filter-mail-mode" className="h-9 w-44"><SelectValue placeholder="Tous les modes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modes</SelectItem>
                {AIDN_MAIL_MODES.map((item) => <SelectItem key={item} value={item}>{mailModeLabels[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </ManagementFilterPanel>
      }
      table={
        showNoResults ? (
          <NoResultsState
            message="Aucune demande ne correspond aux filtres"
            description="Aucune demande mock ne combine ces critères. Effacez les filtres ou recherchez une autre référence, un postulant ou un organisme."
            onClear={handleClearAll}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            error={error}
            emptyMessage="Aucune demande trouvée."
            onRetry={refetchAll}
            onRowClick={setSelectedRow}
            sorting={sorting}
            onSortingChange={setSorting}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        )
      }
      pagination={
        showNoResults ? undefined : (
          <DataTablePagination
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            pageCount={Math.max(1, Math.ceil(filteredRows.length / pagination.pageSize))}
            totalRows={filteredRows.length}
            onPageChange={(pageIndex) => setPagination((current) => ({ ...current, pageIndex }))}
            onPageSizeChange={(nextPageSize) => setPagination({ pageIndex: 0, pageSize: nextPageSize })}
          />
        )
      }
    >
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
        <div className="flex items-start gap-3">
          <FolderOpen className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Une demande ne devient un dossier DN qu’après orientation favorable. Le dossier DN est affiché uniquement lorsqu’il existe réellement dans le référentiel mock.
          </p>
        </div>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Les modes courrier physique et digital proviennent des courriers liés aux demandes.</p>
        </div>
      </div>
      <DemandeDetailsDialog row={selectedRow} open={Boolean(selectedRow)} onClose={() => setSelectedRow(null)} onViewCourrier={handleViewCourrier} onViewDossier={handleViewDossier} />
    </ManagementPageShell>
  );
}
