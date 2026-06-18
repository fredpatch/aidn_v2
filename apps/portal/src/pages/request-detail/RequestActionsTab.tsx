import { CheckCircle2, Download, FileText, Send, Upload } from "lucide-react";
import type { FormEvent, RefObject } from "react";

import type { PortalDossierDetail } from "../../lib/api/dossiers";
import type { PortalRequest } from "../../lib/api/requests";
import { ProcessTimeline } from "./ProcessTimeline";

type RequestActionsTabProps = {
  request: PortalRequest;
  isSubmitted: boolean;
  dossierDetail: PortalDossierDetail | null;
  hasFormalDocRequired: boolean;
  hasActionRequired: boolean;
  showFormalRequestUpload: boolean;
  formalRequestFileRef: RefObject<HTMLInputElement | null>;
  formalRequestNotes: string;
  formalRequestError: string;
  isFormalRequestUploading: boolean;
  preEvalFileRef: RefObject<HTMLInputElement | null>;
  downloadError: string;
  uploadError: string;
  isUploading: boolean;
  onShowFormalRequestUploadChange: (show: boolean) => void;
  onFormalRequestNotesChange: (notes: string) => void;
  onClearFormalRequestError: () => void;
  onFormalRequestUpload: (event: FormEvent<HTMLFormElement>) => void;
  onPreEvalUpload: (event: FormEvent<HTMLFormElement>) => void;
  onDownload: (documentId: string, filename: string) => void;
  onOpenDossierTab: () => void;
};

