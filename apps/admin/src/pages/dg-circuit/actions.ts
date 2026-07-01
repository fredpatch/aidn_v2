import {
  downloadDgCircuitTaskDocument,
  type DgCircuitTask,
} from "@/lib/api/dg-circuit";

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
