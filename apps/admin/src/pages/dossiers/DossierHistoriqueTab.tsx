import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  downloadDossierDocument,
  getAdminFormalRequestPhase,
  type AdminDossierDetail,
  type AdminFormalRequestPhaseState,
  type AdminFormalRequestRequirement,
  type AdminFormalRequestSubmission,
  type AdminMeetingSummary,
} from "@/lib/api/dossiers";
import { downloadRequestOrientationDocument } from "@/lib/api/requests";
import { ApiError } from "@/lib/api/client";
import { openBlobInNewTab } from "@/lib/utils/blob";
import { ActionError } from "./dossier-detail.helpers";

type DossierHistoryEvent = {
  id: string;
  date?: string;
  title: string;
  description?: string;
  category:
    | "dossier"
    | "phase"
    | "meeting"
    | "document"
    | "courrier"
    | "dg_orientation";
  importance: "milestone" | "detail";
  group: "all" | "dossier" | "phase" | "meeting" | "document" | "courrier" | "dg";
  status?: "done" | "pending" | "info";
  documentId?: string;
  documentDownloadKind?: "dossier" | "request";
  requestId?: string;
};

type HistoryFilter = "milestones" | "all" | "meeting" | "document" | "courrier" | "dg";

const categoryLabels: Record<DossierHistoryEvent["category"], string> = {
  dossier: "Dossier",
  phase: "Phase",
  meeting: "Réunion",
  document: "Document",
  courrier: "Courrier",
  dg_orientation: "Orientation DG",
};

const categoryClasses: Record<DossierHistoryEvent["category"], string> = {
  dossier: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200",
  phase: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
  meeting: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200",
  document: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  courrier: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  dg_orientation: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
};

const filterLabels: Record<HistoryFilter, string> = {
  milestones: "Jalons",
  all: "Tous",
  meeting: "Réunions",
  document: "Documents",
  courrier: "Courriers",
  dg: "DG",
};

const phaseLabels: Record<string, string> = {
  preliminary: "Phase préliminaire",
  formal_request: "Demande formelle",
  document_evaluation: "Évaluation documentaire",
  inspection: "Inspection",
  delivery: "Délivrance",
};

const dossierStatusPhaseLabels: Record<string, string> = {
  opened: "Dossier ouvert",
  preliminary_phase: "Phase préliminaire",
  formal_request_phase: "Demande formelle",
  document_evaluation_phase: "Évaluation documentaire",
  inspection_phase: "Inspection",
  delivery_phase: "Délivrance",
  closed: "Clôturé",
  suspended: "Suspendu",
  cancelled: "Annulé",
};

const formalStatusOrder = [
  "formal_request_received",
  "formal_sent_to_dg",
  "formal_dg_returned",
  "formal_dg_decision_recorded",
  "formal_meeting_invited",
  "formal_meeting_held",
  "formal_recevability_recorded",
  "formal_ready_to_close",
  "formal_closed",
];

const formalOmaFormMilestoneTitles: Record<string, string> = {
  validated: "Formulaire DN-AIR-R2-3-F-E-010 validé",
  requires_correction: "Correction demandée sur formulaire DN-AIR-R2-3-F-E-010",
  incomplete: "Formulaire DN-AIR-R2-3-F-E-010 incomplet",
};


function toTimestamp(value?: string): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime();
}

function hasReachedFormalStatus(
  current: string | null | undefined,
  target: string,
): boolean {
  if (!current) return false;
  if (current === target) return true;
  const currentIndex = formalStatusOrder.indexOf(current);
  const targetIndex = formalStatusOrder.indexOf(target);
  return currentIndex >= 0 && targetIndex >= 0 && currentIndex >= targetIndex;
}

function getRuntimeDateField(
  value: unknown,
  field: string,
): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const maybeDate = (value as Record<string, unknown>)[field];
  return typeof maybeDate === "string" ? maybeDate : undefined;
}

function getLatestSubmission(
  req: AdminFormalRequestRequirement,
): AdminFormalRequestSubmission | undefined {
  return req.submissions
    .filter((submission) => submission.status !== "replaced" && submission.status !== "archived")
    .sort((a, b) => toTimestamp(b.uploadedAt) - toTimestamp(a.uploadedAt))[0];
}

