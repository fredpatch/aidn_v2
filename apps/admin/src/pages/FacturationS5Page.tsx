import { useEffect, useRef, useState } from "react";
import { Download, FileUp, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, SkeletonCard } from "@/components/states";
import { SplitView } from "@/components/ui/split-view";
import { downloadDossierDocument } from "@/lib/api/dossiers";
import { hasPermission } from "@/lib/auth/permissions";
import { extractError } from "@/lib/utils/error";
import { openBlobInNewTab } from "@/lib/utils/blob";
import { useAuth } from "@/hooks/useAuth";
import {
  listPhasePaymentTasks,
  type PhasePaymentTask,
  type PhasePaymentTaskList,
  type PhasePaymentTaskStatus,
} from "@/lib/api/payments";
import { UploadInvoiceDialog } from "./dossiers/document-evaluation-dialogs";
import {
  ActionError,
  DefinitionGrid,
  Field,
  WaitingState,
} from "./dossiers/dossier-detail.helpers";

// ── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = PhasePaymentTaskStatus | "all";

type ModalState = { kind: "upload-invoice"; task: PhasePaymentTask } | null;

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TABS: Array<{
  key: StatusFilter;
  label: string;
  countKey: keyof PhasePaymentTaskList["counts"];
}> = [
  { key: "invoice_pending", label: "À facturer", countKey: "invoice_pending" },
  { key: "invoice_sent", label: "Facture envoyée", countKey: "invoice_sent" },
  {
    key: "payment_proof_submitted",
    label: "Preuve reçue",
    countKey: "payment_proof_submitted",
  },
  { key: "all", label: "Tous", countKey: "all" },
];

const STATUS_ACCENT: Record<PhasePaymentTaskStatus, string> = {
  invoice_pending: "border-l-amber-400",
  invoice_sent: "border-l-blue-400",
  payment_proof_submitted: "border-l-emerald-400",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function PaymentStatusBadge({
  status,
}: {
  status: PhasePaymentTaskStatus;
}): React.JSX.Element {
  if (status === "payment_proof_submitted") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
      >
        Preuve reçue
      </Badge>
    );
  }
  if (status === "invoice_sent") {
    return (
      <Badge
        variant="outline"
        className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
      >
        Facture envoyée
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
    >
      À facturer
    </Badge>
  );
}

// ── PaymentTaskRow ────────────────────────────────────────────────────────────

function PaymentTaskRow({
  task,
  isSelected,
  onClick,
}: {
  task: PhasePaymentTask;
  isSelected: boolean;
  onClick: () => void;
}): React.JSX.Element {
  const accent = STATUS_ACCENT[task.paymentStatus];
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-md border border-l-4 bg-background p-3 text-left transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected
          ? "border-primary ring-1 ring-primary"
          : `border-slate-200 dark:border-slate-800 ${accent}`,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300">
              {task.dossierNumber ?? `#${task.dossierId.slice(-6).toUpperCase()}`}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              Phase III — Frais d'étude
            </span>
          </div>
          <p className="truncate text-sm font-medium">{task.organizationName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {task.postulantName}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <p className="text-xs text-muted-foreground">
            {formatDate(task.lastActivityAt)}
          </p>
          <PaymentStatusBadge status={task.paymentStatus} />
        </div>
      </div>
    </button>
  );
}

// ── Right detail panel ────────────────────────────────────────────────────────