export function RequestActionsTab({
  request,
  isSubmitted,
  dossierDetail,
  hasFormalDocRequired,
  hasActionRequired,
  showFormalRequestUpload,
  formalRequestFileRef,
  formalRequestNotes,
  formalRequestError,
  isFormalRequestUploading,
  preEvalFileRef,
  downloadError,
  uploadError,
  isUploading,
  onShowFormalRequestUploadChange,
  onFormalRequestNotesChange,
  onClearFormalRequestError,
  onFormalRequestUpload,
  onPreEvalUpload,
  onDownload,
  onOpenDossierTab,
}: RequestActionsTabProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <div className="surface rounded-xl p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">
          Progression de votre dossier
        </h2>
        <ProcessTimeline
          request={request}
          isSubmitted={isSubmitted}
          dossierDetail={dossierDetail}
        />
      </div>

      <div className="flex flex-col gap-4">
        {request.status === "intake_requires_correction" ? (
          <div className="surface rounded-xl p-5">
            <h2 className="text-sm font-semibold text-amber-800">
              Correction requise
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Votre demande nécessite une correction. Veuillez contacter
              l'équipe ANAC ou soumettre un dossier corrigé selon les
              instructions reçues.
            </p>
          </div>
        ) : null}

        {dossierDetail?.formalRequest?.canUploadFormalRequestCourrier &&
        request.dossierId ? (
          <div className="surface rounded-lg p-5">
            <p className="text-xs font-bold uppercase text-amber-600">
              Action requise
            </p>
            <h2 className="mt-1 text-base font-bold text-slate-950">
              Demande formelle attendue
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Téléversez le courrier de demande formelle pour permettre à
              l'ANAC de poursuivre le traitement.
            </p>

            {!showFormalRequestUpload ? (
              <button
                type="button"
                className="btn btn-primary mt-4 w-fit"
                onClick={() => onShowFormalRequestUploadChange(true)}
              >
                <Upload size={16} aria-hidden="true" />
                Téléverser la demande formelle
              </button>
            ) : (
              <form
                className="mt-4 grid gap-4 rounded-md border border-slate-200 p-4"
                onSubmit={onFormalRequestUpload}
              >
                {formalRequestError ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    {formalRequestError}
                  </div>
                ) : null}

                <div className="field">
                  <label htmlFor="formalRequestFile">
                    Fichier PDF <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="formalRequestFile"
                    ref={formalRequestFileRef}
                    className="control"
                    type="file"
                    accept=".pdf,application/pdf"
                    required
                    disabled={isFormalRequestUploading}
                  />
                </div>

                <div className="field">
                  <label htmlFor="formalRequestNotes">Notes optionnelles</label>
                  <textarea
                    id="formalRequestNotes"
                    className="control min-h-20"
                    value={formalRequestNotes}
                    onChange={(event) =>
                      onFormalRequestNotesChange(event.target.value)
                    }
                    maxLength={3000}
                    disabled={isFormalRequestUploading}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn btn-primary w-fit"
                    type="submit"
                    disabled={isFormalRequestUploading}
                  >
                    <Upload size={16} aria-hidden="true" />
                    {isFormalRequestUploading
                      ? "Envoi en cours..."
                      : "Téléverser la demande formelle"}
                  </button>
                  <button
                    className="btn btn-secondary w-fit"
                    type="button"
                    disabled={isFormalRequestUploading}
                    onClick={() => {
                      onShowFormalRequestUploadChange(false);
                      onClearFormalRequestError();
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : null}

        {dossierDetail?.formalRequest?.hasFormalRequestCourrier &&
        !dossierDetail.formalRequest.canUploadFormalRequestCourrier ? (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={16} aria-hidden="true" />
            {dossierDetail.formalRequest.portalLabel}
          </div>
        ) : null}

        {hasFormalDocRequired &&
        dossierDetail?.formalRequest?.hasFormalRequestCourrier &&
        request.dossierId ? (
          <div className="surface rounded-lg p-5">
            <p className="text-xs font-bold uppercase text-amber-600">
              Action requise
            </p>
            <h2 className="mt-1 text-base font-bold text-slate-950">
              Documents de demande formelle à compléter
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Téléversez les pièces demandées pour permettre à l'ANAC de
              poursuivre le traitement. Téléchargez les formulaires disponibles,
              complétez-les, puis téléversez les versions renseignées.
            </p>
            <button
              type="button"
              className="btn btn-primary mt-4 w-fit"
              onClick={onOpenDossierTab}
            >
              <FileText size={16} aria-hidden="true" />
              Compléter les documents
            </button>
          </div>
        ) : null}

        {dossierDetail?.preliminary.canSubmitForm && request.dossierId ? (
          <div className="surface rounded-lg p-5">
            <h2 className="mb-3 text-base font-bold text-slate-950">
              Formulaire de pré-évaluation à soumettre
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              Téléchargez le formulaire, complétez-le et téléversez-le
              ci-dessous.
            </p>

            {dossierDetail.preliminary.preEvaluationFormDocumentId ? (
              <button
                type="button"
                className="btn btn-secondary mb-4 w-fit"
                onClick={() =>
                  onDownload(
                    dossierDetail.preliminary.preEvaluationFormDocumentId!,
                    "formulaire-pre-evaluation.pdf",
                  )
                }
              >
                <Download size={14} aria-hidden="true" />
                Télécharger le formulaire de pré-évaluation
              </button>
            ) : null}

            {downloadError ? (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {downloadError}
              </div>
            ) : null}

            <form
              className="grid gap-4 rounded-md border border-slate-200 p-4"
              onSubmit={onPreEvalUpload}
            >
              {uploadError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {uploadError}
                </div>
              ) : null}

              <div className="field">
                <label htmlFor="preEvalFile">
                  Formulaire complété <span aria-hidden="true">*</span>
                </label>
                <input
                  id="preEvalFile"
                  ref={preEvalFileRef}
                  className="control"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  required
                  disabled={isUploading}
                />
                <p className="mt-1 text-xs font-medium text-slate-500">
                  PDF, JPG ou PNG - taille maximale 10 Mo.
                </p>
              </div>

              <div>
                <button
                  className="btn btn-primary w-fit"
                  type="submit"
                  disabled={isUploading}
                >
                  <Send size={16} aria-hidden="true" />
                  {isUploading ? "Envoi en cours..." : "Soumettre le formulaire"}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {dossierDetail?.preliminary.hasCompletedForm &&
        !dossierDetail.preliminary.canSubmitForm ? (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={16} aria-hidden="true" />
            Formulaire soumis - en attente d'analyse par l'ANAC.
          </div>
        ) : null}

        {!hasActionRequired ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2
              size={14}
              className="flex-shrink-0 text-emerald-500"
              aria-hidden="true"
            />
            Aucune action requise de votre part pour le moment. Vous serez
            notifié si une action est nécessaire.
          </p>
        ) : null}
      </div>
    </div>
  );
}
