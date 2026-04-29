import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, FolderOpen, Workflow } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AIDN_DOSSIER_STATUSES,
  AIDN_OMA_PHASE_KEYS,
  AidnStatusBadge,
  DgDecisionBadge,
  OmaPhaseBadge,
  useAidnCertificates,
  useAidnDocuments,
  useAidnMeetings,
  useAidnOmaPhases,
  useCourriers,
  useDemandes,
  useDgDecisionRecords,
  useDossiers,
  type AidnCertificate,
  type AidnCourrier,
  type AidnDemande,
  type AidnDgDecisionRecord,
  type AidnDocument,
  type AidnDossier,
  type AidnDossierStatus,
  type AidnMeeting,
  type AidnOmaPhase,
  type AidnOmaPhaseKey,
} from '@/features/aidn';
import { DataTable, DataTablePagination, DataTableRowActions, createColumnHelper, type ColumnDef, type PaginationState, type RowAction, type SortingState } from '@/components/data-table';
import { ManagementFilterPanel, ManagementHeader, ManagementPageShell, ManagementToolbar, NoResultsState, type ActiveFilter } from '@/components/management';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type DeadlineStatus = AidnDossier['deadlineStatus'];

type DossierRow = AidnDossier & {
  demande?: AidnDemande;
  courrier?: AidnCourrier;
  dgDecisionRecord?: AidnDgDecisionRecord;
  documents: AidnDocument[];
  meetings: AidnMeeting[];
  certificate?: AidnCertificate;
  phases: AidnOmaPhase[];
};

const helper = createColumnHelper<DossierRow>();
const pageSize = 8;

const dossierStatusLabels: Record<AidnDossierStatus, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  waiting_postulant: 'Attente postulant',
  late: 'En retard',
  certificate_ready: 'Certificat prêt',
  closed: 'Clôturé',
};

const deadlineLabels: Record<DeadlineStatus, string> = {
  on_track: 'Dans les délais',
  at_risk: 'À risque',
  late: 'En retard',
};

const deadlineClassNames: Record<DeadlineStatus, string> = {
  on_track: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  at_risk: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  late: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
};

const phaseLabels: Record<AidnOmaPhaseKey, string> = {
  preliminary: 'Phase préliminaire',
  formal_application: 'Demande formelle',
  document_evaluation: 'Évaluation documents',
  onsite_demonstration: 'Inspection sur site',
  delivery: 'Délivrance',
};

function formatDate(value?: string): string {
  if (!value) return 'Non renseigné';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}

function isDossierStatus(value: string | null): value is AidnDossierStatus {
  return AIDN_DOSSIER_STATUSES.includes(value as AidnDossierStatus);
}

function isOmaPhaseKey(value: string | null): value is AidnOmaPhaseKey {
  return AIDN_OMA_PHASE_KEYS.includes(value as AidnOmaPhaseKey);
}

