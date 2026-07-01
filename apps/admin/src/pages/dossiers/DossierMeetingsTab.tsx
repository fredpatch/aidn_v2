import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Download, FileText, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  downloadDossierDocument,
  getAdminFormalRequestPhase,
  type AdminDossierDetail,
  type AdminFormalRequestPhaseState,
  type AdminMeetingSummary,
} from "@/lib/api/dossiers";
import { ApiError } from "@/lib/api/client";
import { openBlobInNewTab } from "@/lib/utils/blob";
import { ActionError } from "./dossier-detail.helpers";

type MeetingItem = {
  key: "first_contact_meeting" | "preliminary_meeting" | "formal_meeting";
  title: string;
  phaseLabel: string;
  meeting: Partial<AdminMeetingSummary> | null;
  reportDocumentId?: string;
};

const statusLabels: Record<string, string> = {
  planned: "Planifiée",
  invited: "Invitation envoyée",
  held: "Tenue",
  postponed: "Reportée",
  cancelled: "Annulée",
  missing: "Non planifiée",
};

const toDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value?: string) => {
  const date = toDate(value);
  if (!date) return "Non planifiée";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatTime = (value?: string) => {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const monthKey = (value: string) => {
  const date = toDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (value: string) => {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);
};

const dayLabel = (value: string) => {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
  }).format(date);
};


function MeetingStatusBadge({ status }: { status?: string }): React.JSX.Element {
  const normalized = status ?? "missing";
  const label = statusLabels[normalized] ?? normalized;

  if (normalized === "held") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
      >
        {label}
      </Badge>
    );
  }

  if (normalized === "cancelled") {
    return <Badge variant="destructive">{label}</Badge>;
  }

  if (normalized === "missing") {
    return <Badge variant="outline">{label}</Badge>;
  }

  return <Badge variant="secondary">{label}</Badge>;
}

function ReportBadge({
  reportDocumentId,
}: {
  reportDocumentId?: string;
}): React.JSX.Element {
  if (reportDocumentId) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
      >
        Compte rendu disponible
      </Badge>
    );
  }
  return <Badge variant="secondary">Compte rendu manquant</Badge>;
}

function buildMeetingItems(detail: AdminDossierDetail): MeetingItem[] {
  const preliminary = detail.preliminary;
  const phase = preliminary?.phase;

  return [
    {
      key: "first_contact_meeting",
      title: "Première réunion de contact",
      phaseLabel: "Phase préliminaire",
      meeting: preliminary?.firstMeeting ?? null,
      reportDocumentId:
        preliminary?.firstMeeting?.reportDocumentId ??
        phase?.firstMeetingReportDocumentId,
    },
    {
      key: "preliminary_meeting",
      title: "Réunion préliminaire",
      phaseLabel: "Phase préliminaire",
      meeting: preliminary?.preliminaryMeeting ?? null,
      reportDocumentId:
        preliminary?.preliminaryMeeting?.reportDocumentId ??
        phase?.preliminaryMeetingReportDocumentId,
    },
  ];
}

