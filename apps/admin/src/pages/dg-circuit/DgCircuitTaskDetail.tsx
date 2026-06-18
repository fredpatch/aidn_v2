import { Download, FileUp, Printer, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DgCircuitTask } from "@/lib/api/dg-circuit.api";

import { sourceLabels } from "./constants";
import { CourrierTimeline } from "./CourrierTimeline";
import { formatDate } from "./formatters";
import { StatusBadge } from "./StatusBadge";

export function DgCircuitTaskDetail({
  task,
  isSubmitting,
  onPrintDocument,
  onMarkTransmitted,
  onRecordReturn,
  onRecordPhysicalReceipt,
  onDownloadDocument,
}: {
  task: DgCircuitTask | null;
  isSubmitting: boolean;
  onPrintDocument: (task: DgCircuitTask) => void;
  onMarkTransmitted: (task: DgCircuitTask) => void;
  onRecordReturn: (task: DgCircuitTask) => void;
  onRecordPhysicalReceipt: (task: DgCircuitTask) => void;
  onDownloadDocument: (task: DgCircuitTask, documentId: string) => void;
}): React.JSX.Element {
  if (!task) {
    return (
      <div className="mt-4 hidden items-center justify-center rounded-md border border-dashed bg-background p-10 text-sm text-muted-foreground lg:mt-0 lg:flex">
        Selectionnez un courrier pour voir son detail.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4 rounded-md border bg-background p-4 lg:mt-0">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {sourceLabels[task.source] ?? task.source}
          </Badge>
          <StatusBadge bucket={task.bucket} />
        </div>
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          {task.reference || task.subject}
        </h2>
        <p className="text-sm text-muted-foreground">
          {task.organizationName || task.applicantName || "Non renseigne"}
        </p>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Suivi</p>
        <CourrierTimeline task={task} />
      </div>

      <div className="rounded-md border bg-muted/40 p-3 space-y-3">
        {task.bucket === "to_transmit" ? (
          <>
            <div>
              <p className="text-sm font-medium">Action requise</p>
              <p className="text-xs text-muted-foreground">
                Imprimez le document, puis marquez-le en circuit DG quand il
                quitte l'accueil.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onPrintDocument(task)}
                disabled={
                  isSubmitting ||
                  !task.documentToTransmitId ||
                  !task.availableActions.includes("download_outgoing")
                }
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
              <Button
                type="button"
                onClick={() => onMarkTransmitted(task)}
                disabled={
                  isSubmitting ||
                  !task.availableActions.includes("mark_transmitted")
                }
              >
                <Send className="mr-2 h-4 w-4" />
                Marquer en circuit DG
              </Button>
            </div>
          </>
        ) : task.bucket === "awaiting_return" ? (
          <>
            <div>
              <p className="text-sm font-medium">En attente signature DG</p>
              <p className="text-xs text-muted-foreground">
                Televersez le document signe par le DG pour finaliser cette
                etape.
              </p>
            </div>
            {task.availableActions.includes("record_annotated_return") ? (
              <Button
                type="button"
                onClick={() => onRecordReturn(task)}
                disabled={isSubmitting}
              >
                <FileUp className="mr-2 h-4 w-4" />
                Televerser le document signe
              </Button>
            ) : task.availableActions.includes("record_physical_receipt") ? (
              <Button
                type="button"
                onClick={() => onRecordPhysicalReceipt(task)}
                disabled={isSubmitting}
              >
                <FileUp className="mr-2 h-4 w-4" />
                Enregistrer la reception physique
              </Button>
            ) : null}
          </>
        ) : task.bucket === "returned_scanned" ||
          task.bucket === "decision_recorded" ||
          task.bucket === "processed" ? (
          <>
            <div>
              <p className="text-sm font-medium">Signature DG</p>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Type</dt>
              <dd>{sourceLabels[task.source] ?? task.source}</dd>
              {task.organizationName ? (
                <>
                  <dt className="text-muted-foreground">Organisation</dt>
                  <dd>{task.organizationName}</dd>
                </>
              ) : null}
              {task.applicantName ? (
                <>
                  <dt className="text-muted-foreground">Postulant</dt>
                  <dd>{task.applicantName}</dd>
                </>
              ) : null}
              <dt className="text-muted-foreground">Envoi DG</dt>
              <dd>{formatDate(task.sentToDgAt ?? task.transmittedAt)}</dd>
              <dt className="text-muted-foreground">Signature DG</dt>
              <dd>{formatDate(task.returnedFromDgAt ?? task.returnedAt)}</dd>
              {task.decision ? (
                <>
                  <dt className="text-muted-foreground">Suite donnee</dt>
                  <dd>{task.decision}</dd>
                </>
              ) : null}
              {task.orientedDirection ? (
                <>
                  <dt className="text-muted-foreground">Direction</dt>
                  <dd>{task.orientedDirection}</dd>
                </>
              ) : null}
              {task.observations ? (
                <>
                  <dt className="text-muted-foreground">Observations</dt>
                  <dd className="whitespace-pre-line">{task.observations}</dd>
                </>
              ) : null}
            </dl>
            {task.availableActions.includes("download_annotated_return") &&
            task.annotatedReturnDocumentId ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onDownloadDocument(task, task.annotatedReturnDocumentId!)
                }
                disabled={isSubmitting}
              >
                <Download className="mr-2 h-4 w-4" />
                Consulter le document signe
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
