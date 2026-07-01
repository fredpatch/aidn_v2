import { useCallback, useEffect, useMemo, useState } from "react";
import { Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
  DataTablePagination,
  DataTableRowActions,
  createColumnHelper,
  type ColumnDef,
  type PaginationState,
  type RowAction,
  type SortingState,
} from "@/components/data-table";
import {
  ManagementFilterPanel,
  ManagementHeader,
  ManagementPageShell,
  ManagementToolbar,
  NoResultsState,
  type ActiveFilter,
} from "@/components/management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isMockMode } from "@/lib/data/data-mode";
import {
  downloadDossierDocument,
  listCertificates,
  type AdminCertificate,
  type AdminCertificateWithDossier,
  type CertificateStatus,
  type CertificateType,
  type DossierStatus,
} from "@/lib/api/dossiers";
import { openBlobInNewTab } from "@/lib/utils/blob";
import {
  certificateStatusLabels,
  certificateTypeLabels,
  dossierStatusLabels,
  formatDate,
} from "./dossiers/dossier-detail.labels";
import { AdvanceCertificateDialog } from "./dossiers/delivery-dialogs";

const helper = createColumnHelper<AdminCertificateWithDossier>();
const pageSize = 8;

const CERTIFICATE_STATUSES: CertificateStatus[] = [
  "to_prepare",
  "printed",
  "sent_for_dg_signature",
  "ready_for_collection",
  "collected",
  "archived",
];

const CERTIFICATE_TYPES: CertificateType[] = [
  "agrement",
  "reconnaissance",
  "renewal",
  "modification",
];

const DOSSIER_STATUSES: DossierStatus[] = [
  "opened",
  "preliminary_phase",
  "formal_request_phase",
  "document_evaluation_phase",
  "inspection_phase",
  "delivery_phase",
  "closed",
  "suspended",
  "cancelled",
];

const CERTIFICATE_STATUS_CLASS_NAMES: Record<CertificateStatus, string> = {
  to_prepare:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
  printed:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
  sent_for_dg_signature: "border-primary/20 bg-primary/10 text-primary",
  ready_for_collection:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  collected:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  archived:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
};

const CERTIFICATE_NEXT_ACTION_LABELS: Partial<Record<CertificateStatus, string>> = {
  to_prepare: "Marquer imprimé",
  printed: "Marquer envoyé pour signature DG",
  sent_for_dg_signature: "Téléverser le certificat signé",
  ready_for_collection: "Confirmer le retrait",
  collected: "Archiver",
};

function isCertificateStatus(value: string | null): value is CertificateStatus {
  return CERTIFICATE_STATUSES.includes(value as CertificateStatus);
}

function isCertificateType(value: string | null): value is CertificateType {
  return CERTIFICATE_TYPES.includes(value as CertificateType);
}

function isDossierStatus(value: string | null): value is DossierStatus {
  return DOSSIER_STATUSES.includes(value as DossierStatus);
}

function KpiCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}): React.JSX.Element {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function CertificateStatusBadge({
  status,
}: {
  status: CertificateStatus;
}): React.JSX.Element {
  return (
    <Badge
      variant="outline"
      className={CERTIFICATE_STATUS_CLASS_NAMES[status]}
    >
      {certificateStatusLabels[status] ?? status}
    </Badge>
  );
}

function buildColumns(
  onView: (row: AdminCertificateWithDossier) => void,
  onViewDossier: (row: AdminCertificateWithDossier) => void,
  onAdvanceLifecycle: (row: AdminCertificateWithDossier) => void,
): ColumnDef<AdminCertificateWithDossier>[] {
  return [
    helper.accessor("certificateNumber", {
      header: "Numéro",
      cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
    }),
    helper.accessor("certificateType", {
      header: "Type",
      cell: (info) => (
        <Badge variant="secondary">
          {certificateTypeLabels[info.getValue()] ?? info.getValue()}
        </Badge>
      ),
    }),
    helper.display({
      id: "dossier",
      header: "Dossier DN",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.dossier?.dossierNumber ?? "Non lié"}
        </span>
      ),
    }),
    helper.display({
      id: "organization",
      header: "Organisme",
      cell: ({ row }) => (
        <span>
          {row.original.dossier?.organizationName ?? row.original.holderName}
        </span>
      ),
    }),
    helper.accessor("status", {
      header: "Statut certificat",
      cell: (info) => <CertificateStatusBadge status={info.getValue()} />,
    }),
    helper.accessor("printedAt", {
      header: "Impression",
      meta: { hideOnMobile: true },
      cell: (info) => (
        <span className="text-muted-foreground">
          {info.getValue() ? formatDate(info.getValue()!) : "Non renseigné"}
        </span>
      ),
    }),
    helper.accessor("sentForSignatureAt", {
      header: "Envoi signature DG",
      meta: { hideOnMobile: true },
      cell: (info) => (
        <span className="text-muted-foreground">
          {info.getValue() ? formatDate(info.getValue()!) : "Non renseigné"}
        </span>
      ),
    }),
    helper.display({
      id: "collection",
      header: "Retrait",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.collectedAt
            ? formatDate(row.original.collectedAt)
            : row.original.readyForCollectionAt
              ? formatDate(row.original.readyForCollectionAt)
              : "Non renseigné"}
        </span>
      ),
    }),
    helper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const nextActionLabel =
          CERTIFICATE_NEXT_ACTION_LABELS[row.original.status];
        const actions: RowAction<AdminCertificateWithDossier>[] = [
          { label: "Voir détails", onClick: onView },
          ...(nextActionLabel
            ? ([
                {
                  label: nextActionLabel,
                  onClick: onAdvanceLifecycle,
                  separated: true,
                },
              ] satisfies RowAction<AdminCertificateWithDossier>[])
            : []),
          ...(row.original.dossier
            ? ([
                { label: "Voir dossier DN", onClick: onViewDossier },
              ] satisfies RowAction<AdminCertificateWithDossier>[])
            : []),
        ];

        return (
          <DataTableRowActions
            row={row.original}
            actions={actions}
            triggerLabel={`Actions pour ${row.original.certificateNumber}`}
          />
        );
      },
    }),
  ] as ColumnDef<AdminCertificateWithDossier>[];
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function CertificateDetailsDialog({
  row,
  open,
  onClose,
  onAdvanceLifecycle,
  onDownloadSigned,
}: {
  row: AdminCertificateWithDossier | null;
  open: boolean;
  onClose: () => void;
  onAdvanceLifecycle: (row: AdminCertificateWithDossier) => void;
  onDownloadSigned: (row: AdminCertificateWithDossier) => void;
}): React.JSX.Element {
  const nextActionLabel = row
    ? CERTIFICATE_NEXT_ACTION_LABELS[row.status]
    : undefined;
  const canDownloadSigned =
    row?.signedDocumentId &&
    (row.status === "collected" || row.status === "archived");

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : onClose())}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row?.certificateNumber ?? "Certificat"}</DialogTitle>
          <DialogDescription>
            Cycle de préparation, signature et retrait du certificat.
          </DialogDescription>
        </DialogHeader>

        {row ? (
          <div className="grid gap-4">
            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">
                Cycle du certificat
              </h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <DetailField label="Numéro">{row.certificateNumber}</DetailField>
                <DetailField label="Type">
                  {certificateTypeLabels[row.certificateType] ?? row.certificateType}
                </DetailField>
                <DetailField label="Statut">
                  <CertificateStatusBadge status={row.status} />
                </DetailField>
                <DetailField label="Impression">
                  {row.printedAt ? formatDate(row.printedAt) : "Non renseigné"}
                </DetailField>
                <DetailField label="Envoi signature DG">
                  {row.sentForSignatureAt
                    ? formatDate(row.sentForSignatureAt)
                    : "Non renseigné"}
                </DetailField>
                <DetailField label="Certificat signé archivé">
                  {row.signedUploadedAt
                    ? formatDate(row.signedUploadedAt)
                    : "Non renseigné"}
                </DetailField>
                <DetailField label="Prêt au retrait">
                  {row.readyForCollectionAt
                    ? formatDate(row.readyForCollectionAt)
                    : "Non renseigné"}
                </DetailField>
                <DetailField label="Retrait">
                  {row.collectedAt ? formatDate(row.collectedAt) : "Non renseigné"}
                </DetailField>
                <DetailField label="Archivage">
                  {row.archivedAt ? formatDate(row.archivedAt) : "Non renseigné"}
                </DetailField>
                <DetailField label="Validité">
                  {row.validUntil ? formatDate(row.validUntil) : "Non renseignée"}
                </DetailField>
              </dl>
            </section>

            {row.status === "collected" && row.collectionNote ? (
              <section className="rounded-lg border bg-muted/20 p-4">
                <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">
                  Retrait
                </h2>
                <p className="text-sm text-muted-foreground">
                  {row.collectionNote}
                </p>
              </section>
            ) : null}

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">
                Dossier
              </h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <DetailField label="Dossier DN">
                  {row.dossier?.dossierNumber ?? "Non lié"}
                </DetailField>
                <DetailField label="Statut dossier">
                  {row.dossier
                    ? (dossierStatusLabels[
                        row.dossier.status as DossierStatus
                      ] ?? row.dossier.status)
                    : "Non lié"}
                </DetailField>
                <DetailField label="Organisme">
                  {row.dossier?.organizationName ?? row.holderName}
                </DetailField>
              </dl>
            </section>

            <section className="flex flex-wrap gap-2">
              {canDownloadSigned ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onDownloadSigned(row)}
                >
                  Télécharger le certificat signé
                </Button>
              ) : null}
              {nextActionLabel ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onAdvanceLifecycle(row)}
                >
                  {nextActionLabel}
                </Button>
              ) : (
                <Badge variant="secondary">Cycle terminé</Badge>
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

  const [items, setItems] = useState<AdminCertificateWithDossier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CertificateStatus | "">("");
  const [certificateType, setCertificateType] = useState<CertificateType | "">("");
  const [dossierStatus, setDossierStatus] = useState<DossierStatus | "">("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRow, setSelectedRow] = useState<AdminCertificateWithDossier | null>(
    null,
  );
  const [advanceRow, setAdvanceRow] = useState<AdminCertificateWithDossier | null>(
    null,
  );

  const load = useCallback(async () => {
    if (isMockMode()) {
      setItems([]);
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const response = await listCertificates();
      setItems(response.items);
    } catch {
      setError("Impossible de charger les certificats.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((row) => {
      const matchesSearch = normalizedSearch
        ? [
            row.certificateNumber,
            certificateTypeLabels[row.certificateType] ?? "",
            certificateStatusLabels[row.status] ?? "",
            row.dossier?.dossierNumber ?? "",
            row.dossier?.organizationName ?? "",
            row.holderName,
          ].some((value) => value.toLowerCase().includes(normalizedSearch))
        : true;
      const matchesStatus = status ? row.status === status : true;
      const matchesType = certificateType
        ? row.certificateType === certificateType
        : true;
      const matchesDossierStatus = dossierStatus
        ? row.dossier?.status === dossierStatus
        : true;
      return (
        matchesSearch && matchesStatus && matchesType && matchesDossierStatus
      );
    });
  }, [certificateType, dossierStatus, items, search, status]);

  const activeFilters = useMemo((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    if (status)
      filters.push({
        id: "status",
        label: `Statut : ${certificateStatusLabels[status]}`,
        onRemove: () => setStatus(""),
      });
    if (certificateType)
      filters.push({
        id: "certificateType",
        label: `Type : ${certificateTypeLabels[certificateType]}`,
        onRemove: () => setCertificateType(""),
      });
    if (dossierStatus)
      filters.push({
        id: "dossierStatus",
        label: `Dossier : ${dossierStatusLabels[dossierStatus]}`,
        onRemove: () => setDossierStatus(""),
      });
    return filters;
  }, [certificateType, dossierStatus, status]);

  const kpis = useMemo(
    () => ({
      total: items.length,
      preparationPrinted: items.filter(
        (row) => row.status === "to_prepare" || row.status === "printed",
      ).length,
      inSignature: items.filter(
        (row) => row.status === "sent_for_dg_signature",
      ).length,
      readyCollected: items.filter(
        (row) =>
          row.status === "ready_for_collection" ||
          row.status === "collected" ||
          row.status === "archived",
      ).length,
    }),
    [items],
  );

  const hasActiveFilters = Boolean(
    search || status || certificateType || dossierStatus,
  );
  const showNoResults =
    !isLoading && !error && hasActiveFilters && filteredRows.length === 0;

  const handleClearAll = () => {
    setSearch("");
    setStatus("");
    setCertificateType("");
    setDossierStatus("");
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleViewDossier = useCallback(
    (row: AdminCertificateWithDossier) => {
      if (!row.dossier) return;
      setSelectedRow(null);
      navigate(`/dossiers/${row.dossier.id}`);
    },
    [navigate],
  );

  const handleDownloadSigned = useCallback(
    (row: AdminCertificateWithDossier) => {
      if (!row.dossier?.id || !row.signedDocumentId) return;
      void downloadDossierDocument(row.dossier.id, row.signedDocumentId).then(
        (result) => {
          openBlobInNewTab(
            result.blob,
            result.fileName || "certificat-signe.pdf",
          );
        },
      );
    },
    [],
  );

  const handleAdvanceLifecycle = useCallback(
    (row: AdminCertificateWithDossier) => {
      setSelectedRow(null);
      setAdvanceRow(row);
    },
    [],
  );

  const handleAdvanceSuccess = useCallback(
    (_certificate: AdminCertificate) => {
      setAdvanceRow(null);
      void load();
    },
    [load],
  );

  const columns = useMemo(
    () => buildColumns(setSelectedRow, handleViewDossier, handleAdvanceLifecycle),
    [handleAdvanceLifecycle, handleViewDossier],
  );

  return (
    <ManagementPageShell
      className="page-container"
      header={
        <ManagementHeader
          title="Certificats"
          subtitle="Suivi de la préparation, signature et retrait des certificats OMA rattachés aux dossiers DN."
        />
      }
      toolbar={
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <KpiCard
              title="Certificats suivis"
              value={kpis.total}
              subtitle="Tous les certificats"
            />
            <KpiCard
              title="À préparer / imprimés"
              value={kpis.preparationPrinted}
              subtitle="Avant envoi pour signature DG"
            />
            <KpiCard
              title="En signature"
              value={kpis.inSignature}
              subtitle="Envoyés pour signature DG"
            />
            <KpiCard
              title="Prêts / remis"
              value={kpis.readyCollected}
              subtitle="Retrait ou remise tracée"
            />
          </div>
          <ManagementToolbar
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder="Rechercher certificat, dossier, organisme..."
            filterCount={activeFilters.length}
            onFilterToggle={() => setIsFilterOpen((open) => !open)}
            isFilterOpen={isFilterOpen}
            onRefresh={load}
            isRefreshing={isLoading}
          />
        </div>
      }
      filterPanel={
        <ManagementFilterPanel
          isOpen={isFilterOpen}
          activeFilters={activeFilters}
          onClear={handleClearAll}
        >
          <div className="flex items-center gap-2">
            <label
              className="shrink-0 text-sm font-medium"
              htmlFor="filter-certificate-status"
            >
              Statut
            </label>
            <Select
              value={status || "all"}
              onValueChange={(value) =>
                setStatus(isCertificateStatus(value) ? value : "")
              }
            >
              <SelectTrigger id="filter-certificate-status" className="h-9 w-52">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {CERTIFICATE_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {certificateStatusLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label
              className="shrink-0 text-sm font-medium"
              htmlFor="filter-certificate-type"
            >
              Type
            </label>
            <Select
              value={certificateType || "all"}
              onValueChange={(value) =>
                setCertificateType(isCertificateType(value) ? value : "")
              }
            >
              <SelectTrigger id="filter-certificate-type" className="h-9 w-48">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {CERTIFICATE_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {certificateTypeLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label
              className="shrink-0 text-sm font-medium"
              htmlFor="filter-dossier-status"
            >
              Statut dossier
            </label>
            <Select
              value={dossierStatus || "all"}
              onValueChange={(value) =>
                setDossierStatus(isDossierStatus(value) ? value : "")
              }
            >
              <SelectTrigger id="filter-dossier-status" className="h-9 w-52">
                <SelectValue placeholder="Tous les dossiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les dossiers</SelectItem>
                {DOSSIER_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {dossierStatusLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </ManagementFilterPanel>
      }
      table={
        showNoResults ? (
          <NoResultsState
            message="Aucun certificat ne correspond aux filtres"
            description="Effacez les filtres ou recherchez un certificat, un dossier, un organisme."
            onClear={handleClearAll}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            error={error ? new Error(error) : null}
            emptyMessage="Aucun certificat trouvé."
            onRetry={load}
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
            onPageChange={(pageIndex) =>
              setPagination((current) => ({ ...current, pageIndex }))
            }
            onPageSizeChange={(nextPageSize) =>
              setPagination({ pageIndex: 0, pageSize: nextPageSize })
            }
          />
        )
      }
    >
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
        <div className="flex items-start gap-3">
          <Award className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Le certificat ne peut être retiré que par le postulant en
            personne — vérifiez son identité avant de confirmer un retrait.
          </p>
        </div>
      </div>
      <CertificateDetailsDialog
        row={selectedRow}
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        onAdvanceLifecycle={handleAdvanceLifecycle}
        onDownloadSigned={handleDownloadSigned}
      />
      <AdvanceCertificateDialog
        open={Boolean(advanceRow)}
        onOpenChange={(open) => {
          if (!open) setAdvanceRow(null);
        }}
        certificate={advanceRow}
        onSuccess={handleAdvanceSuccess}
      />
    </ManagementPageShell>
  );
}
