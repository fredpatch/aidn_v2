import {
  ArrowLeft,
  FileUp,
  MapPin,
  RefreshCw,
  Save,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { RequestStatusBadge } from "../components/RequestStatusBadge";
import {
  getRequestTypeLabel,
  RequestTypeLabel,
} from "../components/RequestTypeLabel";
import {
  declarePhysicalDeposit,
  getRequest,
  submitRequest,
  updateRequest,
  uploadRequestCourrier,
  type PortalCourrier,
  type PortalDocument,
  type PortalRequest,
  type PortalRequestType,
} from "../lib/api/portal.api";
import { PortalApiError } from "../lib/api/http";
import { portalRoutes } from "../lib/routes";

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

function getErrorMessage(caught: unknown): string {
  return caught instanceof PortalApiError
    ? caught.message
    : "Une erreur est survenue. Veuillez reessayer.";
}

export function RequestDetailPage(): React.JSX.Element {
  const { id } = useParams();
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [requestType, setRequestType] = useState<PortalRequestType>("oma_approval");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState("");
  const [expectedDepositDate, setExpectedDepositDate] = useState("");
  const [physicalDepositDate, setPhysicalDepositDate] = useState("");
  const [depositLocation, setDepositLocation] =
    useState<"ANAC" | "DG" | "DN" | "other">("ANAC");
  const [depositNotes, setDepositNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const request = detail?.request;
  const isSubmitted = request ? request.status !== "draft" &&
    request.status !== "courrier_uploaded" &&
    request.status !== "courrier_physical_declared" : false;
  const hasEvidence = Boolean(
    request?.initialDocumentId || request?.courrierSource === "physical_deposit",
  );

  const loadRequest = useCallback(async () => {
    if (!id) {
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const nextDetail = await getRequest(id);
      setDetail(nextDetail);
      setRequestType(nextDetail.request.requestType);
      setSubject(nextDetail.request.subject);
      setMessage(nextDetail.request.message ?? "");
      setExpectedDepositDate(
        nextDetail.request.physicalDeposit?.expectedDepositDate?.slice(0, 10) ??
          "",
      );
      setPhysicalDepositDate(
        nextDetail.request.physicalDeposit?.physicalDepositDate?.slice(0, 10) ??
          "",
      );
      setDepositLocation(nextDetail.request.physicalDeposit?.location ?? "ANAC");
      setDepositNotes(nextDetail.request.physicalDeposit?.notes ?? "");
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  const submitBasicUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !request || isSubmitted) {
      return;
    }

    if (subject.trim().length < 3) {
      setError("Objet de la demande requis, minimum 3 caracteres.");
      return;
    }

    setError("");
    setSuccess("");
    setBusyAction("update");
    try {
      const { request: updated } = await updateRequest(id, {
        requestType,
        subject: subject.trim(),
        message: message.trim() || undefined,
      });
      setDetail((current) => (current ? { ...current, request: updated } : current));
      setSuccess("Demande mise a jour.");
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusyAction(null);
    }
  };

  const submitUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !uploadFile || isSubmitted) {
      setError("Veuillez selectionner un courrier initial.");
      return;
    }

    setError("");
    setSuccess("");
    setBusyAction("upload");
    try {
      const nextDetail = await uploadRequestCourrier(id, {
        file: uploadFile,
        notes: uploadNotes.trim() || undefined,
      });
      setDetail(nextDetail);
      setUploadFile(null);
      setUploadNotes("");
      setSuccess("Courrier ajoute avec succes.");
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusyAction(null);
    }
  };

  const submitDeposit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || isSubmitted) {
      return;
    }

    setError("");
    setSuccess("");
    setBusyAction("deposit");
    try {
      const nextDetail = await declarePhysicalDeposit(id, {
        expectedDepositDate: expectedDepositDate || undefined,
        physicalDepositDate: physicalDepositDate || undefined,
        location: depositLocation,
        notes: depositNotes.trim() || undefined,
      });
      setDetail((current) => ({
        request: nextDetail.request,
        courrier: nextDetail.courrier,
        document: current?.document,
      }));
      setSuccess("Depot physique declare.");
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusyAction(null);
    }
  };

  const handleSubmitRequest = async () => {
    if (!id || !request || isSubmitted) {
      return;
    }

    if (!hasEvidence) {
      setError(
        "Veuillez ajouter un courrier ou declarer un depot physique avant de soumettre.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setBusyAction("submit");
    try {
      const { request: submitted } = await submitRequest(id);
      setDetail((current) => (current ? { ...current, request: submitted } : current));
      setSuccess("Demande soumise avec succes.");
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusyAction(null);
    }
  };

  const evidenceLabel = useMemo(() => {
    if (!request) {
      return "Aucun courrier ajoute";
    }

    if (request.initialDocumentId) {
      return "Courrier initial televerse";
    }

    if (request.courrierSource === "physical_deposit") {
      return "Depot physique declare";
    }

    return "Aucun courrier ajoute";
  }, [request]);

  if (isLoading) {
    return (
      <section className="surface rounded-lg p-5 text-sm font-semibold text-slate-600">
        Chargement de la demande...
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
        <Link className="btn btn-secondary mb-4 w-fit" to={portalRoutes.requests}>
          <ArrowLeft size={16} aria-hidden="true" />
          Mes demandes
        </Link>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="page-title">Detail de la demande</h1>
            <p className="page-subtitle">
              <RequestTypeLabel type={request.requestType} /> - {request.subject}
            </p>
          </div>
          <RequestStatusBadge status={request.status} />
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      ) : null}

      {isSubmitted ? (
        <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
          Votre demande a ete recue. Elle est en attente d'orientation
          administrative.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <InfoBlock label="Type de demande" value={getRequestTypeLabel(request.requestType)} />
        <InfoBlock label="Creation" value={formatDateTime(request.createdAt)} />
        <InfoBlock label="Soumission" value={formatDateTime(request.submittedAt)} />
      </div>

      <form className="surface grid gap-4 rounded-lg p-5" onSubmit={submitBasicUpdate}>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Informations</h2>
          <p className="mt-1 text-sm text-slate-500">
            Les champs sont modifiables tant que la demande n'est pas soumise.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="field">
            <label htmlFor="requestType">Type de demande</label>
            <select
              id="requestType"
              className="control"
              value={requestType}
              onChange={(event) =>
                setRequestType(event.target.value as PortalRequestType)
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
              onChange={(event) => setSubject(event.target.value)}
              minLength={3}
              maxLength={200}
              disabled={isSubmitted}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="message">Message complementaire</label>
          <textarea
            id="message"
            className="control min-h-28"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
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
              {busyAction === "update" ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        ) : null}
      </form>

      <section className="surface grid gap-5 rounded-lg p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Courrier initial</h2>
          <p className="mt-1 text-sm text-slate-500">{evidenceLabel}</p>
          {detail.document ? (
            <p className="mt-2 text-sm font-medium text-slate-700">
              Fichier: {detail.document.fileName} -{" "}
              {Math.ceil(detail.document.fileSize / 1024)} Ko
            </p>
          ) : null}
          {detail.courrier?.notes ? (
            <p className="mt-2 text-sm text-slate-600">Notes: {detail.courrier.notes}</p>
          ) : null}
        </div>

        {!isSubmitted ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <form className="grid gap-4 rounded-md border border-slate-200 p-4" onSubmit={submitUpload}>
              <div>
                <h3 className="font-bold text-slate-950">Televerser le courrier</h3>
                <p className="mt-1 text-sm text-slate-500">
                  PDF, JPG ou PNG - taille maximale 10 Mo.
                </p>
              </div>
              <div className="field">
                <label htmlFor="courrierFile">Courrier initial</label>
                <input
                  id="courrierFile"
                  className="control"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                />
              </div>
              <div className="field">
                <label htmlFor="uploadNotes">Notes</label>
                <textarea
                  id="uploadNotes"
                  className="control min-h-20"
                  value={uploadNotes}
                  onChange={(event) => setUploadNotes(event.target.value)}
                  maxLength={3000}
                />
              </div>
              <button
                className="btn btn-secondary w-fit"
                type="submit"
                disabled={busyAction === "upload"}
              >
                <FileUp size={16} aria-hidden="true" />
                {busyAction === "upload" ? "Televersement..." : "Televerser le courrier"}
              </button>
            </form>

            <form className="grid gap-4 rounded-md border border-slate-200 p-4" onSubmit={submitDeposit}>
              <div>
                <h3 className="font-bold text-slate-950">
                  Declarer un depot physique
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Utilisez cette option si le courrier sera depose physiquement.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="field">
                  <label htmlFor="expectedDepositDate">Date prevue de depot</label>
                  <input
                    id="expectedDepositDate"
                    className="control"
                    type="date"
                    value={expectedDepositDate}
                    onChange={(event) => setExpectedDepositDate(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="physicalDepositDate">Date de depot</label>
                  <input
                    id="physicalDepositDate"
                    className="control"
                    type="date"
                    value={physicalDepositDate}
                    onChange={(event) => setPhysicalDepositDate(event.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="depositLocation">Lieu de depot</label>
                <select
                  id="depositLocation"
                  className="control"
                  value={depositLocation}
                  onChange={(event) =>
                    setDepositLocation(
                      event.target.value as "ANAC" | "DG" | "DN" | "other",
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
              <div className="field">
                <label htmlFor="depositNotes">Notes</label>
                <textarea
                  id="depositNotes"
                  className="control min-h-20"
                  value={depositNotes}
                  onChange={(event) => setDepositNotes(event.target.value)}
                  maxLength={3000}
                />
              </div>
              <button
                className="btn btn-secondary w-fit"
                type="submit"
                disabled={busyAction === "deposit"}
              >
                <MapPin size={16} aria-hidden="true" />
                {busyAction === "deposit" ? "Declaration..." : "Declarer le depot"}
              </button>
            </form>
          </div>
        ) : null}
      </section>

      {!isSubmitted ? (
        <div className="surface flex flex-col gap-3 rounded-lg p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bold text-slate-950">Soumettre la demande</h2>
            <p className="mt-1 text-sm text-slate-500">
              Une demande soumise ne peut plus etre modifiee depuis le portail.
            </p>
          </div>
          <button
            className="btn btn-primary w-fit"
            type="button"
            onClick={handleSubmitRequest}
            disabled={busyAction === "submit"}
          >
            <Send size={16} aria-hidden="true" />
            {busyAction === "submit" ? "Soumission..." : "Soumettre la demande"}
          </button>
        </div>
      ) : null}

      <button
        className="btn btn-secondary w-fit"
        type="button"
        onClick={() => void loadRequest()}
      >
        <RefreshCw size={16} aria-hidden="true" />
        Actualiser
      </button>
    </section>
  );
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
