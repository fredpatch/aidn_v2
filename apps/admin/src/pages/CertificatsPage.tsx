import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Award, FileText, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AIDN_CERTIFICATE_STATUSES,
  AIDN_DOSSIER_STATUSES,
  AidnStatusBadge,
  OmaPhaseBadge,
  advanceCertificateLifecycle,
  getNextCertificateLifecycleActionLabel,
  useAidnCertificates,
  useAidnDocuments,
  useAidnOmaPhases,
  useDemandes,
  useDossiers,
  type AidnCertificate,
  type AidnCertificateStatus,
  type AidnDemande,
  type AidnDocument,
  type AidnDossier,
  type AidnDossierStatus,
  type AidnOmaPhase,
} from '@/features/aidn';
import { DataTable, DataTablePagination, DataTableRowActions, createColumnHelper, type ColumnDef, type PaginationState, type RowAction, type SortingState } from '@/components/data-table';
import { ManagementFilterPanel, ManagementHeader, ManagementPageShell, ManagementToolbar, NoResultsState, type ActiveFilter } from '@/components/management';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppToast } from '@/hooks/useAppToast';

type CertificateType = AidnCertificate['certificateType'];

type CertificateRow = AidnCertificate & {
  dossier?: AidnDossier;
  demande?: AidnDemande;
  currentPhase?: AidnOmaPhase;
  linkedDocument?: AidnDocument;
  scannedDocument?: AidnDocument;
  dossierDocuments: AidnDocument[];
};

const helper = createColumnHelper<CertificateRow>();
const pageSize = 8;

const certificateStatusLabels: Record<AidnCertificateStatus, string> = {
  to_prepare: 'A preparer',
  printed: 'Imprime',
  signed_stamped: 'Signe/cachete',
  scanned_in_aidn: 'Scanne dans AIDN',
  ready_for_collection: 'Pret au retrait',
  collected: 'Remis au postulant',
  archived: 'Archive',
};

const certificateStatusClassNames: Record<AidnCertificateStatus, string> = {
  to_prepare: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
  printed: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200',
  signed_stamped: 'border-primary/20 bg-primary/10 text-primary',
  scanned_in_aidn: 'border-primary/20 bg-primary/10 text-primary',
  ready_for_collection: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  collected: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  archived: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
};

const certificateTypeLabels: Record<CertificateType, string> = {
  initial: 'Initial',
  renewal: 'Renouvellement',
  extension: 'Extension',
};

const dossierStatusLabels: Record<AidnDossierStatus, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  waiting_postulant: 'Attente postulant',
  late: 'En retard',
  certificate_ready: 'Certificat pret',
  closed: 'Cloture',
};

function formatDate(value?: string): string {
  if (!value) return 'Non renseigne';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}

function isCertificateStatus(value: string | null): value is AidnCertificateStatus {
  return AIDN_CERTIFICATE_STATUSES.includes(value as AidnCertificateStatus);
}

function isCertificateType(value: string | null): value is CertificateType {
  return value === 'initial' || value === 'renewal' || value === 'extension';
}

