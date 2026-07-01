import type { Types } from "mongoose";

import type { AuthUser } from "../../shared/guards/auth-context.js";
import { CourrierModel } from "../courriers/courrier.model.js";
import { DGReviewModel } from "../dg-reviews/dg-review.model.js";
import { DocumentModel } from "../documents/document.model.js";
import { DocumentRequirementModel } from "../documents/document-requirement.model.js";
import { DocumentSubmissionModel } from "../documents/document-submission.model.js";
import { DossierModel } from "../dossiers/dossier.model.js";
import { MeetingModel } from "../meetings/meeting.model.js";
import { OmaPhaseModel } from "../oma-phases/index.js";
import { getAdminFormalRequestPhase } from "../oma-phases/index.js";
import { RequestModel } from "../requests/request.model.js";
import {
  countElapsedBusinessDays,
  getDashboardProfile,
  resolveDashboardPeriod,
  toIso,
} from "./dashboard.helpers.js";
import type {
  AdminDashboardSummary,
  DashboardQuery,
  DashboardPhaseFocus,
  DashboardPriorityAction,
  DashboardRecentActivity,
} from "./dashboard.types.js";

type LooseRecord = Record<string, unknown> & { _id: Types.ObjectId };

const ACTIVE_DOSSIER_STATUSES = {
  $nin: ["closed", "cancelled", "suspended"],
};

const ACTIVE_PHASE_STATUSES = [
  "in_progress",
  "waiting_postulant",
  "waiting_dg",
  "waiting_meeting",
  "ready_to_close",
];

const ACTIVE_SUBMISSION_STATUSES = [
  "submitted",
  "under_review",
  "validated",
  "requires_correction",
  "incomplete",
];

const NON_ACTIONABLE_RETURNED_DG_TARGET_TYPES = [
  "initial_request",
  "pre_evaluation_form",
  "formal_request",
];

const PHASE_EXPECTED_BUSINESS_DAYS: Record<string, number> = {
  preliminary: 30,
  formal_request: 10,
  document_evaluation: 30,
  inspection: 25,
  delivery: 5,
};

const PHASE_LABELS: Record<string, string> = {
  preliminary: "Phase préliminaire",
  formal_request: "Demande formelle",
  document_evaluation: "Évaluation documentaire",
  inspection: "Inspection / démonstration",
  delivery: "Délivrance",
};

const IMPLEMENTED_PHASES = new Set(["preliminary", "formal_request"]);

const periodMatch = (fromDate: Date, toDate: Date) => ({
  $gte: fromDate,
  $lte: toDate,
});

const countInitialDecision = (
  decision: "oriented_to_dn" | "rejected" | "reoriented",
  fromDate: Date,
  toDate: Date,
) =>
  DGReviewModel.countDocuments({
    targetType: "initial_request",
    decision,
    decisionRecordedAt: periodMatch(fromDate, toDate),
  });

const actionableReturnedDgReviewFilter = () => ({
  status: "returned_scanned",
  targetType: { $nin: NON_ACTIONABLE_RETURNED_DG_TARGET_TYPES },
  $or: [
    { decisionRecordedAt: { $exists: false } },
    { decisionRecordedAt: null },
  ],
});

const listCurrentActiveDossierIds = async () => {
  const activePhases = (await OmaPhaseModel.find({
    status: { $in: ACTIVE_PHASE_STATUSES },
  })
    .select("dossierId")
    .lean()) as unknown as Array<{ dossierId?: Types.ObjectId | string }>;

  const phaseDossierIds = [
    ...new Set(
      activePhases
        .map((phase) => (phase.dossierId ? String(phase.dossierId) : ""))
        .filter(Boolean),
    ),
  ];

  if (phaseDossierIds.length === 0) return [];

  const dossiers = (await DossierModel.find({
    _id: { $in: phaseDossierIds },
    status: ACTIVE_DOSSIER_STATUSES,
  })
    .select("_id")
    .lean()) as unknown as Array<{ _id: Types.ObjectId }>;

  return dossiers.map((dossier) => dossier._id.toString());
};

