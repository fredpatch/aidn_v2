import type { Role } from "../../shared/permissions/permissions.js";

export type DashboardPreset = "today" | "7d" | "month" | "year" | "custom";

export type DashboardPeriod = {
  preset: DashboardPreset;
  from: string;
  to: string;
};

export type DashboardQuery = {
  preset?: string;
  from?: string;
  to?: string;
};

export type DashboardProfile = "dn_full" | "courrier_dg";

export type DashboardRecentActivity = {
  id: string;
  type:
    | "request"
    | "dossier"
    | "dg_review"
    | "document"
    | "meeting"
    | "phase";
  label: string;
  occurredAt: string;
  relatedId: string;
};

export type DashboardPhaseFocus = {
  phaseKey: string;
  label: string;
  implemented: boolean;
  currentDossiers: number;
  closedInPeriod: number;
  overdue: number;
  expectedBusinessDays: number;
};

export type DashboardPriorityAction = {
  type: string;
  label: string;
  priority: "normal" | "warning";
  entityLabel?: string;
  dueLabel?: string;
  occurredAt?: string;
};

export type AdminDashboardSummary = {
  generatedAt: string;
  period: DashboardPeriod;
  profile: DashboardProfile;
  periodStats: {
    requestsReceived: number;
    requestsBySource: {
      portalUpload: number;
      physicalDeposit: number;
      internalScan: number;
      unknown: number;
    };
    initialDecisions: {
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
    overduePhases: number;
    phasesReadyToClose: number;
    certificatesSignedStamped: number;
    certificatesReadyForCollection: number;
    certificatesCollected: number;
  };
  phaseFocus: DashboardPhaseFocus[];
  priorityActions: DashboardPriorityAction[];
  recentActivity: DashboardRecentActivity[];
  alerts: Array<{
    key: string;
    severity: "info" | "warning";
    label: string;
    count: number;
  }>;
  meta: {
    unavailableMetrics: string[];
    cacheGaps: string[];
  };
};
