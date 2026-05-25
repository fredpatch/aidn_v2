import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FolderOpen,
  RefreshCw,
  Save,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import { RequestStatusBadge } from "../components/RequestStatusBadge";
import {
  getRequestTypeLabel,
  RequestTypeLabel,
} from "../components/RequestTypeLabel";
import {
  downloadPortalDossierDocument,
  getPortalDossier,
  getRequest,
  submitRequestWithCourrier,
  updateRequest,
  uploadPreEvaluationForm,
  type PortalCourrier,
  type PortalDocument,
  type PortalDossierDetail,
  type PortalDossierMeeting,
  type PortalRequest,
  type PortalRequestType,
} from "../lib/api/portal.api";
import { PortalApiError } from "../lib/api/http";
import { portalRoutes } from "../lib/routes";

type Tab = "resume" | "courrier" | "actions" | "dossier" | "historique";

const requestTypeOptions: Array<{ value: PortalRequestType; label: string }> = [
  { value: "oma_approval", label: getRequestTypeLabel("oma_approval") },
  { value: "oma_recognition", label: getRequestTypeLabel("oma_recognition") },
  { value: "oma_renewal", label: getRequestTypeLabel("oma_renewal") },
  { value: "oma_modification", label: getRequestTypeLabel("oma_modification") },
];

const locationOptions = [
  { value: "ANAC", label: "ANAC" },
  { value: "DG", label: "DG" },
  { value: "DN", label: "DN" },
  { value: "other", label: "Autre" },
] as const;

const dossierTypeLabels: Record<string, string> = {
  oma_recognition: "Certificat de reconnaissance OMA",
  oma_approval: "Certificat d'agrément OMA",
  oma_renewal: "Renouvellement de Certificat OMA",
  oma_modification: "Modification de Certificat OMA",
};

const portalStatusGuidance: Record<string, string> = {
  "Dossier en cours de traitement":
    "Votre dossier est en cours de traitement par l'équipe de la Direction de la Navigabilité.",
  "Rendez-vous programmé":
    "Un rendez-vous a été programmé. Votre correspondant ANAC vous contactera avec les détails.",
  "Rendez-vous tenu":
    "Le rendez-vous a eu lieu. L'équipe DN prépare la prochaine étape.",
  "Action requise - Formulaire disponible":
    "Un formulaire de pré-évaluation est disponible. Téléchargez-le, complétez-le et soumettez-le dans l'onglet Actions requises.",
  "En attente d'analyse":
    "Votre formulaire est en cours d'analyse par l'équipe ANAC.",
  "Rendez-vous préliminaire programmé":
    "La réunion préliminaire a été programmée. Votre correspondant ANAC vous contactera.",
  "Phase préliminaire en cours de clôture":
    "La phase préliminaire est en cours de finalisation.",
};

type CourrierMode = "portal_upload" | "physical_deposit";

type RequestDetail = {
  request: PortalRequest;
  courrier?: PortalCourrier;
  document?: PortalDocument;
};

const formatDateTime = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "-";

function getErrorMessage(caught: unknown): string {
  return caught instanceof PortalApiError
    ? caught.message
    : "Une erreur est survenue. Veuillez réessayer.";
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <article className="surface rounded-lg p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </article>
  );
}