const countUnassignedActiveDossiers = async (activeDossierIds: string[]) => {
  if (activeDossierIds.length === 0) return 0;

  return DossierModel.countDocuments({
    _id: { $in: activeDossierIds },
    $or: [
      { assignedDnAgentId: { $exists: false } },
      { assignedDnAgentId: null },
    ],
  });
};

const countActiveDocumentSubmissions = async (
  activeDossierIds: string[],
  statuses: string[],
) => {
  if (activeDossierIds.length === 0) return 0;

  return DocumentSubmissionModel.countDocuments({
    dossierId: { $in: activeDossierIds },
    status: { $in: statuses },
  });
};

const zeroDnWorkload = (summary: AdminDashboardSummary) => {
  summary.currentWorkload.activeDossiers = 0;
  summary.currentWorkload.unassignedDossiers = 0;
  summary.currentWorkload.documentsToReview = 0;
  summary.currentWorkload.correctionsWaitingPostulant = 0;
  summary.currentWorkload.missingExpectedDocuments = 0;
  summary.currentWorkload.upcomingMeetings = 0;
  summary.currentWorkload.overduePhases = 0;
  summary.currentWorkload.phasesReadyToClose = 0;
  summary.phaseFocus = summary.phaseFocus.map((phase) => ({
    ...phase,
    currentDossiers: 0,
    closedInPeriod: 0,
    overdue: 0,
  }));
  summary.priorityActions = summary.priorityActions.filter((action) =>
    action.type.startsWith("dg_"),
  );
};

const countMissingExpectedDocumentsForCurrentPhases = async () => {
  const phases = (await OmaPhaseModel.find({
    status: { $in: ACTIVE_PHASE_STATUSES },
  }).lean()) as unknown as LooseRecord[];

  if (phases.length === 0) return 0;

  const dossierIds = [...new Set(phases.map((phase) => String(phase.dossierId)))];
  const dossiers = (await DossierModel.find({
    _id: { $in: dossierIds },
    status: ACTIVE_DOSSIER_STATUSES,
  }).lean()) as unknown as LooseRecord[];
  const dossierTypeById = new Map(
    dossiers.map((dossier) => [dossier._id.toString(), String(dossier.dossierType)]),
  );

  let missing = 0;

  for (const phase of phases) {
    const dossierId = String(phase.dossierId);
    const dossierType = dossierTypeById.get(dossierId);
    if (!dossierType) continue;

    const requirements = (await DocumentRequirementModel.find({
      phaseKey: String(phase.phaseKey),
      requirementLevel: "expected",
      isActive: true,
      $or: [
        { appliesToRequestTypes: { $exists: false } },
        { appliesToRequestTypes: { $size: 0 } },
        { appliesToRequestTypes: dossierType },
      ],
    }).lean()) as unknown as LooseRecord[];

    for (const requirement of requirements) {
      const existing = await DocumentSubmissionModel.exists({
        dossierId: phase.dossierId,
        phaseId: phase._id,
        requirementId: requirement._id,
        status: { $in: ACTIVE_SUBMISSION_STATUSES },
      });

      if (!existing) missing += 1;
    }
  }

  return missing;
};

const countOverduePhases = async () => {
  const phases = (await OmaPhaseModel.find({
    status: { $in: ACTIVE_PHASE_STATUSES },
    startedAt: { $exists: true },
  }).lean()) as unknown as LooseRecord[];

  return phases.filter((phase) => {
    const threshold = PHASE_EXPECTED_BUSINESS_DAYS[String(phase.phaseKey)] ?? 30;
    const startedAt = phase.startedAt ? new Date(String(phase.startedAt)) : null;
    return startedAt
      ? countElapsedBusinessDays(startedAt) > threshold
      : false;
  }).length;
};

const listOverduePhases = async () => {
  const phases = (await OmaPhaseModel.find({
    status: { $in: ACTIVE_PHASE_STATUSES },
    startedAt: { $exists: true },
  }).lean()) as unknown as LooseRecord[];

  return phases.filter((phase) => {
    const threshold = PHASE_EXPECTED_BUSINESS_DAYS[String(phase.phaseKey)] ?? 30;
    const startedAt = phase.startedAt ? new Date(String(phase.startedAt)) : null;
    return startedAt
      ? countElapsedBusinessDays(startedAt) > threshold
      : false;
  });
};

