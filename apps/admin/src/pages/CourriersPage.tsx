import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  listRequests,
  type AdminRequest,
  type AdminRequestStatus,
  type CourrierSource,
} from "@/lib/api/requests";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type DgCircuitStatusKey =
  | "a_imprimer"
  | "depot_physique_prevu"
  | "courrier_physique_recu"
  | "attente_retour_dg"
  | "oriente_dn"
  | "annule_dg"
  | "dossier_ouvert";

const DG_CIRCUIT_STATUS_LABELS: Record<DgCircuitStatusKey, string> = {
  a_imprimer: "À imprimer",
  depot_physique_prevu: "Dépôt physique prévu",
  courrier_physique_recu: "Courrier physique reçu",
  attente_retour_dg: "En attente retour DG",
  oriente_dn: "Orienté DN",
  annule_dg: "Annulé DG",
  dossier_ouvert: "Dossier ouvert",
};

const COURRIER_SOURCE_LABELS: Record<CourrierSource, string> = {
  portal_upload: "Téléversé portail",
  physical_deposit: "Dépôt physique",
  internal_scan: "Scan interne",
  generated_from_template: "Généré",
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  oma_recognition: "Certificat de reconnaissance OMA",
  oma_approval: "Certificat d'agrément OMA",
  oma_renewal: "Renouvellement de Certificat OMA",
  oma_modification: "Modification de Certificat OMA",
};

const HISTORY_STATUSES: AdminRequestStatus[] = ["rejected", "dossier_opened"];

const pageSize = 8;

function deriveDgCircuitStatus(r: AdminRequest): DgCircuitStatusKey {
  if (r.status === "dossier_opened") return "dossier_ouvert";
  if (r.status === "oriented_to_dn") return "oriente_dn";
  if (r.status === "rejected") return "annule_dg";
  if (r.status === "initial_sent_to_dg") return "attente_retour_dg";
  if (r.courrierSource === "physical_deposit") {
    return r.physicalDeposit?.status === "received"
      ? "courrier_physique_recu"
      : "depot_physique_prevu";
  }
  return "a_imprimer";
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function getNavigationSearch(state: unknown): string {
  return typeof state === "object" &&
    state !== null &&
    "aidnSearch" in state &&
    typeof (state as Record<string, unknown>).aidnSearch === "string"
    ? ((state as Record<string, unknown>).aidnSearch as string)
    : "";
}

function DgCircuitBadge({
  statusKey,
}: {
  statusKey: DgCircuitStatusKey;
}): React.JSX.Element {
  const variantMap: Record<
    DgCircuitStatusKey,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    a_imprimer: "outline",
    depot_physique_prevu: "outline",
    courrier_physique_recu: "secondary",
    attente_retour_dg: "secondary",
    oriente_dn: "default",
    annule_dg: "destructive",
    dossier_ouvert: "default",
  };

  return (
    <Badge variant={variantMap[statusKey]}>
      {DG_CIRCUIT_STATUS_LABELS[statusKey]}
    </Badge>
  );
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

const helper = createColumnHelper<AdminRequest>();

function buildColumns(
  onView: (row: AdminRequest) => void,
  onViewDemande: (row: AdminRequest) => void,
): ColumnDef<AdminRequest>[] {
  return [
    helper.display({
      id: "organisation",
      header: "Organisation",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium">
            {row.original.organization?.canonicalName ?? "-"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.submittedBy?.fullName ?? "-"}
          </p>
        </div>
      ),
    }),
    helper.accessor("requestType", {
      header: "Type demande",
      meta: { hideOnMobile: true },
      cell: (info) => (
        <span className="text-sm">
          {REQUEST_TYPE_LABELS[info.getValue()] ?? info.getValue()}
        </span>
      ),
    }),
    helper.accessor("courrierSource", {
      header: "Source",
      cell: (info) => {
        const source = info.getValue();
        return source ? (
          <Badge variant="secondary">
            {COURRIER_SOURCE_LABELS[source] ?? source}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    }),
    helper.display({
      id: "dgCircuitStatus",
      header: "Statut circuit DG",
      cell: ({ row }) => (
        <DgCircuitBadge statusKey={deriveDgCircuitStatus(row.original)} />
      ),
    }),
    helper.display({
      id: "dateEnvoiDg",
      header: "Envoi DG",
      meta: { hideOnMobile: true },
      cell: ({ row }) => {
        const r = row.original;
        const date =
          r.courrierSource === "physical_deposit"
            ? r.physicalDeposit?.physicalDepositDate
            : r.intake?.sentToDgAt;
        return (
          <span className="text-muted-foreground">{formatDate(date)}</span>
        );
      },
    }),
    helper.display({
      id: "decisionDg",
      header: "Décision DG",
      meta: { hideOnMobile: true },
      cell: ({ row }) => {
        const decision = row.original.dgReview?.decision;
        if (!decision || decision === "pending") {
          return <span className="text-muted-foreground">-</span>;
        }
        const labels: Record<string, string> = {
          oriented_to_dn: "Orienté DN",
          rejected: "Annulé",
          approved: "Approuvé",
          reoriented: "Réorienté",
        };
        return (
          <Badge variant={decision === "rejected" ? "destructive" : "default"}>
            {labels[decision] ?? decision}
          </Badge>
        );
      },
    }),
    helper.display({
      id: "dateRetourDg",
      header: "Retour DG",
      meta: { hideOnMobile: true },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.dgReview?.returnedFromDgAt)}
        </span>
      ),
    }),
    helper.display({
      id: "dossier",
      header: "Dossier DN",
      cell: ({ row }) =>
        row.original.dossierId ? (
          <Badge variant="default">Ouvert</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    }),
    helper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const actions: RowAction<AdminRequest>[] = [
          { label: "Voir détails", onClick: onView },
          { label: "Voir la demande", onClick: onViewDemande },
        ];

        return (
          <DataTableRowActions
            row={row.original}
            actions={actions}
            triggerLabel={`Actions pour ${row.original.organization?.canonicalName ?? row.original.id}`}
          />
        );
      },
    }),
  ] as ColumnDef<AdminRequest>[];
}

