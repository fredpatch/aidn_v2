import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, FolderOpen, MailCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AIDN_DG_DECISIONS,
  AIDN_MAIL_MODES,
  AidnStatusBadge,
  DgDecisionBadge,
  useCourriers,
  useDemandes,
  useDgDecisionRecords,
  useDossiers,
  type AidnCourrier,
  type AidnDemande,
  type AidnDgDecision,
  type AidnDgDecisionRecord,
  type AidnDossier,
  type AidnMailMode,
} from '@/features/aidn';
import { DataTable, DataTablePagination, DataTableRowActions, createColumnHelper, type ColumnDef, type PaginationState, type RowAction, type SortingState } from '@/components/data-table';
import { ManagementFilterPanel, ManagementHeader, ManagementPageShell, ManagementToolbar, NoResultsState, type ActiveFilter } from '@/components/management';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type CourrierRow = AidnCourrier & {
  demande?: AidnDemande;
  dossier?: AidnDossier;
  dgDecisionRecord?: AidnDgDecisionRecord;
};

const helper = createColumnHelper<CourrierRow>();
const pageSize = 8;

const mailModeLabels: Record<AidnMailMode, string> = {
  physical: 'Physique',
  digital: 'Digital',
};

const decisionLabels: Record<AidnDgDecision, string> = {
  pending: 'En attente DG',
  oriented_to_dn: 'Orientée DN',
  redirected: 'Réorientée',
  rejected: 'Rejetée',
};

function formatDate(value?: string): string {
  if (!value) return 'Non renseigné';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}

function isMailMode(value: string | null): value is AidnMailMode {
  return AIDN_MAIL_MODES.includes(value as AidnMailMode);
}

function isDgDecision(value: string | null): value is AidnDgDecision {
  return AIDN_DG_DECISIONS.includes(value as AidnDgDecision);
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

function buildColumns(onView: (row: CourrierRow) => void, onViewDemande: (row: CourrierRow) => void, onViewDossier: (row: CourrierRow) => void): ColumnDef<CourrierRow>[] {
  return [
    helper.accessor('reference', {
      header: 'Référence courrier',
      cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
    }),
    helper.display({
      id: 'demande',
      header: 'Demande',
      cell: ({ row }) => <span className="font-medium">{row.original.demande?.reference ?? 'Non liée'}</span>,
    }),
    helper.display({
      id: 'postulant',
      header: 'Postulant / organisme',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.demande?.postulantName ?? 'Non renseigné'}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.demande?.organizationName ?? 'Organisme non renseigné'}</p>
        </div>
      ),
    }),
    helper.accessor('mode', {
      header: 'Mode',
      cell: (info) => <Badge variant="secondary">{mailModeLabels[info.getValue()]}</Badge>,
    }),
    helper.accessor('dateDepot', {
      header: 'Date dépôt',
      meta: { hideOnMobile: true },
      cell: (info) => <span className="text-muted-foreground">{formatDate(info.getValue())}</span>,
    }),
    helper.accessor('dateEnvoiDg', {
      header: 'Transmission DG',
      meta: { hideOnMobile: true },
      cell: (info) => <span className="text-muted-foreground">{formatDate(info.getValue())}</span>,
    }),
    helper.accessor('dateRetourDg', {
      header: 'Retour DG',
      meta: { hideOnMobile: true },
      cell: (info) => <span className="text-muted-foreground">{formatDate(info.getValue())}</span>,
    }),
    helper.accessor('decisionDg', {
      header: 'Décision DG',
      cell: (info) => <DgDecisionBadge decision={info.getValue()} />,
    }),
    helper.accessor('directionOrientee', {
      header: 'Direction orientée',
      meta: { hideOnMobile: true },
      cell: (info) => <span className="text-muted-foreground">{info.getValue() ?? 'Non définie'}</span>,
    }),
    helper.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const actions: RowAction<CourrierRow>[] = [
          { label: 'Voir détails', onClick: onView },
          ...(row.original.demande ? [{ label: 'Voir demande', onClick: onViewDemande }] satisfies RowAction<CourrierRow>[] : []),
          ...(row.original.dossier ? [{ label: 'Voir dossier DN', onClick: onViewDossier, separated: true }] satisfies RowAction<CourrierRow>[] : []),
        ];

        return <DataTableRowActions row={row.original} actions={actions} triggerLabel={`Actions pour ${row.original.reference}`} />;
      },
    }),
  ] as ColumnDef<CourrierRow>[];
}