function formatDateTime(value?: string): string {
  if (!value) return "Date non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date non renseignée";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(date);
}

function formatDurationDays(start?: string, end?: string): string {
  if (!start) return "-";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "-";
  }
  const days = Math.max(
    0,
    Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000),
  );
  return `${days} j`;
}

function addDocumentEvent(
  events: DossierHistoryEvent[],
  input: {
    id: string;
    title: string;
    description?: string;
    category?: DossierHistoryEvent["category"];
    documentId?: string;
    date?: string;
    importance?: DossierHistoryEvent["importance"];
  },
): void {
  if (!input.documentId) return;
  events.push({
    id: input.id,
    date: input.date,
    title: input.title,
    description: input.description,
    category: input.category ?? "document",
    importance: input.importance ?? "detail",
    group: input.category === "courrier" ? "courrier" : input.category === "dg_orientation" ? "dg" : "document",
    status: "done",
    documentId: input.documentId,
    documentDownloadKind: "dossier",
  });
}

function addMeetingEvents(
  events: DossierHistoryEvent[],
  input: {
    key: string;
    meeting: AdminMeetingSummary | null | undefined;
    plannedTitle: string;
    heldTitle: string;
  },
): void {
  if (!input.meeting) return;

  if (input.meeting.scheduledAt) {
    const isHeld = input.meeting.status === "held";
    events.push({
      id: `${input.key}_planned`,
      date: input.meeting.scheduledAt,
      title: input.plannedTitle,
      description: input.meeting.location
        ? `Lieu: ${input.meeting.location}`
        : undefined,
      category: "meeting",
      importance: isHeld ? "detail" : "milestone",
      group: "meeting",
      status: "done",
    });
  }

  if (input.meeting.status === "held") {
    events.push({
      id: `${input.key}_held`,
      date: input.meeting.heldAt ?? input.meeting.createdAt,
      title: input.heldTitle,
      description: input.meeting.notes,
      category: "meeting",
      importance: "milestone",
      group: "meeting",
      status: "done",
    });
  }
}

function addFormalDocumentEvents(
  events: DossierHistoryEvent[],
  formalState: AdminFormalRequestPhaseState,
): void {
  const nonGateRequirements = formalState.requirements.filter(
    (req) => req.requirementLevel !== "gate",
  );
  const omaApprovalFormReq = nonGateRequirements.find(
    (req) => req.code === "oma_approval_form",
  );
  const omaApprovalFormLatest = omaApprovalFormReq
    ? getLatestSubmission(omaApprovalFormReq)
    : undefined;

  if (
    omaApprovalFormReq &&
    formalOmaFormMilestoneTitles[omaApprovalFormReq.status]
  ) {
    events.push({
      id: `formal_document_oma_approval_form_${omaApprovalFormReq.status}`,
      date: omaApprovalFormLatest?.uploadedAt,
      title: formalOmaFormMilestoneTitles[omaApprovalFormReq.status],
      description: omaApprovalFormLatest?.reviewComment
        ? `Note DN : ${omaApprovalFormLatest.reviewComment}`
        : "Décision de revue du formulaire de demande formelle.",
      category: "document",
      importance: "milestone",
      group: "document",
      status: "done",
      documentId: omaApprovalFormLatest?.documentId,
      documentDownloadKind: omaApprovalFormLatest?.documentId
        ? "dossier"
        : undefined,
    });
  }

  nonGateRequirements.forEach((req) => {
    req.submissions
      .filter((submission) => submission.status !== "replaced" && submission.status !== "archived")
      .forEach((submission) => {
        events.push({
          id: `formal_submission_${req.requirementId}_${submission.submissionId}`,
          date: submission.uploadedAt,
          title: `${req.label} déposé`,
          description: req.formCode
            ? `Pièce de demande formelle - ${req.formCode}.`
            : "Pièce de demande formelle déposée.",
          category: "document",
          importance: "detail",
          group: "document",
          status: "done",
          documentId: submission.documentId,
          documentDownloadKind: "dossier",
        });
      });
  });
}

