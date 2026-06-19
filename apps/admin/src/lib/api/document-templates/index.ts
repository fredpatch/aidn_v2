import { apiGet, apiPostForm } from '../client';
import type { DocumentTemplate, ListDocumentTemplatesFilters } from './types';
import { buildDocumentTemplatesPath } from './utils';

export type { DocumentTemplate, ListDocumentTemplatesFilters } from './types';

export function listDocumentTemplates(
  filters: ListDocumentTemplatesFilters = {},
): Promise<{ items: DocumentTemplate[] }> {
  return apiGet<{ items: DocumentTemplate[] }>(buildDocumentTemplatesPath(filters));
}

export function uploadDocumentTemplate(formData: FormData): Promise<DocumentTemplate> {
  return apiPostForm<DocumentTemplate>('/api/v1/admin/document-templates', formData);
}
