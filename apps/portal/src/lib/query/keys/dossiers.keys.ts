export const dossiersKeys = {
  all: ["dossiers"] as const,
  details: () => [...dossiersKeys.all, "detail"] as const,
  detail: (id: string) => [...dossiersKeys.details(), id] as const,
  document: (dossierId: string, documentId: string) =>
    [...dossiersKeys.detail(dossierId), "document", documentId] as const,
};