function addFormalRequestEvents(
  events: DossierHistoryEvent[],
  formalState: AdminFormalRequestPhaseState | null,
): void {
  if (!formalState) return;

  const formalStatus = formalState.phase.formalRequestStatus;
  const gateDate = formalState.gate.receivedAt;

  if (formalState.gate.exists) {
    events.push({
      id: "formal_request_received",
      date: gateDate,
      title: "Demande formelle reçue",
      description:
        formalState.gate.source === "portal_upload"
          ? "Demande formelle reçue via le portail."
          : "Demande formelle enregistrée par l'administration.",
      category: "courrier",
      importance: "milestone",
      group: "courrier",
      status: "done",
    });
  }

  if (hasReachedFormalStatus(formalStatus, "formal_sent_to_dg")) {
    events.push({
      id: "formal_dg_sent",
      title: "Circuit DG demande formelle lancé",
      description: "Mise en circuit officiel/parapheur de la demande formelle.",
      category: "dg_orientation",
      importance: "milestone",
      group: "dg",
      status: "done",
    });
  }

  if (hasReachedFormalStatus(formalStatus, "formal_dg_returned")) {
    events.push({
      id: "formal_dg_returned",
      title: "Retour DG demande formelle enregistré",
      description: "Retour du circuit DG de la demande formelle enregistré.",
      category: "dg_orientation",
      importance: "milestone",
      group: "dg",
      status: "done",
    });
  }

  if (hasReachedFormalStatus(formalStatus, "formal_dg_decision_recorded")) {
    events.push({
      id: "formal_dg_decision_recorded",
      title: "Décision DG demande formelle enregistrée",
      description: "Décision DG rattachée à la demande formelle.",
      category: "dg_orientation",
      importance: "milestone",
      group: "dg",
      status: "done",
    });
  }

  const meeting = formalState.meeting;
  if (meeting?.scheduledAt) {
    const isHeld = meeting.status === "held";
    events.push({
      id: "formal_meeting_planned",
      date: meeting.scheduledAt,
      title: "Réunion formelle planifiée",
      description: meeting.location ? `Lieu: ${meeting.location}` : undefined,
      category: "meeting",
      importance: isHeld ? "detail" : "milestone",
      group: "meeting",
      status: "done",
    });
  }

  if (meeting?.status === "held") {
    events.push({
      id: "formal_meeting_held",
      date:
        getRuntimeDateField(meeting, "heldAt") ??
        meeting.scheduledAt ??
        getRuntimeDateField(meeting, "createdAt"),
      title: "Réunion formelle tenue",
      category: "meeting",
      importance: "milestone",
      group: "meeting",
      status: "done",
    });
  }

  addDocumentEvent(events, {
    id: "formal_meeting_report",
    title: "Compte rendu de réunion formelle joint",
    description: "Compte rendu associé à la réunion formelle.",
    documentId: meeting?.reportDocumentId ?? undefined,
    date: getRuntimeDateField(meeting, "reportUploadedAt"),
    importance: "milestone",
  });

  addDocumentEvent(events, {
    id: "formal_recevability_courrier",
    title: "Courrier de recevabilité joint",
    description: "Pièce facultative rattachée à la demande formelle.",
    category: "courrier",
    documentId: formalState.closure.recevabilityCourrierDocumentId ?? undefined,
    importance: "detail",
  });

  addDocumentEvent(events, {
    id: "formal_phase_closure_courrier",
    title: "Courrier de clôture Phase II joint",
    description: "Pièce facultative rattachée à la clôture de Phase II.",
    category: "courrier",
    documentId: formalState.closure.phaseClosureCourrierDocumentId ?? undefined,
    importance: "detail",
  });

  addFormalDocumentEvents(events, formalState);

  if (formalStatus === "formal_closed") {
    events.push({
      id: "formal_phase_closed",
      date: getRuntimeDateField(formalState.phase, "closedAt"),
      title: "Phase 2 - Demande formelle clôturée",
      description: "Clôture de la phase de demande formelle.",
      category: "phase",
      importance: "milestone",
      group: "phase",
      status: "done",
    });
  }
}