function isDossierStatus(value: string | null): value is AidnDossierStatus {
  return AIDN_DOSSIER_STATUSES.includes(value as AidnDossierStatus);
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

function CertificateStatusBadge({ status }: { status: AidnCertificateStatus }): React.JSX.Element {
  return (
    <Badge variant="outline" className={certificateStatusClassNames[status]}>
      {certificateStatusLabels[status]}
    </Badge>
  );
}

function buildColumns(
  onView: (row: CertificateRow) => void,
  onViewDossier: (row: CertificateRow) => void,
  onViewDocument: (row: CertificateRow) => void,
  onAdvanceLifecycle: (row: CertificateRow) => void,
): ColumnDef<CertificateRow>[] {
  return [
    helper.accessor('certificateNumber', {
      header: 'Numero',
      cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
    }),
    helper.accessor('certificateType', {
      header: 'Type',
      cell: (info) => <Badge variant="secondary">{certificateTypeLabels[info.getValue()]}</Badge>,
    }),
    helper.display({
      id: 'dossier',
      header: 'Dossier DN',
      cell: ({ row }) => <span className="font-medium">{row.original.dossier?.reference ?? 'Non lie'}</span>,
    }),
    helper.accessor('holderName', {
      header: 'Organisme',
      cell: (info) => <span>{info.getValue()}</span>,
    }),
    helper.accessor('status', {
      header: 'Statut certificat',
      cell: (info) => <CertificateStatusBadge status={info.getValue()} />,
    }),
    helper.accessor('printedAt', {
      header: 'Impression',
      meta: { hideOnMobile: true },
      cell: (info) => <span className="text-muted-foreground">{formatDate(info.getValue())}</span>,
    }),
    helper.display({
      id: 'signatureStamp',
      header: 'Signature/cachet',
      meta: { hideOnMobile: true },
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.signedAt ?? row.original.stampedAt)}</span>,
    }),
    helper.accessor('scannedAt', {
      header: 'Scan AIDN',
      meta: { hideOnMobile: true },
      cell: (info) => <span className="text-muted-foreground">{formatDate(info.getValue())}</span>,
    }),
    helper.display({
      id: 'collection',
      header: 'Retrait/remise',
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.collectedAt ?? row.original.readyForCollectionAt)}</span>,
    }),
    helper.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const nextActionLabel = getNextCertificateLifecycleActionLabel(row.original.status);
        const actions: RowAction<CertificateRow>[] = [
          { label: 'Voir details', onClick: onView },
          ...(nextActionLabel ? [{ label: nextActionLabel, onClick: onAdvanceLifecycle, separated: true }] satisfies RowAction<CertificateRow>[] : []),
          ...(row.original.dossier ? [{ label: 'Voir dossier DN', onClick: onViewDossier }] satisfies RowAction<CertificateRow>[] : []),
          ...(row.original.scannedDocument ?? row.original.linkedDocument ? [{ label: 'Voir document scanne', onClick: onViewDocument, separated: true }] satisfies RowAction<CertificateRow>[] : []),
        ];

        return <DataTableRowActions row={row.original} actions={actions} triggerLabel={`Actions pour ${row.original.certificateNumber}`} />;
      },
    }),
  ] as ColumnDef<CertificateRow>[];
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return <div><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{children}</dd></div>;
}

