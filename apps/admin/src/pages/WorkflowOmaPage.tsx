import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, FolderOpen, Workflow } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AIDN_OMA_PHASE_KEYS,
  AIDN_OMA_PHASE_STATUSES,
  AidnStatusBadge,
  OmaPhaseBadge,
  useAidnCertificates,
  useAidnDocuments,
  useAidnMeetings,
  useAidnOmaPhases,
  useDemandes,
  useDossiers,
  type AidnCertificate,
  type AidnDemande,
  type AidnDocument,
  type AidnDossier,
  type AidnMeeting,
  type AidnOmaPhase,
  type AidnOmaPhaseKey,
  type AidnOmaPhaseStatus,
} from '@/features/aidn';
import { DataTable, DataTablePagination, DataTableRowActions, createColumnHelper, type ColumnDef, type PaginationState, type RowAction, type SortingState } from '@/components/data-table';
import { ManagementFilterPanel, ManagementHeader, ManagementPageShell, ManagementToolbar, NoResultsState, type ActiveFilter } from '@/components/management';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type WorkflowRow = AidnOmaPhase & {
  dossier?: AidnDossier;
  demande?: AidnDemande;
  dossierPhases: AidnOmaPhase[];
  phaseDocuments: AidnDocument[];
  dossierDocuments: AidnDocument[];
  meetings: AidnMeeting[];
  certificate?: AidnCertificate;
};

const helper = createColumnHelper<WorkflowRow>();
const pageSize = 8;

const phaseLabels: Record<AidnOmaPhaseKey, string> = {
  preliminary: 'Phase préliminaire',
  formal_application: 'Demande formelle',
  document_evaluation: 'Évaluation documents',
  onsite_demonstration: 'Inspection sur site',
  delivery: 'Délivrance',
};

const phaseStatusLabels: Record<AidnOmaPhaseStatus, string> = {
  not_started: 'Non démarrée',
  in_progress: 'En cours',
  blocked: 'Bloquée',
  late: 'En retard',
  completed: 'Clôturée',
};

function formatDate(value?: string): string {
  if (!value) return 'Non renseigné';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}

function isOmaPhaseKey(value: string | null): value is AidnOmaPhaseKey {
  return AIDN_OMA_PHASE_KEYS.includes(value as AidnOmaPhaseKey);
}

function isOmaPhaseStatus(value: string | null): value is AidnOmaPhaseStatus {
  return AIDN_OMA_PHASE_STATUSES.includes(value as AidnOmaPhaseStatus);
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

function buildColumns(onView: (row: WorkflowRow) => void, onViewDossier: (row: WorkflowRow) => void, onViewDocuments: (row: WorkflowRow) => void): ColumnDef<WorkflowRow>[] {
  return [
    helper.display({
      id: 'dossier',
      header: 'Dossier DN',
      cell: ({ row }) => <span className="font-semibold">{row.original.dossier?.reference ?? 'Dossier non lié'}</span>,
    }),
    helper.display({
      id: 'demande',
      header: 'Demande source',
      meta: { hideOnMobile: true },
      cell: ({ row }) => <span className="font-medium">{row.original.demande?.reference ?? 'Non liée'}</span>,
    }),
    helper.display({
      id: 'organisme',
      header: 'Organisme',
      cell: ({ row }) => <span>{row.original.demande?.organizationName ?? 'Non renseigné'}</span>,
    }),
    helper.accessor('key', {
      header: 'Phase OMA',
      cell: (info) => <span>{phaseLabels[info.getValue()]}</span>,
    }),
    helper.accessor('status', {
      header: 'Statut phase',
      cell: (info) => <OmaPhaseBadge status={info.getValue()} />,
    }),
    helper.accessor('startedAt', {
      header: 'Début',
      meta: { hideOnMobile: true },
      cell: (info) => <span className="text-muted-foreground">{formatDate(info.getValue())}</span>,
    }),
    helper.accessor('dueAt', {
      header: 'Échéance',
      cell: (info) => <span className="text-muted-foreground">{formatDate(info.getValue())}</span>,
    }),
    helper.accessor('completedAt', {
      header: 'Fin',
      meta: { hideOnMobile: true },
      cell: (info) => <span className="text-muted-foreground">{formatDate(info.getValue())}</span>,
    }),
    helper.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const actions: RowAction<WorkflowRow>[] = [
          { label: 'Voir détails', onClick: onView },
          ...(row.original.dossier ? [{ label: 'Voir dossier DN', onClick: onViewDossier }] satisfies RowAction<WorkflowRow>[] : []),
          { label: 'Voir documents liés', onClick: onViewDocuments, separated: true },
        ];

        return <DataTableRowActions row={row.original} actions={actions} triggerLabel={`Actions pour ${row.original.dossier?.reference ?? row.original.id}`} />;
      },
    }),
  ] as ColumnDef<WorkflowRow>[];
}

