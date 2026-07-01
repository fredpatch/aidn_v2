import type { ListDocumentTemplatesFilters } from './types';

export function buildDocumentTemplatesPath(
  filters: ListDocumentTemplatesFilters = {},
): string {
  const params = new URLSearchParams();
  if (filters.documentType) params.set('documentType', filters.documentType);
  if (filters.phaseKey) params.set('phaseKey', filters.phaseKey);
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));

  const query = params.toString();
  return `/api/v1/admin/document-templates${query ? `?${query}` : ''}`;
}
