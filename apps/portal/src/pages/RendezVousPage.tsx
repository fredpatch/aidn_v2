import {
  AlertCircle,
  CalendarDays,
  Clock,
  Eye,
  MapPin,
  Printer,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "../components/EmptyState";
import {
  PortalCalendar,
  type PortalCalendarEvent,
} from "../components/PortalCalendar";
import {
  listPortalMeetings,
  type PortalMeeting,
  type PortalMeetingStatus,
} from "../lib/api/meetings";
import { PortalApiError } from "../lib/api/http";
import { usePortalAuth } from "../lib/auth/PortalAuthContext";

const statusLabels: Record<PortalMeetingStatus, string> = {
  planned: "Programmé",
  invited: "Invitation envoyée",
  held: "Tenu",
  postponed: "Reporté",
  cancelled: "Annulé",
};

const dossierTypeLabels: Record<string, string> = {
  oma_approval: "Certificat d'agrément OMA",
  oma_recognition: "Certificat de reconnaissance OMA",
  oma_renewal: "Renouvellement de Certificat OMA",
  oma_modification: "Modification de Certificat OMA",
};

const meetingTypeLabels: Record<string, string> = {
  first_contact_meeting: "Premier rendez-vous",
  preliminary_meeting: "Rendez-vous préliminaire",
  formal_meeting: "Rendez-vous formel",
  inspection_meeting: "Rendez-vous d'inspection",
  other: "Autre rendez-vous",
};

const fallback = (value?: string | null) => value || "Non renseigné";

const formatDateTime = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Non renseigné";

const formatTime = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Heure à confirmer";

const formatPrintDate = () =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const toDateKey = (value: string) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getErrorMessage = (caught: unknown) =>
  caught instanceof PortalApiError
    ? caught.message
    : "Une erreur est survenue. Veuillez réessayer.";

function ConvocationCard({
  meeting,
  postulantName,
  onClose,
  onPrint,
}: {
  meeting: PortalMeeting;
  postulantName?: string;
  onClose: () => void;
  onPrint: () => void;
}): React.JSX.Element {
  const rows = [
    ["Organisation / postulant", fallback(postulantName)],
    ["Numéro dossier", fallback(meeting.dossierNumber)],
    [
      "Type de dossier",
      fallback(dossierTypeLabels[meeting.dossierType] ?? meeting.dossierType),
    ],
    [
      "Type de rendez-vous",
      fallback(meetingTypeLabels[meeting.meetingType] ?? meeting.meetingType),
    ],
    ["Objet", fallback(meeting.title)],
    ["Date et heure", formatDateTime(meeting.scheduledAt)],
    ["Lieu", fallback(meeting.location)],
    ["Statut", statusLabels[meeting.status]],
    ["Consignes", fallback(meeting.notes)],
    ["Date d'impression", formatPrintDate()],
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 print:static print:overflow-visible print:bg-transparent">
      <div className="flex min-h-full items-start justify-center px-4 py-10 print:block print:p-0">
        <section className="print-area w-full max-w-[210mm] bg-white shadow-2xl print:shadow-none">
          <div className="no-print flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-3">
            <div>
              <p className="text-sm font-bold text-slate-950">
                Convocation au rendez-vous
              </p>
              <p className="text-xs text-slate-500">
                Document généré depuis le portail AIDN.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onPrint}
              >
                <Printer size={16} aria-hidden="true" />
                Imprimer
              </button>
              <button
                type="button"
                className="btn btn-secondary size-10 p-0"
                onClick={onClose}
                aria-label="Fermer"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <article className="convocation-card px-10 pb-10 pt-6 print:px-10 print:pb-10 print:pt-6">
            <img
              src="/header.png"
              alt="ANAC"
              className="mx-auto mb-12 mt-2 w-[360px] max-w-full object-contain print:mb-10 print:mt-0 print:w-[460px]"
            />

            <h1 className="mb-5 pb-4 text-center text-base font-black uppercase tracking-widest text-slate-950 print:border-black">
              Convocation au rendez-vous
            </h1>

            <dl className="divide-y divide-slate-200 text-sm print:divide-black">
              {rows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[190px_1fr]">
                  <dt className="py-2.5 pr-4 font-bold text-slate-500 print:text-black">
                    {label}
                  </dt>
                  <dd className="border-l border-slate-200 py-2.5 pl-4 font-medium text-slate-950 print:border-black">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="convocation-footer mt-8  pt-4 text-center text-[11px] leading-relaxed text-[#1f4f9a] print:border-[#1f4f9a]">
              Document généré depuis le portail AIDN.
              <br />- BP 2212 Libreville - (GABON) - Tél. (241) 01.44.56.44 /
              44.56.58 - Email : anac@anacgabon.com - www.anacgabon.org -
            </p>
          </article>
        </section>
      </div>
    </div>
  );
}

function getConvocationRows(
  meeting: PortalMeeting,
  postulantName?: string,
): Array<[string, string]> {
  return [
    ["Organisation / postulant", fallback(postulantName)],
    ["Numéro dossier", fallback(meeting.dossierNumber)],
    [
      "Type de dossier",
      fallback(dossierTypeLabels[meeting.dossierType] ?? meeting.dossierType),
    ],
    [
      "Type de rendez-vous",
      fallback(meetingTypeLabels[meeting.meetingType] ?? meeting.meetingType),
    ],
    ["Objet", fallback(meeting.title)],
    ["Date et heure", formatDateTime(meeting.scheduledAt)],
    ["Lieu", fallback(meeting.location)],
    ["Statut", statusLabels[meeting.status]],
    ["Consignes", fallback(meeting.notes)],
    ["Date d'impression", formatPrintDate()],
  ];
}

function printConvocationDocument(
  meeting: PortalMeeting,
  postulantName?: string,
): void {
  const printWindow = window.open("", "_blank", "width=900,height=1200");
  if (!printWindow) return;

  const rows = getConvocationRows(meeting, postulantName)
    .map(
      ([label, value]) => `
        <tr>
          <th>${escapeHtml(label)}</th>
          <td>${escapeHtml(value)}</td>
        </tr>
      `,
    )
    .join("");

  const headerUrl = `${window.location.origin}/header.png`;

  printWindow.document.write(`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Convocation au rendez-vous</title>
    <style>
      @page { size: A4 portrait; margin: 10mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #000;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11px;
      }
      .page {
        width: 190mm;
        min-height: 277mm;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        padding: 8mm 12mm 6mm;
      }
      .header {
        display: block;
        width: 460px;
        max-width: 100%;
        margin: 0 auto 12mm;
      }
      h1 {
        margin: 0 0 8mm;
        padding-bottom: 4mm;
        border-bottom: 1px solid #000;
        text-align: center;
        font-size: 14px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        border-bottom: 1px solid #000;
        padding: 3.2mm 4mm;
        text-align: left;
        vertical-align: top;
      }
      th {
        width: 37mm;
        border-right: 1px solid #000;
        font-weight: 700;
      }
      td {
        font-weight: 600;
      }
      .footer {
        margin-top: auto;
        padding-top: 5mm;
        color: #1f4f9a;
        text-align: center;
        font-size: 9px;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <main class="page">
      <img class="header" src="${escapeHtml(headerUrl)}" alt="ANAC" />
      <h1>Convocation au rendez-vous</h1>
      <table>
        <tbody>${rows}</tbody>
      </table>
      <footer class="footer">
        <div>Document généré depuis le portail AIDN.</div>
        <div>- BP 2212 Libreville - (GABON) - Tél. (241) 01.44.56.44 / 44.56.58 - Email : anac@anacgabon.com - www.anacgabon.org -</div>
      </footer>
    </main>
    <script>
      window.addEventListener("load", () => {
        window.focus();
        setTimeout(() => window.print(), 150);
      });
    </script>
  </body>
</html>`);
  printWindow.document.close();
}

function MeetingCard({
  meeting,
  onPrint,
  onView,
}: {
  meeting: PortalMeeting;
  onPrint: (meeting: PortalMeeting) => void;
  onView: (meeting: PortalMeeting) => void;
}): React.JSX.Element {
  return (
    <article className="surface rounded-lg p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-slate-400">
            Dossier {meeting.dossierNumber}
          </p>
          <h3 className="mt-1 text-base font-extrabold text-slate-950">
            {meeting.title}
          </h3>
        </div>
        <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
          {statusLabels[meeting.status]}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={15} aria-hidden="true" />
          {formatDateTime(meeting.scheduledAt)}
        </span>
        {meeting.location ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={15} aria-hidden="true" />
            {meeting.location}
          </span>
        ) : null}
      </div>
      {meeting.notes ? (
        <p className="mt-3 text-sm text-slate-600">{meeting.notes}</p>
      ) : null}
      <div className="no-print mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onView(meeting)}
        >
          <Eye size={16} aria-hidden="true" />
          Voir la convocation
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onPrint(meeting)}
        >
          <Printer size={16} aria-hidden="true" />
          Imprimer
        </button>
      </div>
    </article>
  );
}