function CourrierDetailsDialog({
  row,
  open,
  onClose,
  onViewDemande,
}: {
  row: AdminRequest | null;
  open: boolean;
  onClose: () => void;
  onViewDemande: (row: AdminRequest) => void;
}): React.JSX.Element {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => (nextOpen ? undefined : onClose())}
    >
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {row
              ? `Circuit DG - ${row.organization?.canonicalName ?? row.id}`
              : "Circuit DG"}
          </DialogTitle>
          <DialogDescription>
            Lecture seule du circuit DG. Les actions se font dans Demandes.
          </DialogDescription>
        </DialogHeader>

        {row ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onViewDemande(row)}
              >
                Voir la demande
              </Button>
            </div>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">
                Demande
              </h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Organisation</dt>
                  <dd className="font-medium">
                    {row.organization?.canonicalName ?? "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Postulant</dt>
                  <dd>{row.submittedBy?.fullName ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Type de demande</dt>
                  <dd>
                    {REQUEST_TYPE_LABELS[row.requestType] ?? row.requestType}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date demande</dt>
                  <dd>{formatDate(row.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date soumission</dt>
                  <dd>{formatDate(row.submittedAt)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">
                Circuit DG
              </h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Source courrier</dt>
                  <dd>
                    {row.courrierSource
                      ? (COURRIER_SOURCE_LABELS[row.courrierSource] ??
                        row.courrierSource)
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Statut circuit DG</dt>
                  <dd>
                    <DgCircuitBadge statusKey={deriveDgCircuitStatus(row)} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Document initial</dt>
                  <dd>
                    {row.initialDocumentId ? (
                      <Badge variant="secondary">Présent</Badge>
                    ) : (
                      <span className="text-muted-foreground">Absent</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {row.courrierSource === "physical_deposit"
                      ? "Date réception physique"
                      : "Date impression"}
                  </dt>
                  <dd>
                    {formatDate(
                      row.courrierSource === "physical_deposit"
                        ? row.physicalDeposit?.physicalDepositDate
                        : row.intake?.printedForDgAt,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date envoi DG</dt>
                  <dd>{formatDate(row.intake?.sentToDgAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Décision DG</dt>
                  <dd>{row.dgReview?.decision ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date retour DG</dt>
                  <dd>{formatDate(row.dgReview?.returnedFromDgAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Scan retour DG</dt>
                  <dd>
                    {row.dgReview?.returnedScannedDocumentId ? (
                      <Badge variant="secondary">Présent</Badge>
                    ) : (
                      <span className="text-muted-foreground">Absent</span>
                    )}
                  </dd>
                </div>
                {row.dgReview?.observations ? (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Observations</dt>
                    <dd>{row.dgReview.observations}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4">
              <h2 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">
                Dossier DN
              </h2>
              {row.dossierId ? (
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Statut</dt>
                    <dd>
                      <Badge variant="default">Dossier ouvert</Badge>
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun dossier DN ouvert pour cette demande.
                </p>
              )}
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function isDgCircuitStatusKey(value: string): value is DgCircuitStatusKey {
  return value in DG_CIRCUIT_STATUS_LABELS;
}

function isCourrierSource(value: string): value is CourrierSource {
  return [
    "portal_upload",
    "physical_deposit",
    "internal_scan",
    "generated_from_template",
  ].includes(value);
}

export function CourriersPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState<AdminRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [search, setSearch] = useState(() =>
    getNavigationSearch(location.state),
  );
  const [sourceFilter, setSourceFilter] = useState<CourrierSource | "">("");
  const [dgStatusFilter, setDgStatusFilter] = useState<DgCircuitStatusKey | "">(
    "",
  );
  const [includeHistory, setIncludeHistory] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRow, setSelectedRow] = useState<AdminRequest | null>(null);

  const fetchItems = useCallback(async (loading: boolean) => {
    if (loading) setIsLoading(true);
    else setIsFetching(true);
    setError(null);

    try {
      const { items: fetched } = await listRequests({});
      setItems(fetched.filter((r) => !!r.courrierSource));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Erreur lors du chargement."),
      );
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems(true);
  }, [fetchItems]);

  useEffect(() => {
    const nextSearch = getNavigationSearch(location.state);
    if (!nextSearch) return;
    setSearch(nextSearch);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [location.state]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((r) => {
      if (!includeHistory && HISTORY_STATUSES.includes(r.status)) return false;

      if (sourceFilter && r.courrierSource !== sourceFilter) return false;

      if (dgStatusFilter && deriveDgCircuitStatus(r) !== dgStatusFilter)
        return false;

      if (normalizedSearch) {
        const matches = [
          r.organization?.canonicalName ?? "",
          r.submittedBy?.fullName ?? "",
          REQUEST_TYPE_LABELS[r.requestType] ?? r.requestType,
        ].some((v) => v.toLowerCase().includes(normalizedSearch));
        if (!matches) return false;
      }

      return true;
    });
  }, [items, includeHistory, sourceFilter, dgStatusFilter, search]);

  const kpis = useMemo(
    () => ({
      total: items.length,
      portalUpload: items.filter((r) => r.courrierSource === "portal_upload")
        .length,
      physicalDeposit: items.filter(
        (r) => r.courrierSource === "physical_deposit",
      ).length,
      attenteRetourDg: items.filter((r) => r.status === "initial_sent_to_dg")
        .length,
      retoursDgEnregistres: items.filter((r) =>
        (
          [
            "oriented_to_dn",
            "rejected",
            "dossier_opened",
          ] as AdminRequestStatus[]
        ).includes(r.status),
      ).length,
      dossiersOuverts: items.filter((r) => r.status === "dossier_opened")
        .length,
      annulesDg: items.filter((r) => r.status === "rejected").length,
    }),
    [items],
  );

  const activeFilters = useMemo((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    if (sourceFilter) {
      filters.push({
        id: "source",
        label: `Source : ${COURRIER_SOURCE_LABELS[sourceFilter]}`,
        onRemove: () => setSourceFilter(""),
      });
    }
    if (dgStatusFilter) {
      filters.push({
        id: "dgStatus",
        label: `Statut DG : ${DG_CIRCUIT_STATUS_LABELS[dgStatusFilter]}`,
        onRemove: () => setDgStatusFilter(""),
      });
    }
    if (includeHistory) {
      filters.push({
        id: "history",
        label: "Historique inclus",
        onRemove: () => setIncludeHistory(false),
      });
    }
    return filters;
  }, [sourceFilter, dgStatusFilter, includeHistory]);

  const handleClearAll = () => {
    setSearch("");
    setSourceFilter("");
    setDgStatusFilter("");
    setIncludeHistory(false);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const handleViewDemande = useCallback(
    (row: AdminRequest) => {
      setSelectedRow(null);
      navigate("/demandes", { state: { aidnSearch: row.id } });
    },
    [navigate],
  );

  const hasActiveFilters = Boolean(
    search || sourceFilter || dgStatusFilter || includeHistory,
  );
  const showNoResults =
    !isLoading && !error && hasActiveFilters && filteredRows.length === 0;

  const columns = useMemo(
    () => buildColumns(setSelectedRow, handleViewDemande),
    [handleViewDemande],
  );

  return (
    <ManagementPageShell
      className="page-container"
      header={
        <ManagementHeader
          title="Courriers / Orientation DG"
          subtitle="Registre en lecture seule du circuit DG. Les actions restent dans Demandes."
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
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
            <KpiCard
              title="Courriers liés"
              value={kpis.total}
              subtitle="Demandes avec courrier"
            />
            <KpiCard
              title="Téléversés portail"
              value={kpis.portalUpload}
              subtitle="Soumissions numériques"
            />
            <KpiCard
              title="Dépôts physiques"
              value={kpis.physicalDeposit}
              subtitle="Plis déposés au bureau"
            />
            <KpiCard
              title="En attente retour DG"
              value={kpis.attenteRetourDg}
              subtitle="Sans retour DG enregistré"
            />
            <KpiCard
              title="Retours DG enregistrés"
              value={kpis.retoursDgEnregistres}
              subtitle="Décision DG reçue"
            />
            <KpiCard
              title="Dossiers ouverts"
              value={kpis.dossiersOuverts}
              subtitle="Transmis à la DN"
            />
            <KpiCard
              title="Annulés DG"
              value={kpis.annulesDg}
              subtitle="Refusés par le DG"
            />
          </div>
          <ManagementToolbar
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder="Rechercher organisation, postulant, type demande..."
            filterCount={activeFilters.length}
            onFilterToggle={() => setIsFilterOpen((open) => !open)}
            isFilterOpen={isFilterOpen}
            onRefresh={() => void fetchItems(false)}
            isRefreshing={isFetching}
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
              htmlFor="filter-source"
            >
              Source courrier
            </label>
            <Select
              value={sourceFilter || "all"}
              onValueChange={(value) =>
                setSourceFilter(isCourrierSource(value) ? value : "")
              }
            >
              <SelectTrigger id="filter-source" className="h-9 w-48">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="portal_upload">Téléversé portail</SelectItem>
                <SelectItem value="physical_deposit">Dépôt physique</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label
              className="shrink-0 text-sm font-medium"
              htmlFor="filter-dg-status"
            >
              Statut circuit DG
            </label>
            <Select
              value={dgStatusFilter || "all"}
              onValueChange={(value) =>
                setDgStatusFilter(isDgCircuitStatusKey(value) ? value : "")
              }
            >
              <SelectTrigger id="filter-dg-status" className="h-9 w-52">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {(
                  Object.entries(DG_CIRCUIT_STATUS_LABELS) as [
                    DgCircuitStatusKey,
                    string,
                  ][]
                ).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="filter-history"
              checked={includeHistory}
              onCheckedChange={setIncludeHistory}
            />
            <Label htmlFor="filter-history" className="text-sm font-medium">
              Inclure l'historique
            </Label>
          </div>
        </ManagementFilterPanel>
      }
      table={
        showNoResults ? (
          <NoResultsState
            message="Aucun courrier ne correspond aux filtres"
            description="Effacez les filtres ou ajustez la recherche."
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
            onRetry={() => void fetchItems(true)}
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
      <CourrierDetailsDialog
        row={selectedRow}
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        onViewDemande={handleViewDemande}
      />
    </ManagementPageShell>
  );
}
