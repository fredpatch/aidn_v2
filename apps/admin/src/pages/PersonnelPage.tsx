import { useEffect, useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import {
  BriefcaseBusiness,
  Building2,
  Check,
  Copy,
  Hash,
  Search,
  ShieldCheck,
  UserRound,
  UserPlus,
} from "lucide-react";
import {
  activateInternalAccount,
  searchPersonnel,
  type ActivateInternalAccountResponse,
  type PersonnelSearchItem,
} from "../lib/api/admin.api";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { isMockMode } from "../lib/data/data-mode";

const defaultLimit = 5;

const roleOptions = [
  { value: "admin", label: "Administrateur" },
  { value: "dn_supervisor", label: "Superviseur DN" },
  { value: "dn_agent", label: "Agent DN" },
  { value: "dg_secretariat", label: "Secretariat DG" },
  { value: "reception", label: "Reception" },
  { value: "bureau_courrier", label: "Bureau courrier" },
];

const mockPersonnel: PersonnelSearchItem[] = [
  {
    personnelId: "DEMO001",
    matricule: "DEMO001",
    fullName: "Agent Demo",
    email: "agent.demo@anac-gabon.com",
    direction: "Direction de la Navigabilite",
    fonction: "Agent",
    alreadyActivated: false,
  },
];

function statusLabel(item: PersonnelSearchItem): string {
  if (!item.alreadyActivated) return "Non active";
  if (item.activationStatus === "active") return "Active";
  if (item.activationStatus === "disabled") return "Desactive";
  if (item.activationStatus === "pending_first_login")
    return "Premiere connexion en attente";
  return "Active";
}

function roleLabel(role?: string): string {
  return (
    roleOptions.find((option) => option.value === role)?.label ?? role ?? "-"
  );
}

function statusBadgeVariant(item: PersonnelSearchItem): "default" | "secondary" | "destructive" | "outline" {
  if (!item.alreadyActivated) return "outline";
  if (item.activationStatus === "disabled") return "destructive";
  if (item.activationStatus === "pending_first_login") return "secondary";
  return "default";
}

function HeaderLabel({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4" aria-hidden={true} />
      {children}
    </span>
  );
}

export function PersonnelPage(): React.JSX.Element {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<PersonnelSearchItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<PersonnelSearchItem | null>(null);
  const [role, setRole] = useState("dn_agent");
  const [activationResult, setActivationResult] =
    useState<ActivateInternalAccountResponse | null>(null);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const firstItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, total);

  const loadPersonnel = async (
    term = search,
    nextPage = page,
    nextLimit = limit,
  ) => {
    const trimmedTerm = term.trim();

    setError("");

    setIsLoading(true);
    try {
      if (isMockMode()) {
        const start = (nextPage - 1) * nextLimit;
        setItems(mockPersonnel.slice(start, start + nextLimit));
        setTotal(mockPersonnel.length);
        setPage(nextPage);
        setLimit(nextLimit);
        setHasSearched(true);
        return;
      }

      const response = await searchPersonnel({
        search: trimmedTerm,
        page: nextPage,
        limit: nextLimit,
      });
      setItems(response.items);
      setTotal(response.total);
      setPage(response.page);
      setLimit(response.limit);
      setHasSearched(true);
    } catch {
      setError("Connexion impossible.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPersonnel("", 1, defaultLimit);
  }, []);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadPersonnel(search, 1, limit);
  };

  const handleLimitChange = (nextLimit: number) => {
    void loadPersonnel(search, 1, nextLimit);
  };

  const handlePageChange = (nextPage: number) => {
    void loadPersonnel(search, nextPage, limit);
  };

  const handleActivate = async () => {
    if (!selected) return;

    setError("");
    setIsActivating(true);
    try {
      const response = isMockMode()
        ? {
            account: {
              id: "demo-account",
              personnelId: selected.personnelId,
              matricule: selected.matricule,
              userId: "demo-user",
              fullName: selected.fullName,
              email: selected.email,
              role,
              status: "pending_first_login" as const,
            },
            temporaryPassword: "123456",
          }
        : await activateInternalAccount(selected.personnelId, role);

      setActivationResult(response);
      await loadPersonnel(search, page, limit);
    } catch {
      setError("Connexion impossible.");
    } finally {
      setIsActivating(false);
    }
  };

  const closeActivation = () => {
    setSelected(null);
    setActivationResult(null);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Personnel ANAC</h1>
          <p className="page-subtitle">
            Recherche officielle et activation des comptes internes AIDN.
          </p>
        </div>
      </div>

      <form
        className="surface flex flex-col gap-3 rounded-lg p-4 sm:flex-row"
        onSubmit={handleSearch}
      >
        <input
          className="control min-w-0 flex-1"
          placeholder="Rechercher par matricule, nom, direction ou fonction"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={isLoading}>
          <Search className="h-4 w-4" aria-hidden="true" />
          Rechercher
        </button>
      </form>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="surface overflow-hidden rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-300">
            {!hasSearched
              ? "Chargement du personnel"
              : total === 0
              ? "Aucun resultat"
              : `${firstItem}-${lastItem} sur ${total}`}
          </p>
          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            Lignes par page
            <select
              className="control min-h-9 py-1"
              value={limit}
              onChange={(event) =>
                handleLimitChange(Number(event.target.value))
              }
              disabled={isLoading}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
        <Table className="min-w-[820px]">
          <TableHeader className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <TableRow>
              <TableHead>
                <HeaderLabel icon={Hash}>Matricule</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={UserRound}>Nom complet</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={Building2}>Direction</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={BriefcaseBusiness}>Fonction</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={ShieldCheck}>Statut AIDN</HeaderLabel>
              </TableHead>
              <TableHead className="text-right">
                <HeaderLabel icon={UserPlus}>Action</HeaderLabel>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.personnelId}>
                <TableCell>
                  <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {item.matricule}
                  </span>
                </TableCell>
                <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                  {item.fullName}
                </TableCell>
                <TableCell className="max-w-[220px] truncate text-slate-600 dark:text-slate-300">
                  {item.direction ?? "-"}
                </TableCell>
                <TableCell className="max-w-[220px] truncate text-slate-600 dark:text-slate-300">
                  {item.fonction ?? "-"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <Badge variant={statusBadgeVariant(item)}>{statusLabel(item)}</Badge>
                    {item.aidnRole ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {roleLabel(item.aidnRole)}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    className="btn btn-secondary whitespace-nowrap"
                    type="button"
                    disabled={item.alreadyActivated}
                    onClick={() => setSelected(item)}
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Activer
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {!items.length ? (
              <TableRow>
                <TableCell className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  {isLoading
                    ? "Chargement..."
                    : hasSearched
                      ? "Aucun personnel trouve."
                      : "Chargement du personnel ANAC."}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-300">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              type="button"
              disabled={isLoading || page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Precedent
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={isLoading || page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Suivant
            </button>
          </div>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 px-4">
          <section className="surface w-full max-w-lg rounded-lg p-6">
            {activationResult ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                    Compte active
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Le mot de passe temporaire ci-dessous ne sera affiche qu'une
                    seule fois. Copiez-le et transmettez-le a l'agent par un
                    canal securise.
                  </p>
                </div>
                <div className="rounded-md bg-slate-50 p-4 text-sm dark:bg-slate-900">
                  <p>
                    <span className="font-semibold">Matricule:</span>{" "}
                    {activationResult.account.matricule}
                  </p>
                  <p>
                    <span className="font-semibold">
                      Mot de passe temporaire:
                    </span>{" "}
                    {activationResult.temporaryPassword}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() =>
                      void navigator.clipboard?.writeText(
                        activationResult.temporaryPassword,
                      )
                    }
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Copier le mot de passe
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={closeActivation}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    J'ai copie
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                    Activer le compte
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Personnel: {selected.fullName}
                  </p>
                </div>
                <div className="grid gap-3 text-sm">
                  <p>
                    <span className="font-semibold">Matricule:</span>{" "}
                    {selected.matricule}
                  </p>
                  <label className="font-medium text-slate-700 dark:text-slate-200">
                    Role AIDN
                    <select
                      className="control mt-1 w-full"
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={closeActivation}
                  >
                    Annuler
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={handleActivate}
                    disabled={isActivating}
                  >
                    {isActivating ? "Activation..." : "Activer"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
