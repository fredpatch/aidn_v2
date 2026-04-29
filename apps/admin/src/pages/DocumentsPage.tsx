import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileArchive, FileText, FolderOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AIDN_DOCUMENT_SOURCES,
  AIDN_DOCUMENT_STATUSES,
  AIDN_OMA_PHASE_KEYS,
  AidnStatusBadge,
  OmaPhaseBadge,
  useAidnDocuments,
  useAidnOmaPhases,
  useCourriers,
  useDemandes,
  useDossiers,
  type AidnCourrier,
  type AidnDemande,
  type AidnDocument,
  type AidnDocumentSource,
  type AidnDocumentStatus,
  type AidnDossier,
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

type DocumentRow = AidnDocument & {
  demande?: AidnDemande;
  courrier?: AidnCourrier;
  dossier?: AidnDossier;
  phase?: AidnOmaPhase;
};

const helper = createColumnHelper<DocumentRow>();
const pageSize = 8;

const documentStatusLabels: Record<AidnDocumentStatus, string> = {
  missing: 'Manquant',
  received: 'Reçu',
  to_review: 'À vérifier',
  validated: 'Validé',
  rejected: 'Rejeté',
};

const documentSourceLabels: Record<AidnDocumentSource, string> = {
  postulant: 'Postulant',
  dg: 'DG',
  dn: 'DN',
  s5: 'S5',
  r3: 'R3',
};

const phaseLabels: Record<AidnOmaPhaseKey, string> = {
  preliminary: 'Phase préliminaire',
  formal_application: 'Demande formelle',
  document_evaluation: 'Évaluation documents',
  onsite_demonstration: 'Inspection sur site',
  delivery: 'Délivrance',
};

const statusClassNames: Record<AidnDocumentStatus, string> = {
  missing: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  received: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
  to_review: 'border-primary/20 bg-primary/10 text-primary',
  validated: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  rejected: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
};

function formatDate(value?: string): string {
  if (!value) return 'Non renseigné';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}

function isDocumentStatus(value: string | null): value is AidnDocumentStatus {
  return AIDN_DOCUMENT_STATUSES.includes(value as AidnDocumentStatus);
}

function isDocumentSource(value: string | null): value is AidnDocumentSource {
  return AIDN_DOCUMENT_SOURCES.includes(value as AidnDocumentSource);
}

function isOmaPhaseKey(value: string | null): value is AidnOmaPhaseKey {
  return AIDN_OMA_PHASE_KEYS.includes(value as AidnOmaPhaseKey);
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

function DocumentStatusBadge({ status }: { status: AidnDocumentStatus }): React.JSX.Element {
  return (
    <Badge variant="outline" className={statusClassNames[status]}>
      {documentStatusLabels[status]}
    </Badge>
  );
}

function SourceBadge({ source }: { source: AidnDocumentSource }): React.JSX.Element {
  return <Badge variant="secondary">{documentSourceLabels[source]}</Badge>;
}

function getNavigationSearch(state: unknown): string {
  return typeof state === 'object' && state !== null && 'aidnSearch' in state && typeof state.aidnSearch === 'string' ? state.aidnSearch : '';
}

function buildColumns(onView: (row: DocumentRow) => void, onViewDemande: (row: DocumentRow) => void, onViewDossier: (row: DocumentRow) => void, onViewPhase: (row: DocumentRow) => void): ColumnDef<DocumentRow>[] {
  return [
    helper.accessor('title', {
      header: 'Document',
      cell: (info) => (
        <div className="min-w-0">
          <p className="truncate font-semibold">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground">{info.row.original.id}</p>
        </div>
      ),
    }),
    helper.accessor('source', {
      header: 'Source',
      cell: (info) => <SourceBadge source={info.getValue()} />,
    }),
    helper.accessor('status', {
      header: 'Statut',
      cell: (info) => <DocumentStatusBadge status={info.getValue()} />,
    }),
    helper.display({
      id: 'demande',
      header: 'Demande',
      meta: { hideOnMobile: true },
      cell: ({ row }) => <span className="font-medium">{row.original.demande?.reference ?? 'Non liée'}</span>,
    }),
    helper.display({
      id: 'courrier',
      header: 'Courrier',
      meta: { hideOnMobile: true },
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.courrier?.reference ?? 'Non lié'}</span>,
    }),
    helper.display({
      id: 'dossier',
      header: 'Dossier DN',
      cell: ({ row }) => <span className="font-medium">{row.original.dossier?.reference ?? 'Non lié'}</span>,
    }),
    helper.accessor('phaseKey', {
      header: 'Phase OMA',
      cell: (info) => {
        const phaseKey = info.getValue();
        if (!phaseKey) return <span className="text-muted-foreground">Non liée</span>;
        return info.row.original.phase ? <OmaPhaseBadge status={info.row.original.phase.status} /> : <Badge variant="secondary">{phaseLabels[phaseKey]}</Badge>;
      },
    }),
    helper.accessor('receivedAt', {
      header: 'Date dépôt',
      meta: { hideOnMobile: true },
      cell: (info) => <span className="text-muted-foreground">{formatDate(info.getValue())}</span>,
    }),
    helper.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const actions: RowAction<DocumentRow>[] = [
          { label: 'Voir détails', onClick: onView },
          ...(row.original.demande ? [{ label: 'Voir demande', onClick: onViewDemande }] satisfies RowAction<DocumentRow>[] : []),
          ...(row.original.dossier ? [{ label: 'Voir dossier DN', onClick: onViewDossier }] satisfies RowAction<DocumentRow>[] : []),
          ...(row.original.phaseKey && row.original.dossier ? [{ label: 'Voir phase OMA', onClick: onViewPhase, separated: true }] satisfies RowAction<DocumentRow>[] : []),
        ];

        return <DataTableRowActions row={row.original} actions={actions} triggerLabel={`Actions pour ${row.original.title}`} />;
      },
    }),
  ] as ColumnDef<DocumentRow>[];
}

