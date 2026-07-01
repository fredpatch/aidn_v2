import { apiGet, apiGetBlob } from '../client';
import type { DgCircuitTaskFilters, DgCircuitTasksResponse } from './types';
import { buildDgCircuitTaskDocumentPath, buildDgCircuitTasksPath } from './utils';

export type {
  DgCircuitAction,
  DgCircuitBucket,
  DgCircuitSource,
  DgCircuitTask,
  DgCircuitTaskFilters,
  DgCircuitTasksResponse,
} from './types';
export {
  markDgCircuitTaskTransmitted,
  recordDgCircuitPhysicalReceipt,
  recordDgCircuitSignedDocument,
} from './workflow';

export function listDgCircuitTasks(
  filters: DgCircuitTaskFilters,
): Promise<DgCircuitTasksResponse> {
  return apiGet<DgCircuitTasksResponse>(buildDgCircuitTasksPath(filters));
}

export function downloadDgCircuitTaskDocument(
  taskId: string,
  documentId: string,
): Promise<{ blob: Blob; fileName: string }> {
  return apiGetBlob(buildDgCircuitTaskDocumentPath(taskId, documentId));
}