function CourrierDetailsDialog({
  row,
  open,
  onClose,
  onViewDemande,
  onViewDossier,
}: {
  row: CourrierRow | null;
  open: boolean;
  onClose: () => void;
  onViewDemande: (row: CourrierRow) => void;
  onViewDossier: (row: CourrierRow) => void;
}): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : onClose())}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row ? `Courrier ${row.reference}` : 'Courrier'}</DialogTitle>
          <DialogDescription>
            Lecture seule du courrier, de la demande liée, de la décision DG et de l’état Dossier DN.
          </DialogDescription>
        </DialogHeader>

        {row ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {row.demande ? (
                <Button type="button" variant="outline" size="sm" onClick={() => onViewDemande(row)}>
                  Voir demande
                </Button>
              ) : null}
              {row.dossier ? (
                <Button type="button" variant="outline" size="sm" onClick={() => onViewDossier(row)}>
                  Voir dossier DN
                </Button>
              ) : null}
            </div>
            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Informations courrier</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Référence courrier</dt><dd className="font-medium">{row.reference}</dd></div>
                <div><dt className="text-muted-foreground">Mode courrier</dt><dd>{mailModeLabels[row.mode]}</dd></div>
                <div><dt className="text-muted-foreground">Date dépôt</dt><dd>{formatDate(row.dateDepot)}</dd></div>
                <div><dt className="text-muted-foreground">Date scan</dt><dd>{formatDate(row.scannedAt)}</dd></div>
                <div><dt className="text-muted-foreground">Transmission DG</dt><dd>{formatDate(row.dateEnvoiDg)}</dd></div>
                <div><dt className="text-muted-foreground">Retour DG</dt><dd>{formatDate(row.dateRetourDg)}</dd></div>
                <div className="sm:col-span-2"><dt className="text-muted-foreground">Scan / document mock</dt><dd>{row.scanCourrierUrl ?? 'Aucune référence de scan'}</dd></div>
              </dl>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Demande liée</h2>
              {row.demande ? (
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">Référence demande</dt><dd className="font-medium">{row.demande.reference}</dd></div>
                  <div><dt className="text-muted-foreground">Statut demande</dt><dd><AidnStatusBadge status={row.demande.status} /></dd></div>
                  <div><dt className="text-muted-foreground">Postulant</dt><dd>{row.demande.postulantName}</dd></div>
                  <div><dt className="text-muted-foreground">Organisme</dt><dd>{row.demande.organizationName}</dd></div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune demande liée.</p>
              )}
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Décision DG</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Décision</dt><dd><DgDecisionBadge decision={row.decisionDg} /></dd></div>
                <div><dt className="text-muted-foreground">Direction orientée</dt><dd>{row.directionOrientee ?? 'Non définie'}</dd></div>
                <div><dt className="text-muted-foreground">Date décision</dt><dd>{formatDate(row.dgDecisionRecord?.decidedAt ?? row.dateRetourDg)}</dd></div>
                <div><dt className="text-muted-foreground">Agent ayant enregistré</dt><dd>{row.dgDecisionRecord?.recordedBy ?? 'Non renseigné'}</dd></div>
                <div className="sm:col-span-2"><dt className="text-muted-foreground">Observations</dt><dd>{row.dgDecisionRecord?.notes ?? 'Aucune observation enregistrée.'}</dd></div>
              </dl>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Dossier DN</h2>
              {row.dossier ? (
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">Référence dossier</dt><dd className="font-medium">{row.dossier.reference}</dd></div>
                  <div><dt className="text-muted-foreground">Agent DN</dt><dd>{row.dossier.assignedAgent}</dd></div>
                  <div><dt className="text-muted-foreground">Statut global</dt><dd><AidnStatusBadge status={row.dossier.globalStatus} /></dd></div>
                  <div><dt className="text-muted-foreground">Ouverture</dt><dd>{formatDate(row.dossier.openedAt)}</dd></div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun dossier DN ouvert pour ce courrier.</p>
              )}
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function CourriersPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState(() => getNavigationSearch(location.state));
  const [mailMode, setMailMode] = useState<AidnMailMode | ''>('');
  const [decision, setDecision] = useState<AidnDgDecision | ''>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRow, setSelectedRow] = useState<CourrierRow | null>(null);

  const courriersQuery = useCourriers();
  const demandesQuery = useDemandes();
  const dossiersQuery = useDossiers();
  const decisionsQuery = useDgDecisionRecords();

  const rows = useMemo<CourrierRow[]>(() => {
    const demandesById = new Map((demandesQuery.data ?? []).map((demande) => [demande.id, demande]));
    const dossiersByDemande = new Map((dossiersQuery.data ?? []).map((dossier) => [dossier.demandeId, dossier]));
    const decisionsByCourrier = new Map((decisionsQuery.data ?? []).map((record) => [record.courrierId, record]));

    return (courriersQuery.data ?? []).map((courrier) => ({
      ...courrier,
      demande: demandesById.get(courrier.demandeId),
      dossier: dossiersByDemande.get(courrier.demandeId),
      dgDecisionRecord: decisionsByCourrier.get(courrier.id),
    }));
  }, [courriersQuery.data, decisionsQuery.data, demandesQuery.data, dossiersQuery.data]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch = normalizedSearch
        ? [
            row.reference,
            row.demande?.reference ?? '',
            row.demande?.postulantName ?? '',
            row.demande?.organizationName ?? '',
            row.directionOrientee ?? '',
          ].some((value) => value.toLowerCase().includes(normalizedSearch))
        : true;
      const matchesMailMode = mailMode ? row.mode === mailMode : true;
      const matchesDecision = decision ? row.decisionDg === decision : true;
      return matchesSearch && matchesMailMode && matchesDecision;
    });
  }, [decision, mailMode, rows, search]);

  const activeFilters = useMemo((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    if (mailMode) filters.push({ id: 'mailMode', label: `Mode : ${mailModeLabels[mailMode]}`, onRemove: () => setMailMode('') });
    if (decision) filters.push({ id: 'decision', label: `Décision : ${decisionLabels[decision]}`, onRemove: () => setDecision('') });
    return filters;
  }, [decision, mailMode]);

  const kpis = useMemo(
    () => ({
      total: rows.length,
      physical: rows.filter((row) => row.mode === 'physical').length,
      digital: rows.filter((row) => row.mode === 'digital').length,
      pendingDg: rows.filter((row) => row.decisionDg === 'pending').length,
    }),
    [rows],
  );

  const isLoading = courriersQuery.isLoading || demandesQuery.isLoading || dossiersQuery.isLoading || decisionsQuery.isLoading;
  const error = courriersQuery.error ?? demandesQuery.error ?? dossiersQuery.error ?? decisionsQuery.error;
  const hasActiveFilters = Boolean(search || mailMode || decision);
  const showNoResults = !isLoading && !error && hasActiveFilters && filteredRows.length === 0;

  useEffect(() => {
    const nextSearch = getNavigationSearch(location.state);
    if (!nextSearch) return;
    setSearch(nextSearch);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [location.state]);

  const refetchAll = useCallback(() => {
    void courriersQuery.refetch();
    void demandesQuery.refetch();
    void dossiersQuery.refetch();
    void decisionsQuery.refetch();
  }, [courriersQuery, decisionsQuery, demandesQuery, dossiersQuery]);

  const handleClearAll = () => {
    setSearch('');
    setMailMode('');
    setDecision('');
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleViewDemande = useCallback((row: CourrierRow) => {
    if (!row.demande) return;
    setSelectedRow(null);
    navigate('/demandes', { state: { aidnSearch: row.demande.reference } });
  }, [navigate]);

  const handleViewDossier = useCallback((row: CourrierRow) => {
    if (!row.dossier) return;
    setSelectedRow(null);
    navigate(`/dossiers/${row.dossier.id}`);
  }, [navigate]);

  const columns = useMemo(
    () => buildColumns(setSelectedRow, handleViewDemande, handleViewDossier),
    [handleViewDemande, handleViewDossier],
  );

  return (
    <ManagementPageShell
      className="page-container"
      header={
        <ManagementHeader
          title="Courriers / Orientation DG"
          subtitle="Suivi des courriers physiques et digitaux jusqu’à la décision du Directeur Général."
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
          <div className="grid gap-3 md:grid-cols-4">
            <KpiCard title="Courriers reçus" value={kpis.total} subtitle="Courriers liés aux demandes OMA" />
            <KpiCard title="Physiques" value={kpis.physical} subtitle="Plis déposés au bureau courrier" />
            <KpiCard title="Digitaux" value={kpis.digital} subtitle="Soumissions ou scans numériques" />
            <KpiCard title="En attente DG" value={kpis.pendingDg} subtitle="Sans retour DG enregistré" />
          </div>
          <ManagementToolbar
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder="Rechercher courrier, demande, postulant, organisme, direction..."
            filterCount={activeFilters.length}
            onFilterToggle={() => setIsFilterOpen((open) => !open)}
            isFilterOpen={isFilterOpen}
            onRefresh={refetchAll}
            isRefreshing={courriersQuery.isFetching || demandesQuery.isFetching || dossiersQuery.isFetching || decisionsQuery.isFetching}
          />
        </div>
      }
      filterPanel={
        <ManagementFilterPanel isOpen={isFilterOpen} activeFilters={activeFilters} onClear={handleClearAll}>
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
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-dg-decision">Décision DG</label>
            <Select value={decision || 'all'} onValueChange={(value) => setDecision(isDgDecision(value) ? value : '')}>
              <SelectTrigger id="filter-dg-decision" className="h-9 w-52"><SelectValue placeholder="Toutes les décisions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les décisions</SelectItem>
                {AIDN_DG_DECISIONS.map((item) => <SelectItem key={item} value={item}>{decisionLabels[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </ManagementFilterPanel>
      }
      table={
        showNoResults ? (
          <NoResultsState
            message="Aucun courrier / Orientation DG ne correspond aux filtres"
            description="Aucun courrier mock ne combine ces critères. Effacez les filtres ou recherchez une référence, une demande, un postulant ou un organisme."
            onClear={handleClearAll}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            error={error}
            emptyMessage="Aucun courrier trouvé."
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
            La décision DG est enregistrée dans AIDN au retour du courrier officiel. Une orientation favorable vers la DN n’affiche un dossier DN que si le dossier existe dans les données mock.
          </p>
        </div>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Les courriers physiques et digitaux partagent le même circuit d’orientation DG dans ce prototype.</p>
        </div>
      </div>
      <CourrierDetailsDialog row={selectedRow} open={Boolean(selectedRow)} onClose={() => setSelectedRow(null)} onViewDemande={handleViewDemande} onViewDossier={handleViewDossier} />
    </ManagementPageShell>
  );
}