function DocumentDetailsDialog({ row, open, onClose }: { row: DocumentRow | null; open: boolean; onClose: () => void }): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : onClose())}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row?.title ?? 'Document'}</DialogTitle>
          <DialogDescription>
            Lecture seule des métadonnées et rattachements du document.
          </DialogDescription>
        </DialogHeader>

        {row ? (
          <div className="grid gap-4">
            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Informations document</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Titre</dt><dd className="font-medium">{row.title}</dd></div>
                <div><dt className="text-muted-foreground">Référence</dt><dd>{row.id}</dd></div>
                <div><dt className="text-muted-foreground">Source</dt><dd><SourceBadge source={row.source} /></dd></div>
                <div><dt className="text-muted-foreground">Statut</dt><dd><DocumentStatusBadge status={row.status} /></dd></div>
                <div><dt className="text-muted-foreground">Nom fichier / URL mock</dt><dd>Non renseigné</dd></div>
                <div><dt className="text-muted-foreground">Date dépôt</dt><dd>{formatDate(row.receivedAt)}</dd></div>
                <div><dt className="text-muted-foreground">Mis à jour</dt><dd>{formatDate(row.updatedAt)}</dd></div>
                <div><dt className="text-muted-foreground">Déposé par</dt><dd>{documentSourceLabels[row.source]}</dd></div>
              </dl>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Rattachement</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Demande</dt><dd className="font-medium">{row.demande?.reference ?? 'Non liée'}</dd></div>
                <div><dt className="text-muted-foreground">Courrier</dt><dd>{row.courrier?.reference ?? 'Non lié'}</dd></div>
                <div><dt className="text-muted-foreground">Dossier DN</dt><dd>{row.dossier?.reference ?? 'Non lié'}</dd></div>
                <div><dt className="text-muted-foreground">Phase OMA</dt><dd>{row.phaseKey ? phaseLabels[row.phaseKey] : 'Non liée'}</dd></div>
              </dl>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Contexte</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Organisme</dt><dd>{row.demande?.organizationName ?? 'Non renseigné'}</dd></div>
                <div><dt className="text-muted-foreground">Postulant</dt><dd>{row.demande?.postulantName ?? 'Non renseigné'}</dd></div>
                <div><dt className="text-muted-foreground">Statut dossier</dt><dd>{row.dossier ? <AidnStatusBadge status={row.dossier.globalStatus} /> : 'Non lié'}</dd></div>
                <div><dt className="text-muted-foreground">Statut phase</dt><dd>{row.phase ? <OmaPhaseBadge status={row.phase.status} /> : 'Non liée'}</dd></div>
              </dl>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function DocumentsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState(() => getNavigationSearch(location.state));
  const [status, setStatus] = useState<AidnDocumentStatus | ''>('');
  const [source, setSource] = useState<AidnDocumentSource | ''>('');
  const [phase, setPhase] = useState<AidnOmaPhaseKey | ''>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRow, setSelectedRow] = useState<DocumentRow | null>(null);

  const documentsQuery = useAidnDocuments();
  const demandesQuery = useDemandes();
  const courriersQuery = useCourriers();
  const dossiersQuery = useDossiers();
  const phasesQuery = useAidnOmaPhases();

  const rows = useMemo<DocumentRow[]>(() => {
    const demandesById = new Map((demandesQuery.data ?? []).map((demande) => [demande.id, demande]));
    const dossiersById = new Map((dossiersQuery.data ?? []).map((dossier) => [dossier.id, dossier]));
    const courriersByDemande = new Map((courriersQuery.data ?? []).map((courrier) => [courrier.demandeId, courrier]));
    const phasesByDossierAndKey = new Map((phasesQuery.data ?? []).map((phaseItem) => [`${phaseItem.dossierId}:${phaseItem.key}`, phaseItem]));

    return (documentsQuery.data ?? []).map((document) => {
      const dossier = document.dossierId ? dossiersById.get(document.dossierId) : undefined;
      const demande = document.demandeId ? demandesById.get(document.demandeId) : dossier ? demandesById.get(dossier.demandeId) : undefined;
      const courrier = demande ? courriersByDemande.get(demande.id) : undefined;
      const phaseRecord = document.dossierId && document.phaseKey ? phasesByDossierAndKey.get(`${document.dossierId}:${document.phaseKey}`) : undefined;

      return {
        ...document,
        demande,
        courrier,
        dossier,
        phase: phaseRecord,
      };
    });
  }, [courriersQuery.data, demandesQuery.data, documentsQuery.data, dossiersQuery.data, phasesQuery.data]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch = normalizedSearch
        ? [
            row.title,
            row.id,
            row.demande?.reference ?? '',
            row.courrier?.reference ?? '',
            row.dossier?.reference ?? '',
            row.demande?.organizationName ?? '',
            documentSourceLabels[row.source],
          ].some((value) => value.toLowerCase().includes(normalizedSearch))
        : true;
      const matchesStatus = status ? row.status === status : true;
      const matchesSource = source ? row.source === source : true;
      const matchesPhase = phase ? row.phaseKey === phase : true;
      return matchesSearch && matchesStatus && matchesSource && matchesPhase;
    });
  }, [phase, rows, search, source, status]);

  const activeFilters = useMemo((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    if (status) filters.push({ id: 'status', label: `Statut : ${documentStatusLabels[status]}`, onRemove: () => setStatus('') });
    if (source) filters.push({ id: 'source', label: `Source : ${documentSourceLabels[source]}`, onRemove: () => setSource('') });
    if (phase) filters.push({ id: 'phase', label: `Phase OMA : ${phaseLabels[phase]}`, onRemove: () => setPhase('') });
    return filters;
  }, [phase, source, status]);

  const kpis = useMemo(
    () => ({
      total: rows.length,
      toReview: rows.filter((row) => row.status === 'to_review').length,
      missing: rows.filter((row) => row.status === 'missing').length,
      validated: rows.filter((row) => row.status === 'validated').length,
    }),
    [rows],
  );

  const isLoading = documentsQuery.isLoading || demandesQuery.isLoading || courriersQuery.isLoading || dossiersQuery.isLoading || phasesQuery.isLoading;
  const error = documentsQuery.error ?? demandesQuery.error ?? courriersQuery.error ?? dossiersQuery.error ?? phasesQuery.error;
  const hasActiveFilters = Boolean(search || status || source || phase);
  const showNoResults = !isLoading && !error && hasActiveFilters && filteredRows.length === 0;

  useEffect(() => {
    const nextSearch = getNavigationSearch(location.state);
    if (!nextSearch) return;
    setSearch(nextSearch);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [location.state]);

  const refetchAll = useCallback(() => {
    void documentsQuery.refetch();
    void demandesQuery.refetch();
    void courriersQuery.refetch();
    void dossiersQuery.refetch();
    void phasesQuery.refetch();
  }, [courriersQuery, demandesQuery, documentsQuery, dossiersQuery, phasesQuery]);

  const handleClearAll = () => {
    setSearch('');
    setStatus('');
    setSource('');
    setPhase('');
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleViewDemande = useCallback((row: DocumentRow) => {
    if (!row.demande) return;
    setSelectedRow(null);
    navigate('/demandes', { state: { aidnSearch: row.demande.reference } });
  }, [navigate]);

  const handleViewDossier = useCallback((row: DocumentRow) => {
    if (!row.dossier) return;
    setSelectedRow(null);
    navigate(`/dossiers/${row.dossier.id}`);
  }, [navigate]);

  const handleViewPhase = useCallback((row: DocumentRow) => {
    if (!row.dossier) return;
    setSelectedRow(null);
    navigate('/workflow-oma', { state: { aidnSearch: row.dossier.reference } });
  }, [navigate]);

  const columns = useMemo(
    () => buildColumns(setSelectedRow, handleViewDemande, handleViewDossier, handleViewPhase),
    [handleViewDemande, handleViewDossier, handleViewPhase],
  );

  return (
    <ManagementPageShell
      className="page-container"
      header={
        <ManagementHeader
          title="Documents"
          subtitle="Inventaire centralisé des pièces AIDN liées aux demandes, courriers, dossiers DN et phases OMA."
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
            <KpiCard title="Documents enregistrés" value={kpis.total} subtitle="Référentiel documentaire mock" />
            <KpiCard title="À vérifier" value={kpis.toReview} subtitle="Documents en attente de contrôle" />
            <KpiCard title="Manquants" value={kpis.missing} subtitle="Pièces attendues mais absentes" />
            <KpiCard title="Validés" value={kpis.validated} subtitle="Pièces acceptées par le circuit" />
          </div>
          <ManagementToolbar
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder="Rechercher document, demande, courrier, dossier, organisme..."
            filterCount={activeFilters.length}
            onFilterToggle={() => setIsFilterOpen((open) => !open)}
            isFilterOpen={isFilterOpen}
            onRefresh={refetchAll}
            isRefreshing={documentsQuery.isFetching || demandesQuery.isFetching || courriersQuery.isFetching || dossiersQuery.isFetching || phasesQuery.isFetching}
          />
        </div>
      }
      filterPanel={
        <ManagementFilterPanel isOpen={isFilterOpen} activeFilters={activeFilters} onClear={handleClearAll}>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-document-status">Statut</label>
            <Select value={status || 'all'} onValueChange={(value) => setStatus(isDocumentStatus(value) ? value : '')}>
              <SelectTrigger id="filter-document-status" className="h-9 w-44"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {AIDN_DOCUMENT_STATUSES.map((item) => <SelectItem key={item} value={item}>{documentStatusLabels[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-document-source">Source</label>
            <Select value={source || 'all'} onValueChange={(value) => setSource(isDocumentSource(value) ? value : '')}>
              <SelectTrigger id="filter-document-source" className="h-9 w-40"><SelectValue placeholder="Toutes les sources" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sources</SelectItem>
                {AIDN_DOCUMENT_SOURCES.map((item) => <SelectItem key={item} value={item}>{documentSourceLabels[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-document-phase">Phase OMA</label>
            <Select value={phase || 'all'} onValueChange={(value) => setPhase(isOmaPhaseKey(value) ? value : '')}>
              <SelectTrigger id="filter-document-phase" className="h-9 w-56"><SelectValue placeholder="Toutes les phases" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les phases</SelectItem>
                {AIDN_OMA_PHASE_KEYS.map((item) => <SelectItem key={item} value={item}>{phaseLabels[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </ManagementFilterPanel>
      }
      table={
        showNoResults ? (
          <NoResultsState
            message="Aucun document ne correspond aux filtres"
            description="Aucun document mock ne combine ces critères. Effacez les filtres ou recherchez un document, une demande, un courrier, un dossier DN ou un organisme."
            onClear={handleClearAll}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            error={error}
            emptyMessage="Aucun document trouvé."
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
          <FileArchive className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Les documents sont des enregistrements centralisés. Les pièces manquantes ne sont affichées que lorsqu’elles existent déjà comme records mock.
          </p>
        </div>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <FolderOpen className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Un document peut être lié à une demande, à un courrier retrouvé via la demande, à un dossier DN et à une phase OMA.</p>
        </div>
      </div>
      <DocumentDetailsDialog row={selectedRow} open={Boolean(selectedRow)} onClose={() => setSelectedRow(null)} />
    </ManagementPageShell>
  );
}