function CertificateDetailsDialog({
  row,
  open,
  onClose,
  onAdvanceLifecycle,
}: {
  row: CertificateRow | null;
  open: boolean;
  onClose: () => void;
  onAdvanceLifecycle: (row: CertificateRow) => void;
}): React.JSX.Element {
  const nextActionLabel = row ? getNextCertificateLifecycleActionLabel(row.status) : null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : onClose())}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row?.certificateNumber ?? 'Certificat'}</DialogTitle>
          <DialogDescription>
            Lecture seule du cycle manuel certificat. Generation automatique non active dans le prototype.
          </DialogDescription>
        </DialogHeader>

        {row ? (
          <div className="grid gap-4">
            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Cycle manuel du certificat</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <DetailField label="Numero">{row.certificateNumber}</DetailField>
                <DetailField label="Type">{certificateTypeLabels[row.certificateType]}</DetailField>
                <DetailField label="Statut"><CertificateStatusBadge status={row.status} /></DetailField>
                <DetailField label="Preparation">{formatDate(row.preparedAt)}</DetailField>
                <DetailField label="Impression">{formatDate(row.printedAt)}</DetailField>
                <DetailField label="Signature">{formatDate(row.signedAt)}</DetailField>
                <DetailField label="Cachet">{formatDate(row.stampedAt)}</DetailField>
                <DetailField label="Scan AIDN">{formatDate(row.scannedAt)}</DetailField>
                <DetailField label="Pret au retrait">{formatDate(row.readyForCollectionAt)}</DetailField>
                <DetailField label="Remise">{formatDate(row.collectedAt ?? row.deliveredAt)}</DetailField>
                <DetailField label="Archivage">{formatDate(row.archivedAt)}</DetailField>
                <DetailField label="Validite">{formatDate(row.validUntil)}</DetailField>
              </dl>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Responsables et retrait</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <DetailField label="Prepare par">{row.preparedBy ?? 'Non renseigne'}</DetailField>
                <DetailField label="Signe par">{row.signedBy ?? 'Non renseigne'}</DetailField>
                <DetailField label="Retire par">{row.collectedBy ?? 'Non renseigne'}</DetailField>
                <DetailField label="Note retrait">{row.collectionNote ?? 'Non renseignee'}</DetailField>
              </dl>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Dossier et document scanne</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <DetailField label="Dossier DN">{row.dossier?.reference ?? 'Non lie'}</DetailField>
                <DetailField label="Statut dossier">{row.dossier ? <AidnStatusBadge status={row.dossier.globalStatus} /> : 'Non lie'}</DetailField>
                <DetailField label="Demande source">{row.demande?.reference ?? 'Non liee'}</DetailField>
                <DetailField label="Phase courante">{row.currentPhase ? <OmaPhaseBadge status={row.currentPhase.status} /> : 'Non renseignee'}</DetailField>
                <DetailField label="Organisme">{row.demande?.organizationName ?? row.holderName}</DetailField>
                <DetailField label="Postulant">{row.demande?.postulantName ?? 'Non renseigne'}</DetailField>
                <DetailField label="Document scanne">{row.scannedDocument?.title ?? 'Non rattache'}</DetailField>
                <DetailField label="Document support">{row.linkedDocument?.title ?? 'Aucun document lie'}</DetailField>
              </dl>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">Note prototype</h2>
              <p className="text-sm text-muted-foreground">
                Generation automatique non active dans le prototype. La page trace uniquement la preparation, l'impression, la signature/cachet physique, le scan AIDN, le retrait et l'archive.
              </p>
              {nextActionLabel ? (
                <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => onAdvanceLifecycle(row)}>
                  {nextActionLabel}
                </Button>
              ) : (
                <Badge variant="secondary" className="mt-3">Cycle archive dans la demo</Badge>
              )}
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function CertificatsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AidnCertificateStatus | ''>('');
  const [certificateType, setCertificateType] = useState<CertificateType | ''>('');
  const [dossierStatus, setDossierStatus] = useState<AidnDossierStatus | ''>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRow, setSelectedRow] = useState<CertificateRow | null>(null);

  const certificatesQuery = useAidnCertificates();
  const dossiersQuery = useDossiers();
  const demandesQuery = useDemandes();
  const documentsQuery = useAidnDocuments();
  const phasesQuery = useAidnOmaPhases();

  const rows = useMemo<CertificateRow[]>(() => {
    const dossiersById = new Map((dossiersQuery.data ?? []).map((dossier) => [dossier.id, dossier]));
    const demandesById = new Map((demandesQuery.data ?? []).map((demande) => [demande.id, demande]));
    const documentsById = new Map((documentsQuery.data ?? []).map((document) => [document.id, document]));
    const documents = documentsQuery.data ?? [];
    const phasesByDossierAndKey = new Map((phasesQuery.data ?? []).map((phase) => [`${phase.dossierId}:${phase.key}`, phase]));

    return (certificatesQuery.data ?? []).map((certificate) => {
      const dossier = dossiersById.get(certificate.dossierId);
      const demande = dossier ? demandesById.get(dossier.demandeId) : undefined;
      const currentPhase = dossier ? phasesByDossierAndKey.get(`${dossier.id}:${dossier.currentPhase}`) : undefined;

      return {
        ...certificate,
        dossier,
        demande,
        currentPhase,
        linkedDocument: certificate.linkedDocumentId ? documentsById.get(certificate.linkedDocumentId) : undefined,
        scannedDocument: certificate.scannedDocumentId ? documentsById.get(certificate.scannedDocumentId) : undefined,
        dossierDocuments: documents.filter((document) => document.dossierId === certificate.dossierId),
      };
    });
  }, [certificatesQuery.data, demandesQuery.data, documentsQuery.data, dossiersQuery.data, phasesQuery.data]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch = normalizedSearch
        ? [
            row.certificateNumber,
            certificateTypeLabels[row.certificateType],
            certificateStatusLabels[row.status],
            row.dossier?.reference ?? '',
            row.demande?.reference ?? '',
            row.demande?.organizationName ?? '',
            row.demande?.postulantName ?? '',
            row.holderName,
          ].some((value) => value.toLowerCase().includes(normalizedSearch))
        : true;
      const matchesStatus = status ? row.status === status : true;
      const matchesType = certificateType ? row.certificateType === certificateType : true;
      const matchesDossierStatus = dossierStatus ? row.dossier?.globalStatus === dossierStatus : true;
      return matchesSearch && matchesStatus && matchesType && matchesDossierStatus;
    });
  }, [certificateType, dossierStatus, rows, search, status]);

  const activeFilters = useMemo((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    if (status) filters.push({ id: 'status', label: `Statut : ${certificateStatusLabels[status]}`, onRemove: () => setStatus('') });
    if (certificateType) filters.push({ id: 'certificateType', label: `Type : ${certificateTypeLabels[certificateType]}`, onRemove: () => setCertificateType('') });
    if (dossierStatus) filters.push({ id: 'dossierStatus', label: `Dossier : ${dossierStatusLabels[dossierStatus]}`, onRemove: () => setDossierStatus('') });
    return filters;
  }, [certificateType, dossierStatus, status]);

  const kpis = useMemo(
    () => ({
      total: rows.length,
      preparationPrinted: rows.filter((row) => row.status === 'to_prepare' || row.status === 'printed').length,
      signedScanned: rows.filter((row) => row.status === 'signed_stamped' || row.status === 'scanned_in_aidn').length,
      readyCollected: rows.filter((row) => row.status === 'ready_for_collection' || row.status === 'collected').length,
    }),
    [rows],
  );

  const isLoading = certificatesQuery.isLoading || dossiersQuery.isLoading || demandesQuery.isLoading || documentsQuery.isLoading || phasesQuery.isLoading;
  const error = certificatesQuery.error ?? dossiersQuery.error ?? demandesQuery.error ?? documentsQuery.error ?? phasesQuery.error;
  const hasActiveFilters = Boolean(search || status || certificateType || dossierStatus);
  const showNoResults = !isLoading && !error && hasActiveFilters && filteredRows.length === 0;

  const refetchAll = useCallback(() => {
    void certificatesQuery.refetch();
    void dossiersQuery.refetch();
    void demandesQuery.refetch();
    void documentsQuery.refetch();
    void phasesQuery.refetch();
  }, [certificatesQuery, demandesQuery, documentsQuery, dossiersQuery, phasesQuery]);

  const refreshAidnQueries = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['aidn'] });
  };

  const handleClearAll = () => {
    setSearch('');
    setStatus('');
    setCertificateType('');
    setDossierStatus('');
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleViewDossier = useCallback((row: CertificateRow) => {
    if (!row.dossier) return;
    setSelectedRow(null);
    navigate(`/dossiers/${row.dossier.id}`);
  }, [navigate]);

  const handleViewDocument = useCallback((row: CertificateRow) => {
    setSelectedRow(null);
    navigate('/documents', { state: { aidnSearch: row.scannedDocument?.title ?? row.linkedDocument?.title ?? row.certificateNumber } });
  }, [navigate]);

  const handleAdvanceLifecycle = useCallback((row: CertificateRow) => {
    advanceCertificateLifecycle(row.id);
    refreshAidnQueries();
    setSelectedRow(null);
    toast.success('Cycle certificat mis a jour localement');
  }, [queryClient, toast]);

  const columns = useMemo(
    () => buildColumns(setSelectedRow, handleViewDossier, handleViewDocument, handleAdvanceLifecycle),
    [handleAdvanceLifecycle, handleViewDocument, handleViewDossier],
  );

  return (
    <ManagementPageShell
      className="page-container"
      header={
        <ManagementHeader
          title="Certificats"
          subtitle="Suivi mock du cycle manuel des certificats OMA rattaches aux dossiers DN."
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
            <KpiCard title="Certificats suivis" value={kpis.total} subtitle="Records certificat mock" />
            <KpiCard title="A preparer / imprimes" value={kpis.preparationPrinted} subtitle="Preparation et impression manuelles" />
            <KpiCard title="Signes / scannes" value={kpis.signedScanned} subtitle="Signature, cachet ou scan AIDN" />
            <KpiCard title="Prets / remis" value={kpis.readyCollected} subtitle="Retrait ou remise tracee" />
          </div>
          <ManagementToolbar
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder="Rechercher certificat, dossier, demande, organisme..."
            filterCount={activeFilters.length}
            onFilterToggle={() => setIsFilterOpen((open) => !open)}
            isFilterOpen={isFilterOpen}
            onRefresh={refetchAll}
            isRefreshing={certificatesQuery.isFetching || dossiersQuery.isFetching || demandesQuery.isFetching || documentsQuery.isFetching || phasesQuery.isFetching}
          />
        </div>
      }
      filterPanel={
        <ManagementFilterPanel isOpen={isFilterOpen} activeFilters={activeFilters} onClear={handleClearAll}>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-certificate-status">Statut</label>
            <Select value={status || 'all'} onValueChange={(value) => setStatus(isCertificateStatus(value) ? value : '')}>
              <SelectTrigger id="filter-certificate-status" className="h-9 w-52"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {AIDN_CERTIFICATE_STATUSES.map((item) => <SelectItem key={item} value={item}>{certificateStatusLabels[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-certificate-type">Type</label>
            <Select value={certificateType || 'all'} onValueChange={(value) => setCertificateType(isCertificateType(value) ? value : '')}>
              <SelectTrigger id="filter-certificate-type" className="h-9 w-48"><SelectValue placeholder="Tous les types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="initial">{certificateTypeLabels.initial}</SelectItem>
                <SelectItem value="renewal">{certificateTypeLabels.renewal}</SelectItem>
                <SelectItem value="extension">{certificateTypeLabels.extension}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-dossier-status">Statut dossier</label>
            <Select value={dossierStatus || 'all'} onValueChange={(value) => setDossierStatus(isDossierStatus(value) ? value : '')}>
              <SelectTrigger id="filter-dossier-status" className="h-9 w-52"><SelectValue placeholder="Tous les dossiers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les dossiers</SelectItem>
                {AIDN_DOSSIER_STATUSES.map((item) => <SelectItem key={item} value={item}>{dossierStatusLabels[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </ManagementFilterPanel>
      }
      table={
        showNoResults ? (
          <NoResultsState
            message="Aucun certificat ne correspond aux filtres"
            description="Aucun certificat mock ne combine ces criteres. Effacez les filtres ou recherchez un certificat, un dossier DN, une demande, un organisme ou un postulant."
            onClear={handleClearAll}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            error={error}
            emptyMessage="Aucun certificat trouve."
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
          <Award className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Mode demonstration : le cycle du certificat est simule localement. Le prototype ne declenche aucune generation, signature, cachet, scan ou remise reelle.
          </p>
        </div>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <FolderOpen className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Chaque certificat affiche est un record mock existant rattache a un Dossier DN.</p>
        </div>
      </div>
      <CertificateDetailsDialog row={selectedRow} open={Boolean(selectedRow)} onClose={() => setSelectedRow(null)} onAdvanceLifecycle={handleAdvanceLifecycle} />
    </ManagementPageShell>
  );
}
