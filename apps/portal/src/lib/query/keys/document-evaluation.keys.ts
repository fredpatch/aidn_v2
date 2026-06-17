export const documentEvaluationKeys = {
  all: ["document-evaluation"] as const,
  dossier: (dossierId: string) =>
    [...documentEvaluationKeys.all, "dossier", dossierId] as const,
  correction: (evaluationId: string) =>
    [...documentEvaluationKeys.all, "correction", evaluationId] as const,
};
