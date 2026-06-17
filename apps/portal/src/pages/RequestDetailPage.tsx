import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  FolderOpen,
  RefreshCw,
  Save,
  Send,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Phase3DocumentEvaluationBlock } from "../components/Phase3DocumentEvaluationBlock";
import { RequestStatusBadge } from "../components/RequestStatusBadge";
import {
  getRequestTypeLabel,
  RequestTypeLabel,
} from "../components/RequestTypeLabel";
import {
  downloadPortalDossierDocument,
  getPortalDossier,
  uploadPreEvaluationForm,
  type PortalDossierDetail,
  type PortalDossierMeeting,
} from "../lib/api/dossiers";
import {
  getRequest,
  submitRequestWithCourrier,
  updateRequest,
  type PortalCourrier,
  type PortalDocument,
  type PortalRequest,
  type PortalRequestType,
} from "../lib/api/requests";
import {
  downloadFormalRequestTemplate,
  uploadFormalRequestCourrier,
  uploadFormalRequestDocument,
  type PortalFormalRequestRequirement,
} from "../lib/api/formal-request";
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
  "En cours de traitement par l'ANAC":
    "Votre dossier est en cours de traitement par l'ANAC.",
  "Dossier en cours de traitement":
    "Votre dossier est en cours de traitement par l'ANAC.",
  "Rendez-vous programmé":
    "Un rendez-vous a été programmé. Votre correspondant ANAC vous contactera avec les détails.",
  "Formulaire de pré-évaluation à compléter":
    "Un formulaire de pré-évaluation est disponible. Téléchargez-le, complétez-le et soumettez-le dans l'onglet Actions requises.",
  "En cours d'examen":
    "Votre dossier est en cours d'examen par l'ANAC.",
  "Rendez-vous préliminaire programmé":
    "La réunion préliminaire a été programmée. Votre correspondant ANAC vous contactera.",
  "Phase préliminaire en cours de clôture":
    "La phase préliminaire est en cours de finalisation.",
  "Phase préliminaire clôturée":
    "La phase préliminaire est clôturée.",
  "Demande formelle attendue":
    "La demande formelle doit être téléversée pour poursuivre le traitement.",
  "Demande formelle reçue":
    "Votre demande formelle a été reçue par l'ANAC.",
  "Demande formelle en cours d'examen":
    "Votre demande formelle est en cours d'examen par l'ANAC.",
  "Réunion formelle programmée":
    "La réunion formelle a été programmée. Votre correspondant ANAC vous contactera avec les détails.",
  "Documents de demande formelle à compléter":
    "Des documents de demande formelle sont attendus pour poursuivre le traitement.",
  "En attente de finalisation par l'ANAC":
    "Votre demande formelle est en attente de finalisation par l'ANAC.",
  "Phase de demande formelle clôturée":
    "La phase de demande formelle est clôturée.",
  "Action requise": "Une action est attendue de votre part.",
};

type CourrierMode = "portal_upload" | "physical_deposit";

// ── Process timeline ─────────────────────────────────────────────────────────

type ProcessStep = {
  id: string;
  label: string;
  subtitle?: string;
  state: "done" | "active" | "locked";
};

