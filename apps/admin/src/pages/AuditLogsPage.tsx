import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  BadgeCheck,
  CalendarClock,
  Database,
  Fingerprint,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { listAuditLogs, type AuditLog } from "../lib/api/admin.api";
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

const defaultLimit = 8;

const mockLogs: AuditLog[] = [
  {
    _id: "demo-log",
    createdAt: new Date().toISOString(),
    actorRole: "admin",
    actor: {
      id: "demo-user",
      fullName: "Agent Demo",
      matricule: "DEMO001",
      role: "admin",
      userType: "internal",
    },
    action: "admin.internal_account_activated",
    entityType: "aidn_internal_account",
    status: "success",
  },
];

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  bootstrap_admin: "Administrateur initial",
  dn_supervisor: "Superviseur DN",
  dn_agent: "Agent DN",
  dg_secretariat: "Secretariat DG",
  reception: "Reception",
  bureau_courrier: "Bureau courrier",
  postulant: "Postulant",
};

const actionLabels: Record<string, string> = {
  "admin.internal_account_activated": "Compte interne active",
  "admin.internal_account_reactivated": "Compte interne reactive",
  "admin.internal_account_role_changed": "Role de compte modifie",
  "auth.bootstrap_login_success": "Connexion administrateur initiale",
  "auth.bootstrap_login_failed": "Echec connexion administrateur",
  "auth.internal_login_success": "Connexion agent",
  "auth.internal_login_failed": "Echec connexion agent",
  "auth.internal_password_change_success": "Mot de passe modifie",
  "auth.internal_password_change_failed": "Echec changement mot de passe",
};

const entityLabels: Record<string, string> = {
  auth: "Authentification",
  user: "Utilisateur",
  aidn_internal_account: "Compte interne",
};

function formatDate(value?: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function actorDisplay(log: AuditLog): { name: string; details: string } {
  const name =
    log.actor?.fullName ||
    (log.actorId ? "Utilisateur non retrouve" : "Acteur systeme");
  const role =
    roleLabels[log.actor?.role ?? log.actorRole ?? ""] ??
    log.actor?.role ??
    log.actorRole ??
    "-";
  const matricule = log.actor?.matricule
    ? `Matricule ${log.actor.matricule}`
    : undefined;
  const technicalId =
    !log.actor?.fullName && log.actorId ? `ID ${log.actorId}` : undefined;

  return {
    name,
    details: [matricule, role, technicalId].filter(Boolean).join(" - "),
  };
}

function actionLabel(action: string): string {
  return actionLabels[action] ?? action;
}

function entityLabel(entityType: string): string {
  return entityLabels[entityType] ?? entityType;
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

export function AuditLogsPage(): React.JSX.Element {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const firstItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, total);

  const loadLogs = async (nextPage = page, nextLimit = limit) => {
    setError("");
    setIsLoading(true);
    try {
      if (isMockMode()) {
        const start = (nextPage - 1) * nextLimit;
        setItems(mockLogs.slice(start, start + nextLimit));
        setTotal(mockLogs.length);
        setPage(nextPage);
        setLimit(nextLimit);
        return;
      }

      const response = await listAuditLogs({
        page: nextPage,
        limit: nextLimit,
      });
      setItems(response.items);
      setTotal(response.total);
      setPage(response.page);
      setLimit(response.limit);
    } catch {
      setError("Connexion impossible.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs(1, defaultLimit);
  }, []);

  const handleLimitChange = (nextLimit: number) => {
    void loadLogs(1, nextLimit);
  };

  const handlePageChange = (nextPage: number) => {
    void loadLogs(nextPage, limit);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Journal d'audit</h1>
          <p className="page-subtitle">
            Lecture des actions sensibles de la plateforme.
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="surface overflow-hidden rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-300">
            {total === 0
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
        <Table className="min-w-[860px]">
          <TableHeader className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <TableRow>
              <TableHead>
                <HeaderLabel icon={CalendarClock}>Date</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={UserRound}>Acteur</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={Fingerprint}>Action</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={Database}>Entite</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={ShieldCheck}>Statut</HeaderLabel>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const actor = actorDisplay(item);

              return (
                <TableRow key={item._id}>
                  <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {actor.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {actor.details}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-200">
                    {actionLabel(item.action)}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">
                    {entityLabel(item.entityType)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      <BadgeCheck className="mr-1 h-3 w-3" aria-hidden={true} />
                      {item.status ?? "OK"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {!items.length ? (
              <TableRow>
                <TableCell
                  className="px-4 py-8 text-center text-slate-500"
                  colSpan={5}
                >
                  {isLoading ? "Chargement..." : "Aucune entree."}
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
    </div>
  );
}