function buildHistoryEvents(
  detail: AdminDossierDetail,
  formalState: AdminFormalRequestPhaseState | null,
): DossierHistoryEvent[] {
  const events: DossierHistoryEvent[] = [];
  const preliminary = detail.preliminary;
  const phase = preliminary?.phase;

  if (detail.dossier.openedAt) {
    events.push({
      id: "dossier_opened",
      date: detail.dossier.openedAt,
      title: "Dossier ouvert",
      description: "Ouverture du dossier DN.",
      category: "dossier",
      importance: "milestone",
      group: "dossier",
      status: "done",
    });
  }

  if (phase?.startedAt) {
    events.push({
      id: "preliminary_started",
      date: phase.startedAt,
      title: "Phase préliminaire démarrée",
      description: "Démarrage de la phase préliminaire OMA.",
      category: "phase",
      importance: "milestone",
      group: "phase",
      status: "done",
    });
  }

  addMeetingEvents(events, {
    key: "first_meeting",
    meeting: preliminary?.firstMeeting,
    plannedTitle: "Première réunion de contact planifiée",
    heldTitle: "Première réunion de contact tenue",
  });

  addDocumentEvent(events, {
    id: "first_meeting_report",
    title: "Compte rendu première réunion joint",
    description: "Compte rendu associé à la première réunion de contact.",
    documentId: phase?.firstMeetingReportDocumentId,
  });

  addDocumentEvent(events, {
    id: "pre_eval_template",
    title: "Formulaire pré-évaluation mis à disposition",
    description: "Modèle de formulaire rendu disponible.",
    documentId: phase?.preEvaluationTemplateDocumentId,
  });

  addDocumentEvent(events, {
    id: "completed_pre_eval",
    title: "Formulaire pré-évaluation complété reçu",
    description: "Formulaire complété rattaché au dossier.",
    documentId: phase?.completedPreEvaluationDocumentId,
  });

  addDocumentEvent(events, {
    id: "pre_eval_dg_return",
    title: "Retour DG pré-évaluation enregistré",
    description: "Document annoté retourné par le DG.",
    category: "dg_orientation",
    importance: "milestone",
    documentId: phase?.preEvaluationDgAnnotatedDocumentId,
    date: phase?.preEvaluationReturnedFromDgAt,
  });

  addMeetingEvents(events, {
    key: "preliminary_meeting",
    meeting: preliminary?.preliminaryMeeting,
    plannedTitle: "Réunion préliminaire planifiée",
    heldTitle: "Réunion préliminaire tenue",
  });

  addDocumentEvent(events, {
    id: "preliminary_meeting_report",
    title: "Compte rendu réunion préliminaire joint",
    description: "Compte rendu associé à la réunion préliminaire.",
    documentId: phase?.preliminaryMeetingReportDocumentId,
  });

  const initialCourrier = detail.courriers?.initialCourrier;
  if (initialCourrier) {
    events.push({
      id: "initial_courrier",
      date: initialCourrier.date,
      title: "Courrier initial reçu/transmis",
      description: initialCourrier.reference
        ? `Référence : ${initialCourrier.reference}`
        : "Trace du courrier initial rattaché à la demande.",
      category: "courrier",
      importance: "milestone",
      group: "courrier",
      status: initialCourrier.documentId ? "done" : "info",
      documentId: initialCourrier.documentId,
      documentDownloadKind: initialCourrier.documentId ? "request" : undefined,
      requestId: initialCourrier.requestId ?? detail.dossier.requestId,
    });
  }

  const initialDgOrientation = detail.courriers?.initialDgOrientation;
  if (initialDgOrientation) {
    events.push({
      id: "initial_dg_orientation",
      date: initialDgOrientation.returnedAt,
      title: "Retour DG orientation initiale enregistré",
      description:
        initialDgOrientation.observations ??
        (initialDgOrientation.decision
          ? `Décision : ${initialDgOrientation.decision}`
          : "Retour DG rattaché à la demande initiale."),
      category: "dg_orientation",
      importance: "milestone",
      group: "dg",
      status: initialDgOrientation.documentId ? "done" : "info",
      documentId: initialDgOrientation.documentId,
      documentDownloadKind: initialDgOrientation.documentId
        ? "request"
        : undefined,
      requestId: initialDgOrientation.requestId ?? detail.dossier.requestId,
    });
  }

  addDocumentEvent(events, {
    id: "closure_courrier",
    title: "Courrier de clôture phase I joint",
    description: "Courrier de clôture optionnel rattaché à la phase I.",
    category: "courrier",
    importance: "detail",
    documentId: phase?.closureCourrierDocumentId,
  });

  if (phase?.closedAt) {
    events.push({
      id: "preliminary_closed",
      date: phase.closedAt,
      title: "Phase préliminaire clôturée",
      description: "Clôture de la phase préliminaire OMA.",
      category: "phase",
      importance: "milestone",
      group: "phase",
      status: "done",
    });
  }

  addFormalRequestEvents(events, formalState);

  return events.sort((a, b) => {
    const dateSort = toTimestamp(a.date) - toTimestamp(b.date);
    if (dateSort !== 0) return dateSort;
    return a.title.localeCompare(b.title, "fr");
  });
}

