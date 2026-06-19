import {
  recordFormalRequestDgReturn,
  recordPreEvalDgReturn,
  sendFormalRequestToDg,
  sendPreEvalToDg,
} from "../dossiers";
import {
  markPrintedForDg,
  recordDgReturn,
  registerPhysicalCourrier,
} from "../requests";
import type { DgCircuitTask } from "./types";

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