function DetailPanel({
  task,
  isDownloading,
  canUploadInvoice,
  onDownload,
  onUploadInvoice,
}: {
  task: PhasePaymentTask;
  isDownloading: string | null;
  canUploadInvoice: boolean;
  onDownload: (documentId: string, fileName: string) => void;
  onUploadInvoice: () => void;
}): React.JSX.Element {
  return (
    <div className="space-y-4 rounded-md border bg-background p-4">
      {/* Header */}
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <PaymentStatusBadge status={task.paymentStatus} />
        </div>
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          {task.dossierNumber
            ? `Dossier ${task.dossierNumber}`
            : `Dossier #${task.dossierId.slice(-6).toUpperCase()}`}
        </h2>
        <p className="text-sm text-muted-foreground">{task.organizationName}</p>
      </div>

      {/* Definition grid */}
      <DefinitionGrid>
        <Field label="Organisation">{task.organizationName}</Field>
        <Field label="Postulant">{task.postulantName}</Field>
        {task.postulantEmail ? (
          <Field label="Email postulant">{task.postulantEmail}</Field>
        ) : null}
        <Field label="Phase">Phase III — Évaluation approfondie</Field>
        <Field label="Type de paiement">Frais d'étude</Field>
        <Field label="Statut">
          <PaymentStatusBadge status={task.paymentStatus} />
        </Field>
        {task.invoiceSentAt ? (
          <Field label="Date facture">{formatDate(task.invoiceSentAt)}</Field>
        ) : null}
        {task.paymentProofSubmittedAt ? (
          <Field label="Date preuve paiement">
            {formatDate(task.paymentProofSubmittedAt)}
          </Field>
        ) : null}
      </DefinitionGrid>

      {/* Documents */}
      {task.invoiceDocumentId || task.paymentProofDocumentId ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Documents</p>
          <div className="flex flex-wrap gap-2">
            {task.invoiceDocumentId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDownloading === task.invoiceDocumentId}
                onClick={() =>
                  onDownload(
                    task.invoiceDocumentId!,
                    "facture-frais-etude.pdf",
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                {isDownloading === task.invoiceDocumentId
                  ? "Téléchargement…"
                  : "Télécharger la facture"}
              </Button>
            ) : null}
            {task.paymentProofDocumentId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDownloading === task.paymentProofDocumentId}
                onClick={() =>
                  onDownload(
                    task.paymentProofDocumentId!,
                    "preuve-paiement-frais-etude.pdf",
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                {isDownloading === task.paymentProofDocumentId
                  ? "Téléchargement…"
                  : "Télécharger la preuve de paiement"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Action card */}
      <div className="rounded-md border bg-muted/40 p-3 space-y-3">
        {task.paymentStatus === "invoice_pending" ? (
          <>
            <div>
              <p className="text-sm font-medium">Facture à transmettre</p>
              <p className="text-xs text-muted-foreground">
                Téléversez la facture des frais d'étude pour notifier le
                postulant.
              </p>
            </div>
            {canUploadInvoice ? (
              <Button type="button" size="sm" onClick={onUploadInvoice}>
                <FileUp className="mr-2 h-4 w-4" />
                Téléverser la facture
              </Button>
            ) : (
              <WaitingState>
                Vous pouvez consulter ce dossier, mais vous n'avez pas
                l'autorisation de téléverser la facture.
              </WaitingState>
            )}
          </>
        ) : task.paymentStatus === "invoice_sent" ? (
          <>
            <p className="text-sm font-medium">Facture envoyée</p>
            <p className="text-xs text-muted-foreground">
              En attente de la preuve de paiement du postulant.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">Preuve de paiement reçue</p>
            <p className="text-xs text-muted-foreground">
              La DN peut poursuivre l'évaluation documentaire depuis le dossier.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── FacturationS5Page ─────────────────────────────────────────────────────────

export function FacturationS5Page(): React.JSX.Element {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("invoice_pending");
  const [data, setData] = useState<PhasePaymentTaskList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<PhasePaymentTask | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  const canUploadInvoice = hasPermission(user, "PAYMENT_INVOICE_UPLOAD");

  // Keep a stable ref to the current filter so reload callbacks stay in sync
  const filterRef = useRef(statusFilter);
  filterRef.current = statusFilter;

  const loadTasks = async (filter: StatusFilter) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const fresh = await listPhasePaymentTasks({
        status: filter === "all" ? undefined : filter,
      });
      setData(fresh);
      setSelected((prev) => {
        if (!prev) return fresh.items[0] ?? null;
        return (
          fresh.items.find((t) => t.dossierId === prev.dossierId) ??
          fresh.items[0] ??
          null
        );
      });
    } catch (err) {
      setLoadError(
        extractError(err, "Impossible de charger les tâches de facturation."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks(statusFilter);
  }, [statusFilter]);

  const handleFilterChange = (filter: StatusFilter) => {
    if (filter === statusFilter) {
      void loadTasks(filter);
    } else {
      setStatusFilter(filter);
    }
  };

  const handleDownload = (documentId: string, fileName: string) => {
    if (!selected) return;
    setIsDownloading(documentId);
    setDownloadError("");
    void downloadDossierDocument(selected.dossierId, documentId)
      .then(({ blob }) => openBlobInNewTab(blob, fileName))
      .catch((err) =>
        setDownloadError(
          extractError(err, "Impossible de télécharger le document."),
        ),
      )
      .finally(() => setIsDownloading(null));
  };

  const handleUploadSuccess = () => {
    void loadTasks(filterRef.current);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Facturation S5</h1>
          <p className="page-subtitle">
            Suivi des factures et preuves de paiement des phases OMA.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadTasks(statusFilter)}
          disabled={isLoading}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Load error */}
      {loadError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {loadError}
        </div>
      ) : null}

      {/* KPI chips */}
      {data ? (
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Total", value: data.counts.all },
            { label: "À facturer", value: data.counts.invoice_pending },
            { label: "Facture envoyée", value: data.counts.invoice_sent },
            {
              label: "Preuve reçue",
              value: data.counts.payment_proof_submitted,
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="min-w-[80px] rounded-md border bg-background px-3 py-2 text-center"
            >
              <p className="text-xl font-semibold tabular-nums">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Split workspace */}
      <SplitView
        left={
          <div className="space-y-3">
            {/* Status filter tabs */}
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => (
                <Button
                  key={tab.key}
                  type="button"
                  variant={statusFilter === tab.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange(tab.key)}
                >
                  {tab.label}
                  {data
                    ? ` (${data.counts[tab.countKey] ?? 0})`
                    : ""}
                </Button>
              ))}
            </div>

            {/* Task list */}
            {isLoading ? (
              <div className="grid gap-2">
                <SkeletonCard lines={3} />
                <SkeletonCard lines={3} />
                <SkeletonCard lines={3} />
              </div>
            ) : data && data.items.length > 0 ? (
              <div className="grid gap-2">
                {data.items.map((task) => (
                  <PaymentTaskRow
                    key={task.dossierId}
                    task={task}
                    isSelected={selected?.dossierId === task.dossierId}
                    onClick={() => setSelected(task)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="Aucun dossier dans cette catégorie." />
            )}
          </div>
        }
        right={
          selected ? (
            <div className="mt-4 lg:mt-0 space-y-3">
              {downloadError ? <ActionError message={downloadError} /> : null}
              <DetailPanel
                task={selected}
                isDownloading={isDownloading}
                canUploadInvoice={canUploadInvoice}
                onDownload={handleDownload}
                onUploadInvoice={() =>
                  setModal({ kind: "upload-invoice", task: selected })
                }
              />
            </div>
          ) : (
            <div className="mt-4 hidden items-center justify-center rounded-md border border-dashed bg-background p-10 text-sm text-muted-foreground lg:mt-0 lg:flex">
              Sélectionnez un dossier pour afficher les détails de facturation.
            </div>
          )
        }
      />

      {/* Upload invoice dialog */}
      <UploadInvoiceDialog
        open={modal?.kind === "upload-invoice"}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
        dossierId={
          modal?.kind === "upload-invoice" ? modal.task.dossierId : ""
        }
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
