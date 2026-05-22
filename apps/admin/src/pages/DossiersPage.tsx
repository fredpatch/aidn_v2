import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderOpen } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isMockMode } from "@/lib/data/data-mode";
import {
  listDossiers,
  type AdminDossierSummary,
  type DossierStatus,
  type DossierType,
} from "@/lib/api/dossiers.api";

const helper = createColumnHelper<AdminDossierSummary>();
const pageSize = 8;

const dossierTypeLabels: Record<DossierType, string> = {
  oma_recognition: "Certificat de reconnaissance OMA",
  oma_approval: "Certificat d'agrément OMA",
  oma_renewal: "Renouvellement de Certificat OMA",
  oma_modification: "Modification de Certificat OMA",
};

const dossierStatusLabels: Record<DossierStatus, string> = {
  opened: "Ouvert",
  preliminary_phase: "Phase préliminaire",
  formal_request_phase: "Demande formelle",
  document_evaluation_phase: "Évaluation documents",
  inspection_phase: "Inspection",
  delivery_phase: "Délivrance",
  closed: "Clôturé",
  suspended: "Suspendu",
  cancelled: "Annulé",
};

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

const DOSSIER_TYPES: DossierType[] = [
  "oma_recognition",
  "oma_approval",
  "oma_renewal",
  "oma_modification",
];

const statusBadgeVariant = (
  status: DossierStatus,
): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "preliminary_phase") return "secondary";
  if (status === "closed" || status === "cancelled") return "destructive";
  if (status === "delivery_phase") return "default";
  return "outline";
};

function formatDate(value?: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function isDossierStatus(value: string | null): value is DossierStatus {
  return DOSSIER_STATUSES.includes(value as DossierStatus);
}

function isDossierType(value: string | null): value is DossierType {
  return DOSSIER_TYPES.includes(value as DossierType);
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

function getNavigationSearch(state: unknown): string {
  return typeof state === "object" &&
    state !== null &&
    "aidnSearch" in state &&
    typeof state.aidnSearch === "string"
    ? state.aidnSearch
    : "";
}

function buildColumns(
  onView: (row: AdminDossierSummary) => void,
): ColumnDef<AdminDossierSummary>[] {
  return [
    helper.accessor("dossierNumber", {
      header: "Référence dossier",
      cell: (info) => (
        <span className="font-semibold">{info.getValue() ?? "-"}</span>
      ),
    }),
    helper.display({
      id: "organisme",
      header: "Organisme",
      cell: ({ row }) => (
        <span>
          {row.original.organization?.canonicalName ?? "Non renseigné"}
        </span>
      ),
    }),
    helper.display({
      id: "postulant",
      header: "Postulant",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.postulant?.fullName ?? "Non renseigné"}
        </span>
      ),
    }),
    helper.accessor("dossierType", {
      header: "Type",
      meta: { hideOnMobile: true },
      cell: (info) => (
        <span className="text-sm">{dossierTypeLabels[info.getValue()]}</span>
      ),
    }),
    helper.accessor("status", {
      header: "Statut",
      cell: (info) => (
        <Badge variant={statusBadgeVariant(info.getValue())}>
          {dossierStatusLabels[info.getValue()]}
        </Badge>
      ),
    }),
    helper.accessor("openedAt", {
      header: "Date ouverture",
      meta: { hideOnMobile: true },
      cell: (info) => (
        <span className="text-muted-foreground">
          {formatDate(info.getValue())}
        </span>
      ),
    }),
    helper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const actions: RowAction<AdminDossierSummary>[] = [
          { label: "Voir détails", onClick: onView },
        ];
        return (
          <DataTableRowActions
            row={row.original}
            actions={actions}
            triggerLabel={`Actions pour ${row.original.dossierNumber ?? row.original.id}`}
          />
        );
      },
    }),
  ] as ColumnDef<AdminDossierSummary>[];
}

