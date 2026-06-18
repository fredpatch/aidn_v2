import {
  downloadDgCircuitTaskDocument,
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
      "Impossible d'ouvrir l'apercu. Autorisez les fenetres contextuelles pour consulter le document.",
    );
    URL.revokeObjectURL(url);
    return;
  }

  targetWindow.document.title = fileName;
  targetWindow.location.href = url;

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function canPreviewOutgoingDocument(task: DgCircuitTask): boolean {
  return Boolean(
    task.documentToTransmitId &&
      task.availableActions.includes("download_outgoing"),
  );
}

export async function previewDgCircuitTaskDocument({
  task,
  documentId,
  previewWindow,
}: {
  task: DgCircuitTask;
  documentId: string;
  previewWindow?: Window | null;
}): Promise<void> {
  const { blob, fileName } = await downloadDgCircuitTaskDocument(
    task.id,
    documentId,
  );
  openBlobPreview(blob, fileName, previewWindow);
}

export async function previewOutgoingDgCircuitDocument(
  task: DgCircuitTask,
  previewWindow?: Window | null,
): Promise<void> {
  if (!task.documentToTransmitId) return;
  await previewDgCircuitTaskDocument({
    task,
    documentId: task.documentToTransmitId,
    previewWindow,
  });
}

export async function markDgCircuitTaskTransmitted(
  task: DgCircuitTask,
): Promise<void> {
  if (task.source === "initial_request" && task.requestId) {
    await markPrintedForDg(task.requestId, {});
    return;
  }

  if (task.source === "pre_evaluation" && task.dossierId) {
    await sendPreEvalToDg(task.dossierId, {});
    return;
  }

  if (task.source === "formal_request" && task.dossierId) {
    await sendFormalRequestToDg(task.dossierId);
  }
}

export async function recordDgCircuitSignedDocument(
  task: DgCircuitTask,
  formData: FormData,
): Promise<void> {
  if (task.source === "initial_request" && task.requestId) {
    await recordDgReturn(task.requestId, formData);
    return;
  }

  if (task.source === "pre_evaluation" && task.dossierId) {
    await recordPreEvalDgReturn(task.dossierId, formData);
    return;
  }

  if (task.source === "formal_request" && task.dossierId) {
    await recordFormalRequestDgReturn(task.dossierId, formData);
  }
}

export async function recordDgCircuitPhysicalReceipt(
  task: DgCircuitTask,
  formData: FormData,
): Promise<void> {
  if (!task.requestId) return;
  await registerPhysicalCourrier(task.requestId, formData);
}
