export const formalRequestKeys = {
  all: ["formal-request"] as const,
  dossier: (dossierId: string) =>
    [...formalRequestKeys.all, "dossier", dossierId] as const,
  requirement: (dossierId: string, requirementId: string) =>
    [
      ...formalRequestKeys.dossier(dossierId),
      "requirement",
      requirementId,
    ] as const,
  template: (templateId: string) =>
    [...formalRequestKeys.all, "template", templateId] as const,
};
