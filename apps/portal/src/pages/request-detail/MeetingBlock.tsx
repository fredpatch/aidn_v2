import type { PortalDossierMeeting } from "../../lib/api/dossiers";
import { Card, CardContent, CardDescription } from "../../components/ui/card";
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
    <Card>
      <CardDescription className="p-4 pb-0">{label}</CardDescription>
      <CardContent className="pt-2">
        <dl className="grid gap-2 text-sm">
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
      </CardContent>
    </Card>
  );
}