const countReadyToClosePhases = async (actor: AuthUser) => {
  const preliminary = await OmaPhaseModel.countDocuments({
    phaseKey: "preliminary",
    $or: [
      { status: "ready_to_close" },
      { preliminaryStatus: "preliminary_ready_to_close" },
    ],
  });

  const formalPhases = (await OmaPhaseModel.find({
    phaseKey: "formal_request",
    status: { $in: ACTIVE_PHASE_STATUSES },
  }).lean()) as unknown as LooseRecord[];

  let formal = 0;
  for (const phase of formalPhases) {
    try {
      const state = await getAdminFormalRequestPhase(String(phase.dossierId), actor);
      if (state.phase.canClosePhase) formal += 1;
    } catch {
      // Ignore malformed/incomplete phase records for read-only dashboard counts.
    }
  }

  return preliminary + formal;
};

const buildPhaseFocus = async (
  fromDate: Date,
  toDate: Date,
): Promise<DashboardPhaseFocus[]> => {
  const [activePhases, closedInPeriod, overduePhases] = await Promise.all([
    OmaPhaseModel.find({ status: { $in: ACTIVE_PHASE_STATUSES } }).lean(),
    OmaPhaseModel.find({ closedAt: periodMatch(fromDate, toDate) }).lean(),
    listOverduePhases(),
  ]);

  const activeCounts = new Map<string, number>();
  const closedCounts = new Map<string, number>();
  const overdueCounts = new Map<string, number>();

  for (const phase of activePhases as unknown as LooseRecord[]) {
    const key = String(phase.phaseKey);
    activeCounts.set(key, (activeCounts.get(key) ?? 0) + 1);
  }

  for (const phase of closedInPeriod as unknown as LooseRecord[]) {
    const key = String(phase.phaseKey);
    closedCounts.set(key, (closedCounts.get(key) ?? 0) + 1);
  }

  for (const phase of overduePhases) {
    const key = String(phase.phaseKey);
    overdueCounts.set(key, (overdueCounts.get(key) ?? 0) + 1);
  }

  return Object.entries(PHASE_LABELS).map(([phaseKey, label]) => ({
    phaseKey,
    label,
    implemented: IMPLEMENTED_PHASES.has(phaseKey),
    currentDossiers: activeCounts.get(phaseKey) ?? 0,
    closedInPeriod: closedCounts.get(phaseKey) ?? 0,
    overdue: overdueCounts.get(phaseKey) ?? 0,
    expectedBusinessDays: PHASE_EXPECTED_BUSINESS_DAYS[phaseKey] ?? 30,
  }));
};

