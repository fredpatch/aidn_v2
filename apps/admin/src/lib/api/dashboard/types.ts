export type DashboardPreset = 'today' | '7d' | 'month' | 'year' | 'custom';

export type DashboardProfile = 'dn_full' | 'courrier_dg';

export type AdminDashboardResponse = {
  profile: DashboardProfile;
  generatedAt?: string;
  period: {
    from: string;
    to: string;
    preset: DashboardPreset;
  };
  periodStats: {
    requestsReceived: number;
    requestsBySource: {
      portalUpload: number;
      physicalDeposit: number;
      internalScan: number;
      unknown: number;
    };
    initialDecisions?: {
      orientedToDn: number;
      rejected: number;
      reoriented: number;
    };
    requestsOrientedToDn: number;
    requestsRejectedOrReoriented: number;
    dossiersOpened: number;
    phasesClosed: number;
    certificatesCollected: number;
  };
  currentWorkload: {
    dgToPrint: number;
    dgAwaitingReturn: number;
    dgReturnedToRecord: number;
    activeDossiers: number;
    unassignedDossiers: number;
    documentsToReview: number;
    correctionsWaitingPostulant: number;
    missingExpectedDocuments: number;
    upcomingMeetings: number;
    certificatesSignedStamped: number;
    certificatesReadyForCollection: number;
    certificatesCollected: number;
    overduePhases: number;
    phasesReadyToClose: number;
  };
  phaseFocus: Array<{
    phaseKey: string;
    label: string;
    implemented: boolean;
    currentDossiers: number;
    closedInPeriod: number;
    overdue: number;
    expectedBusinessDays: number;
  }>;
  priorityActions: Array<{
    type: string;
    label: string;
    priority: 'normal' | 'warning';
    entityLabel?: string;
    dueLabel?: string;
    occurredAt?: string;
  }>;
  recentActivity: Array<{
    type: string;
    label: string;
    actorName?: string;
    entityLabel?: string;
    documentName?: string;
    occurredAt: string;
  }>;
  meta?: {
    unavailableMetrics?: string[];
    cacheGaps?: string[];
  };
};

export type AdminDashboardParams = {
  preset?: DashboardPreset;
  from?: string;
  to?: string;
};