function WorkflowDetailsDialog({ row, open, onClose }: { row: WorkflowRow | null; open: boolean; onClose: () => void }): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : onClose())}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row ? `${row.dossier?.reference ?? 'Dossier'} - ${phaseLabels[row.key]}` : 'Workflow OMA'}</DialogTitle>
          <DialogDescription>
            Lecture seule du workflow OMA rattaché au dossier DN existant.
          </DialogDescription>
        </DialogHeader>

        {row ? (
          <div className="grid gap-4">
            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Résumé dossier</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Dossier DN</dt><dd className="font-medium">{row.dossier?.reference ?? 'Non lié'}</dd></div>
                <div><dt className="text-muted-foreground">Statut dossier</dt><dd>{row.dossier ? <AidnStatusBadge status={row.dossier.globalStatus} /> : 'Non renseigné'}</dd></div>
                <div><dt className="text-muted-foreground">Demande source</dt><dd>{row.demande?.reference ?? 'Non liée'}</dd></div>
                <div><dt className="text-muted-foreground">Agent DN</dt><dd>{row.dossier?.assignedAgent ?? 'Non renseigné'}</dd></div>
                <div><dt className="text-muted-foreground">Organisme</dt><dd>{row.demande?.organizationName ?? 'Non renseigné'}</dd></div>
                <div><dt className="text-muted-foreground">Postulant</dt><dd>{row.demande?.postulantName ?? 'Non renseigné'}</dd></div>
              </dl>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Workflow complet</h2>
              <ol className="space-y-2 text-sm">
                {row.dossierPhases.sort((first, second) => first.order - second.order).map((phase) => (
                  <li key={phase.id} className="grid gap-2 rounded-md bg-background px-3 py-2 sm:grid-cols-[1fr_auto]">
                    <div>
                      <p className="font-medium">{phase.order}. {phase.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Début : {formatDate(phase.startedAt)} · Échéance : {formatDate(phase.dueAt)} · Fin : {formatDate(phase.completedAt)}
                      </p>
                    </div>
                    <OmaPhaseBadge status={phase.status} />
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Documents liés à la phase</h2>
              {row.phaseDocuments.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {row.phaseDocuments.map((document) => (
                    <li key={document.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-background px-3 py-2">
                      <span>{document.title}</span>
                      <span className="text-xs text-muted-foreground">{document.source} · {document.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun document directement rattaché à cette phase.</p>
              )}
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Réunions liées</h2>
              {row.meetings.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {row.meetings.map((meeting) => (
                    <li key={meeting.id} className="rounded-md bg-background px-3 py-2">
                      <p className="font-medium">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(meeting.scheduledAt)} · {meeting.location} · {meeting.outcome}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune réunion liée.</p>
              )}
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Certificat</h2>
              <p className="text-sm text-muted-foreground">
                {row.certificate ? `${row.certificate.certificateNumber} · ${row.certificate.status}` : 'Aucun certificat lié à ce dossier.'}
              </p>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function WorkflowOmaPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState(() => getNavigationSearch(location.state));
  const [phaseKey, setPhaseKey] = useState<AidnOmaPhaseKey | ''>('');
  const [phaseStatus, setPhaseStatus] = useState<AidnOmaPhaseStatus | ''>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRow, setSelectedRow] = useState<WorkflowRow | null>(null);

  const dossiersQuery = useDossiers();
  const demandesQuery = useDemandes();
  const phasesQuery = useAidnOmaPhases();
  const documentsQuery = useAidnDocuments();
  const meetingsQuery = useAidnMeetings();
  const certificatesQuery = useAidnCertificates();

  const rows = useMemo<WorkflowRow[]>(() => {
    const dossiersById = new Map((dossiersQuery.data ?? []).map((dossier) => [dossier.id, dossier]));
    const demandesById = new Map((demandesQuery.data ?? []).map((demande) => [demande.id, demande]));
    const phases = phasesQuery.data ?? [];
    const documents = documentsQuery.data ?? [];
    const meetings = meetingsQuery.data ?? [];
    const certificates = certificatesQuery.data ?? [];

    return phases
      .filter((phase) => dossiersById.has(phase.dossierId))
      .map((phase) => {
        const dossier = dossiersById.get(phase.dossierId);
        const demande = dossier ? demandesById.get(dossier.demandeId) : undefined;

        return {
          ...phase,
          dossier,
          demande,
          dossierPhases: phases.filter((item) => item.dossierId === phase.dossierId),
          phaseDocuments: documents.filter((document) => document.dossierId === phase.dossierId && document.phaseKey === phase.key),
          dossierDocuments: documents.filter((document) => document.dossierId === phase.dossierId),
          meetings: meetings.filter((meeting) => meeting.dossierId === phase.dossierId),
          certificate: certificates.find((certificate) => certificate.dossierId === phase.dossierId),
        };
      });
  }, [certificatesQuery.data, demandesQuery.data, documentsQuery.data, dossiersQuery.data, meetingsQuery.data, phasesQuery.data]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch = normalizedSearch
        ? [
            row.dossier?.reference ?? '',
            row.demande?.reference ?? '',
            row.demande?.postulantName ?? '',
            row.demande?.organizationName ?? '',
            row.dossier?.assignedAgent ?? '',
          ].some((value) => value.toLowerCase().includes(normalizedSearch))
        : true;
      const matchesPhase = phaseKey ? row.key === phaseKey : true;
      const matchesStatus = phaseStatus ? row.status === phaseStatus : true;
      return matchesSearch && matchesPhase && matchesStatus;
    });
  }, [phaseKey, phaseStatus, rows, search]);

  const activeFilters = useMemo((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    if (phaseKey) filters.push({ id: 'phaseKey', label: `Phase OMA : ${phaseLabels[phaseKey]}`, onRemove: () => setPhaseKey('') });
    if (phaseStatus) filters.push({ id: 'phaseStatus', label: `Statut : ${phaseStatusLabels[phaseStatus]}`, onRemove: () => setPhaseStatus('') });
    return filters;
  }, [phaseKey, phaseStatus]);

  const kpis = useMemo(
    () => ({
      total: rows.length,
      inProgress: rows.filter((row) => row.status === 'in_progress').length,
      blockedLate: rows.filter((row) => row.status === 'blocked' || row.status === 'late').length,
      completed: rows.filter((row) => row.status === 'completed').length,
    }),
    [rows],
  );

  const isLoading = dossiersQuery.isLoading || demandesQuery.isLoading || phasesQuery.isLoading || documentsQuery.isLoading || meetingsQuery.isLoading || certificatesQuery.isLoading;
  const error = dossiersQuery.error ?? demandesQuery.error ?? phasesQuery.error ?? documentsQuery.error ?? meetingsQuery.error ?? certificatesQuery.error;
  const hasActiveFilters = Boolean(search || phaseKey || phaseStatus);
  const showNoResults = !isLoading && !error && hasActiveFilters && filteredRows.length === 0;

  useEffect(() => {
    const nextSearch = getNavigationSearch(location.state);
    if (!nextSearch) return;
    setSearch(nextSearch);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [location.state]);

  const refetchAll = useCallback(() => {
    void dossiersQuery.refetch();
    void demandesQuery.refetch();
    void phasesQuery.refetch();
    void documentsQuery.refetch();
    void meetingsQuery.refetch();
    void certificatesQuery.refetch();
  }, [certificatesQuery, demandesQuery, documentsQuery, dossiersQuery, meetingsQuery, phasesQuery]);

  const handleClearAll = () => {
    setSearch('');
    setPhaseKey('');
    setPhaseStatus('');
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleViewDossier = useCallback((row: WorkflowRow) => {
    if (!row.dossier) return;
    setSelectedRow(null);
    navigate(`/dossiers/${row.dossier.id}`);
  }, [navigate]);

  const handleViewDocuments = useCallback((row: WorkflowRow) => {
    setSelectedRow(null);
    navigate('/documents', { state: { aidnSearch: row.dossier?.reference ?? row.id } });
  }, [navigate]);

  const columns = useMemo(
    () => buildColumns(setSelectedRow, handleViewDossier, handleViewDocuments),
    [handleViewDossier, handleViewDocuments],
  );

  return (
    <ManagementPageShell
      className="page-container"
      header={
        <ManagementHeader
          title="Workflow OMA"
          subtitle="Pilotage des phases OMA rattachées aux dossiers DN existants."
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
            <KpiCard title="Phases totales" value={kpis.total} subtitle="Phases liées aux dossiers DN" />
            <KpiCard title="En cours" value={kpis.inProgress} subtitle="Phases actuellement actives" />
            <KpiCard title="Bloquées / en retard" value={kpis.blockedLate} subtitle="Alertes à traiter par la DN" />
            <KpiCard title="Clôturées" value={kpis.completed} subtitle="Phases validées" />
          </div>
          <ManagementToolbar
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder="Rechercher dossier, demande, postulant, organisme, agent..."
            filterCount={activeFilters.length}
            onFilterToggle={() => setIsFilterOpen((open) => !open)}
            isFilterOpen={isFilterOpen}
            onRefresh={refetchAll}
            isRefreshing={dossiersQuery.isFetching || demandesQuery.isFetching || phasesQuery.isFetching || documentsQuery.isFetching || meetingsQuery.isFetching || certificatesQuery.isFetching}
          />
        </div>
      }
      filterPanel={
        <ManagementFilterPanel isOpen={isFilterOpen} activeFilters={activeFilters} onClear={handleClearAll}>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-phase-key">Phase OMA</label>
            <Select value={phaseKey || 'all'} onValueChange={(value) => setPhaseKey(isOmaPhaseKey(value) ? value : '')}>
              <SelectTrigger id="filter-phase-key" className="h-9 w-56"><SelectValue placeholder="Toutes les phases" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les phases</SelectItem>
                {AIDN_OMA_PHASE_KEYS.map((item) => <SelectItem key={item} value={item}>{phaseLabels[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-phase-status">Statut phase</label>
            <Select value={phaseStatus || 'all'} onValueChange={(value) => setPhaseStatus(isOmaPhaseStatus(value) ? value : '')}>
              <SelectTrigger id="filter-phase-status" className="h-9 w-52"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {AIDN_OMA_PHASE_STATUSES.map((item) => <SelectItem key={item} value={item}>{phaseStatusLabels[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </ManagementFilterPanel>
      }
      table={
        showNoResults ? (
          <NoResultsState
            message="Aucune phase OMA ne correspond aux filtres"
            description="Aucune phase OMA mock ne combine ces critères. Effacez les filtres ou recherchez un dossier DN, une demande, un postulant ou un organisme."
            onClear={handleClearAll}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            error={error}
            emptyMessage="Aucune phase OMA trouvée."
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
            Le workflow OMA est rattaché uniquement aux dossiers DN ouverts. Aucune phase n’est inférée depuis une demande non transformée en dossier.
          </p>
        </div>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <Workflow className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Le détail regroupe le workflow complet, les documents de phase, les réunions du dossier et le certificat associé.</p>
        </div>
      </div>
      <WorkflowDetailsDialog row={selectedRow} open={Boolean(selectedRow)} onClose={() => setSelectedRow(null)} />
    </ManagementPageShell>
  );
}