const buildPriorityActions = async (
  activeDossierIds: string[],
): Promise<DashboardPriorityAction[]> => {
  const [returnedReviews, unassignedDossiers, submissions, overduePhases] =
    await Promise.all([
      DGReviewModel.find(actionableReturnedDgReviewFilter())
        .sort({ returnedFromDgAt: 1, updatedAt: 1 })
        .limit(4)
        .lean(),
      activeDossierIds.length > 0
        ? DossierModel.find({
            _id: { $in: activeDossierIds },
            $or: [
              { assignedDnAgentId: { $exists: false } },
              { assignedDnAgentId: null },
            ],
          })
            .sort({ openedAt: 1 })
            .limit(4)
            .lean()
        : Promise.resolve([]),
      activeDossierIds.length > 0
        ? DocumentSubmissionModel.find({
            dossierId: { $in: activeDossierIds },
            status: { $in: ["submitted", "under_review", "requires_correction"] },
          })
            .sort({ createdAt: 1 })
            .limit(4)
            .lean()
        : Promise.resolve([]),
      listOverduePhases(),
    ]);

  const documentIds = [
    ...new Set(
      (submissions as unknown as LooseRecord[])
        .map((submission) => String(submission.documentId ?? ""))
        .filter(Boolean),
    ),
  ];
  const requirementIds = [
    ...new Set(
      (submissions as unknown as LooseRecord[])
        .map((submission) => String(submission.requirementId ?? ""))
        .filter(Boolean),
    ),
  ];
  const submissionDossierIds = [
    ...new Set(
      (submissions as unknown as LooseRecord[])
        .map((submission) => String(submission.dossierId ?? ""))
        .filter(Boolean),
    ),
  ];

  const [documents, requirements, submissionDossiers] = await Promise.all([
    documentIds.length > 0
      ? DocumentModel.find({ _id: { $in: documentIds } }).lean()
      : Promise.resolve([]),
    requirementIds.length > 0
      ? DocumentRequirementModel.find({ _id: { $in: requirementIds } }).lean()
      : Promise.resolve([]),
    submissionDossierIds.length > 0
      ? DossierModel.find({ _id: { $in: submissionDossierIds } }).lean()
      : Promise.resolve([]),
  ]);

  const documentById = new Map(
    (documents as unknown as LooseRecord[]).map((document) => [
      document._id.toString(),
      document,
    ]),
  );
  const requirementById = new Map(
    (requirements as unknown as LooseRecord[]).map((requirement) => [
      requirement._id.toString(),
      requirement,
    ]),
  );
  const dossierById = new Map(
    (submissionDossiers as unknown as LooseRecord[]).map((dossier) => [
      dossier._id.toString(),
      dossier,
    ]),
  );

  const actions: DashboardPriorityAction[] = [];

  for (const review of returnedReviews as unknown as LooseRecord[]) {
    actions.push({
      type: "dg_return_record",
      label: "Retour DG à traiter",
      priority: "warning",
      entityLabel: String(review.targetType ?? "Circuit DG"),
      occurredAt:
        toIso(review.returnedFromDgAt as Date | string | undefined) ??
        toIso(review.updatedAt as Date | string | undefined),
    });
  }

  for (const dossier of unassignedDossiers as unknown as LooseRecord[]) {
    actions.push({
      type: "dossier_assignment",
      label: "Dossier non assigné",
      priority: "warning",
      entityLabel: dossier.dossierNumber
        ? `Dossier ${String(dossier.dossierNumber)}`
        : "Dossier DN",
      occurredAt: toIso(dossier.openedAt as Date | string | undefined),
    });
  }

  for (const submission of submissions as unknown as LooseRecord[]) {
    const requiresCorrection = String(submission.status) === "requires_correction";
    const document = documentById.get(String(submission.documentId ?? ""));
    const requirement = requirementById.get(String(submission.requirementId ?? ""));
    const dossier = dossierById.get(String(submission.dossierId ?? ""));
    const documentLabel =
      (document?.title ? String(document.title) : undefined) ??
      (document?.fileName ? String(document.fileName) : undefined) ??
      (requirement?.label ? String(requirement.label) : undefined) ??
      PHASE_LABELS[String(submission.phaseKey)] ??
      "Document";
    const dossierLabel = dossier?.dossierNumber
      ? `Dossier ${String(dossier.dossierNumber)}`
      : PHASE_LABELS[String(submission.phaseKey)];

    actions.push({
      type: requiresCorrection ? "document_correction" : "document_review",
      label: requiresCorrection
        ? "Correction postulant en attente"
        : "Document à vérifier",
      priority: requiresCorrection ? "normal" : "warning",
      entityLabel: documentLabel,
      dueLabel: dossierLabel,
      occurredAt: toIso(submission.createdAt as Date | string | undefined),
    });
  }

  for (const phase of overduePhases.slice(0, 4)) {
    actions.push({
      type: "phase_overdue",
      label: "Phase en retard",
      priority: "warning",
      entityLabel: PHASE_LABELS[String(phase.phaseKey)] ?? "Phase OMA",
      dueLabel: `${PHASE_EXPECTED_BUSINESS_DAYS[String(phase.phaseKey)] ?? 30} jours ouvrés`,
      occurredAt: toIso(phase.startedAt as Date | string | undefined),
    });
  }

  return actions
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "warning" ? -1 : 1;
      return (
        new Date(a.occurredAt ?? 0).getTime() -
        new Date(b.occurredAt ?? 0).getTime()
      );
    })
    .slice(0, 8);
};

const upcomingWindow = () => {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 30);
  return { now, end };
};

