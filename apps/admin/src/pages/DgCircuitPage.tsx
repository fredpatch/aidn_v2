import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileUp,
  Printer,
  RefreshCcw,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, SkeletonCard } from "@/components/states";
import { SplitView } from "@/components/ui/split-view";
import { ApiError } from "@/lib/api/client";
import {
  downloadDgCircuitTaskDocument,
  listDgCircuitTasks,
  type DgCircuitBucket,
  type DgCircuitTask,
} from "@/lib/api/dg-circuit.api";
import {
  markPrintedForDg,
  recordDgReturn,
  registerPhysicalCourrier,
} from "@/lib/api/requests.api";
import {
  recordFormalRequestDgReturn,
  recordPreEvalDgReturn,
  sendFormalRequestToDg,
  sendPreEvalToDg,
} from "@/lib/api/dossiers.api";

type DgCircuitTaskCounts = {
  toTransmit: number;
  awaitingReturn: number;
  returnedScanned: number;
  decisionRecorded: number;
  processed: number;
};

type ModalState =
  | { kind: "print-confirm"; task: DgCircuitTask }
  | { kind: "dg-return"; task: DgCircuitTask }
  | { kind: "physical-receipt"; task: DgCircuitTask }
  | null;

const bucketTabs: Array<{
  key: DgCircuitBucket | "all";
  label: string;
  countKey?: keyof DgCircuitTaskCounts;
}> = [
  { key: "all", label: "Tous" },
  { key: "to_transmit", label: "À imprimer", countKey: "toTransmit" },
  { key: "awaiting_return", label: "En circuit", countKey: "awaitingReturn" },
  {
    key: "returned_scanned",
    label: "Retours enregistrés",
    countKey: "returnedScanned",
  },
  {
    key: "decision_recorded",
    label: "Décision enregistrée",
    countKey: "decisionRecorded",
  },
];

const sourceLabels: Record<string, string> = {
  initial_request: "Demande initiale",
  pre_evaluation: "Formulaire de pré-évaluation",
  formal_request: "Demande formelle",
};

const bucketStyle: Record<
  DgCircuitBucket,
  { icon: React.ReactNode; accentBorder: string; iconBg: string }
