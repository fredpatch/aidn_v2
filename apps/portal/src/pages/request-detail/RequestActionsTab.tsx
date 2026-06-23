import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Send,
  Upload,
} from "lucide-react";
import type { FormEvent, RefObject } from "react";

import {
  Alert,
  AlertContent,
  AlertIcon,
  AlertTitle,
} from "../../components/Alert";
import type { PortalDossierDetail } from "../../lib/api/dossiers";
import type { PortalRequest } from "../../lib/api/requests";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Field, FieldError, FieldLabel } from "../../components/ui/field";
import { Input } from "../../components/ui/input";
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Progression de votre dossier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProcessTimeline
            request={request}
            isSubmitted={isSubmitted}
            dossierDetail={dossierDetail}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {request.status === "intake_requires_correction" ? (
          <Alert variant="warning" appearance="light">
            <AlertIcon>
              <AlertCircle
                size={16}
                className="text-amber-600"
                aria-hidden="true"
              />
            </AlertIcon>
            <AlertContent>
              <AlertTitle>Correction requise</AlertTitle>
              <p className="mt-1 text-sm text-amber-700">
                Votre demande nécessite une correction. Veuillez contacter
                l'équipe ANAC ou soumettre un dossier corrigé selon les
                instructions reçues.
              </p>
            </AlertContent>
          </Alert>
        ) : null}

        {dossierDetail?.formalRequest?.canUploadFormalRequestCourrier &&
        request.dossierId ? (
          <Card>
            <CardHeader>
              <CardDescription>Action requise</CardDescription>
              <CardTitle>Demande formelle attendue</CardTitle>
              <p className="mt-2 text-sm text-slate-600">
                Téléversez le courrier de demande formelle pour permettre à
                l'ANAC de poursuivre le traitement.
              </p>
            </CardHeader>
            <CardContent>
              {!showFormalRequestUpload ? (
                <Button
                  type="button"
                  variant="default"
                  onClick={() => onShowFormalRequestUploadChange(true)}
                >
                  <Upload size={16} aria-hidden="true" />
                  Téléverser la demande formelle
                </Button>
              ) : (
                <form className="grid gap-4" onSubmit={onFormalRequestUpload}>
                  {formalRequestError ? (
                    <Alert variant="danger" appearance="light">
                      <AlertIcon>
                        <AlertCircle
                          size={16}
                          className="text-red-600"
                          aria-hidden="true"
                        />
                      </AlertIcon>
                      <AlertContent>
                        <AlertTitle>{formalRequestError}</AlertTitle>
                      </AlertContent>
                    </Alert>
                  ) : null}

                  <Field>
                    <FieldLabel htmlFor="formalRequestFile">
                      Fichier PDF <span aria-hidden="true">*</span>
                    </FieldLabel>
                    <Input
                      id="formalRequestFile"
                      ref={formalRequestFileRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      required
                      disabled={isFormalRequestUploading}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="formalRequestNotes">
                      Notes optionnelles
                    </FieldLabel>
                    <textarea
                      id="formalRequestNotes"
                      className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 focus-visible:border-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10"
                      value={formalRequestNotes}
                      onChange={(event) =>
                        onFormalRequestNotesChange(event.target.value)
                      }
                      maxLength={3000}
                      disabled={isFormalRequestUploading}
                    />
                  </Field>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={isFormalRequestUploading}>
                      <Upload size={16} aria-hidden="true" />
                      {isFormalRequestUploading
                        ? "Envoi en cours..."
                        : "Téléverser la demande formelle"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isFormalRequestUploading}
                      onClick={() => {
                        onShowFormalRequestUploadChange(false);
                        onClearFormalRequestError();
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        ) : null}

        {dossierDetail?.formalRequest?.hasFormalRequestCourrier &&
        !dossierDetail.formalRequest.canUploadFormalRequestCourrier ? (
          <Alert variant="success" appearance="light">
            <AlertIcon>
              <CheckCircle2
                size={16}
                className="text-emerald-600"
                aria-hidden="true"
              />
            </AlertIcon>
            <AlertContent>
              <AlertTitle>{dossierDetail.formalRequest.portalLabel}</AlertTitle>
            </AlertContent>
          </Alert>
        ) : null}

        {hasFormalDocRequired &&
        dossierDetail?.formalRequest?.hasFormalRequestCourrier &&
        request.dossierId ? (
          <Card>
            <CardHeader>
              <CardDescription>Action requise</CardDescription>
              <CardTitle>Documents de demande formelle à compléter</CardTitle>
              <p className="mt-2 text-sm text-slate-600">
                Téléversez les pièces demandées pour permettre à l'ANAC de
                poursuivre le traitement. Téléchargez les formulaires
                disponibles, complétez-les, puis téléversez les versions
                renseignées.
              </p>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={onOpenDossierTab}>
                <FileText size={16} aria-hidden="true" />
                Compléter les documents
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {dossierDetail?.preliminary.canSubmitForm && request.dossierId ? (
          <Card>
            <CardHeader>
              <CardTitle>Formulaire de pré-évaluation à soumettre</CardTitle>
              <p className="mt-2 text-sm text-slate-600">
                Téléchargez le formulaire, complétez-le et téléversez-le
                ci-dessous.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {dossierDetail.preliminary.preEvaluationFormDocumentId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    onDownload(
                      dossierDetail.preliminary.preEvaluationFormDocumentId!,
                      "formulaire-pre-evaluation.pdf",
                    )
                  }
                >
                  <Download size={14} aria-hidden="true" />
                  Télécharger le formulaire de pré-évaluation
                </Button>
              ) : null}

              {downloadError ? (
                <Alert variant="danger" appearance="light">
                  <AlertIcon>
                    <AlertCircle
                      size={16}
                      className="text-red-600"
                      aria-hidden="true"
                    />
                  </AlertIcon>
                  <AlertContent>
                    <AlertTitle>{downloadError}</AlertTitle>
                  </AlertContent>
                </Alert>
              ) : null}

              <form className="grid gap-4" onSubmit={onPreEvalUpload}>
                {uploadError ? (
                  <Alert variant="danger" appearance="light">
                    <AlertIcon>
                      <AlertCircle
                        size={16}
                        className="text-red-600"
                        aria-hidden="true"
                      />
                    </AlertIcon>
                    <AlertContent>
                      <AlertTitle>{uploadError}</AlertTitle>
                    </AlertContent>
                  </Alert>
                ) : null}

                <Field>
                  <FieldLabel htmlFor="preEvalFile">
                    Formulaire complété <span aria-hidden="true">*</span>
                  </FieldLabel>
                  <Input
                    id="preEvalFile"
                    ref={preEvalFileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    required
                    disabled={isUploading}
                  />
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    PDF, JPG ou PNG - taille maximale 10 Mo.
                  </p>
                </Field>

                <Button type="submit" disabled={isUploading}>
                  <Send size={16} aria-hidden="true" />
                  {isUploading
                    ? "Envoi en cours..."
                    : "Soumettre le formulaire"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {dossierDetail?.preliminary.hasCompletedForm &&
        !dossierDetail.preliminary.canSubmitForm ? (
          <Alert variant="success" appearance="light">
            <AlertIcon>
              <CheckCircle2
                size={16}
                className="text-emerald-600"
                aria-hidden="true"
              />
            </AlertIcon>
            <AlertContent>
              <AlertTitle>
                Formulaire soumis - en attente d'analyse par l'ANAC.
              </AlertTitle>
            </AlertContent>
          </Alert>
        ) : null}

        {!hasActionRequired ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2
              size={14}
              className="shrink-0 text-emerald-500"
              aria-hidden="true"
            />
            Aucune action requise de votre part pour le moment. Vous serez
            notifié si une action est nécessaire.
          </div>
        ) : null}
      </div>
    </div>
  );
}
