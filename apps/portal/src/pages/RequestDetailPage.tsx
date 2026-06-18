import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import {
  downloadPortalDossierDocument,
  getPortalDossier,
  uploadPreEvaluationForm,
  type PortalDossierDetail,
} from "../lib/api/dossiers";
import {
  downloadFormalRequestTemplate,
  uploadFormalRequestCourrier,
  uploadFormalRequestDocument,
} from "../lib/api/formal-request";
import {
  getRequest,
  submitRequestWithCourrier,
  updateRequest,
  type PortalRequestType,
} from "../lib/api/requests";
import { portalRoutes } from "../lib/routes";
import { getErrorMessage } from "./request-detail/helpers";
import { RequestActionsTab } from "./request-detail/RequestActionsTab";
import { RequestCourrierTab } from "./request-detail/RequestCourrierTab";
import { RequestDetailHeader } from "./request-detail/RequestDetailHeader";
import {
  RequestDossierTab,
  type DossierSubTab,
} from "./request-detail/RequestDossierTab";
import { RequestHistoryTab } from "./request-detail/RequestHistoryTab";
import {
  RequestSummaryTab,
  type RequestSummaryFormValues,
} from "./request-detail/RequestSummaryTab";
import { RequestWorkflowTabs } from "./request-detail/RequestWorkflowTabs";
import type {
  CourrierMode,
  RequestDetail,
  RequestDetailTab,
} from "./request-detail/types";

const subjectRequiredMessage =
  "Objet de la demande requis, minimum 3 caractères.";
const initialCourrierRequiredMessage =
  "Veuillez sélectionner le courrier initial à téléverser.";
const expectedDepositDateRequiredMessage =
  "La date prévue de dépôt est requise.";
const depositLocationRequiredMessage = "Le lieu de dépôt est requis.";
const formalRequestFileRequiredMessage =
  "Veuillez sélectionner le courrier formel à téléverser.";

