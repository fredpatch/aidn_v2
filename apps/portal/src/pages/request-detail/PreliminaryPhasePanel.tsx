import { CheckCircle2, Download } from "lucide-react";

import type { PortalDossierPreliminary } from "../../lib/api/dossiers";
import { MeetingBlock } from "./MeetingBlock";

type PreliminaryPhasePanelProps = {
  preliminary: PortalDossierPreliminary;
  downloadError: string;
  onDownload: (documentId: string, filename: string) => void;
};

export function PreliminaryPhasePanel({
  preliminary,
  downloadError,
  onDownload,
}: PreliminaryPhasePanelProps): React.JSX.Element {
  return (
    <div className="grid gap-4">
      {preliminary.status === "preliminary_closed" ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
          <CheckCircle2
            size={16}
            className="flex-shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <p className="font-semibold text-emerald-800">
            Phase préliminaire clôturée
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm">
          <p className="font-semibold text-sky-800">
            {preliminary.portalLabel}
          </p>
        </div>
      )}

      {preliminary.firstMeeting ? (
        <MeetingBlock
          label="Première réunion de contact"
          meeting={preliminary.firstMeeting}
        />
      ) : null}

      {preliminary.preliminaryMeeting ? (
        <MeetingBlock
          label="Réunion préliminaire"
          meeting={preliminary.preliminaryMeeting}
        />
      ) : null}

      {downloadError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {downloadError}
        </div>
      ) : null}

      {preliminary.firstMeetingReportDocumentId ? (
        <div>
          <button
            type="button"
            className="btn btn-secondary w-fit"
            onClick={() =>
              onDownload(
                preliminary.firstMeetingReportDocumentId!,
                "compte-rendu-premiere-reunion.pdf",
              )
            }
          >
            <Download size={14} aria-hidden="true" />
            Télécharger le compte rendu — Première réunion
          </button>
        </div>
      ) : null}
    </div>
  );
}
