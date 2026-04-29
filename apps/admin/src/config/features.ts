export const FEATURES = {
  dashboard: { label: 'Tableau de bord', enabled: true },
  reports: { label: 'Rapports', enabled: true },
  demandes: { label: 'Demandes', enabled: true },
  courriers: { label: 'Courriers / Orientation DG', enabled: true },
  dossiers: { label: 'Dossiers DN', enabled: true },
  workflowOma: { label: 'Workflow OMA', enabled: true },
  documents: { label: 'Documents', enabled: true },
  reunions: { label: 'Réunions', enabled: true },
  certificats: { label: 'Certificats', enabled: true },
  settings: { label: 'Paramètres', enabled: true },
} as const;

export type FeatureKey = keyof typeof FEATURES;
