import { AlertCircle, CheckCircle2, Clock, Download } from "lucide-react";

import type { PortalDossierPreliminary } from "../../lib/api/dossiers";
import { Alert, AlertIcon, AlertContent, AlertTitle } from "../../components/Alert";
import { Button } from "../../components/ui/button";
import {
  getPreliminaryStatusLabel,
  getPreliminaryPhaseStep,
} from "./status.helpers";
import { MeetingBlock } from "./MeetingBlock";
import { PRELIMINARY_STEPS } from "./status.constants";

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
  const currentStep = getPreliminaryPhaseStep(preliminary);
  const statusLabel = getPreliminaryStatusLabel(preliminary.status);
  const isClosed = preliminary.status === "preliminary_closed";
  const isWaiting =
    preliminary.status === "preliminary_started" ||
    preliminary.status?.includes("invited");

  return (
    <div className="grid gap-4">
      {/* Status indicator */}
      {isClosed ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
          <CheckCircle2
            size={16}
            className="flex-shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <p className="font-semibold text-emerald-800">{statusLabel}</p>
        </div>
      ) : isWaiting ? (
        <Alert variant="warning" appearance="light">
          <AlertIcon>
            <Clock size={16} className="text-amber-600" aria-hidden="true" />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>{statusLabel}</AlertTitle>
          </AlertContent>
        </Alert>
      ) : (
        <Alert variant="info" appearance="light">
          <AlertIcon>
            <AlertCircle size={16} className="text-sky-600" aria-hidden="true" />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>{statusLabel}</AlertTitle>
          </AlertContent>
        </Alert>
      )}

      {/* Phase progress indicator */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          {[
            PRELIMINARY_STEPS.START,
            PRELIMINARY_STEPS.FIRST_MEETING,
            PRELIMINARY_STEPS.PRE_EVAL_FORM,
            PRELIMINARY_STEPS.PRELIMINARY_MEETING,
            PRELIMINARY_STEPS.CLOSED,
          ].map((step, idx) => (
            <div
              key={step}
              className="flex items-center gap-1"
              aria-current={step === currentStep ? "step" : undefined}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  step === PRELIMINARY_STEPS.START ||
                  step === PRELIMINARY_STEPS.FIRST_MEETING ||
                  step === PRELIMINARY_STEPS.PRE_EVAL_FORM ||
                  step === PRELIMINARY_STEPS.PRELIMINARY_MEETING ||
                  step === PRELIMINARY_STEPS.CLOSED
                    ? step === currentStep
                      ? "bg-sky-600"
                      : ["START", "FIRST_MEETING", "PRE_EVAL_FORM"].includes(
                            step.toUpperCase(),
                          )
                        ? "bg-slate-300"
                        : "bg-slate-200"
                    : "bg-slate-200"
                }`}
              />
              {idx < 4 && <div className="h-px w-1 bg-slate-300" />}
            </div>
          ))}
        </div>
      </div>

      {/* Meeting blocks */}
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

      {/* Error message */}
      {downloadError ? (
        <Alert variant="danger" appearance="light">
          <AlertIcon>
            <AlertCircle size={16} className="text-red-600" aria-hidden="true" />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>{downloadError}</AlertTitle>
          </AlertContent>
        </Alert>
      ) : null}

      {/* First meeting report download */}
      {preliminary.firstMeetingReportDocumentId ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onDownload(
              preliminary.firstMeetingReportDocumentId!,
              "compte-rendu-premiere-reunion.pdf",
            )
          }
        >
          <Download size={14} className="mr-2" aria-hidden="true" />
          Télécharger le compte rendu — Première réunion
        </Button>
      ) : null}
    </div>
  );
}