function buildProcessSteps(
  request: PortalRequest,
  isSubmitted: boolean,
  dossierDetail: PortalDossierDetail | null,
): ProcessStep[] {
  const hasDossier = !!request.dossierId;
  const prelimClosed =
    dossierDetail?.preliminary.status === "preliminary_closed";
  const formalClosed =
    dossierDetail?.formalRequest?.portalLabel ===
    "Phase de demande formelle clôturée";
  const dossierStatus = dossierDetail?.dossier?.status ?? "";
  const phase3Done = ["inspection_phase", "delivery_phase", "closed"].includes(
    dossierStatus,
  );
  const phase3Active = dossierStatus === "document_evaluation_phase";

  return [
    {
      id: "soumission",
      label: "Demande soumise",
      subtitle: isSubmitted
        ? "Votre demande a été reçue par l'ANAC."
        : "En cours de saisie.",
      state: isSubmitted ? "done" : "active",
    },
    {
      id: "orientation",
      label: "Orientation et ouverture du dossier",
      subtitle: hasDossier
        ? "Dossier ouvert à la Direction de la Navigabilité."
        : undefined,
      state: hasDossier ? "done" : isSubmitted ? "active" : "locked",
    },
    {
      id: "preliminaire",
      label: "Phase préliminaire",
      subtitle: prelimClosed ? "Phase préliminaire clôturée." : undefined,
      state: prelimClosed ? "done" : hasDossier ? "active" : "locked",
    },
    {
      id: "formelle",
      label: "Phase de demande formelle",
      subtitle: formalClosed ? "Phase de demande formelle clôturée." : undefined,
      state: formalClosed
        ? "done"
        : prelimClosed
          ? "active"
          : "locked",
    },
    {
      id: "evaluation",
      label: "Phase III — Évaluation approfondie",
      subtitle: phase3Done ? "Évaluation approfondie finalisée." : undefined,
      state: phase3Done ? "done" : phase3Active || formalClosed ? "active" : "locked",
    },
  ];
}