> = {
  to_transmit: {
    icon: <Printer className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
    accentBorder: "border-l-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
  },
  awaiting_return: {
    icon: <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    accentBorder: "border-l-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
  },
  returns_to_register: {
    icon: <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    accentBorder: "border-l-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
  },
  returned_scanned: {
    icon: <FileCheck2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />,
    accentBorder: "border-l-teal-400",
    iconBg: "bg-teal-50 dark:bg-teal-950/40",
  },
  decision_recorded: {
    icon: (
      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    ),
    accentBorder: "border-l-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  processed: {
    icon: (
      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    ),
    accentBorder: "border-l-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
};

function CourrierTaskRow({
  task,
  isSelected,
  onClick,
}: {
  task: DgCircuitTask;
  isSelected: boolean;
  onClick: () => void;
}): React.JSX.Element {
  const style = bucketStyle[task.bucket] ?? bucketStyle.to_transmit;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-md border border-l-4 bg-background p-3 text-left transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected
          ? "border-primary ring-1 ring-primary"
          : `border-slate-200 dark:border-slate-800 ${style.accentBorder}`,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {/* Icon slot */}
        <div
          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${style.iconBg}`}
          aria-hidden="true"
        >
          {style.icon}
        </div>

        {/* Content slot */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              {sourceLabels[task.source] ?? task.source}
            </Badge>
          </div>
          <p className="truncate text-sm font-medium">
            {task.reference || task.subject}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {task.organizationName || task.applicantName || "Non renseigné"}
          </p>
        </div>

        {/* Toolbar slot */}
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <p className="text-xs text-muted-foreground">
            {formatDate(task.submittedAt)}
          </p>
          <StatusBadge bucket={task.bucket} />
        </div>
      </div>
    </button>
  );
}

function formatDate(value?: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function openBlobPreview(
  blob: Blob,
  fileName: string,
  previewWindow?: Window | null,
): void {
  const url = URL.createObjectURL(blob);
  const targetWindow =
    previewWindow && !previewWindow.closed
      ? previewWindow
      : window.open("about:blank", "_blank");

  if (!targetWindow) {
    window.alert(
      "Impossible d'ouvrir l'aperçu. Autorisez les fenêtres contextuelles pour consulter le document.",
    );
    URL.revokeObjectURL(url);
    return;
  }

  targetWindow.document.title = fileName;
  targetWindow.location.href = url;

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401)
      return "Session expirée. Veuillez vous reconnecter.";
    return err.message;
  }
  return "Une erreur est survenue.";
}

function StatusBadge({
  bucket,
}: {
  bucket: DgCircuitBucket;
}): React.JSX.Element {
  if (bucket === "decision_recorded" || bucket === "processed") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700"
      >
        Décision saisie
      </Badge>
    );
  }
  if (bucket === "returned_scanned") {
    return (
      <Badge
        variant="outline"
        className="border-teal-200 bg-teal-50 text-teal-700"
      >
        Retour DG enregistré
      </Badge>
    );
  }
  if (bucket === "awaiting_return") {
    return <Badge variant="secondary">En circuit DG</Badge>;
  }
  return <Badge variant="outline">À imprimer</Badge>;
}

function CourrierTimeline({
  task,
}: {
  task: DgCircuitTask;
}): React.JSX.Element {
  const documentUploaded = !!(
    task.annotatedReturnDocumentId ||
    task.returnedFromDgAt ||
    task.returnedAt ||
    task.processedAt
  );
  const steps = [
    { label: "Reçu", date: task.submittedAt, done: !!task.submittedAt },
    {
      label: "Imprimé / mis en circuit",
      date: task.transmittedAt,
      done: !!task.transmittedAt,
    },
    {
      label: "Signé ou annoté",
      date: task.returnedFromDgAt ?? task.returnedAt,
      done: !!(task.returnedFromDgAt || task.returnedAt),
    },
    {
      label: "Téléversé",
      date: task.processedAt ?? task.returnedFromDgAt ?? task.returnedAt,
      done: documentUploaded,
    },
  ];

  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <div
            className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 ${
              step.done
                ? "border-emerald-500 bg-emerald-500"
                : "border-slate-300 bg-white dark:bg-slate-950"
            }`}
          />
          <div>
            <p
              className={`text-sm font-medium ${step.done ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
            >
              {step.label}
            </p>
            {step.date ? (
              <p className="text-xs text-muted-foreground">
                {formatDate(step.date)}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function PrintConfirmDialog({
  task,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  task: DgCircuitTask;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}): React.JSX.Element {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer la mise en circuit</DialogTitle>
          <DialogDescription>
            {task.reference || task.subject}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Le document a-t-il été imprimé et placé dans le circuit officiel ?
        </p>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement…" : "Oui, marquer mis en circuit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DgReturnDialog({
  task,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  task: DgCircuitTask;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [decision, setDecision] = useState<
    "oriented_to_dn" | "cancelled_by_dg"
  >("oriented_to_dn");
  const [returnedAt, setReturnedAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [localError, setLocalError] = useState("");

  const submit = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setLocalError("Le scan du retour est obligatoire.");
      return;
    }

    const form = new FormData();
    if (task.source === "initial_request") {
      form.set("returnedScannedDocument", file);
      form.set("decision", decision);
    } else {
      form.set("file", file);
    }
    if (returnedAt) {
      form.set(
        task.source === "formal_request" ? "returnedFromDgAt" : "returnedAt",
        returnedAt,
      );
    }
    if (notes.trim()) {
      form.set("notes", notes.trim());
      form.set("observations", notes.trim());
    }
    onSubmit(form);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Téléverser le retour signé/annoté</DialogTitle>
          <DialogDescription>
            {task.reference || task.subject}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {task.source === "initial_request" ? (
            <div className="space-y-1">
              <Label htmlFor="dg-decision">Décision</Label>
              <select
                id="dg-decision"
                className="control"
                value={decision}
                onChange={(event) =>
                  setDecision(
                    event.target.value as "oriented_to_dn" | "cancelled_by_dg",
                  )
                }
              >
                <option value="oriented_to_dn">Orientée DN</option>
                <option value="cancelled_by_dg">Annulée par DG</option>
              </select>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="dg-return-file">Scan annoté *</Label>
              <Input
                id="dg-return-file"
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dg-return-date">Date retour</Label>
              <Input
                id="dg-return-date"
                type="date"
                value={returnedAt}
                onChange={(event) => setReturnedAt(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="dg-return-notes">Observations</Label>
            <Textarea
              id="dg-return-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </div>
          {localError ? (
            <p className="text-sm text-red-600">{localError}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="button" onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhysicalReceiptDialog({
  task,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  task: DgCircuitTask;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [physicalDepositDate, setPhysicalDepositDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [officialReference, setOfficialReference] = useState("");
  const [notes, setNotes] = useState("");
  const [localError, setLocalError] = useState("");

  const submit = () => {
    const file = fileRef.current?.files?.[0];
    if (!physicalDepositDate || !file) {
      setLocalError("La date de dépôt et le scan sont obligatoires.");
      return;
    }

    const form = new FormData();
    form.set("physicalDepositDate", physicalDepositDate);
    form.set("file", file);
    if (officialReference.trim())
      form.set("officialReference", officialReference.trim());
    if (notes.trim()) form.set("notes", notes.trim());
    onSubmit(form);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer la réception physique</DialogTitle>
          <DialogDescription>
            {task.reference || task.subject}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="receipt-date">Date dépôt réel *</Label>
              <Input
                id="receipt-date"
                type="date"
                value={physicalDepositDate}
                onChange={(event) => setPhysicalDepositDate(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="receipt-reference">Référence officielle</Label>
              <Input
                id="receipt-reference"
                value={officialReference}
                onChange={(event) => setOfficialReference(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="receipt-file">Scan courrier *</Label>
            <Input
              id="receipt-file"
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="receipt-notes">Notes</Label>
            <Textarea
              id="receipt-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </div>
          {localError ? (
            <p className="text-sm text-red-600">{localError}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="button" onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DgCircuitPage(): React.JSX.Element {
  const [bucket, setBucket] = useState<DgCircuitBucket | "all">("all");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<{
    items: DgCircuitTask[];
    counts: DgCircuitTaskCounts;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<DgCircuitTask | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  const filters = useMemo(
    () => ({
      bucket: bucket === "all" ? undefined : bucket,
      search: search.trim() || undefined,
    }),
    [bucket, search],
  );

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const fresh = await listDgCircuitTasks(filters);
      setData(fresh);
      if (selected) {
        const freshSelected =
          fresh.items.find((t) => t.id === selected.id) ?? null;
        setSelected(freshSelected);
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filters]);

  const runAction = async (action: () => Promise<unknown>) => {
    setIsSubmitting(true);
    setError("");
    try {
      await action();
      setModal(null);
      const fresh = await listDgCircuitTasks(filters);
      setData(fresh);
      if (selected) {
        const freshSelected =
          fresh.items.find((t) => t.id === selected.id) ?? null;
        setSelected(freshSelected);
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintAndCircuit = async (task: DgCircuitTask) => {
    const previewWindow =
      task.documentToTransmitId &&
      task.availableActions.includes("download_outgoing")
        ? window.open("about:blank", "_blank")
        : null;

    if (
      task.documentToTransmitId &&
      task.availableActions.includes("download_outgoing")
    ) {
      setIsSubmitting(true);
      setError("");
      try {
        const { blob, fileName } = await downloadDgCircuitTaskDocument(
          task.id,
          task.documentToTransmitId,
        );
        openBlobPreview(blob, fileName, previewWindow);
      } catch (err) {
        previewWindow?.close();
        setError(formatApiError(err));
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
    }
    setModal({ kind: "print-confirm", task });
  };

  const markTransmitted = (task: DgCircuitTask) => {
    void runAction(async () => {
      if (task.source === "initial_request" && task.requestId) {
        await markPrintedForDg(task.requestId, {});
      } else if (task.source === "pre_evaluation" && task.dossierId) {
        await sendPreEvalToDg(task.dossierId, {});
      } else if (task.source === "formal_request" && task.dossierId) {
        await sendFormalRequestToDg(task.dossierId);
      }
    });
  };

  const downloadDocument = (task: DgCircuitTask, documentId?: string) => {
    if (!documentId) return;
    const previewWindow = window.open("about:blank", "_blank");
    void runAction(async () => {
      const { blob, fileName } = await downloadDgCircuitTaskDocument(
        task.id,
        documentId,
      );
      openBlobPreview(blob, fileName, previewWindow);
    });
  };

  const submitReturn = (task: DgCircuitTask, formData: FormData) => {
    void runAction(async () => {
      if (task.source === "initial_request" && task.requestId) {
        await recordDgReturn(task.requestId, formData);
      } else if (task.source === "pre_evaluation" && task.dossierId) {
        await recordPreEvalDgReturn(task.dossierId, formData);
      } else if (task.source === "formal_request" && task.dossierId) {
        await recordFormalRequestDgReturn(task.dossierId, formData);
      }
    });
  };

  const submitPhysicalReceipt = (task: DgCircuitTask, formData: FormData) => {
    if (!task.requestId) return;
    void runAction(() => registerPhysicalCourrier(task.requestId!, formData));
  };

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Courriers officiels</h1>
          <p className="page-subtitle">
            Impression, mise en circuit et téléversement des retours signés.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void load()}
          disabled={isLoading}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {data ? (
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Total", value: data.items.length },
            { label: "À imprimer", value: data.counts.toTransmit },
            { label: "En circuit", value: data.counts.awaitingReturn },
            { label: "Retours DG", value: data.counts.returnedScanned },
            { label: "Décisions saisies", value: data.counts.decisionRecorded },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-md border bg-background px-3 py-2 text-center min-w-[80px]"
            >
              <p className="text-xl font-semibold tabular-nums">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      <SplitView
        left={
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {bucketTabs.map((tab) => (
                <Button
                  key={tab.key}
                  type="button"
                  variant={bucket === tab.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBucket(tab.key)}
                >
                  {tab.label}
                  {tab.countKey ? ` (${data?.counts[tab.countKey] ?? 0})` : ""}
                </Button>
              ))}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Référence, organisme, postulant…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="grid gap-2">
                <SkeletonCard lines={3} />
                <SkeletonCard lines={3} />
                <SkeletonCard lines={3} />
              </div>
            ) : data && data.items.length > 0 ? (
              <div className="grid gap-2">
                {data.items.map((task) => (
                  <CourrierTaskRow
                    key={task.id}
                    task={task}
                    isSelected={selected?.id === task.id}
                    onClick={() => setSelected(task)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="Aucun courrier dans cette vue. Les courriers traités restent disponibles via les filtres Retours enregistrés ou Décision enregistrée." />
            )}
          </div>
        }
        right={
          selected ? (
            <div className="mt-4 space-y-4 rounded-md border bg-background p-4 lg:mt-0">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {sourceLabels[selected.source] ?? selected.source}
                  </Badge>
                  <StatusBadge bucket={selected.bucket} />
                </div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                  {selected.reference || selected.subject}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selected.organizationName ||
                    selected.applicantName ||
                    "Non renseigné"}
                </p>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium">Suivi</p>
                <CourrierTimeline task={selected} />
              </div>

              <div className="rounded-md border bg-muted/40 p-3 space-y-3">
                {selected.bucket === "to_transmit" ? (
                  <>
                    <div>
                      <p className="text-sm font-medium">Action requise</p>
                      <p className="text-xs text-muted-foreground">
                        Imprimez le document et placez-le dans le circuit
                        officiel (DG / parapheur).
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => void handlePrintAndCircuit(selected)}
                      disabled={isSubmitting}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimer et marquer mis en circuit
                    </Button>
                  </>
                ) : selected.bucket === "awaiting_return" ? (
                  <>
                    <div>
                      <p className="text-sm font-medium">
                        En attente du retour signé
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Téléversez le document signé ou annoté reçu du DG.
                      </p>
                    </div>
                    {selected.availableActions.includes(
                      "record_annotated_return",
                    ) ? (
                      <Button
                        type="button"
                        onClick={() =>
                          setModal({ kind: "dg-return", task: selected })
                        }
                        disabled={isSubmitting}
                      >
                        <FileUp className="mr-2 h-4 w-4" />
                        Téléverser le retour signé/annoté
                      </Button>
                    ) : selected.availableActions.includes(
                        "record_physical_receipt",
                      ) ? (
                      <Button
                        type="button"
                        onClick={() =>
                          setModal({ kind: "physical-receipt", task: selected })
                        }
                        disabled={isSubmitting}
                      >
                        <FileUp className="mr-2 h-4 w-4" />
                        Enregistrer la réception physique
                      </Button>
                    ) : null}
                  </>
                ) : selected.bucket === "returned_scanned" ||
                  selected.bucket === "decision_recorded" ||
                  selected.bucket === "processed" ? (
                  <>
                    <div>
                      <p className="text-sm font-medium">Traçabilité</p>
                    </div>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                      <dt className="text-muted-foreground">Type</dt>
                      <dd>
                        {sourceLabels[selected.source] ?? selected.source}
                      </dd>
                      {selected.organizationName ? (
                        <>
                          <dt className="text-muted-foreground">
                            Organisation
                          </dt>
                          <dd>{selected.organizationName}</dd>
                        </>
                      ) : null}
                      {selected.applicantName ? (
                        <>
                          <dt className="text-muted-foreground">Postulant</dt>
                          <dd>{selected.applicantName}</dd>
                        </>
                      ) : null}
                      <dt className="text-muted-foreground">Envoi DG</dt>
                      <dd>
                        {formatDate(
                          selected.sentToDgAt ?? selected.transmittedAt,
                        )}
                      </dd>
                      <dt className="text-muted-foreground">Retour DG</dt>
                      <dd>
                        {formatDate(
                          selected.returnedFromDgAt ?? selected.returnedAt,
                        )}
                      </dd>
                      {selected.decision ? (
                        <>
                          <dt className="text-muted-foreground">Décision</dt>
                          <dd>{selected.decision}</dd>
                        </>
                      ) : null}
                      {selected.orientedDirection ? (
                        <>
                          <dt className="text-muted-foreground">Direction</dt>
                          <dd>{selected.orientedDirection}</dd>
                        </>
                      ) : null}
                      {selected.observations ? (
                        <>
                          <dt className="text-muted-foreground">
                            Observations
                          </dt>
                          <dd className="whitespace-pre-line">
                            {selected.observations}
                          </dd>
                        </>
                      ) : null}
                    </dl>
                    {selected.availableActions.includes(
                      "download_annotated_return",
                    ) && selected.annotatedReturnDocumentId ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          downloadDocument(
                            selected,
                            selected.annotatedReturnDocumentId,
                          )
                        }
                        disabled={isSubmitting}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Consulter le retour DG
                      </Button>
                    ) : null}
                    {/* formal_request: no separate decision step - scanned return is the evidence */}
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-4 hidden items-center justify-center rounded-md border border-dashed bg-background p-10 text-sm text-muted-foreground lg:mt-0 lg:flex">
              Sélectionnez un courrier pour voir son détail.
            </div>
          )
        }
      />

      {modal?.kind === "print-confirm" ? (
        <PrintConfirmDialog
          task={modal.task}
          isSubmitting={isSubmitting}
          onClose={() => setModal(null)}
          onConfirm={() => markTransmitted(modal.task)}
        />
      ) : null}

      {modal?.kind === "dg-return" ? (
        <DgReturnDialog
          task={modal.task}
          isSubmitting={isSubmitting}
          onClose={() => setModal(null)}
          onSubmit={(formData) => submitReturn(modal.task, formData)}
        />
      ) : null}

      {modal?.kind === "physical-receipt" ? (
        <PhysicalReceiptDialog
          task={modal.task}
          isSubmitting={isSubmitting}
          onClose={() => setModal(null)}
          onSubmit={(formData) => submitPhysicalReceipt(modal.task, formData)}
        />
      ) : null}
    </div>
  );
}
