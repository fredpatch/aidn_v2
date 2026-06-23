import { Download, FileUp, Printer, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DgCircuitTask } from "@/lib/api/dg-circuit";

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
      <Card className="mt-4 hidden items-center justify-center lg:mt-0 lg:flex">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Selectionnez un courrier pour voir son detail.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 lg:mt-0">
      <CardHeader className="border-b pb-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {sourceLabels[task.source] ?? task.source}
          </Badge>
          <StatusBadge bucket={task.bucket} />
        </div>
        <CardTitle className="text-lg">
          {task.reference || task.subject}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {task.organizationName || task.applicantName || "Non renseigne"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div>
          <p className="mb-3 text-sm font-medium">Suivi</p>
          <CourrierTimeline task={task} />
        </div>

        <Separator className="my-2" />

        <div className="space-y-3 rounded-md border bg-muted/40 p-3">
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
      </CardContent>
    </Card>
  );
}