function ProcessTimeline({
  request,
  isSubmitted,
  dossierDetail,
}: {
  request: PortalRequest;
  isSubmitted: boolean;
  dossierDetail: PortalDossierDetail | null;
}): React.JSX.Element {
  const steps = buildProcessSteps(request, isSubmitted, dossierDetail);
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((step) => (
        <li key={step.id} className="process-step">
          {/* Dot */}
          <div className="mt-0.5 flex w-5 flex-shrink-0 flex-col items-center">
            {step.state === "done" ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                <CheckCircle2 size={12} className="text-white" aria-hidden="true" />
              </span>
            ) : step.state === "active" ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-900 bg-white">
                <span className="h-2 w-2 rounded-full bg-slate-900" />
              </span>
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-200 bg-white" />
            )}
          </div>
          {/* Content */}
          <div className="pb-4 min-w-0">
            <p
              className={[
                "text-sm font-medium",
                step.state === "done"
                  ? "text-emerald-700"
                  : step.state === "active"
                    ? "text-slate-900"
                    : "text-slate-400",
              ].join(" ")}
            >
              {step.label}
            </p>
            {step.subtitle ? (
              <p className="mt-0.5 text-xs text-slate-500">{step.subtitle}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

// ── Request detail ────────────────────────────────────────────────────────────

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


function MeetingBlock({
  label,
  meeting,
}: {
  label: string;
  meeting: PortalDossierMeeting;
}): React.JSX.Element {
  const meetingStatusLabels: Record<string, string> = {
    planned: "Planifié",
    invited: "Planifié",
    held: "Tenu",
    postponed: "Reporté",
    cancelled: "Annulé",
  };

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

const REQ_STATUS_LABELS: Record<string, string> = {
  missing: "Manquant",
  submitted: "Déposé",
  under_review: "En revue",
  validated: "Validé",
  requires_correction: "Correction demandée",
  incomplete: "Incomplet",
  rejected: "Rejeté",
};

const REQ_STATUS_CLASSES: Record<string, string> = {
  missing: "bg-slate-100 text-slate-600",
  submitted: "bg-sky-100 text-sky-700",
  under_review: "bg-amber-100 text-amber-700",
  validated: "bg-emerald-100 text-emerald-700",
  requires_correction: "bg-red-100 text-red-700",
  incomplete: "bg-amber-100 text-amber-700",
  rejected: "bg-red-200 text-red-800",
};

function Phase2DocumentChecklist({
  requirements,
  progress,
  expandedRequirementId,
  reqUploadFile,
  reqUploadNotes,
  reqUploadBusy,
  reqUploadError,
  reqUploadFileRef,
  onExpand,
  onFileChange,
  onNotesChange,
  onSubmit,
  onTemplateDownload,
}: {
  requirements: PortalFormalRequestRequirement[];
  progress: {
    totalTracked: number;
    submitted: number;
    validated: number;
    missing: number;
  };
  expandedRequirementId: string | null;
  reqUploadFile: File | null;
  reqUploadNotes: string;
  reqUploadBusy: boolean;
  reqUploadError: string;
  reqUploadFileRef: React.RefObject<HTMLInputElement | null>;
  onExpand: (id: string) => void;
  onFileChange: (file: File | null) => void;
  onNotesChange: (notes: string) => void;
  onSubmit: (requirementId: string, e: React.FormEvent) => void;
  onTemplateDownload: (templateId: string, fileName: string) => void;
}): React.JSX.Element {
  return (
    <div className="rounded-md border border-slate-200">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-950">
          Documents de demande formelle
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {progress.totalTracked} pièce{progress.totalTracked !== 1 ? "s" : ""}{" "}
          suivie{progress.totalTracked !== 1 ? "s" : ""} · {progress.submitted}{" "}
          déposée{progress.submitted !== 1 ? "s" : ""} · {progress.missing}{" "}
          manquante{progress.missing !== 1 ? "s" : ""}
        </p>
      </div>

      <ul className="divide-y divide-slate-100">
        {requirements.map((req) => {
          const isExpanded = expandedRequirementId === req.requirementId;
          const isOmaApprovalForm = req.code === "oma_approval_form";
          const canUpload =
            req.status === "missing" ||
            req.status === "requires_correction" ||
            req.status === "incomplete" ||
            req.status === "rejected" ||
            req.isRepeatable;
          const uploadLabel =
            req.isRepeatable && req.submissions.length > 0
              ? "Ajouter un document"
              : req.status === "requires_correction" ||
                  req.status === "incomplete" ||
                  req.status === "rejected"
                ? "Remplacer le document"
                : "Téléverser";

          return (
            <li key={req.requirementId} className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {req.label}
                    </span>
                    {req.formCode ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                        {req.formCode}
                      </span>
                    ) : null}
                    {req.requirementLevel === "optional" ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                        Optionnel
                      </span>
                    ) : req.requirementLevel === "conditional" ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                        Conditionnel
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        "rounded px-2 py-0.5 text-xs font-semibold",
                        REQ_STATUS_CLASSES[req.status] ??
                          "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {!isOmaApprovalForm && req.status === "submitted"
                        ? "Déposé - disponible pour consultation"
                        : (REQ_STATUS_LABELS[req.status] ?? req.status)}
                    </span>
                    {req.submissions.length > 0 && (
                      <span className="text-xs text-slate-400">
                        {req.submissions.length} dépôt
                        {req.submissions.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {/* Review feedback note - only for the reviewable form */}
                  {isOmaApprovalForm &&
                  (req.status === "requires_correction" ||
                    req.status === "incomplete" ||
                    req.status === "rejected") ? (
                    <div className="mt-1.5 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                      {req.status === "requires_correction"
                        ? "La DN a demandé une correction."
                        : req.status === "incomplete"
                          ? "Document incomplet - veuillez compléter et téléverser une nouvelle version."
                          : "Document rejeté - veuillez téléverser une nouvelle version."}
                      {req.submissions[0]?.reviewComment ? (
                        <span className="block mt-0.5 font-medium">
                          Note : {req.submissions[0].reviewComment}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {req.template ? (
                    <button
                      type="button"
                      className="btn btn-secondary py-1 text-xs"
                      onClick={() =>
                        onTemplateDownload(
                          req.template!.templateId,
                          req.template!.fileName,
                        )
                      }
                    >
                      <Download size={12} aria-hidden="true" />
                      Télécharger le formulaire
                    </button>
                  ) : null}

                  {canUpload &&
                  req.status !== "validated" &&
                  req.status !== "under_review" ? (
                    <button
                      type="button"
                      className="btn btn-primary py-1 text-xs"
                      onClick={() => onExpand(req.requirementId)}
                    >
                      <Upload size={12} aria-hidden="true" />
                      {isExpanded ? (
                        <>
                          Annuler <ChevronUp size={12} aria-hidden="true" />
                        </>
                      ) : (
                        <>
                          {uploadLabel}{" "}
                          <ChevronDown size={12} aria-hidden="true" />
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>

              {isExpanded ? (
                <form
                  className="mt-3 grid gap-3 rounded-md border border-slate-200 p-3"
                  onSubmit={(e) => onSubmit(req.requirementId, e)}
                >
                  {reqUploadError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                      {reqUploadError}
                    </div>
                  ) : null}

                  <div className="field">
                    <label htmlFor={`req-file-${req.requirementId}`}>
                      {req.template ? "Formulaire rempli" : "Document"}{" "}
                      <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id={`req-file-${req.requirementId}`}
                      ref={reqUploadFileRef}
                      className="control"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      required
                      disabled={reqUploadBusy}
                      onChange={(e) =>
                        onFileChange(e.target.files?.[0] ?? null)
                      }
                    />
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      PDF, JPG ou PNG - taille maximale 10 Mo.
                    </p>
                  </div>

                  <div className="field">
                    <label htmlFor={`req-notes-${req.requirementId}`}>
                      Notes optionnelles
                    </label>
                    <textarea
                      id={`req-notes-${req.requirementId}`}
                      className="control min-h-16"
                      value={reqUploadNotes}
                      onChange={(e) => onNotesChange(e.target.value)}
                      maxLength={1000}
                      disabled={reqUploadBusy}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn btn-primary w-fit"
                      type="submit"
                      disabled={reqUploadBusy || !reqUploadFile}
                    >
                      <Upload size={14} aria-hidden="true" />
                      {reqUploadBusy
                        ? "Envoi en cours…"
                        : "Déposer le document"}
                    </button>
                    <button
                      className="btn btn-secondary w-fit"
                      type="button"
                      disabled={reqUploadBusy}
                      onClick={() => onExpand(req.requirementId)}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
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
  const [dossierSubTab, setDossierSubTab] = useState<
    "overview" | "phase1" | "phase2" | "phase3"
  >("phase1");

  const preEvalFileRef = useRef<HTMLInputElement>(null);
  const formalRequestFileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [formalRequestNotes, setFormalRequestNotes] = useState("");
  const [formalRequestError, setFormalRequestError] = useState("");
  const [isFormalRequestUploading, setIsFormalRequestUploading] =
    useState(false);
  const [showFormalRequestUpload, setShowFormalRequestUpload] = useState(false);

  const [expandedRequirementId, setExpandedRequirementId] = useState<
    string | null
  >(null);
  const [reqUploadFile, setReqUploadFile] = useState<File | null>(null);
  const [reqUploadNotes, setReqUploadNotes] = useState("");
  const [reqUploadBusy, setReqUploadBusy] = useState(false);
  const [reqUploadError, setReqUploadError] = useState("");
  const reqUploadFileRef = useRef<HTMLInputElement>(null);

  const request = detail?.request;
  const isSubmitted = request
    ? request.status !== "draft" &&
      request.status !== "courrier_uploaded" &&
      request.status !== "courrier_physical_declared"
    : false;

  const hasFormalDocRequired =
    dossierDetail?.formalRequest?.requirements?.some(
      (r) =>
        r.requirementLevel === "expected" &&
        (r.status === "missing" ||
          r.status === "requires_correction" ||
          r.status === "incomplete" ||
          r.status === "rejected"),
    ) ?? false;

  const hasActionRequired =
    request?.status === "intake_requires_correction" ||
    dossierDetail?.preliminary.canSubmitForm === true ||
    dossierDetail?.formalRequest?.canUploadFormalRequestCourrier === true ||
    hasFormalDocRequired;

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

  // Auto-select the sub-tab for the current active phase
  useEffect(() => {
    if (!dossierDetail) return;
    const s = dossierDetail.dossier.status;
    if (
      ["document_evaluation_phase", "inspection_phase", "delivery_phase", "closed"].includes(s)
    ) {
      setDossierSubTab("phase3");
    } else if (s === "formal_request_phase") {
      setDossierSubTab("phase2");
    } else {
      setDossierSubTab("phase1");
    }
  }, [dossierDetail]);

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

  const handleFormalRequestUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const file = formalRequestFileRef.current?.files?.[0];
    if (!file || !request?.dossierId) {
      setFormalRequestError(
        "Veuillez sélectionner le courrier formel à téléverser.",
      );
      return;
    }

    setFormalRequestError("");
    setIsFormalRequestUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      if (formalRequestNotes.trim()) {
        form.set("notes", formalRequestNotes.trim());
      }
      await uploadFormalRequestCourrier(request.dossierId, form);
      if (formalRequestFileRef.current) formalRequestFileRef.current.value = "";
      setFormalRequestNotes("");
      setShowFormalRequestUpload(false);
      await loadDossier(request.dossierId);
      toast.success("Demande formelle déposée.");
    } catch (caught) {
      setFormalRequestError(getErrorMessage(caught));
    } finally {
      setIsFormalRequestUploading(false);
    }
  };

  const handleRequirementUpload = async (
    requirementId: string,
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (!request?.dossierId || !reqUploadFile) return;
    setReqUploadBusy(true);
    setReqUploadError("");
    try {
      const form = new FormData();
      form.set("file", reqUploadFile);
      if (reqUploadNotes.trim()) form.set("notes", reqUploadNotes.trim());
      await uploadFormalRequestDocument(request.dossierId, requirementId, form);
      if (reqUploadFileRef.current) reqUploadFileRef.current.value = "";
      setReqUploadFile(null);
      setReqUploadNotes("");
      setExpandedRequirementId(null);
      await loadDossier(request.dossierId);
      toast.success("Document déposé.");
    } catch (caught) {
      setReqUploadError(getErrorMessage(caught));
    } finally {
      setReqUploadBusy(false);
    }
  };

  const handleTemplateDownload = async (
    templateId: string,
    fileName: string,
  ) => {
    try {
      const blob = await downloadFormalRequestTemplate(templateId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      toast.error(getErrorMessage(caught));
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
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="page-title">
              <RequestTypeLabel type={request.requestType} />
            </h1>
            <RequestStatusBadge
              status={request.status}
              label={request.portalStatusLabel}
            />
          </div>
          <p className="page-subtitle line-clamp-1">{request.subject}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {/* Tab bar */}
      <div className="portal-tab-bar">
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
                "portal-tab",
                isActive ? "portal-tab-active" : "",
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

          <dl className="grid gap-x-8 gap-y-4 rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm sm:grid-cols-3">
            <div className="field-readonly">
              <dt>Type de demande</dt>
              <dd>{getRequestTypeLabel(request.requestType)}</dd>
            </div>
            <div className="field-readonly">
              <dt>Date de création</dt>
              <dd>{formatDateTime(request.createdAt)}</dd>
            </div>
            <div className="field-readonly">
              <dt>Date de soumission</dt>
              <dd>{request.submittedAt ? formatDateTime(request.submittedAt) : <span className="text-slate-400">Non soumise</span>}</dd>
            </div>
          </dl>

          {isSubmitted ? (
            <div className="surface grid gap-5 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Détails de la demande
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    La demande soumise ne peut plus être modifiée.
                  </p>
                </div>
                <button
                  className="btn btn-secondary py-1 text-xs"
                  type="button"
                  onClick={() => void loadRequest()}
                  disabled={isLoading}
                >
                  <RefreshCw size={12} aria-hidden="true" />
                  Actualiser
                </button>
              </div>
              <dl className="grid gap-4 text-sm sm:grid-cols-2 field-readonly">
                <div>
                  <dt>Type de demande</dt>
                  <dd>{getRequestTypeLabel(requestType)}</dd>
                </div>
                <div>
                  <dt>Objet</dt>
                  <dd>{subject || <span className="text-slate-400">—</span>}</dd>
                </div>
                {message ? (
                  <div className="sm:col-span-2">
                    <dt>Message complémentaire</dt>
                    <dd className="whitespace-pre-line">{message}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : (
            <form
              className="surface grid gap-4 rounded-xl p-5"
              onSubmit={submitBasicUpdate}
            >
              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  Informations
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Modifiables jusqu'à la soumission de la demande.
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
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="btn btn-secondary"
                  type="submit"
                  disabled={busyAction === "update"}
                >
                  <Save size={16} aria-hidden="true" />
                  {busyAction === "update" ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => void loadRequest()}
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  Actualiser
                </button>
              </div>
            </form>
          )}
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
        <div className="flex flex-col gap-6">
          {/* Process timeline */}
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
                  onClick={() => setShowFormalRequestUpload(true)}
                >
                  <Upload size={16} aria-hidden="true" />
                  Téléverser la demande formelle
                </button>
              ) : (
                <form
                  className="mt-4 grid gap-4 rounded-md border border-slate-200 p-4"
                  onSubmit={(event) => void handleFormalRequestUpload(event)}
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
                    <label htmlFor="formalRequestNotes">
                      Notes optionnelles
                    </label>
                    <textarea
                      id="formalRequestNotes"
                      className="control min-h-20"
                      value={formalRequestNotes}
                      onChange={(event) =>
                        setFormalRequestNotes(event.target.value)
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
                        setShowFormalRequestUpload(false);
                        setFormalRequestError("");
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
                poursuivre le traitement. Téléchargez les formulaires
                disponibles, complétez-les, puis téléversez les versions
                renseignées.
              </p>
              <button
                type="button"
                className="btn btn-primary mt-4 w-fit"
                onClick={() => setTab("dossier")}
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
      ) : null}

      {/* Dossier tab */}
      {tab === "dossier" && request.dossierId ? (
        <div className="surface overflow-hidden rounded-xl">
          {/* Sub-tab bar */}
          {dossierDetail ? (
            <div className="sub-tab-bar">
              <button
                type="button"
                className={`sub-tab ${dossierSubTab === "overview" ? "sub-tab-active" : ""}`}
                onClick={() => setDossierSubTab("overview")}
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
                onClick={() => setDossierSubTab("phase1")}
              >
                Phase I — Préliminaire
              </button>
              {dossierDetail.formalRequest ? (
                <button
                  type="button"
                  className={[
                    "sub-tab",
                    dossierSubTab === "phase2" ? "sub-tab-active" : "",
                    dossierDetail.formalRequest.portalLabel ===
                    "Phase de demande formelle clôturée"
                      ? "sub-tab-done"
                      : "",
                  ].join(" ")}
                  onClick={() => setDossierSubTab("phase2")}
                >
                  Phase II — Demande formelle
                </button>
              ) : null}
              {["document_evaluation_phase", "inspection_phase", "delivery_phase", "closed"].includes(
                dossierDetail.dossier.status,
              ) ? (
                <button
                  type="button"
                  className={`sub-tab ${dossierSubTab === "phase3" ? "sub-tab-active" : ""}`}
                  onClick={() => setDossierSubTab("phase3")}
                >
                  Phase III — Évaluation
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Sub-tab content */}
          <div className="p-5">
            {dossierLoading ? (
              <p className="text-sm text-slate-500">
                Chargement du dossier DN…
              </p>
            ) : dossierError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {dossierError}
              </div>
            ) : dossierDetail ? (
              <>
                {/* ── Overview sub-tab ──────────────────────────────────── */}
                {dossierSubTab === "overview" ? (
                  <div className="grid gap-5">
                    <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-3 field-readonly">
                      <div>
                        <dt>Référence dossier</dt>
                        <dd className="font-mono">
                          {dossierDetail.dossier.dossierNumber}
                        </dd>
                      </div>
                      <div>
                        <dt>Type de certification</dt>
                        <dd>
                          {dossierTypeLabels[dossierDetail.dossier.dossierType] ??
                            dossierDetail.dossier.dossierType}
                        </dd>
                      </div>
                      <div>
                        <dt>Ouvert le</dt>
                        <dd>{formatDate(dossierDetail.dossier.openedAt)}</dd>
                      </div>
                    </dl>

                    {/* Compact phase progress strip */}
                    <div className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-3">
                      {[
                        {
                          label: "Phase I — Préliminaire",
                          done: dossierDetail.preliminary.status === "preliminary_closed",
                          active: dossierDetail.preliminary.status !== "preliminary_closed",
                        },
                        {
                          label: "Phase II — Demande formelle",
                          done:
                            dossierDetail.formalRequest?.portalLabel ===
                            "Phase de demande formelle clôturée",
                          active:
                            !!dossierDetail.formalRequest &&
                            dossierDetail.formalRequest.portalLabel !==
                              "Phase de demande formelle clôturée",
                        },
                        {
                          label: "Phase III — Évaluation",
                          done: ["inspection_phase", "delivery_phase", "closed"].includes(
                            dossierDetail.dossier.status,
                          ),
                          active:
                            dossierDetail.dossier.status === "document_evaluation_phase",
                        },
                      ].map((phase) => (
                        <div
                          key={phase.label}
                          className={[
                            "rounded-lg px-3 py-2 text-xs font-medium",
                            phase.done
                              ? "bg-emerald-50 text-emerald-700"
                              : phase.active
                                ? "bg-sky-50 text-sky-800"
                                : "bg-white text-slate-400",
                          ].join(" ")}
                        >
                          {phase.done ? (
                            <span className="mr-1.5">✓</span>
                          ) : phase.active ? (
                            <span className="mr-1.5">→</span>
                          ) : (
                            <span className="mr-1.5 opacity-0">·</span>
                          )}
                          {phase.label}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="btn btn-secondary py-1 text-xs"
                        onClick={() => void loadDossier(request.dossierId!)}
                        disabled={dossierLoading}
                      >
                        <RefreshCw size={12} aria-hidden="true" />
                        Actualiser
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* ── Phase I sub-tab ───────────────────────────────────── */}
                {dossierSubTab === "phase1" ? (
                  <div className="grid gap-4">
                    {dossierDetail.preliminary.status === "preliminary_closed" ? (
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
                      <div>
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
                          Télécharger le compte rendu — Première réunion
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* ── Phase II sub-tab ──────────────────────────────────── */}
                {dossierSubTab === "phase2" ? (
                  <div className="grid gap-4">
                    {dossierDetail.formalRequest ? (
                      <>
                        <div
                          className={[
                            "rounded-xl border px-4 py-3 text-sm",
                            dossierDetail.formalRequest.portalLabel ===
                            "Phase de demande formelle clôturée"
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-sky-200 bg-sky-50",
                          ].join(" ")}
                        >
                          <p
                            className={
                              dossierDetail.formalRequest.portalLabel ===
                              "Phase de demande formelle clôturée"
                                ? "font-semibold text-emerald-800"
                                : "font-semibold text-sky-800"
                            }
                          >
                            {dossierDetail.formalRequest.portalLabel}
                          </p>
                        </div>

                        {dossierDetail.formalRequest.formalMeeting ? (
                          <MeetingBlock
                            label="Réunion de demande formelle"
                            meeting={dossierDetail.formalRequest.formalMeeting}
                          />
                        ) : null}

                        {dossierDetail.formalRequest.requirements.length > 0 ? (
                          <>
                            {downloadError ? (
                              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                                {downloadError}
                              </div>
                            ) : null}
                            <Phase2DocumentChecklist
                              requirements={dossierDetail.formalRequest.requirements}
                              progress={dossierDetail.formalRequest.progress}
                              expandedRequirementId={expandedRequirementId}
                              reqUploadFile={reqUploadFile}
                              reqUploadNotes={reqUploadNotes}
                              reqUploadBusy={reqUploadBusy}
                              reqUploadError={reqUploadError}
                              reqUploadFileRef={reqUploadFileRef}
                              onExpand={(id) => {
                                setExpandedRequirementId(
                                  expandedRequirementId === id ? null : id,
                                );
                                setReqUploadFile(null);
                                setReqUploadNotes("");
                                setReqUploadError("");
                                if (reqUploadFileRef.current)
                                  reqUploadFileRef.current.value = "";
                              }}
                              onFileChange={setReqUploadFile}
                              onNotesChange={setReqUploadNotes}
                              onSubmit={handleRequirementUpload}
                              onTemplateDownload={handleTemplateDownload}
                            />
                          </>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">
                        La Phase II débutera après la clôture de la Phase I.
                      </p>
                    )}
                  </div>
                ) : null}

                {/* ── Phase III sub-tab ─────────────────────────────────── */}
                {dossierSubTab === "phase3" ? (
                  <Phase3DocumentEvaluationBlock dossierId={request.dossierId!} />
                ) : null}
              </>
            ) : null}
          </div>
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
