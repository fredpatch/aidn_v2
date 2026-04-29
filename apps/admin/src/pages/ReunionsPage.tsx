import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarClock, FileText, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AIDN_OMA_PHASE_KEYS,
  AidnStatusBadge,
  OmaPhaseBadge,
  markMeetingReportAvailable,
  markMeetingScheduled,
  useAidnDocuments,
  useAidnMeetings,
  useAidnOmaPhases,
  useDemandes,
  useDossiers,
  type AidnDemande,
  type AidnDocument,
  type AidnDossier,
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
import { useAppToast } from '@/hooks/useAppToast';

type MeetingOutcome = AidnMeeting['outcome'];
type ReportFilter = 'attached' | 'missing';

type MeetingRow = AidnMeeting & {
  dossier?: AidnDossier;
  demande?: AidnDemande;
  phase?: AidnOmaPhase;
  reportDocument?: AidnDocument;
  dossierDocuments: AidnDocument[];
};

const helper = createColumnHelper<MeetingRow>();
const pageSize = 8;

const outcomeLabels: Record<MeetingOutcome, string> = {
  planned: 'Planifiée',
  held: 'Tenue',
  postponed: 'Reportée',
  cancelled: 'Annulée',
};

const outcomeClassNames: Record<MeetingOutcome, string> = {
  planned: 'border-primary/20 bg-primary/10 text-primary',
  held: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  postponed: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  cancelled: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
};

const phaseLabels: Record<AidnOmaPhaseKey, string> = {
  preliminary: 'Phase préliminaire',
  formal_application: 'Demande formelle',
  document_evaluation: 'Évaluation documents',
  onsite_demonstration: 'Inspection sur site',
  delivery: 'Délivrance',
};