function filterHistoryEvents(
  events: DossierHistoryEvent[],
  filter: HistoryFilter,
): DossierHistoryEvent[] {
  if (filter === "all") return events;
  if (filter === "milestones") {
    return events.filter((event) => event.importance === "milestone");
  }
  return events.filter((event) => event.group === filter);
}

function getActivePhaseLabel(detail: AdminDossierDetail): string {
  const openPhase =
    detail.phases.find((phase) => phase.startedAt && !phase.closedAt) ??
    detail.phases.find((phase) => !phase.closedAt);
  if (openPhase) {
    return phaseLabels[openPhase.phaseKey] ?? openPhase.phaseKey;
  }
  return dossierStatusPhaseLabels[detail.dossier.status] ?? detail.dossier.status;
}

function getLatestDatedEvent(events: DossierHistoryEvent[]): DossierHistoryEvent | undefined {
  return [...events]
    .filter((event) => Number.isFinite(toTimestamp(event.date)))
    .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))[0];
}

function HistoryKpiRow({
  detail,
  events,
}: {
  detail: AdminDossierDetail;
  events: DossierHistoryEvent[];
}): React.JSX.Element {
  const latestEvent = getLatestDatedEvent(events);
  const items = [
    {
      label: "Durée depuis ouverture",
      value: formatDurationDays(detail.dossier.openedAt, detail.dossier.closedAt),
      hint: detail.dossier.openedAt
        ? `Depuis ${formatDate(detail.dossier.openedAt)}`
        : "Ouverture non renseignée",
    },
    {
      label: "Phase active",
      value: getActivePhaseLabel(detail),
      hint: "Indicateurs de délai à venir",
    },
    {
      label: "Événements",
      value: String(events.length),
      hint: "Historique consolidé",
    },
    {
      label: "Dernière activité",
      value: latestEvent ? formatDate(latestEvent.date) : "-",
      hint: latestEvent?.title ?? "Aucune date renseignée",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="space-y-1 p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {item.label}
            </p>
            <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
              {item.value}
            </p>
            <p className="truncate text-xs text-muted-foreground">{item.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function HistoryFilters({
  selected,
  onSelect,
}: {
  selected: HistoryFilter;
  onSelect: (filter: HistoryFilter) => void;
}): React.JSX.Element {
  const filters: HistoryFilter[] = [
    "milestones",
    "all",
    "meeting",
    "document",
    "courrier",
    "dg",
  ];

  return (
    <div className="flex flex-wrap gap-2" aria-label="Filtres historique">
      {filters.map((filter) => (
        <Button
          key={filter}
          type="button"
          size="sm"
          variant={selected === filter ? "default" : "outline"}
          onClick={() => onSelect(filter)}
        >
          {filterLabels[filter]}
        </Button>
      ))}
    </div>
  );
}

function CategoryBadge({
  category,
}: {
  category: DossierHistoryEvent["category"];
}): React.JSX.Element {
  return (
    <Badge variant="outline" className={categoryClasses[category]}>
      {categoryLabels[category]}
    </Badge>
  );
}

function TimelineEventItem({
  event,
  downloadingId,
  onDownload,
}: {
  event: DossierHistoryEvent;
  downloadingId: string;
  onDownload: (event: DossierHistoryEvent) => void;
}): React.JSX.Element {
  const canDownload = Boolean(event.documentId && event.documentDownloadKind);
  const isDownloading = downloadingId === event.id;

  return (
    <li className="relative pl-8">
      <span
        className="absolute left-[7px] top-2 h-3 w-3 rounded-full border-2 border-primary bg-background"
        aria-hidden="true"
      />
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={event.category} />
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {formatDateTime(event.date)}
              </span>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {event.title}
              </p>
              {event.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.description}
                </p>
              ) : null}
            </div>
          </div>

          {canDownload ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full shrink-0 sm:w-auto"
              disabled={isDownloading}
              onClick={() => onDownload(event)}
            >
              <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {isDownloading ? "Ouverture..." : "Consulter"}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </li>
  );
}

export function DossierHistoriqueTab({
  detail,
}: {
  detail: AdminDossierDetail;
}): React.JSX.Element {
  const [downloadingId, setDownloadingId] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<HistoryFilter>("milestones");
  const [visibleCount, setVisibleCount] = useState(6);
  const [formalState, setFormalState] =
    useState<AdminFormalRequestPhaseState | null>(null);

  const loadFormalPhase = useCallback(async () => {
    try {
      const state = await getAdminFormalRequestPhase(detail.dossier.id);
      setFormalState(state);
    } catch {
      // Phase 2 not started - no-op
      setFormalState(null);
    }
  }, [detail.dossier.id]);

  useEffect(() => {
    void loadFormalPhase();
  }, [loadFormalPhase]);

  const events = useMemo(
    () => buildHistoryEvents(detail, formalState),
    [detail, formalState],
  );
  const filteredEvents = useMemo(
    () => filterHistoryEvents(events, selectedFilter),
    [events, selectedFilter],
  );
  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const hasMoreEvents = visibleEvents.length < filteredEvents.length;

  useEffect(() => {
    setVisibleCount(6);
  }, [selectedFilter]);

  const handleDownload = async (event: DossierHistoryEvent) => {
    if (!event.documentId || !event.documentDownloadKind) return;

    setDownloadingId(event.id);
    setDownloadError("");
    try {
      const result =
        event.documentDownloadKind === "request" && event.requestId
          ? await downloadRequestOrientationDocument(
              event.requestId,
              event.documentId,
            )
          : await downloadDossierDocument(detail.dossier.id, event.documentId);
      openBlobInNewTab(result.blob, result.fileName);
    } catch (err) {
      setDownloadError(
        err instanceof ApiError
          ? err.message
          : "Une erreur est survenue. Réessayez.",
      );
    } finally {
      setDownloadingId("");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Historique du dossier
        </h2>
        <p className="text-sm text-muted-foreground">
          Journal des étapes, documents, réunions et décisions liées au dossier.
        </p>
      </div>

      <HistoryKpiRow detail={detail} events={events} />
      <HistoryFilters selected={selectedFilter} onSelect={setSelectedFilter} />

      {downloadError ? <ActionError message={downloadError} /> : null}

      {filteredEvents.length ? (
        <div className="space-y-3">
          <ol className="relative space-y-2 before:absolute before:left-3 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
            {visibleEvents.map((event) => (
              <TimelineEventItem
                key={event.id}
                event={event}
                downloadingId={downloadingId}
                onDownload={(nextEvent) => void handleDownload(nextEvent)}
              />
            ))}
          </ol>
          <div className="flex flex-wrap items-center justify-between gap-3 pl-8">
            <p className="text-sm text-muted-foreground">
              {visibleEvents.length} sur {filteredEvents.length} événements
              affichés
            </p>
            {hasMoreEvents ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((count) => count + 6)}
              >
                Afficher plus
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-start gap-3 p-6 text-sm text-muted-foreground">
            <History className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>Aucun événement historique disponible pour ce dossier.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
