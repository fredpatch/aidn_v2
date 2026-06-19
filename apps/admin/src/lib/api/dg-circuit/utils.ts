import type { DgCircuitTaskFilters } from './types';

export function buildDgCircuitTasksPath(filters: DgCircuitTaskFilters): string {
  const params = new URLSearchParams();
  if (filters.bucket) params.set('bucket', filters.bucket);
  if (filters.source) params.set('source', filters.source);
  if (filters.search) params.set('search', filters.search);

  const query = params.toString();
  return `/api/v1/admin/dg-circuit/tasks${query ? `?${query}` : ''}`;
}

export function buildDgCircuitTaskDocumentPath(taskId: string, documentId: string): string {
  return `/api/v1/admin/dg-circuit/tasks/${encodeURIComponent(taskId)}/documents/${documentId}`;
}
