import { useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SplitView } from "@/components/ui/split-view";
import { useAppToast } from "@/hooks/useAppToast";
import {
  type DgCircuitBucket,
  type DgCircuitSource,
  type DgCircuitTask,
} from "@/lib/api/dg-circuit";
import {
  useDgCircuitTasks,
  useMarkDgCircuitTaskTransmitted,
  useRecordDgCircuitPhysicalReceipt,
  useRecordDgCircuitSignedDocument,
} from "@/lib/query";
import {
  canPreviewOutgoingDocument,
  previewDgCircuitTaskDocument,
  previewOutgoingDgCircuitDocument,
} from "./dg-circuit/actions";
import { formatApiError } from "./dg-circuit/formatters";
import { DgReturnDialog } from "./dg-circuit/DgReturnDialog";
import { DgCircuitFilters } from "./dg-circuit/DgCircuitFilters";
import { DgCircuitKpis } from "./dg-circuit/DgCircuitKpis";
import { DgCircuitTaskDetail } from "./dg-circuit/DgCircuitTaskDetail";
import { DgCircuitTaskList } from "./dg-circuit/DgCircuitTaskList";
import { PhysicalReceiptDialog } from "./dg-circuit/PhysicalReceiptDialog";
import { PrintConfirmDialog } from "./dg-circuit/PrintConfirmDialog";
import type { DgCircuitModalState } from "./dg-circuit/types";

const validBuckets: Array<DgCircuitBucket | "all"> = [
  "all",
  "to_transmit",
  "awaiting_return",
  "returns_to_register",
  "returned_scanned",
  "decision_recorded",
  "processed",
];

const validSources: Array<DgCircuitSource | "all"> = [
  "all",
  "initial_request",
  "pre_evaluation",
  "formal_request",
];

function readBucketParam(value: string | null): DgCircuitBucket | "all" {
  return validBuckets.includes(value as DgCircuitBucket | "all")
    ? (value as DgCircuitBucket | "all")
    : "all";
}

function readSourceParam(value: string | null): DgCircuitSource | "all" {
  return validSources.includes(value as DgCircuitSource | "all")
    ? (value as DgCircuitSource | "all")
    : "all";
}

