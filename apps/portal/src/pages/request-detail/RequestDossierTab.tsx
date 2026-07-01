import { FolderOpen } from "lucide-react";
import type { RefObject } from "react";

import { Phase3DocumentEvaluationBlock } from "../../components/Phase3DocumentEvaluationBlock";
import { Phase4InspectionBlock } from "../../components/Phase4InspectionBlock";
import type { PortalDossierDetail } from "../../lib/api/dossiers";
import { formalClosedLabel, phase3Statuses, phase4Statuses } from "./dossier.constants";
import { DossierOverviewPanel } from "./DossierOverviewPanel";
import { FormalRequestPhasePanel } from "./FormalRequestPhasePanel";
import { PreliminaryPhasePanel } from "./PreliminaryPhasePanel";

export type DossierSubTab = "overview" | "phase1" | "phase2" | "phase3" | "phase4";

type RequestDossierTabProps = {
  dossierId: string;
  dossierDetail: PortalDossierDetail | null;
  dossierLoading: boolean;
  dossierError: string;
  downloadError: string;
  dossierSubTab: DossierSubTab;
  expandedRequirementId: string | null;
  reqUploadFile: File | null;
  reqUploadNotes: string;
  reqUploadBusy: boolean;
  reqUploadError: string;
  reqUploadFileRef: RefObject<HTMLInputElement | null>;
  onDossierSubTabChange: (tab: DossierSubTab) => void;
  onRefreshDossier: () => void;
  onDownload: (documentId: string, filename: string) => void;
  onRequirementExpand: (requirementId: string) => void;
  onRequirementFileChange: (file: File | null) => void;
  onRequirementNotesChange: (notes: string) => void;
  onRequirementSubmit: (
    requirementId: string,
    event: React.FormEvent,
  ) => void;
  onTemplateDownload: (templateId: string, fileName: string) => void;
};

export function RequestDossierTab({
  dossierId,
  dossierDetail,
  dossierLoading,
  dossierError,
  downloadError,
  dossierSubTab,
  expandedRequirementId,
  reqUploadFile,
  reqUploadNotes,
  reqUploadBusy,
  reqUploadError,
  reqUploadFileRef,
  onDossierSubTabChange,
  onRefreshDossier,
  onDownload,
  onRequirementExpand,
  onRequirementFileChange,
  onRequirementNotesChange,
  onRequirementSubmit,
  onTemplateDownload,
}: RequestDossierTabProps): React.JSX.Element {
  return (
    <div className="surface overflow-hidden rounded-xl">
      {dossierDetail ? (
        <div className="sub-tab-bar">
          <button
            type="button"
            className={`sub-tab ${dossierSubTab === "overview" ? "sub-tab-active" : ""}`}
            onClick={() => onDossierSubTabChange("overview")}
          >
            <FolderOpen size={13} aria-hidden="true" />
            Dossier
          </button>
          <button
            type="button"
            className={[
              "sub-tab",
              dossierSubTab === "phase1" ? "sub-tab-active" : "",
              dossierDetail.preliminary.status === "preliminary_closed"
                ? "sub-tab-done"
                : "",
            ].join(" ")}
            onClick={() => onDossierSubTabChange("phase1")}
          >
            Phase I — Préliminaire
          </button>
          {dossierDetail.formalRequest ? (
            <button
              type="button"
              className={[
                "sub-tab",
                dossierSubTab === "phase2" ? "sub-tab-active" : "",
                dossierDetail.formalRequest.portalLabel === formalClosedLabel
                  ? "sub-tab-done"
                  : "",
              ].join(" ")}
              onClick={() => onDossierSubTabChange("phase2")}
            >
              Phase II — Demande formelle
            </button>
          ) : null}
          {phase3Statuses.includes(dossierDetail.dossier.status) ? (
            <button
              type="button"
              className={`sub-tab ${dossierSubTab === "phase3" ? "sub-tab-active" : ""}`}
              onClick={() => onDossierSubTabChange("phase3")}
            >
              Phase III — Évaluation
            </button>
          ) : null}
          {phase4Statuses.includes(dossierDetail.dossier.status) ? (
            <button
              type="button"
              className={`sub-tab ${dossierSubTab === "phase4" ? "sub-tab-active" : ""}`}
              onClick={() => onDossierSubTabChange("phase4")}
            >
              Phase IV — Inspection
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="p-5">
        {dossierLoading ? (
          <p className="text-sm text-slate-500">Chargement du dossier DN…</p>
        ) : dossierError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {dossierError}
          </div>
        ) : dossierDetail ? (
          <>
            {dossierSubTab === "overview" ? (
              <DossierOverviewPanel
                dossierDetail={dossierDetail}
                dossierLoading={dossierLoading}
                onRefreshDossier={onRefreshDossier}
              />
            ) : null}

            {dossierSubTab === "phase1" ? (
              <PreliminaryPhasePanel
                preliminary={dossierDetail.preliminary}
                downloadError={downloadError}
                onDownload={onDownload}
              />
            ) : null}

            {dossierSubTab === "phase2" ? (
              <FormalRequestPhasePanel
                formalRequest={dossierDetail.formalRequest}
                downloadError={downloadError}
                expandedRequirementId={expandedRequirementId}
                reqUploadFile={reqUploadFile}
                reqUploadNotes={reqUploadNotes}
                reqUploadBusy={reqUploadBusy}
                reqUploadError={reqUploadError}
                reqUploadFileRef={reqUploadFileRef}
                onRequirementExpand={onRequirementExpand}
                onRequirementFileChange={onRequirementFileChange}
                onRequirementNotesChange={onRequirementNotesChange}
                onRequirementSubmit={onRequirementSubmit}
                onTemplateDownload={onTemplateDownload}
              />
            ) : null}

            {dossierSubTab === "phase3" ? (
              <Phase3DocumentEvaluationBlock dossierId={dossierId} />
            ) : null}

            {dossierSubTab === "phase4" ? (
              <Phase4InspectionBlock dossierId={dossierId} />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
