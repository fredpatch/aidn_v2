import type { RefObject } from "react";

import type { PortalDossierFormalRequest } from "../../lib/api/formal-request";
import { formalClosedLabel } from "./dossier.constants";
import { MeetingBlock } from "./MeetingBlock";
import { Phase2DocumentChecklist } from "./Phase2DocumentChecklist";

type FormalRequestPhasePanelProps = {
  formalRequest?: PortalDossierFormalRequest;
  downloadError: string;
  expandedRequirementId: string | null;
  reqUploadFile: File | null;
  reqUploadNotes: string;
  reqUploadBusy: boolean;
  reqUploadError: string;
  reqUploadFileRef: RefObject<HTMLInputElement | null>;
  onRequirementExpand: (requirementId: string) => void;
  onRequirementFileChange: (file: File | null) => void;
  onRequirementNotesChange: (notes: string) => void;
  onRequirementSubmit: (
    requirementId: string,
    event: React.FormEvent,
  ) => void;
  onTemplateDownload: (templateId: string, fileName: string) => void;
};

export function FormalRequestPhasePanel({
  formalRequest,
  downloadError,
  expandedRequirementId,
  reqUploadFile,
  reqUploadNotes,
  reqUploadBusy,
  reqUploadError,
  reqUploadFileRef,
  onRequirementExpand,
  onRequirementFileChange,
  onRequirementNotesChange,
  onRequirementSubmit,
  onTemplateDownload,
}: FormalRequestPhasePanelProps): React.JSX.Element {
  if (!formalRequest) {
    return (
      <p className="text-sm text-slate-500">
        La Phase II débutera après la clôture de la Phase I.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      <div
        className={[
          "rounded-xl border px-4 py-3 text-sm",
          formalRequest.portalLabel === formalClosedLabel
            ? "border-emerald-200 bg-emerald-50"
            : "border-sky-200 bg-sky-50",
        ].join(" ")}
      >
        <p
          className={
            formalRequest.portalLabel === formalClosedLabel
              ? "font-semibold text-emerald-800"
              : "font-semibold text-sky-800"
          }
        >
          {formalRequest.portalLabel}
        </p>
      </div>

      {formalRequest.formalMeeting ? (
        <MeetingBlock
          label="Réunion de demande formelle"
          meeting={formalRequest.formalMeeting}
        />
      ) : null}

      {formalRequest.requirements.length > 0 ? (
        <>
          {downloadError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {downloadError}
            </div>
          ) : null}
          <Phase2DocumentChecklist
            requirements={formalRequest.requirements}
            progress={formalRequest.progress}
            expandedRequirementId={expandedRequirementId}
            reqUploadFile={reqUploadFile}
            reqUploadNotes={reqUploadNotes}
            reqUploadBusy={reqUploadBusy}
            reqUploadError={reqUploadError}
            reqUploadFileRef={reqUploadFileRef}
            onExpand={onRequirementExpand}
            onFileChange={onRequirementFileChange}
            onNotesChange={onRequirementNotesChange}
            onSubmit={onRequirementSubmit}
            onTemplateDownload={onTemplateDownload}
          />
        </>
      ) : null}
    </div>
  );
}