const addActivity = (
  items: DashboardRecentActivity[],
  input: Omit<DashboardRecentActivity, "occurredAt"> & {
    occurredAt?: string;
  },
) => {
  if (!input.occurredAt) return;
  items.push({ ...input, occurredAt: input.occurredAt });
};

const listRecentActivity = async () => {
  const [requests, dossiers, dgReviews, submissions, meetings, phases] =
    await Promise.all([
      RequestModel.find({}).sort({ createdAt: -1 }).limit(8).lean(),
      DossierModel.find({}).sort({ openedAt: -1 }).limit(8).lean(),
      DGReviewModel.find({})
        .sort({ decisionRecordedAt: -1, returnedFromDgAt: -1, sentToDgAt: -1 })
        .limit(8)
        .lean(),
      DocumentSubmissionModel.find({}).sort({ createdAt: -1 }).limit(8).lean(),
      MeetingModel.find({ scheduledAt: { $exists: true } })
        .sort({ scheduledAt: -1 })
        .limit(8)
        .lean(),
      OmaPhaseModel.find({ closedAt: { $exists: true } })
        .sort({ closedAt: -1 })
        .limit(8)
        .lean(),
    ]);

  const items: DashboardRecentActivity[] = [];

  for (const request of requests as unknown as LooseRecord[]) {
    addActivity(items, {
      id: `request:${request._id.toString()}`,
      type: "request",
      label: "Demande reçue",
      relatedId: request._id.toString(),
      occurredAt: toIso(request.createdAt as Date | string | undefined),
    });
  }

  for (const dossier of dossiers as unknown as LooseRecord[]) {
    addActivity(items, {
      id: `dossier:${dossier._id.toString()}`,
      type: "dossier",
      label: "Dossier ouvert",
      relatedId: dossier._id.toString(),
      occurredAt: toIso(dossier.openedAt as Date | string | undefined),
    });
  }

  for (const review of dgReviews as unknown as LooseRecord[]) {
    const occurredAt =
      toIso(review.decisionRecordedAt as Date | string | undefined) ??
      toIso(review.returnedFromDgAt as Date | string | undefined) ??
      toIso(review.sentToDgAt as Date | string | undefined);
    addActivity(items, {
      id: `dg_review:${review._id.toString()}`,
      type: "dg_review",
      label: "Circuit DG mis à jour",
      relatedId: review._id.toString(),
      occurredAt,
    });
  }

  for (const submission of submissions as unknown as LooseRecord[]) {
    addActivity(items, {
      id: `document:${submission._id.toString()}`,
      type: "document",
      label: "Document déposé",
      relatedId: submission._id.toString(),
      occurredAt: toIso(submission.createdAt as Date | string | undefined),
    });
  }

  for (const meeting of meetings as unknown as LooseRecord[]) {
    addActivity(items, {
      id: `meeting:${meeting._id.toString()}`,
      type: "meeting",
      label: "Réunion planifiée",
      relatedId: meeting._id.toString(),
      occurredAt: toIso(meeting.scheduledAt as Date | string | undefined),
    });
  }

  for (const phase of phases as unknown as LooseRecord[]) {
    addActivity(items, {
      id: `phase:${phase._id.toString()}`,
      type: "phase",
      label: "Phase clôturée",
      relatedId: phase._id.toString(),
      occurredAt: toIso(phase.closedAt as Date | string | undefined),
    });
  }

  return items
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
    .slice(0, 10);
};