export function DgCircuitPage(): React.JSX.Element {
  const toast = useAppToast();
  const [searchParams] = useSearchParams();
  const [bucket, setBucket] = useState<DgCircuitBucket | "all">(() =>
    readBucketParam(searchParams.get("bucket")),
  );
  const [source, setSource] = useState<DgCircuitSource | "all">(() =>
    readSourceParam(searchParams.get("source")),
  );
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queryError, setQueryError] = useState("");
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<DgCircuitTask | null>(null);
  const [modal, setModal] = useState<DgCircuitModalState>(null);

  const filters = useMemo(
    () => ({
      bucket: bucket === "all" ? undefined : bucket,
      source: source === "all" ? undefined : source,
      search: search.trim() || undefined,
    }),
    [bucket, search, source],
  );

  const tasksQuery = useDgCircuitTasks(filters);
  const markTransmittedMutation = useMarkDgCircuitTaskTransmitted();
  const recordSignedDocumentMutation = useRecordDgCircuitSignedDocument();
  const recordPhysicalReceiptMutation = useRecordDgCircuitPhysicalReceipt();
  const data = tasksQuery.data ?? null;
  const isLoading = tasksQuery.isLoading || tasksQuery.isFetching;

  useEffect(() => {
    if (!data) return;

    const nextSelected = selected
      ? (data.items.find((task) => task.id === selected.id) ??
        data.items[0] ??
        null)
      : (data.items[0] ?? null);

    // If we had a selected task but it's gone from the current filtered list
    if (
      selected &&
      !data.items.find((task) => task.id === selected.id) &&
      prevSelectedId === selected.id
    ) {
      toast.info("Le courrier a été traité ou déplacé vers un autre statut.");
    }

    setSelected(nextSelected);
    setPrevSelectedId(nextSelected?.id ?? null);
  }, [data, toast]);

  useEffect(() => {
    if (tasksQuery.error) {
      setQueryError(formatApiError(tasksQuery.error));
    } else if (data) {
      setQueryError("");
    }
  }, [tasksQuery.error, data]);

  useEffect(() => {
    setBucket(readBucketParam(searchParams.get("bucket")));
    setSource(readSourceParam(searchParams.get("source")));
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  const runAction = async (
    action: () => Promise<unknown>,
    messages?: { success?: string; error?: string },
  ) => {
    setIsSubmitting(true);
    try {
      await action();
      setModal(null);
      if (messages?.success) {
        toast.success(messages.success);
      }
    } catch (err) {
      const message = formatApiError(err);
      toast.error(messages?.error ?? message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const printDocument = async (task: DgCircuitTask) => {
    const previewWindow = canPreviewOutgoingDocument(task)
      ? window.open("about:blank", "_blank")
      : null;

    if (!canPreviewOutgoingDocument(task)) return;

    setIsSubmitting(true);
    try {
      await previewOutgoingDgCircuitDocument(task, previewWindow);
      toast.success("Document ouvert pour impression.");
    } catch (err) {
      previewWindow?.close();
      const message = formatApiError(err);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const markTransmitted = (task: DgCircuitTask) => {
    void runAction(() => markTransmittedMutation.mutateAsync({ task }), {
      success: "Courrier marque en circuit DG.",
      error: "Impossible de marquer le courrier en circuit DG.",
    });
  };

  const downloadDocument = (task: DgCircuitTask, documentId?: string) => {
    if (!documentId) return;
    const previewWindow = window.open("about:blank", "_blank");
    void runAction(
      () =>
        previewDgCircuitTaskDocument({
          task,
          documentId,
          previewWindow,
        }),
      {
        success: "Document ouvert.",
        error: "Impossible d'ouvrir le document.",
      },
    );
  };

  const submitReturn = (task: DgCircuitTask, formData: FormData) => {
    void runAction(
      () => recordSignedDocumentMutation.mutateAsync({ task, formData }),
      {
        success: "Document signe DG enregistre.",
        error: "Impossible d'enregistrer le document signe DG.",
      },
    );
  };

  const submitPhysicalReceipt = (task: DgCircuitTask, formData: FormData) => {
    void runAction(
      () => recordPhysicalReceiptMutation.mutateAsync({ task, formData }),
      {
        success: "Reception physique enregistree.",
        error: "Impossible d'enregistrer la reception physique.",
      },
    );
  };

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Courriers officiels</h1>
          <p className="page-subtitle">
            Impression, mise en circuit DG et televersement des documents
            signes.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void tasksQuery.refetch()}
          disabled={isLoading}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {queryError ? (
        <Alert variant="destructive">
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>{queryError}</AlertDescription>
        </Alert>
      ) : null}

      {data ? (
        <DgCircuitKpis total={data.items.length} counts={data.counts} />
      ) : null}

      <SplitView
        left={
          <div className="space-y-3">
            <DgCircuitFilters
              bucket={bucket}
              counts={data?.counts}
              search={search}
              source={source}
              onBucketChange={setBucket}
              onSearchChange={setSearch}
              onSourceChange={setSource}
            />
            <DgCircuitTaskList
              isLoading={isLoading}
              tasks={data?.items}
              selectedTaskId={selected?.id}
              onSelectTask={setSelected}
            />
          </div>
        }
        right={
          <DgCircuitTaskDetail
            task={selected}
            isSubmitting={isSubmitting}
            onPrintDocument={(task) => void printDocument(task)}
            onMarkTransmitted={(task) =>
              setModal({ kind: "transmit-confirm", task })
            }
            onRecordReturn={(task) => setModal({ kind: "dg-return", task })}
            onRecordPhysicalReceipt={(task) =>
              setModal({ kind: "physical-receipt", task })
            }
            onDownloadDocument={downloadDocument}
          />
        }
      />

      {modal?.kind === "transmit-confirm" ? (
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