export function RendezVousPage(): React.JSX.Element {
  const { user } = usePortalAuth();
  const [meetings, setMeetings] = useState<PortalMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState<PortalMeeting | null>(
    null,
  );
  const [printAfterOpen, setPrintAfterOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    listPortalMeetings({ status: "all" })
      .then(({ items }) => {
        if (isMounted) setMeetings(items);
      })
      .catch((caught) => {
        if (isMounted) setError(getErrorMessage(caught));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedMeeting || !printAfterOpen) return undefined;

    const timeout = window.setTimeout(() => {
      window.print();
      setPrintAfterOpen(false);
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [printAfterOpen, selectedMeeting]);

  const upcomingMeetings = useMemo(() => {
    const now = Date.now();
    return meetings
      .filter((meeting) => {
        if (!meeting.scheduledAt) return false;
        if (meeting.status === "cancelled" || meeting.status === "held") {
          return false;
        }
        return new Date(meeting.scheduledAt).getTime() >= now;
      })
      .slice(0, 4);
  }, [meetings]);

  const calendarEvents: PortalCalendarEvent[] = useMemo(
    () =>
      meetings
        .filter((meeting) => meeting.scheduledAt)
        .map((meeting) => ({
          id: meeting.id,
          title: meeting.title,
          date: toDateKey(meeting.scheduledAt!),
          timeLabel: formatTime(meeting.scheduledAt),
          location: meeting.location,
          status: statusLabels[meeting.status],
          dossierNumber: meeting.dossierNumber,
        })),
    [meetings],
  );

  const viewMeeting = (meeting: PortalMeeting) => {
    setPrintAfterOpen(false);
    setSelectedMeeting(meeting);
  };

  const printMeeting = (meeting: PortalMeeting) => {
    setPrintAfterOpen(false);
    printConvocationDocument(meeting, user?.fullName);
  };

  const findMeeting = (meetingId: string) =>
    meetings.find((meeting) => meeting.id === meetingId);

  return (
    <section className="flex flex-col gap-6">
      <div className="no-print flex flex-col gap-6">
        <div>
          <h1 className="page-title">Rendez-vous</h1>
          <p className="page-subtitle">
            Consultez les réunions programmées par l'administration pour vos
            dossiers. Cette section est en lecture seule.
          </p>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            <AlertCircle size={16} aria-hidden="true" />
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="surface rounded-lg p-5 text-sm font-semibold text-slate-600">
            Chargement des rendez-vous...
          </div>
        ) : meetings.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Aucun rendez-vous programmé."
            description="Les rendez-vous planifiés par l'administration apparaîtront ici."
          />
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">
                  Prochains rendez-vous
                </h2>
                <p className="text-sm text-slate-500">
                  Les rendez-vous à venir liés à vos dossiers.
                </p>
              </div>
              {upcomingMeetings.length > 0 ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {upcomingMeetings.map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      onPrint={printMeeting}
                      onView={viewMeeting}
                    />
                  ))}
                </div>
              ) : (
                <div className="surface rounded-lg p-4 text-sm font-semibold text-slate-600">
                  Aucun rendez-vous à venir.
                </div>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">
                  Calendrier
                </h2>
                <p className="text-sm text-slate-500">
                  Visualisez les rendez-vous par date.
                </p>
              </div>
              <PortalCalendar
                events={calendarEvents}
                onPrintEvent={(meetingId) => {
                  const meeting = findMeeting(meetingId);
                  if (meeting) printMeeting(meeting);
                }}
                onViewEvent={(meetingId) => {
                  const meeting = findMeeting(meetingId);
                  if (meeting) viewMeeting(meeting);
                }}
              />
            </section>
          </>
        )}
      </div>

      {selectedMeeting ? (
        <ConvocationCard
          meeting={selectedMeeting}
          postulantName={user?.fullName}
          onPrint={() =>
            printConvocationDocument(selectedMeeting, user?.fullName)
          }
          onClose={() => {
            setPrintAfterOpen(false);
            setSelectedMeeting(null);
          }}
        />
      ) : null}
    </section>
  );
}