export const getAdminDashboardSummary = async (
  query: DashboardQuery,
  actor: AuthUser,
): Promise<AdminDashboardSummary> => {
  const { period, fromDate, toDate } = resolveDashboardPeriod(query);
  const profile = getDashboardProfile(actor.role);
  const { now, end } = upcomingWindow();
  const activeDossierIds = await listCurrentActiveDossierIds();

  const [
    requestsReceived,
    portalUpload,
    physicalDeposit,
    internalScan,
    orientedToDn,
    rejected,
    reoriented,
    dossiersOpened,
    phasesClosed,
    dgToPrint,
    dgAwaitingReturn,
    dgReturnedToRecord,
    activeDossiers,
    unassignedDossiers,
    documentsToReview,
    correctionsWaitingPostulant,
    missingExpectedDocuments,
    upcomingMeetings,
    overduePhases,
    phasesReadyToClose,
    phaseFocus,
    priorityActions,
    recentActivity,
  ] = await Promise.all([
    RequestModel.countDocuments({ createdAt: periodMatch(fromDate, toDate) }),
    RequestModel.countDocuments({
      courrierSource: "portal_upload",
      createdAt: periodMatch(fromDate, toDate),
    }),
    RequestModel.countDocuments({
      courrierSource: "physical_deposit",
      createdAt: periodMatch(fromDate, toDate),
    }),
    CourrierModel.countDocuments({
      source: "internal_scan",
      createdAt: periodMatch(fromDate, toDate),
    }),
    countInitialDecision("oriented_to_dn", fromDate, toDate),
    countInitialDecision("rejected", fromDate, toDate),
    countInitialDecision("reoriented", fromDate, toDate),
    DossierModel.countDocuments({ openedAt: periodMatch(fromDate, toDate) }),
    OmaPhaseModel.countDocuments({ closedAt: periodMatch(fromDate, toDate) }),
    RequestModel.countDocuments({
      status: {
        $in: [
          "submitted",
          "courrier_uploaded",
          "courrier_physical_declared",
          "intake_in_review",
        ],
      },
      $or: [
        { "intake.printedForDgAt": { $exists: false } },
        { "intake.printedForDgAt": null },
      ],
    }),
    DGReviewModel.countDocuments({
      status: { $in: ["sent_to_dg_circuit", "awaiting_return"] },
    }),
    DGReviewModel.countDocuments(actionableReturnedDgReviewFilter()),
    Promise.resolve(activeDossierIds.length),
    countUnassignedActiveDossiers(activeDossierIds),
    countActiveDocumentSubmissions(activeDossierIds, [
      "submitted",
      "under_review",
    ]),
    countActiveDocumentSubmissions(activeDossierIds, ["requires_correction"]),
    countMissingExpectedDocumentsForCurrentPhases(),
    MeetingModel.countDocuments({
      status: { $in: ["planned", "invited"] },
      scheduledAt: { $gte: now, $lte: end },
    }),
    countOverduePhases(),
    countReadyToClosePhases(actor),
    buildPhaseFocus(fromDate, toDate),
    buildPriorityActions(activeDossierIds),
    listRecentActivity(),
  ]);

  const summary: AdminDashboardSummary = {
    generatedAt: new Date().toISOString(),
    period,
    profile,
    periodStats: {
      requestsReceived,
      requestsBySource: {
        portalUpload,
        physicalDeposit,
        internalScan,
        unknown: 0,
      },
      initialDecisions: {
        orientedToDn,
        rejected,
        reoriented,
      },
      requestsOrientedToDn: orientedToDn,
      requestsRejectedOrReoriented: rejected + reoriented,
      dossiersOpened,
      phasesClosed,
      certificatesCollected: 0,
    },
    currentWorkload: {
      dgToPrint,
      dgAwaitingReturn,
      dgReturnedToRecord,
      activeDossiers,
      unassignedDossiers,
      documentsToReview,
      correctionsWaitingPostulant,
      missingExpectedDocuments,
      upcomingMeetings,
      overduePhases,
      phasesReadyToClose,
      certificatesSignedStamped: 0,
      certificatesReadyForCollection: 0,
      certificatesCollected: 0,
    },
    phaseFocus,
    priorityActions,
    recentActivity,
    alerts: [
      {
        key: "dg_returned_to_record",
        severity: "warning" as const,
        label: "Retours DG à traiter",
        count: dgReturnedToRecord,
      },
      {
        key: "overdue_phases",
        severity: "warning" as const,
        label: "Phases actives en retard",
        count: overduePhases,
      },
    ].filter((alert) => alert.count > 0),
    meta: {
      unavailableMetrics: ["certificates"],
      cacheGaps: ["exploration-cache/06-workflows/OMA_FORMAL_REQUEST_WORKFLOW.md"],
    },
  };

  if (profile === "courrier_dg") {
    zeroDnWorkload(summary);
  }

  return summary;
};