function formatDateTime(value?: string): string {
  if (!value) return 'Non renseigné';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function isMeetingOutcome(value: string | null): value is MeetingOutcome {
  return value === 'planned' || value === 'held' || value === 'postponed' || value === 'cancelled';
}

function isOmaPhaseKey(value: string | null): value is AidnOmaPhaseKey {
  return AIDN_OMA_PHASE_KEYS.includes(value as AidnOmaPhaseKey);
}

function isReportFilter(value: string | null): value is ReportFilter {
  return value === 'attached' || value === 'missing';
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

function OutcomeBadge({ outcome }: { outcome: MeetingOutcome }): React.JSX.Element {
  return (
    <Badge variant="outline" className={outcomeClassNames[outcome]}>
      {outcomeLabels[outcome]}
    </Badge>
  );
}

function YesNoBadge({ yes, yesLabel, noLabel }: { yes: boolean; yesLabel: string; noLabel: string }): React.JSX.Element {
  return (
    <Badge variant="outline" className={yes ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'}>
      {yes ? yesLabel : noLabel}
    </Badge>
  );
}

function buildColumns(
  onView: (row: MeetingRow) => void,
  onViewDossier: (row: MeetingRow) => void,
  onViewDocuments: (row: MeetingRow) => void,
  onMarkScheduled: (row: MeetingRow) => void,
  onMarkReportAvailable: (row: MeetingRow) => void,
): ColumnDef<MeetingRow>[] {
  return [
    helper.accessor('title', {
      header: 'Objet',
      cell: (info) => (
        <div className="min-w-0">
          <p className="truncate font-semibold">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground">{info.row.original.id}</p>
        </div>
      ),
    }),
    helper.display({
      id: 'dossier',
      header: 'Dossier DN',
      cell: ({ row }) => <span className="font-medium">{row.original.dossier?.reference ?? 'Non lié'}</span>,
    }),
    helper.display({
      id: 'organisme',
      header: 'Organisme',
      cell: ({ row }) => <span>{row.original.demande?.organizationName ?? 'Non renseigné'}</span>,
    }),
    helper.accessor('phaseKey', {
      header: 'Phase OMA',
      cell: (info) => {
        const phaseKey = info.getValue();
        if (!phaseKey) return <span className="text-muted-foreground">Non liée</span>;
        return info.row.original.phase ? <OmaPhaseBadge status={info.row.original.phase.status} /> : <Badge variant="secondary">{phaseLabels[phaseKey]}</Badge>;
      },
    }),
    helper.accessor('scheduledAt', {
      header: 'Date réunion',
      cell: (info) => <span className="text-muted-foreground">{formatDateTime(info.getValue())}</span>,
    }),
    helper.accessor('participants', {
      header: 'Participants',
      meta: { hideOnMobile: true },
      cell: (info) => <span className="text-muted-foreground">{info.getValue().join(', ')}</span>,
    }),
    helper.accessor('convocationSentAt', {
      header: 'Convocation',
      cell: (info) => <YesNoBadge yes={Boolean(info.getValue())} yesLabel="Envoyée" noLabel="Non envoyée" />,
    }),
    helper.display({
      id: 'report',
      header: 'Compte rendu',
      cell: ({ row }) => <YesNoBadge yes={Boolean(row.original.reportDocument)} yesLabel="Joint" noLabel="Non joint" />,
    }),
    helper.accessor('outcome', {
      header: 'Statut',
      cell: (info) => <OutcomeBadge outcome={info.getValue()} />,
    }),
    helper.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const actions: RowAction<MeetingRow>[] = [
          { label: 'Voir détails', onClick: onView },
          ...(!row.original.convocationSentAt && row.original.outcome !== 'cancelled' ? [{ label: 'Marquer reunion programmee dans la demo', onClick: onMarkScheduled, separated: true }] satisfies RowAction<MeetingRow>[] : []),
          ...(!row.original.reportDocument ? [{ label: 'Marquer compte rendu disponible dans la demo', onClick: onMarkReportAvailable }] satisfies RowAction<MeetingRow>[] : []),
          ...(row.original.dossier ? [{ label: 'Voir dossier DN', onClick: onViewDossier }] satisfies RowAction<MeetingRow>[] : []),
          { label: 'Voir documents liés', onClick: onViewDocuments, separated: true },
        ];

        return <DataTableRowActions row={row.original} actions={actions} triggerLabel={`Actions pour ${row.original.title}`} />;
      },
    }),
  ] as ColumnDef<MeetingRow>[];
}