function EventStrip({ items }: { items: MeetingItem[] }): React.JSX.Element {
  const scheduledItems = items
    .filter((item) => item.meeting?.scheduledAt)
    .sort((a, b) => {
      const aTime = toDate(a.meeting?.scheduledAt)?.getTime() ?? 0;
      const bTime = toDate(b.meeting?.scheduledAt)?.getTime() ?? 0;
      return aTime - bTime;
    });

  if (scheduledItems.length === 0) {
    return (
      <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
        Aucune réunion planifiée pour le moment.
      </div>
    );
  }

  const groups = new Map<string, MeetingItem[]>();
  scheduledItems.forEach((item) => {
    const scheduledAt = item.meeting?.scheduledAt;
    if (!scheduledAt) return;
    const key = monthKey(scheduledAt);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });

  return (
    <div className="space-y-3">
      {Array.from(groups.entries()).map(([key, monthItems]) => (
        <section key={key} className="rounded-md border bg-muted/10 p-4">
          <h3 className="text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">
            {monthLabel(monthItems[0]?.meeting?.scheduledAt ?? "")}
          </h3>
          <ol className="mt-3 space-y-2">
            {monthItems.map((item) => (
              <li
                key={item.key}
                className="flex items-start gap-3 rounded-md bg-background p-3 text-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                  {dayLabel(item.meeting?.scheduledAt ?? "")}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatTime(item.meeting?.scheduledAt)}
                    {item.meeting?.location ? ` - ${item.meeting.location}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function MeetingCard({
  item,
  dossierId,
  downloadingId,
  onDownload,
}: {
  item: MeetingItem;
  dossierId: string;
  downloadingId: string;
  onDownload: (dossierId: string, documentId: string) => void;
}): React.JSX.Element {
  const { meeting, reportDocumentId } = item;
  const isDownloading = Boolean(reportDocumentId) && downloadingId === reportDocumentId;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{item.phaseLabel}</Badge>
              <MeetingStatusBadge status={meeting?.status} />
            </div>
            <CardTitle className="text-base">{item.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-2 text-muted-foreground sm:grid-cols-2">
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>
              <span className="text-xs text-muted-foreground">Date prévue</span>{" "}
              {formatDateTime(meeting?.scheduledAt)}
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {meeting?.location ?? "Lieu non renseigné"}
          </span>
          {meeting?.heldAt ? (
            <span className="inline-flex items-center gap-2 sm:col-span-2">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              <span>
                <span className="text-xs text-muted-foreground">Date tenue</span>{" "}
                {formatDateTime(meeting.heldAt)}
              </span>
            </span>
          ) : null}
        </div>

        {meeting?.notes ? (
          <p className="rounded-md bg-muted/30 p-3 text-muted-foreground">
            {meeting.notes}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <ReportBadge reportDocumentId={reportDocumentId} />
          </div>

          {reportDocumentId ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isDownloading}
              onClick={() => onDownload(dossierId, reportDocumentId)}
            >
              <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {isDownloading ? "Téléchargement..." : "Télécharger le compte rendu"}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function DossierMeetingsTab({
  detail,
}: {
  detail: AdminDossierDetail;
}): React.JSX.Element {
  const [downloadingId, setDownloadingId] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [formalState, setFormalState] =
    useState<AdminFormalRequestPhaseState | null>(null);

  const loadFormalPhase = useCallback(async () => {
    try {
      const state = await getAdminFormalRequestPhase(detail.dossier.id);
      setFormalState(state);
    } catch {
      // Phase 2 not started - no-op
    }
  }, [detail.dossier.id]);

  useEffect(() => {
    void loadFormalPhase();
  }, [loadFormalPhase]);

  const phaseOneMeetingItems = useMemo(() => buildMeetingItems(detail), [detail]);
  const formalMeetingItem = useMemo<MeetingItem | null>(() => {
    if (!formalState?.meeting) return null;
    return {
      key: "formal_meeting",
      title: "Réunion formelle",
      phaseLabel: "Phase 2 - Demande formelle",
      meeting: {
        ...formalState.meeting,
        meetingType: "formal_meeting",
        title: "Réunion formelle",
        reportDocumentId: formalState.meeting.reportDocumentId ?? undefined,
      },
      reportDocumentId: formalState.meeting.reportDocumentId ?? undefined,
    };
  }, [formalState]);
  const calendarItems = useMemo(
    () =>
      formalMeetingItem
        ? [...phaseOneMeetingItems, formalMeetingItem]
        : phaseOneMeetingItems,
    [formalMeetingItem, phaseOneMeetingItems],
  );

  const handleDownload = async (dossierId: string, documentId: string) => {
    setDownloadingId(documentId);
    setDownloadError("");
    try {
      const { blob, fileName } = await downloadDossierDocument(
        dossierId,
        documentId,
      );
      openBlobInNewTab(blob, fileName);
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

  const hasAnyMeeting = calendarItems.some((item) => item.meeting);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Réunions du dossier
        </h2>
        <p className="text-sm text-muted-foreground">
          Dates, convocations et comptes rendus liés aux phases OMA.
        </p>
      </div>

      {downloadError ? <ActionError message={downloadError} /> : null}

      {!detail.preliminary && !hasAnyMeeting ? (
        <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
          Aucune réunion enregistrée pour ce dossier pour le moment.
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Calendrier synthétique
            </div>
            <EventStrip items={calendarItems} />
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            {phaseOneMeetingItems.map((item) => (
              <MeetingCard
                key={item.key}
                item={item}
                dossierId={detail.dossier.id}
                downloadingId={downloadingId}
                onDownload={(dossierId, documentId) =>
                  void handleDownload(dossierId, documentId)
                }
              />
            ))}
          </section>

          {formalMeetingItem ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Phase 2 - Réunion formelle
              </div>
              <MeetingCard
                item={formalMeetingItem}
                dossierId={detail.dossier.id}
                downloadingId={downloadingId}
                onDownload={(dossierId, documentId) =>
                  void handleDownload(dossierId, documentId)
                }
              />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
