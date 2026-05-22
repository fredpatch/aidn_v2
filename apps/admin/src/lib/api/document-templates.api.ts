import { apiGet, apiPostForm } from './client';

export type DocumentTemplate = {
  id: string;
  code: string;
  title: string;
  documentType: string;
  phaseKey?: string;
  fileDocumentId: string;
  isActive: boolean;
};

export function listDocumentTemplates(filters: {
  documentType?: string;
  isActive?: boolean;
} = {}): Promise<{ items: DocumentTemplate[] }> {
  const params = new URLSearchParams();
  if (filters.documentType) params.set('documentType', filters.documentType);
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
  const query = params.toString();
  return apiGet<{ items: DocumentTemplate[] }>(
    `/api/v1/admin/document-templates${query ? `?${query}` : ''}`,
  );
}

export function uploadDocumentTemplate(formData: FormData): Promise<DocumentTemplate> {
  return apiPostForm<DocumentTemplate>('/api/v1/admin/document-templates', formData);
}