export function DossiersPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState<AdminDossierSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(() =>
    getNavigationSearch(location.state),
  );
  const [status, setStatus] = useState<DossierStatus | "">("");
  const [dossierType, setDossierType] = useState<DossierType | "">("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const load = useCallback(async () => {
    if (isMockMode()) {
      setItems([]);
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const response = await listDossiers({});
      setItems(response.items);
    } catch {
      setError("Impossible de charger les dossiers DN.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const nextSearch = getNavigationSearch(location.state);
    if (!nextSearch) return;
    setSearch(nextSearch);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [location.state]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return items.filter((row) => {
      const matchesSearch = normalizedSearch
        ? [
            row.dossierNumber ?? "",
            row.organization?.canonicalName ?? "",
            row.postulant?.fullName ?? "",
          ].some((value) => value.toLowerCase().includes(normalizedSearch))
        : true;
      const matchesStatus = status ? row.status === status : true;
      const matchesType = dossierType ? row.dossierType === dossierType : true;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [items, search, status, dossierType]);

  const kpis = useMemo(
    () => ({
      total: items.length,
      preliminary: items.filter((d) => d.status === "preliminary_phase").length,
      active: items.filter((d) =>
        [
          "preliminary_phase",
          "formal_request_phase",
          "document_evaluation_phase",
          "inspection_phase",
          "delivery_phase",
        ].includes(d.status),
      ).length,
      closed: items.filter((d) => d.status === "closed").length,
    }),
    [items],
  );

  const activeFilters = useMemo((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    if (status)
      filters.push({
        id: "status",
        label: `Statut : ${dossierStatusLabels[status]}`,
        onRemove: () => setStatus(""),
      });
    if (dossierType)
      filters.push({
        id: "dossierType",
        label: `Type : ${dossierTypeLabels[dossierType]}`,
        onRemove: () => setDossierType(""),
      });
    return filters;
  }, [dossierType, status]);

  const hasActiveFilters = Boolean(search || status || dossierType);
  const showNoResults =
    !isLoading && !error && hasActiveFilters && filteredRows.length === 0;

  const handleClearAll = () => {
    setSearch("");
    setStatus("");
    setDossierType("");
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleViewDossier = useCallback(
    (row: AdminDossierSummary) => {
      navigate(`/dossiers/${row.id}`);
    },
    [navigate],
  );

  const columns = useMemo(
    () => buildColumns(handleViewDossier),
    [handleViewDossier],
  );

  return (
    <ManagementPageShell
      className="page-container"
      header={
        <ManagementHeader
          title="Dossiers DN"
          subtitle="Référentiel des dossiers officiellement ouverts après orientation favorable vers la Direction de la Navigabilité."
        />
      }
      toolbar={
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <KpiCard
              title="Dossiers DN totaux"
              value={kpis.total}
              subtitle="Tous les dossiers enregistrés"
            />
            <KpiCard
              title="Phase préliminaire"
              value={kpis.preliminary}
              subtitle="En cours d'instruction initiale"
            />
            <KpiCard
              title="Dossiers actifs"
              value={kpis.active}
              subtitle="En instruction (toutes phases)"
            />
            <KpiCard
              title="Clôturés"
              value={kpis.closed}
              subtitle="Dossiers finalisés"
            />
          </div>
          <ManagementToolbar
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder="Rechercher référence, organisme, postulant…"
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
              htmlFor="filter-dossier-status"
            >
              Statut
            </label>
            <Select
              value={status || "all"}
              onValueChange={(value) =>
                setStatus(isDossierStatus(value) ? value : "")
              }
            >
              <SelectTrigger id="filter-dossier-status" className="h-9 w-52">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {DOSSIER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {dossierStatusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label
              className="shrink-0 text-sm font-medium"
              htmlFor="filter-dossier-type"
            >
              Type
            </label>
            <Select
              value={dossierType || "all"}
              onValueChange={(value) =>
                setDossierType(isDossierType(value) ? value : "")
              }
            >
              <SelectTrigger id="filter-dossier-type" className="h-9 w-72">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {DOSSIER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {dossierTypeLabels[t]}
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
            message="Aucun dossier DN ne correspond aux filtres"
            description="Effacez les filtres ou modifiez votre recherche."
            onClear={handleClearAll}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            error={error ? new Error(error) : null}
            emptyMessage="Aucun dossier DN trouvé."
            onRetry={load}
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
            pageCount={Math.max(
              1,
              Math.ceil(filteredRows.length / pagination.pageSize),
            )}
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
          <FolderOpen className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Cette page affiche uniquement les dossiers DN réellement ouverts
            après orientation DG favorable. Une demande orientée vers la DN peut
            rester visible dans /demandes sans apparaître ici tant que le
            dossier n'est pas ouvert.
          </p>
        </div>
      </div>
    </ManagementPageShell>
  );
}