function MeetingBlock({
  label,
  meeting,
}: {
  label: string;
  meeting: PortalDossierMeeting;
}): React.JSX.Element {
  const meetingStatusLabels: Record<string, string> = {
    invited: "Planifié",
    held: "Tenu",
    cancelled: "Annulé",
  };

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <dl className="mt-2 grid gap-1">
        <div>
          <dt className="inline text-slate-500">Statut : </dt>
          <dd className="inline font-medium text-slate-800">
            {meetingStatusLabels[meeting.status] ?? meeting.status}
          </dd>
        </div>
        {meeting.scheduledAt ? (
          <div>
            <dt className="inline text-slate-500">Date : </dt>
            <dd className="inline font-medium text-slate-800">
              {new Intl.DateTimeFormat("fr-FR", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(meeting.scheduledAt))}
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

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "resume", label: "Résumé" },
  { key: "courrier", label: "Courrier initial" },
  { key: "actions", label: "Actions requises" },
  { key: "dossier", label: "Dossier" },
  { key: "historique", label: "Historique" },
];

export function RequestDetailPage(): React.JSX.Element {
  const { id } = useParams();
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [tab, setTab] = useState<Tab>("resume");
  const [requestType, setRequestType] =
    useState<PortalRequestType>("oma_approval");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [courrierMode, setCourrierMode] =
    useState<CourrierMode>("portal_upload");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [expectedDepositDate, setExpectedDepositDate] = useState("");
  const [depositLocation, setDepositLocation] = useState<
    "ANAC" | "DG" | "DN" | "other"
  >("ANAC");
  const [courrierNotes, setCourrierNotes] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [dossierDetail, setDossierDetail] =
    useState<PortalDossierDetail | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierError, setDossierError] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const preEvalFileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const request = detail?.request;
  const isSubmitted = request
    ? request.status !== "draft" &&
      request.status !== "courrier_uploaded" &&
      request.status !== "courrier_physical_declared"
    : false;

  const hasActionRequired =
    request?.status === "intake_requires_correction" ||
    dossierDetail?.preliminary.canSubmitForm === true;

  const loadDossier = useCallback(async (dossierId: string) => {
    setDossierLoading(true);
    setDossierError("");
    try {
      setDossierDetail(await getPortalDossier(dossierId));
    } catch (caught) {
      setDossierError(getErrorMessage(caught));
    } finally {
      setDossierLoading(false);
    }
  }, []);

  const loadRequest = useCallback(async () => {
    if (!id) return;
    setError("");
    setIsLoading(true);
    try {
      const nextDetail = await getRequest(id);
      setDetail(nextDetail);
      setRequestType(nextDetail.request.requestType);
      setSubject(nextDetail.request.subject);
      setMessage(nextDetail.request.message ?? "");
      setCourrierMode(nextDetail.request.courrierSource ?? "portal_upload");
      setExpectedDepositDate(
        nextDetail.request.physicalDeposit?.expectedDepositDate?.slice(0, 10) ??
          "",
      );
      setDepositLocation(
        nextDetail.request.physicalDeposit?.location ?? "ANAC",
      );
      setCourrierNotes(
        nextDetail.courrier?.notes ??
          nextDetail.request.physicalDeposit?.notes ??
          "",
      );
      if (nextDetail.request.dossierId) {
        void loadDossier(nextDetail.request.dossierId);
      }
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }, [id, loadDossier]);

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  const submitBasicUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !request || isSubmitted) return;
    if (subject.trim().length < 3) {
      setError("Objet de la demande requis, minimum 3 caractères.");
      return;
    }
    setError("");
    setBusyAction("update");
    try {
      const { request: updated } = await updateRequest(id, {
        requestType,
        subject: subject.trim(),
        message: message.trim() || undefined,
      });
      setDetail((current) =>
        current ? { ...current, request: updated } : current,
      );
      toast.success("Demande mise à jour.");
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusyAction(null);
    }
  };

  const handleSubmitRequest = async () => {
    if (!id || !request || isSubmitted) return;
    if (subject.trim().length < 3) {
      setError("Objet de la demande requis, minimum 3 caractères.");
      return;
    }
    if (
      courrierMode === "portal_upload" &&
      !uploadFile &&
      !request.initialDocumentId
    ) {
      setError("Veuillez sélectionner le courrier initial à téléverser.");
      return;
    }
    if (courrierMode === "physical_deposit" && !expectedDepositDate) {
      setError("La date prévue de dépôt est requise.");
      return;
    }
    if (courrierMode === "physical_deposit" && !depositLocation) {
      setError("Le lieu de dépôt est requis.");
      return;
    }
    setError("");
    setBusyAction("submit");
    try {
      const { request: submitted } = await submitRequestWithCourrier(id, {
        requestType,
        subject: subject.trim(),
        message: message.trim() || undefined,
        courrierSource: courrierMode,
        file:
          courrierMode === "portal_upload"
            ? (uploadFile ?? undefined)
            : undefined,
        plannedPhysicalDepositDate:
          courrierMode === "physical_deposit" ? expectedDepositDate : undefined,
        depositLocation:
          courrierMode === "physical_deposit" ? depositLocation : undefined,
        notes: courrierNotes.trim() || undefined,
      });
      setDetail((current) =>
        current ? { ...current, request: submitted } : current,
      );
      toast.success("Demande soumise avec succès.");
      setTab("resume");
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusyAction(null);
    }
  };

  const handlePreEvalUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const file = preEvalFileRef.current?.files?.[0];
    if (!file || !request?.dossierId) return;
    setUploadError("");
    setIsUploading(true);
    try {
      await uploadPreEvaluationForm(request.dossierId, file);
      if (preEvalFileRef.current) preEvalFileRef.current.value = "";
      void loadDossier(request.dossierId);
      toast.success("Formulaire soumis avec succès.");
    } catch (caught) {
      setUploadError(getErrorMessage(caught));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (documentId: string, filename: string) => {
    if (!request?.dossierId) return;
    setDownloadError("");
    try {
      const blob = await downloadPortalDossierDocument(
        request.dossierId,
        documentId,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setDownloadError(getErrorMessage(caught));
    }
  };

  const evidenceLabel = useMemo(() => {
    if (!request) return "Aucun courrier ajouté";
    if (request.initialDocumentId) return "Courrier initial téléversé";
    if (request.courrierSource === "physical_deposit")
      return "Dépôt physique prévu";
    return "Aucun courrier ajouté";
  }, [request]);

  if (isLoading) {
    return (
      <section className="surface rounded-lg p-5 text-sm font-semibold text-slate-600">
        Chargement de la demande…
      </section>
    );
  }

  if (!request) {
    return (
      <section className="flex flex-col gap-4">
        <Link className="btn btn-secondary w-fit" to={portalRoutes.requests}>
          <ArrowLeft size={16} aria-hidden="true" />
          Mes demandes
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error || "Demande introuvable."}
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <Link
          className="btn btn-secondary mb-4 w-fit"
          to={portalRoutes.requests}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Mes demandes
        </Link>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="page-title">Détail de la demande</h1>
            <p className="page-subtitle">
              <RequestTypeLabel type={request.requestType} /> -{" "}
              {request.subject}
            </p>
          </div>
          <RequestStatusBadge
            status={request.status}
            label={request.portalStatusLabel}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
        {TABS.map(({ key, label }) => {
          const isActive = tab === key;
          const needsBadge = key === "actions" && hasActionRequired;
          const isDossierDisabled = key === "dossier" && !request.dossierId;
          return (
            <button
              key={key}
              type="button"
              disabled={isDossierDisabled}
              onClick={() => setTab(key)}
              className={[
                "relative flex flex-shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-950 text-white"
                  : isDossierDisabled
                    ? "cursor-not-allowed text-slate-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              ].join(" ")}
            >
              {label}
              {needsBadge ? (
                <span
                  className="h-2 w-2 rounded-full bg-amber-400"
                  aria-label="action requise"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Résumé tab */}
      {tab === "resume" ? (
        <div className="flex flex-col gap-4">
          {isSubmitted && !request.dossierId ? (
            <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
              Votre demande a été reçue. Elle est en attente d'orientation
              administrative.
            </div>
          ) : null}

          {request.portalStatusLabel &&
          portalStatusGuidance[request.portalStatusLabel] ? (
            <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm">
              <p className="font-semibold text-sky-800">
                {request.portalStatusLabel}
              </p>
              <p className="mt-1 text-sky-700">
                {portalStatusGuidance[request.portalStatusLabel]}
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock
              label="Type de demande"
              value={getRequestTypeLabel(request.requestType)}
            />
            <InfoBlock
              label="Création"
              value={formatDateTime(request.createdAt)}
            />
            <InfoBlock
              label="Soumission"
              value={formatDateTime(request.submittedAt)}
            />
          </div>

          <form
            className="surface grid gap-4 rounded-lg p-5"
            onSubmit={submitBasicUpdate}
          >
            <div>
              <h2 className="text-lg font-bold text-slate-950">Informations</h2>
              <p className="mt-1 text-sm text-slate-500">
                Les champs sont modifiables tant que la demande n'est pas
                soumise.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="field">
                <label htmlFor="requestType">Type de demande</label>
                <select
                  id="requestType"
                  className="control"
                  value={requestType}
                  onChange={(e) =>
                    setRequestType(e.target.value as PortalRequestType)
                  }
                  disabled={isSubmitted}
                >
                  {requestTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="subject">Objet de la demande</label>
                <input
                  id="subject"
                  className="control"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  minLength={3}
                  maxLength={200}
                  disabled={isSubmitted}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="message">Message complémentaire</label>
              <textarea
                id="message"
                className="control min-h-28"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={3000}
                disabled={isSubmitted}
              />
            </div>

            {!isSubmitted ? (
              <div>
                <button
                  className="btn btn-secondary"
                  type="submit"
                  disabled={busyAction === "update"}
                >
                  <Save size={16} aria-hidden="true" />
                  {busyAction === "update" ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            ) : null}
          </form>

          <div className="flex justify-end">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => void loadRequest()}
            >
              <RefreshCw size={16} aria-hidden="true" />
              Actualiser
            </button>
          </div>
        </div>
      ) : null}

      {/* Courrier initial tab */}
      {tab === "courrier" ? (
        <div className="surface flex flex-col gap-5 rounded-lg p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Courrier initial
            </h2>
            <p className="mt-1 text-sm text-slate-500">{evidenceLabel}</p>
            {detail?.document ? (
              <p className="mt-2 text-sm font-medium text-slate-700">
                Fichier : {detail.document.fileName} -{" "}
                {Math.ceil(detail.document.fileSize / 1024)} Ko
              </p>
            ) : null}
            {detail?.courrier?.notes ? (
              <p className="mt-2 text-sm text-slate-600">
                Notes : {detail.courrier.notes}
              </p>
            ) : null}
          </div>

          {!isSubmitted ? (
            <div className="grid gap-4 rounded-md border border-slate-200 p-4">
              <div className="field">
                <label htmlFor="courrierMode">
                  Mode de dépôt du courrier *
                </label>
                <select
                  id="courrierMode"
                  className="control"
                  value={courrierMode}
                  onChange={(e) =>
                    setCourrierMode(e.target.value as CourrierMode)
                  }
                >
                  <option value="portal_upload">Téléversement portail</option>
                  <option value="physical_deposit">
                    Dépôt physique à l'ANAC
                  </option>
                </select>
              </div>

              {courrierMode === "portal_upload" ? (
                <div className="field">
                  <label htmlFor="courrierFile">Courrier initial *</label>
                  <input
                    id="courrierFile"
                    className="control"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  />
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    PDF, JPG ou PNG - taille maximale 10 Mo.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="field">
                    <label htmlFor="expectedDepositDate">
                      Date prévue de dépôt *
                    </label>
                    <input
                      id="expectedDepositDate"
                      className="control"
                      type="date"
                      value={expectedDepositDate}
                      onChange={(e) => setExpectedDepositDate(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="depositLocation">Lieu de dépôt</label>
                    <select
                      id="depositLocation"
                      className="control"
                      value={depositLocation}
                      onChange={(e) =>
                        setDepositLocation(
                          e.target.value as "ANAC" | "DG" | "DN" | "other",
                        )
                      }
                    >
                      {locationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="field">
                <label htmlFor="courrierNotes">Notes</label>
                <textarea
                  id="courrierNotes"
                  className="control min-h-20"
                  value={courrierNotes}
                  onChange={(e) => setCourrierNotes(e.target.value)}
                  maxLength={3000}
                />
              </div>
            </div>
          ) : null}

          {!isSubmitted ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="font-bold text-slate-950">Soumettre la demande</p>
                <p className="mt-1 text-sm text-slate-500">
                  Une demande soumise ne peut plus être modifiée depuis le
                  portail.
                </p>
              </div>
              <button
                className="btn btn-primary flex-shrink-0"
                type="button"
                onClick={() => void handleSubmitRequest()}
                disabled={busyAction === "submit"}
              >
                <Send size={16} aria-hidden="true" />
                {busyAction === "submit" ? "Soumission…" : "Soumettre"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Actions requises tab */}
      {tab === "actions" ? (
        <div className="flex flex-col gap-4">
          {request.status === "intake_requires_correction" ? (
            <div className="surface rounded-lg p-5">
              <h2 className="text-base font-bold text-amber-800">
                Correction requise
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Votre demande nécessite une correction. Veuillez contacter
                l'équipe ANAC ou soumettre un dossier corrigé selon les
                instructions reçues.
              </p>
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
                    void handleDownload(
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
                onSubmit={(e) => void handlePreEvalUpload(e)}
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
                    {isUploading
                      ? "Envoi en cours…"
                      : "Soumettre le formulaire"}
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
            <div className="surface rounded-lg p-8 text-center">
              <CheckCircle2
                size={28}
                className="mx-auto mb-3 text-emerald-500"
                aria-hidden="true"
              />
              <p className="font-semibold text-slate-700">
                Aucune action requise pour le moment.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Vous serez notifié si une action de votre part est nécessaire.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Dossier tab */}
      {tab === "dossier" && request.dossierId ? (
        <div className="surface grid gap-4 rounded-lg p-5">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-sky-600" aria-hidden="true" />
            <h2 className="text-lg font-bold text-slate-950">
              Votre dossier de certification
            </h2>
          </div>

          {dossierLoading ? (
            <p className="text-sm text-slate-500">Chargement du dossier DN…</p>
          ) : dossierError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {dossierError}
            </div>
          ) : dossierDetail ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <InfoBlock
                  label="Référence dossier"
                  value={dossierDetail.dossier.dossierNumber}
                />
                <InfoBlock
                  label="Type de certification"
                  value={
                    dossierTypeLabels[dossierDetail.dossier.dossierType] ??
                    dossierDetail.dossier.dossierType
                  }
                />
              </div>

              {dossierDetail.preliminary.status === "preliminary_closed" ? (
                <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-emerald-800">
                      Phase préliminaire terminée
                    </p>
                    <p className="mt-1 text-emerald-700">
                      Votre dossier passe à la phase de demande formelle.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm">
                  <p className="font-semibold text-sky-800">
                    {dossierDetail.preliminary.portalLabel}
                  </p>
                </div>
              )}

              {dossierDetail.preliminary.firstMeeting ? (
                <MeetingBlock
                  label="Première réunion de contact"
                  meeting={dossierDetail.preliminary.firstMeeting}
                />
              ) : null}

              {dossierDetail.preliminary.preliminaryMeeting ? (
                <MeetingBlock
                  label="Réunion préliminaire"
                  meeting={dossierDetail.preliminary.preliminaryMeeting}
                />
              ) : null}

              {downloadError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {downloadError}
                </div>
              ) : null}

              {dossierDetail.preliminary.firstMeetingReportDocumentId ? (
                <button
                  type="button"
                  className="btn btn-secondary w-fit"
                  onClick={() =>
                    void handleDownload(
                      dossierDetail.preliminary.firstMeetingReportDocumentId!,
                      "compte-rendu-premiere-reunion.pdf",
                    )
                  }
                >
                  <Download size={14} aria-hidden="true" />
                  Télécharger le compte rendu - Première réunion
                </button>
              ) : null}

              <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                <span>
                  Ouvert le {formatDate(dossierDetail.dossier.openedAt)}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void loadDossier(request.dossierId!)}
                  disabled={dossierLoading}
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  Actualiser
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {/* Historique tab */}
      {tab === "historique" ? (
        <div className="surface rounded-lg p-8 text-center">
          <p className="font-semibold text-slate-700">
            L'historique détaillé sera disponible dans une prochaine version.
          </p>
        </div>
      ) : null}
    </section>
  );
}
