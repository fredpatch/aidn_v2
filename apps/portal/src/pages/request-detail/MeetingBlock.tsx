import type { PortalDossierMeeting } from "../../lib/api/dossiers";
import { formatDateTime } from "./formatters";

const meetingStatusLabels: Record<string, string> = {
  planned: "Planifié",
  invited: "Planifié",
  held: "Tenu",
  postponed: "Reporté",
  cancelled: "Annulé",
};

export function MeetingBlock({
  label,
  meeting,
}: {
  label: string;
  meeting: PortalDossierMeeting;
}): React.JSX.Element {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <dl className="mt-2 grid gap-1">
        <div>
          <dt className="inline text-slate-500">Statut : </dt>
          <dd className="inline font-medium text-slate-800">
            {meetingStatusLabels[meeting.status] ?? "Statut non reconnu"}
          </dd>
        </div>
        {meeting.scheduledAt ? (
          <div>
            <dt className="inline text-slate-500">Date : </dt>
            <dd className="inline font-medium text-slate-800">
              {formatDateTime(meeting.scheduledAt)}
            </dd>
          </div>
        ) : null}
        {meeting.location ? (
          <div>
            <dt className="inline text-slate-500">Lieu : </dt>
            <dd className="inline font-medium text-slate-800">
              {meeting.location}
            </dd>
          </div>
        ) : null}
        {meeting.notes ? (
          <div>
            <dt className="inline text-slate-500">Notes : </dt>
            <dd className="inline text-slate-700">{meeting.notes}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
