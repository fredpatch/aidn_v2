export type DocumentTemplate = {
  id: string;
  code: string;
  title: string;
  documentType: string;
  phaseKey?: string;
  fileDocumentId: string;
  isActive: boolean;
};

export type ListDocumentTemplatesFilters = {
  documentType?: string;
  phaseKey?: string;
  isActive?: boolean;
};