function MeetingDetailsDialog({
  row,
  open,
  onClose,
  onMarkScheduled,
  onMarkReportAvailable,
}: {
  row: MeetingRow | null;
  open: boolean;
  onClose: () => void;
  onMarkScheduled: (row: MeetingRow) => void;
  onMarkReportAvailable: (row: MeetingRow) => void;
}): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : onClose())}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row?.title ?? 'Réunion'}</DialogTitle>
          <DialogDescription>
            Lecture seule de la réunion, de la convocation et du rattachement OMA.
          </DialogDescription>
        </DialogHeader>

        {row ? (
          <div className="grid gap-4">
            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Informations réunion</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Objet</dt><dd className="font-medium">{row.title}</dd></div>
                <div><dt className="text-muted-foreground">Statut</dt><dd><OutcomeBadge outcome={row.outcome} /></dd></div>
                <div><dt className="text-muted-foreground">Date / heure</dt><dd>{formatDateTime(row.scheduledAt)}</dd></div>
                <div><dt className="text-muted-foreground">Lieu / mode</dt><dd>{row.location}</dd></div>
                <div className="sm:col-span-2"><dt className="text-muted-foreground">Participants</dt><dd>{row.participants.join(', ')}</dd></div>
              </dl>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Rattachement</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Dossier DN</dt><dd className="font-medium">{row.dossier?.reference ?? 'Non lié'}</dd></div>
                <div><dt className="text-muted-foreground">Statut dossier</dt><dd>{row.dossier ? <AidnStatusBadge status={row.dossier.globalStatus} /> : 'Non lié'}</dd></div>
                <div><dt className="text-muted-foreground">Demande source</dt><dd>{row.demande?.reference ?? 'Non liée'}</dd></div>
                <div><dt className="text-muted-foreground">Phase OMA</dt><dd>{row.phase ? <OmaPhaseBadge status={row.phase.status} /> : row.phaseKey ? phaseLabels[row.phaseKey] : 'Non liée'}</dd></div>
                <div><dt className="text-muted-foreground">Organisme</dt><dd>{row.demande?.organizationName ?? 'Non renseigné'}</dd></div>
                <div><dt className="text-muted-foreground">Postulant</dt><dd>{row.demande?.postulantName ?? 'Non renseigné'}</dd></div>
              </dl>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Convocation</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">État</dt><dd><YesNoBadge yes={Boolean(row.convocationSentAt)} yesLabel="Envoyée" noLabel="Non envoyée" /></dd></div>
                <div><dt className="text-muted-foreground">Date envoi</dt><dd>{formatDateTime(row.convocationSentAt)}</dd></div>
                <div><dt className="text-muted-foreground">Canal</dt><dd>{row.convocationChannel ?? 'Non renseigné'}</dd></div>
              </dl>
              {(!row.convocationSentAt && row.outcome !== 'cancelled') ? (
                <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => onMarkScheduled(row)}>
                  Marquer reunion programmee dans la demo
                </Button>
              ) : null}
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Compte rendu</h2>
              {row.reportDocument ? (
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">Document</dt><dd className="font-medium">{row.reportDocument.title}</dd></div>
                  <div><dt className="text-muted-foreground">Statut</dt><dd>{row.reportDocument.status}</dd></div>
                  <div><dt className="text-muted-foreground">Mis à jour</dt><dd>{formatDateTime(row.reportDocument.updatedAt)}</dd></div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun compte rendu joint à cette réunion.</p>
              )}
              {!row.reportDocument ? (
                <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => onMarkReportAvailable(row)}>
                  Marquer compte rendu disponible dans la demo
                </Button>
              ) : null}
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function ReunionsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const [search, setSearch] = useState('');
  const [outcome, setOutcome] = useState<MeetingOutcome | ''>('');
  const [phase, setPhase] = useState<AidnOmaPhaseKey | ''>('');
  const [report, setReport] = useState<ReportFilter | ''>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRow, setSelectedRow] = useState<MeetingRow | null>(null);

  const meetingsQuery = useAidnMeetings();
  const dossiersQuery = useDossiers();
  const demandesQuery = useDemandes();
  const phasesQuery = useAidnOmaPhases();
  const documentsQuery = useAidnDocuments();

  const rows = useMemo<MeetingRow[]>(() => {
    const dossiersById = new Map((dossiersQuery.data ?? []).map((dossier) => [dossier.id, dossier]));
    const demandesById = new Map((demandesQuery.data ?? []).map((demande) => [demande.id, demande]));
    const documentsById = new Map((documentsQuery.data ?? []).map((document) => [document.id, document]));
    const phasesByDossierAndKey = new Map((phasesQuery.data ?? []).map((phaseItem) => [`${phaseItem.dossierId}:${phaseItem.key}`, phaseItem]));
    const documents = documentsQuery.data ?? [];

    return (meetingsQuery.data ?? []).map((meeting) => {
      const dossier = dossiersById.get(meeting.dossierId);
      const demande = dossier ? demandesById.get(dossier.demandeId) : undefined;
      const linkedPhase = meeting.phaseKey ? phasesByDossierAndKey.get(`${meeting.dossierId}:${meeting.phaseKey}`) : undefined;

      return {
        ...meeting,
        dossier,
        demande,
        phase: linkedPhase,
        reportDocument: meeting.reportDocumentId ? documentsById.get(meeting.reportDocumentId) : undefined,
        dossierDocuments: documents.filter((document) => document.dossierId === meeting.dossierId),
      };
    });
  }, [demandesQuery.data, documentsQuery.data, dossiersQuery.data, meetingsQuery.data, phasesQuery.data]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch = normalizedSearch
        ? [
            row.title,
            row.dossier?.reference ?? '',
            row.demande?.reference ?? '',
            row.demande?.organizationName ?? '',
            row.demande?.postulantName ?? '',
            row.participants.join(' '),
          ].some((value) => value.toLowerCase().includes(normalizedSearch))
        : true;
      const matchesOutcome = outcome ? row.outcome === outcome : true;
      const matchesPhase = phase ? row.phaseKey === phase : true;
      const matchesReport = report ? (report === 'attached' ? Boolean(row.reportDocument) : !row.reportDocument) : true;
      return matchesSearch && matchesOutcome && matchesPhase && matchesReport;
    });
  }, [outcome, phase, report, rows, search]);

  const activeFilters = useMemo((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    if (outcome) filters.push({ id: 'outcome', label: `Statut : ${outcomeLabels[outcome]}`, onRemove: () => setOutcome('') });
    if (phase) filters.push({ id: 'phase', label: `Phase OMA : ${phaseLabels[phase]}`, onRemove: () => setPhase('') });
    if (report) filters.push({ id: 'report', label: `Compte rendu : ${report === 'attached' ? 'joint' : 'non joint'}`, onRemove: () => setReport('') });
    return filters;
  }, [outcome, phase, report]);

  const now = Date.now();
  const kpis = useMemo(
    () => ({
      planned: rows.filter((row) => row.outcome === 'planned').length,
      convocations: rows.filter((row) => Boolean(row.convocationSentAt)).length,
      reports: rows.filter((row) => Boolean(row.reportDocument)).length,
      upcoming: rows.filter((row) => new Date(row.scheduledAt).getTime() >= now).length,
    }),
    [now, rows],
  );

  const isLoading = meetingsQuery.isLoading || dossiersQuery.isLoading || demandesQuery.isLoading || phasesQuery.isLoading || documentsQuery.isLoading;
  const error = meetingsQuery.error ?? dossiersQuery.error ?? demandesQuery.error ?? phasesQuery.error ?? documentsQuery.error;
  const hasActiveFilters = Boolean(search || outcome || phase || report);
  const showNoResults = !isLoading && !error && hasActiveFilters && filteredRows.length === 0;

  const refetchAll = useCallback(() => {
    void meetingsQuery.refetch();
    void dossiersQuery.refetch();
    void demandesQuery.refetch();
    void phasesQuery.refetch();
    void documentsQuery.refetch();
  }, [demandesQuery, documentsQuery, dossiersQuery, meetingsQuery, phasesQuery]);

  const refreshAidnQueries = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['aidn'] });
  };

  const handleClearAll = () => {
    setSearch('');
    setOutcome('');
    setPhase('');
    setReport('');
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleViewDossier = useCallback((row: MeetingRow) => {
    if (!row.dossier) return;
    setSelectedRow(null);
    navigate(`/dossiers/${row.dossier.id}`);
  }, [navigate]);

  const handleViewDocuments = useCallback((row: MeetingRow) => {
    setSelectedRow(null);
    navigate('/documents', { state: { aidnSearch: row.dossier?.reference ?? row.id } });
  }, [navigate]);

  const handleMarkScheduled = useCallback((row: MeetingRow) => {
    markMeetingScheduled(row.id);
    refreshAidnQueries();
    setSelectedRow(null);
    toast.success('Demo mise a jour localement');
  }, [queryClient, toast]);

  const handleMarkReportAvailable = useCallback((row: MeetingRow) => {
    markMeetingReportAvailable(row.id);
    refreshAidnQueries();
    setSelectedRow(null);
    toast.success('Demo mise a jour localement');
  }, [queryClient, toast]);

  const columns = useMemo(
    () => buildColumns(setSelectedRow, handleViewDossier, handleViewDocuments, handleMarkScheduled, handleMarkReportAvailable),
    [handleMarkReportAvailable, handleMarkScheduled, handleViewDossier, handleViewDocuments],
  );

  return (
    <ManagementPageShell
      className="page-container"
      header={
        <ManagementHeader
          title="Réunions / Convocations"
          subtitle="Suivi mock des réunions et convocations liées aux dossiers OMA."
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
            <KpiCard title="Réunions planifiées" value={kpis.planned} subtitle="Réunions encore à tenir" />
            <KpiCard title="Convocations envoyées" value={kpis.convocations} subtitle="Envois mock tracés" />
            <KpiCard title="Comptes rendus joints" value={kpis.reports} subtitle="Documents de suivi associés" />
            <KpiCard title="Réunions à venir" value={kpis.upcoming} subtitle="À partir de la date courante" />
          </div>
          <ManagementToolbar
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder="Rechercher réunion, dossier, demande, organisme, participant..."
            filterCount={activeFilters.length}
            onFilterToggle={() => setIsFilterOpen((open) => !open)}
            isFilterOpen={isFilterOpen}
            onRefresh={refetchAll}
            isRefreshing={meetingsQuery.isFetching || dossiersQuery.isFetching || demandesQuery.isFetching || phasesQuery.isFetching || documentsQuery.isFetching}
          />
        </div>
      }
      filterPanel={
        <ManagementFilterPanel isOpen={isFilterOpen} activeFilters={activeFilters} onClear={handleClearAll}>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-meeting-outcome">Statut</label>
            <Select value={outcome || 'all'} onValueChange={(value) => setOutcome(isMeetingOutcome(value) ? value : '')}>
              <SelectTrigger id="filter-meeting-outcome" className="h-9 w-44"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="planned">{outcomeLabels.planned}</SelectItem>
                <SelectItem value="held">{outcomeLabels.held}</SelectItem>
                <SelectItem value="postponed">{outcomeLabels.postponed}</SelectItem>
                <SelectItem value="cancelled">{outcomeLabels.cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-meeting-phase">Phase OMA</label>
            <Select value={phase || 'all'} onValueChange={(value) => setPhase(isOmaPhaseKey(value) ? value : '')}>
              <SelectTrigger id="filter-meeting-phase" className="h-9 w-56"><SelectValue placeholder="Toutes les phases" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les phases</SelectItem>
                {AIDN_OMA_PHASE_KEYS.map((item) => <SelectItem key={item} value={item}>{phaseLabels[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-meeting-report">Compte rendu</label>
            <Select value={report || 'all'} onValueChange={(value) => setReport(isReportFilter(value) ? value : '')}>
              <SelectTrigger id="filter-meeting-report" className="h-9 w-44"><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="attached">Joint</SelectItem>
                <SelectItem value="missing">Non joint</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ManagementFilterPanel>
      }
      table={
        showNoResults ? (
          <NoResultsState
            message="Aucune réunion ne correspond aux filtres"
            description="Aucune réunion mock ne combine ces critères. Effacez les filtres ou recherchez un dossier DN, une demande, un organisme ou un participant."
            onClear={handleClearAll}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            error={error}
            emptyMessage="Aucune réunion trouvée."
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
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Mode demonstration : les reunions sont simulees localement. Aucun email Outlook n'est envoye.
          </p>
        </div>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <FolderOpen className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Chaque réunion affichée est un record existant lié à un dossier DN du référentiel mock.</p>
        </div>
      </div>
      <MeetingDetailsDialog
        row={selectedRow}
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        onMarkScheduled={handleMarkScheduled}
        onMarkReportAvailable={handleMarkReportAvailable}
      />
    </ManagementPageShell>
  );
}
