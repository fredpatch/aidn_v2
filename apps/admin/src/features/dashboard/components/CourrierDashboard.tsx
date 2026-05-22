import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SkeletonCard } from "@/components/states";
import { ApiError } from "@/lib/api/client";
import {
  listDgCircuitTasks,
  type DgCircuitTask,
} from "@/lib/api/dg-circuit.api";

const sourceLabels: Record<string, string> = {
  initial_request: "Courrier initial",
  pre_evaluation: "Formulaire de pré-évaluation",
};

function formatDate(value?: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isThisWeek(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function RecentCourrierRow({
  task,
  onOpen,
}: {
  task: DgCircuitTask;
  onOpen: () => void;
}): React.JSX.Element {
  const displayName = task.organizationName || task.applicantName;

  return (
    <div className="flex items-start gap-3 rounded-md border bg-background p-3 sm:items-center">
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        aria-hidden="true"
      >
        {getInitials(displayName)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-xs">
            {sourceLabels[task.source] ?? task.source}
          </Badge>
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs"
          >
            Traité
          </Badge>
        </div>
        <p className="truncate text-sm font-medium">
          {task.reference || task.subject}
        </p>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0 text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-slate-500 dark:text-slate-400">
              Organisation
            </span>{" "}
            {task.organizationName ?? "Organisation non renseignée"}
          </span>
          {task.applicantName ? (
            <span>
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Postulant
              </span>{" "}
              {task.applicantName}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Traité le
          </span>{" "}
          {formatDate(task.processedAt)}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={onOpen}
          title="Voir dans les courriers officiels"
        >
          <ExternalLink className="mr-1.5 h-3 w-3" />
          Ouvrir
        </Button>
      </div>
    </div>
  );
}

export function CourrierDashboard(): React.JSX.Element {
  const navigate = useNavigate();
  const [items, setItems] = useState<DgCircuitTask[]>([]);
  const [counts, setCounts] = useState({
    toTransmit: 0,
    awaitingReturn: 0,
    processed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setError("");
    listDgCircuitTasks({})
      .then((res) => {
        setItems(res.items);
        setCounts(res.counts);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError && err.status === 401
            ? "Session expirée. Veuillez vous reconnecter."
            : "Chargement impossible.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const processed = items.filter((t) => t.bucket === "processed");
    return {
      processedToday: processed.filter((t) => isToday(t.processedAt)).length,
      processedThisWeek: processed.filter((t) => isThisWeek(t.processedAt))
        .length,
      initialInProgress: items.filter(
        (t) => t.source === "initial_request" && t.bucket !== "processed",
      ).length,
      preEvalInProgress: items.filter(
        (t) => t.source === "pre_evaluation" && t.bucket !== "processed",
      ).length,
      recentProcessed: processed
        .slice()
        .sort((a, b) =>
          (b.processedAt ?? "").localeCompare(a.processedAt ?? ""),
        )
        .slice(0, 5),
    };
  }, [items]);

  const openCircuit = () => void navigate("/circuit-dg");

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">
            Activité courrier - circuit officiel DG.
          </p>
        </div>
        <Button type="button" onClick={openCircuit}>
          <Send className="mr-2 h-4 w-4" />
          Ouvrir les courriers officiels
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 text-base font-semibold">Activité courrier</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            id="to-print"
            title="Courriers à imprimer"
            value={counts.toTransmit}
            isLoading={isLoading}
          />
          <MetricCard
            id="in-circuit"
            title="En circuit officiel"
            value={counts.awaitingReturn}
            isLoading={isLoading}
          />
          <MetricCard
            id="today"
            title="Traités aujourd'hui"
            value={stats.processedToday}
            isLoading={isLoading}
          />
          <MetricCard
            id="week"
            title="Traités cette semaine"
            value={stats.processedThisWeek}
            isLoading={isLoading}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold">Répartition en cours</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            id="initial"
            title="Courriers initiaux"
            value={stats.initialInProgress}
            subtitle="En cours de traitement"
            isLoading={isLoading}
          />
          <MetricCard
            id="preeval"
            title="Formulaires de pré-évaluation"
            value={stats.preEvalInProgress}
            subtitle="En cours de traitement"
            isLoading={isLoading}
          />
          <MetricCard
            id="awaiting"
            title="Retours en attente"
            value={counts.awaitingReturn}
            subtitle="Documents signés non encore reçus"
            isLoading={isLoading}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold">Derniers traitements</h2>
        {isLoading ? (
          <div className="grid gap-2">
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </div>
        ) : stats.recentProcessed.length > 0 ? (
          <div className="grid gap-2">
            {stats.recentProcessed.map((task) => (
              <RecentCourrierRow
                key={task.id}
                task={task}
                onOpen={openCircuit}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Aucun traitement récent
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Les courriers traités apparaîtront ici.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