export function RequestDetailPage(): React.JSX.Element {
  const { id } = useParams();
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [tab, setTab] = useState<RequestDetailTab>("resume");
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
  const [dossierSubTab, setDossierSubTab] =
    useState<DossierSubTab>("phase1");

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
      (requirement) =>
        requirement.requirementLevel === "expected" &&
        (requirement.status === "missing" ||
          requirement.status === "requires_correction" ||
          requirement.status === "incomplete" ||
          requirement.status === "rejected"),
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

  useEffect(() => {
    if (!dossierDetail) return;

    const status = dossierDetail.dossier.status;
    if (
      [
        "document_evaluation_phase",
        "inspection_phase",
        "delivery_phase",
        "closed",
      ].includes(status)
    ) {
      setDossierSubTab("phase3");
    } else if (status === "formal_request_phase") {
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

  const submitBasicUpdate = async (values: RequestSummaryFormValues) => {
    if (!id || !request || isSubmitted) return;

    if (values.subject.trim().length < 3) {
      setError(subjectRequiredMessage);
      return;
    }

    setError("");
    setBusyAction("update");
    try {
      const { request: updated } = await updateRequest(id, {
        requestType: values.requestType,
        subject: values.subject.trim(),
        message: values.message.trim() || undefined,
      });
      setDetail((current) =>
        current ? { ...current, request: updated } : current,
      );
      setRequestType(updated.requestType);
      setSubject(updated.subject);
      setMessage(updated.message ?? "");
      toast.success("Demande mise à jour.");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setBusyAction(null);
    }
  };

  const handleSubmitRequest = async () => {
    if (!id || !request || isSubmitted) return;

    if (subject.trim().length < 3) {
      setError(subjectRequiredMessage);
      setTab("resume");
      return;
    }

    if (
      courrierMode === "portal_upload" &&
      !uploadFile &&
      !request.initialDocumentId
    ) {
      setError(initialCourrierRequiredMessage);
      setTab("courrier");
      return;
    }

    if (courrierMode === "physical_deposit" && !expectedDepositDate) {
      setError(expectedDepositDateRequiredMessage);
      setTab("courrier");
      return;
    }

    if (courrierMode === "physical_deposit" && !depositLocation) {
      setError(depositLocationRequiredMessage);
      setTab("courrier");
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
      toast.error(getErrorMessage(caught));
    } finally {
      setBusyAction(null);
    }
  };

  const handlePreEvalUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

  const handleFormalRequestUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const file = formalRequestFileRef.current?.files?.[0];
    if (!file || !request?.dossierId) {
      setFormalRequestError(formalRequestFileRequiredMessage);
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
    event: React.FormEvent,
  ) => {
    event.preventDefault();
    if (!request?.dossierId || !reqUploadFile) return;

    setReqUploadBusy(true);
    setReqUploadError("");
    try {
      const form = new FormData();
      form.set("file", reqUploadFile);
      if (reqUploadNotes.trim()) {
        form.set("notes", reqUploadNotes.trim());
      }

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
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
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
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      const message = getErrorMessage(caught);
      setDownloadError(message);
      toast.error(message);
    }
  };

  const evidenceLabel = useMemo(() => {
    if (!request) return "Aucun courrier ajouté";
    if (request.initialDocumentId) return "Courrier initial téléversé";
    if (request.courrierSource === "physical_deposit") {
      return "Dépôt physique prévu";
    }
    return "Aucun courrier ajouté";
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
      <RequestDetailHeader request={request} backTo={portalRoutes.requests} />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <RequestWorkflowTabs
        activeTab={tab}
        hasActionRequired={hasActionRequired}
        hasDossier={Boolean(request.dossierId)}
        onTabChange={setTab}
      />

      {tab === "resume" ? (
        <RequestSummaryTab
          request={request}
          isSubmitted={isSubmitted}
          requestType={requestType}
          subject={subject}
          message={message}
          busyAction={busyAction}
          isLoading={isLoading}
          onRequestTypeChange={setRequestType}
          onSubjectChange={setSubject}
          onMessageChange={setMessage}
          onSubmitBasicUpdate={submitBasicUpdate}
          onReload={() => void loadRequest()}
        />
      ) : null}

      {tab === "courrier" ? (
        <RequestCourrierTab
          evidenceLabel={evidenceLabel}
          document={detail?.document}
          courrier={detail?.courrier}
          isSubmitted={isSubmitted}
          courrierMode={courrierMode}
          uploadFile={uploadFile}
          expectedDepositDate={expectedDepositDate}
          depositLocation={depositLocation}
          courrierNotes={courrierNotes}
          busyAction={busyAction}
          onCourrierModeChange={(mode) => {
            setCourrierMode(mode);
            setError("");
          }}
          onUploadFileChange={(file) => {
            setUploadFile(file);
            setError("");
          }}
          onExpectedDepositDateChange={(date) => {
            setExpectedDepositDate(date);
            setError("");
          }}
          onDepositLocationChange={(location) => {
            setDepositLocation(location);
            setError("");
          }}
          onCourrierNotesChange={(notes) => {
            setCourrierNotes(notes);
            setError("");
          }}
          onSubmitRequest={() => void handleSubmitRequest()}
        />
      ) : null}

      {tab === "actions" ? (
        <RequestActionsTab
          request={request}
          isSubmitted={isSubmitted}
          dossierDetail={dossierDetail}
          hasFormalDocRequired={hasFormalDocRequired}
          hasActionRequired={hasActionRequired}
          showFormalRequestUpload={showFormalRequestUpload}
          formalRequestFileRef={formalRequestFileRef}
          formalRequestNotes={formalRequestNotes}
          formalRequestError={formalRequestError}
          isFormalRequestUploading={isFormalRequestUploading}
          preEvalFileRef={preEvalFileRef}
          downloadError={downloadError}
          uploadError={uploadError}
          isUploading={isUploading}
          onShowFormalRequestUploadChange={setShowFormalRequestUpload}
          onFormalRequestNotesChange={setFormalRequestNotes}
          onClearFormalRequestError={() => setFormalRequestError("")}
          onFormalRequestUpload={(event) =>
            void handleFormalRequestUpload(event)
          }
          onPreEvalUpload={(event) => void handlePreEvalUpload(event)}
          onDownload={(documentId, filename) =>
            void handleDownload(documentId, filename)
          }
          onOpenDossierTab={() => setTab("dossier")}
        />
      ) : null}

      {tab === "dossier" && request.dossierId ? (
        <RequestDossierTab
          dossierId={request.dossierId}
          dossierDetail={dossierDetail}
          dossierLoading={dossierLoading}
          dossierError={dossierError}
          downloadError={downloadError}
          dossierSubTab={dossierSubTab}
          expandedRequirementId={expandedRequirementId}
          reqUploadFile={reqUploadFile}
          reqUploadNotes={reqUploadNotes}
          reqUploadBusy={reqUploadBusy}
          reqUploadError={reqUploadError}
          reqUploadFileRef={reqUploadFileRef}
          onDossierSubTabChange={setDossierSubTab}
          onRefreshDossier={() => void loadDossier(request.dossierId!)}
          onDownload={(documentId, filename) =>
            void handleDownload(documentId, filename)
          }
          onRequirementExpand={(requirementId) => {
            setExpandedRequirementId(
              expandedRequirementId === requirementId ? null : requirementId,
            );
            setReqUploadFile(null);
            setReqUploadNotes("");
            setReqUploadError("");
            if (reqUploadFileRef.current) reqUploadFileRef.current.value = "";
          }}
          onRequirementFileChange={setReqUploadFile}
          onRequirementNotesChange={setReqUploadNotes}
          onRequirementSubmit={handleRequirementUpload}
          onTemplateDownload={handleTemplateDownload}
        />
      ) : null}

      {tab === "historique" ? <RequestHistoryTab /> : null}
    </section>
  );
}