function isDeadlineStatus(value: string | null): value is DeadlineStatus {
  return value === 'on_track' || value === 'at_risk' || value === 'late';
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

function DeadlineBadge({ status }: { status: DeadlineStatus }): React.JSX.Element {
  return (
    <Badge variant="outline" className={deadlineClassNames[status]}>
      {deadlineLabels[status]}
    </Badge>
  );
}

function getNavigationSearch(state: unknown): string {
  return typeof state === 'object' && state !== null && 'aidnSearch' in state && typeof state.aidnSearch === 'string' ? state.aidnSearch : '';
}

function buildColumns(onView: (row: DossierRow) => void, onViewDemande: (row: DossierRow) => void, onViewWorkflow: (row: DossierRow) => void): ColumnDef<DossierRow>[] {
  return [
    helper.accessor('reference', {
      header: 'Référence dossier',
      cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
    }),
    helper.display({
      id: 'organisme',
      header: 'Organisme',
      cell: ({ row }) => <span>{row.original.demande?.organizationName ?? 'Non renseigné'}</span>,
    }),
    helper.display({
      id: 'postulant',
      header: 'Postulant',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.demande?.postulantName ?? 'Non renseigné'}</span>,
    }),
    helper.display({
      id: 'demande',
      header: 'Demande source',
      meta: { hideOnMobile: true },
      cell: ({ row }) => <span className="font-medium">{row.original.demande?.reference ?? 'Non liée'}</span>,
    }),
    helper.accessor('currentPhase', {
      header: 'Phase OMA',
      cell: (info) => {
        const phase = info.row.original.phases.find((item) => item.key === info.getValue());
        return phase ? <OmaPhaseBadge status={phase.status} /> : <Badge variant="secondary">{phaseLabels[info.getValue()]}</Badge>;
      },
    }),
    helper.accessor('progressPercent', {
      header: 'Progression',
      cell: (info) => (
        <div className="min-w-24">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{info.getValue()}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${info.getValue()}%` }} />
          </div>
        </div>
      ),
    }),
    helper.accessor('assignedAgent', {
      header: 'Agent DN',
      meta: { hideOnMobile: true },
      cell: (info) => <span>{info.getValue()}</span>,
    }),
    helper.accessor('globalStatus', {
      header: 'Statut',
      cell: (info) => <AidnStatusBadge status={info.getValue()} />,
    }),
    helper.accessor('deadlineStatus', {
      header: 'Délai',
      cell: (info) => <DeadlineBadge status={info.getValue()} />,
    }),
    helper.accessor('openedAt', {
      header: 'Date ouverture',
      meta: { hideOnMobile: true },
      cell: (info) => <span className="text-muted-foreground">{formatDate(info.getValue())}</span>,
    }),
    helper.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const actions: RowAction<DossierRow>[] = [
          { label: 'Voir détails', onClick: onView },
          { label: 'Voir demande source', onClick: onViewDemande },
          { label: 'Voir workflow OMA', onClick: onViewWorkflow, separated: true },
        ];

        return <DataTableRowActions row={row.original} actions={actions} triggerLabel={`Actions pour ${row.original.reference}`} />;
      },
    }),
  ] as ColumnDef<DossierRow>[];
}

function DossierDetailsDialog({ row, open, onClose }: { row: DossierRow | null; open: boolean; onClose: () => void }): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : onClose())}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row ? `Dossier ${row.reference}` : 'Dossier DN'}</DialogTitle>
          <DialogDescription>
            Lecture seule du dossier DN, de son origine administrative et du suivi OMA.
          </DialogDescription>
        </DialogHeader>

        {row ? (
          <div className="grid gap-4">
            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Résumé dossier</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Référence</dt><dd className="font-medium">{row.reference}</dd></div>
                <div><dt className="text-muted-foreground">Statut</dt><dd><AidnStatusBadge status={row.globalStatus} /></dd></div>
                <div><dt className="text-muted-foreground">Organisme</dt><dd>{row.demande?.organizationName ?? 'Non renseigné'}</dd></div>
                <div><dt className="text-muted-foreground">Postulant</dt><dd>{row.demande?.postulantName ?? 'Non renseigné'}</dd></div>
                <div><dt className="text-muted-foreground">Agent DN</dt><dd>{row.assignedAgent}</dd></div>
                <div><dt className="text-muted-foreground">Date ouverture</dt><dd>{formatDate(row.openedAt)}</dd></div>
                <div><dt className="text-muted-foreground">Progression</dt><dd>{row.progressPercent}%</dd></div>
                <div><dt className="text-muted-foreground">Délai</dt><dd><DeadlineBadge status={row.deadlineStatus} /></dd></div>
              </dl>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Origine administrative</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Demande liée</dt><dd className="font-medium">{row.demande?.reference ?? 'Non liée'}</dd></div>
                <div><dt className="text-muted-foreground">Courrier lié</dt><dd>{row.courrier?.reference ?? 'Non lié'}</dd></div>
                <div><dt className="text-muted-foreground">Décision DG</dt><dd>{row.courrier ? <DgDecisionBadge decision={row.courrier.decisionDg} /> : 'Non renseignée'}</dd></div>
                <div><dt className="text-muted-foreground">Retour DG</dt><dd>{formatDate(row.courrier?.dateRetourDg)}</dd></div>
                <div><dt className="text-muted-foreground">Direction orientée</dt><dd>{row.courrier?.directionOrientee ?? row.dgDecisionRecord?.directionOrientee ?? 'Non définie'}</dd></div>
                <div><dt className="text-muted-foreground">Observations DG</dt><dd>{row.dgDecisionRecord?.notes ?? 'Aucune observation'}</dd></div>
              </dl>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Workflow OMA</h2>
              <ol className="space-y-2 text-sm">
                {row.phases.sort((first, second) => first.order - second.order).map((phase) => (
                  <li key={phase.id} className="grid gap-2 rounded-md bg-background px-3 py-2 sm:grid-cols-[1fr_auto]">
                    <div>
                      <p className="font-medium">{phase.order}. {phase.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Début : {formatDate(phase.startedAt)} · Fin : {formatDate(phase.completedAt)} · Échéance : {formatDate(phase.dueAt)}
                      </p>
                    </div>
                    <OmaPhaseBadge status={phase.status} />
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Suivi</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div><dt className="text-muted-foreground">Documents liés</dt><dd className="font-medium">{row.documents.length}</dd></div>
                <div><dt className="text-muted-foreground">Réunions liées</dt><dd className="font-medium">{row.meetings.length}</dd></div>
                <div><dt className="text-muted-foreground">Certificat</dt><dd>{row.certificate ? `${row.certificate.certificateNumber} · ${row.certificate.status}` : 'Aucun certificat'}</dd></div>
              </dl>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function DossiersPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState(() => getNavigationSearch(location.state));
  const [status, setStatus] = useState<AidnDossierStatus | ''>('');
  const [phase, setPhase] = useState<AidnOmaPhaseKey | ''>('');
  const [deadline, setDeadline] = useState<DeadlineStatus | ''>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRow] = useState<DossierRow | null>(null);

  const dossiersQuery = useDossiers();
  const demandesQuery = useDemandes();
  const courriersQuery = useCourriers();
  const decisionsQuery = useDgDecisionRecords();
  const documentsQuery = useAidnDocuments();
  const meetingsQuery = useAidnMeetings();
  const certificatesQuery = useAidnCertificates();
  const phasesQuery = useAidnOmaPhases();

  const rows = useMemo<DossierRow[]>(() => {
    const demandesById = new Map((demandesQuery.data ?? []).map((demande) => [demande.id, demande]));
    const courriersByDemande = new Map((courriersQuery.data ?? []).map((courrier) => [courrier.demandeId, courrier]));
    const decisionsByDemande = new Map((decisionsQuery.data ?? []).map((record) => [record.demandeId, record]));
    const documents = documentsQuery.data ?? [];
    const meetings = meetingsQuery.data ?? [];
    const certificates = certificatesQuery.data ?? [];
    const phases = phasesQuery.data ?? [];

    return (dossiersQuery.data ?? []).map((dossier) => ({
      ...dossier,
      demande: demandesById.get(dossier.demandeId),
      courrier: courriersByDemande.get(dossier.demandeId),
      dgDecisionRecord: decisionsByDemande.get(dossier.demandeId),
      documents: documents.filter((document) => document.dossierId === dossier.id || document.demandeId === dossier.demandeId),
      meetings: meetings.filter((meeting) => meeting.dossierId === dossier.id),
      certificate: certificates.find((certificate) => certificate.dossierId === dossier.id),
      phases: phases.filter((item) => item.dossierId === dossier.id),
    }));
  }, [certificatesQuery.data, courriersQuery.data, decisionsQuery.data, demandesQuery.data, documentsQuery.data, dossiersQuery.data, meetingsQuery.data, phasesQuery.data]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch = normalizedSearch
        ? [
            row.reference,
            row.demande?.reference ?? '',
            row.demande?.postulantName ?? '',
            row.demande?.organizationName ?? '',
            row.assignedAgent,
          ].some((value) => value.toLowerCase().includes(normalizedSearch))
        : true;
      const matchesStatus = status ? row.globalStatus === status : true;
      const matchesPhase = phase ? row.currentPhase === phase : true;
      const matchesDeadline = deadline ? row.deadlineStatus === deadline : true;
      return matchesSearch && matchesStatus && matchesPhase && matchesDeadline;
    });
  }, [deadline, phase, rows, search, status]);

  const activeFilters = useMemo((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    if (status) filters.push({ id: 'status', label: `Statut : ${dossierStatusLabels[status]}`, onRemove: () => setStatus('') });
    if (phase) filters.push({ id: 'phase', label: `Phase OMA : ${phaseLabels[phase]}`, onRemove: () => setPhase('') });
    if (deadline) filters.push({ id: 'deadline', label: `Délai : ${deadlineLabels[deadline]}`, onRemove: () => setDeadline('') });
    return filters;
  }, [deadline, phase, status]);

  const kpis = useMemo(
    () => ({
      open: rows.length,
      active: rows.filter((row) => ['open', 'in_progress', 'waiting_postulant', 'late'].includes(row.globalStatus)).length,
      blocked: rows.filter((row) => row.globalStatus === 'waiting_postulant' || row.deadlineStatus === 'late').length,
      issuedCertificates: rows.filter((row) => row.certificate?.status === 'collected' || Boolean(row.certificate?.collectedAt)).length,
    }),
    [rows],
  );

  const isLoading = dossiersQuery.isLoading || demandesQuery.isLoading || courriersQuery.isLoading || decisionsQuery.isLoading || documentsQuery.isLoading || meetingsQuery.isLoading || certificatesQuery.isLoading || phasesQuery.isLoading;
  const error = dossiersQuery.error ?? demandesQuery.error ?? courriersQuery.error ?? decisionsQuery.error ?? documentsQuery.error ?? meetingsQuery.error ?? certificatesQuery.error ?? phasesQuery.error;
  const hasActiveFilters = Boolean(search || status || phase || deadline);
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
    void courriersQuery.refetch();
    void decisionsQuery.refetch();
    void documentsQuery.refetch();
    void meetingsQuery.refetch();
    void certificatesQuery.refetch();
    void phasesQuery.refetch();
  }, [certificatesQuery, courriersQuery, decisionsQuery, demandesQuery, documentsQuery, dossiersQuery, meetingsQuery, phasesQuery]);

  const handleClearAll = () => {
    setSearch('');
    setStatus('');
    setPhase('');
    setDeadline('');
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleViewDossier = useCallback((row: DossierRow) => {
    navigate(`/dossiers/${row.id}`);
  }, [navigate]);

  const handleViewDemande = useCallback((row: DossierRow) => {
    if (!row.demande) return;
    navigate('/demandes', { state: { aidnSearch: row.demande.reference } });
  }, [navigate]);

  const handleViewWorkflow = useCallback((row: DossierRow) => {
    navigate('/workflow-oma', { state: { aidnSearch: row.reference } });
  }, [navigate]);

  const columns = useMemo(
    () => buildColumns(handleViewDossier, handleViewDemande, handleViewWorkflow),
    [handleViewDemande, handleViewDossier, handleViewWorkflow],
  );

  return (
    <ManagementPageShell
      className="page-container"
      header={
        <ManagementHeader
          title="Dossiers DN"
          subtitle="Référentiel des dossiers officiellement ouverts après orientation favorable vers la Direction de la Navigabilité."
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
            <KpiCard title="Dossiers DN ouverts" value={kpis.open} subtitle="Dossiers existants dans le référentiel" />
            <KpiCard title="Dossiers actifs" value={kpis.active} subtitle="En instruction ou attente postulant" />
            <KpiCard title="Dossiers bloqués" value={kpis.blocked} subtitle="Retards ou attente d’éléments" />
            <KpiCard title="Certificats délivrés" value={kpis.issuedCertificates} subtitle="Certificats liés aux dossiers" />
          </div>
          <ManagementToolbar
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder="Rechercher dossier, demande, postulant, organisme, agent..."
            filterCount={activeFilters.length}
            onFilterToggle={() => setIsFilterOpen((open) => !open)}
            isFilterOpen={isFilterOpen}
            onRefresh={refetchAll}
            isRefreshing={dossiersQuery.isFetching || demandesQuery.isFetching || courriersQuery.isFetching || decisionsQuery.isFetching || documentsQuery.isFetching || meetingsQuery.isFetching || certificatesQuery.isFetching || phasesQuery.isFetching}
          />
        </div>
      }
      filterPanel={
        <ManagementFilterPanel isOpen={isFilterOpen} activeFilters={activeFilters} onClear={handleClearAll}>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-dossier-status">Statut</label>
            <Select value={status || 'all'} onValueChange={(value) => setStatus(isDossierStatus(value) ? value : '')}>
              <SelectTrigger id="filter-dossier-status" className="h-9 w-52"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {AIDN_DOSSIER_STATUSES.map((item) => <SelectItem key={item} value={item}>{dossierStatusLabels[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-oma-phase">Phase OMA</label>
            <Select value={phase || 'all'} onValueChange={(value) => setPhase(isOmaPhaseKey(value) ? value : '')}>
              <SelectTrigger id="filter-oma-phase" className="h-9 w-56"><SelectValue placeholder="Toutes les phases" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les phases</SelectItem>
                {AIDN_OMA_PHASE_KEYS.map((item) => <SelectItem key={item} value={item}>{phaseLabels[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-deadline">Délai</label>
            <Select value={deadline || 'all'} onValueChange={(value) => setDeadline(isDeadlineStatus(value) ? value : '')}>
              <SelectTrigger id="filter-deadline" className="h-9 w-44"><SelectValue placeholder="Tous les délais" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les délais</SelectItem>
                <SelectItem value="on_track">{deadlineLabels.on_track}</SelectItem>
                <SelectItem value="at_risk">{deadlineLabels.at_risk}</SelectItem>
                <SelectItem value="late">{deadlineLabels.late}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ManagementFilterPanel>
      }
      table={
        showNoResults ? (
          <NoResultsState
            message="Aucun dossier DN ne correspond aux filtres"
            description="Aucun dossier DN mock ne combine ces critères. Effacez les filtres ou recherchez une référence, un postulant, un organisme ou un agent DN."
            onClear={handleClearAll}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            error={error}
            emptyMessage="Aucun dossier DN trouvé."
            onRetry={refetchAll}
            onRowClick={handleViewDossier}
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
            Cette page n’affiche que les dossiers DN réellement existants. Une demande orientée vers la DN peut rester visible dans /demandes sans apparaître ici tant que le dossier n’est pas ouvert.
          </p>
        </div>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <Workflow className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Le détail du dossier regroupe le workflow OMA, les documents, les réunions et le certificat liés au dossier.</p>
        </div>
      </div>
      <DossierDetailsDialog row={selectedRow} open={Boolean(selectedRow)} onClose={() => undefined} />
    </ManagementPageShell>
  );
}
