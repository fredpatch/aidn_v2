import { useCallback, useContext, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AuthContext } from "@/contexts/AuthContext";
import {
  adminReviewFormalRequestDocument,
  downloadDossierDocument,
  getAdminFormalRequestPhase,
  type AdminDossierDetail,
  type AdminDossierDocumentEvidence,
  type AdminFormalRequestPhaseState,
  type AdminFormalRequestRequirement,
  type AdminOmaPhase,
} from "@/lib/api/dossiers.api";
import { hasPermission } from "@/lib/auth/permissions";
import { ApiError } from "@/lib/api/client";
import { openBlobInNewTab } from "@/lib/utils/blob";
import { extractError } from "@/lib/utils/error";
import { preliminaryStatusLabels } from "./dossier-detail.labels";
import { ActionError } from "./dossier-detail.helpers";

// ── Types ─────────────────────────────────────────────────────────────────────

type PreliminaryDocumentField =
  | "firstMeetingReportDocumentId"
  | "preEvaluationTemplateDocumentId"
  | "completedPreEvaluationDocumentId"
  | "preEvaluationDgAnnotatedDocumentId"
  | "preliminaryMeetingReportDocumentId"
  | "closureCourrierDocumentId";

type PreliminaryEvidenceKey =
  | "firstMeetingReportDocument"
  | "preEvaluationTemplateDocument"
  | "completedPreEvaluationDocument"
  | "preEvaluationDgAnnotatedDocument"
  | "preliminaryMeetingReportDocument"
  | "closureCourrierDocument";

type PreliminaryDocumentDefinition = {
  field: PreliminaryDocumentField;
  evidenceKey: PreliminaryEvidenceKey;
  label: string;
  optional?: boolean;
};

const PRELIMINARY_DOCUMENTS: PreliminaryDocumentDefinition[] = [
  {
    field: "firstMeetingReportDocumentId",
    evidenceKey: "firstMeetingReportDocument",
    label: "Compte rendu - 1ère réunion",
  },
  {
    field: "preEvaluationTemplateDocumentId",
    evidenceKey: "preEvaluationTemplateDocument",
    label: "Formulaire pré-évaluation - modèle",
  },
  {
    field: "completedPreEvaluationDocumentId",
    evidenceKey: "completedPreEvaluationDocument",
    label: "Formulaire pré-évaluation - soumis",
  },
  {
    field: "preEvaluationDgAnnotatedDocumentId",
    evidenceKey: "preEvaluationDgAnnotatedDocument",
    label: "Retour DG annoté",
  },
  {
    field: "preliminaryMeetingReportDocumentId",
    evidenceKey: "preliminaryMeetingReportDocument",
    label: "Compte rendu - réunion préliminaire",
  },
  {
    field: "closureCourrierDocumentId",
    evidenceKey: "closureCourrierDocument",
    label: "Courrier de clôture phase I",
    optional: true,
  },
];

// ── Static maps ───────────────────────────────────────────────────────────────

const visibilityLabels: Record<string, string> = {
  internal_only: "Interne uniquement",
  postulant_visible: "Visible postulant",
};

const formalRequestStatusLabels: Record<string, string> = {
  formal_not_started: "Non démarrée",
  formal_waiting_request: "En attente",
  formal_request_received: "Demande reçue",
  formal_sent_to_dg: "Circuit DG",
  formal_dg_returned: "Retour DG",
  formal_dg_decision_recorded: "Décision DG",
  formal_meeting_invited: "Réunion planifiée",
  formal_meeting_held: "Réunion tenue",
  formal_recevability_recorded: "Recevabilité",
  formal_ready_to_close: "Prête à clôturer",
  formal_closed: "Clôturée",
  formal_requires_correction: "Correction requise",
  formal_suspended: "Suspendue",
};

const formalSubmissionStatusLabels: Record<string, string> = {
  missing: "Manquant",
  submitted: "Déposé",
  under_review: "En revue",
  validated: "Validé",
  requires_correction: "Correction demandée",
  incomplete: "Incomplet",
  rejected: "Rejeté",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatUploadedAt = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);
};

// ── Badges ────────────────────────────────────────────────────────────────────

function DocumentStatusBadge({
  documentId,
  optional,
}: {
  documentId?: string;
  optional?: boolean;
}): React.JSX.Element {
  if (documentId) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
      >
        Disponible
      </Badge>
    );
  }
  if (optional) {
    return <Badge variant="outline">Optionnel</Badge>;
  }
  return <Badge variant="secondary">Manquant</Badge>;
}

function VisibilityBadge({
  visibility,
}: {
  visibility?: string;
}): React.JSX.Element | null {
  if (!visibility) return null;
  const label = visibilityLabels[visibility] ?? visibility;
  if (visibility === "postulant_visible") {
    return (
      <Badge
        variant="outline"
        className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200"
      >
        {label}
      </Badge>
    );
  }
  return <Badge variant="outline">{label}</Badge>;
}

function FormalStatusBadge({ status }: { status: string }): React.JSX.Element {
  const label = formalSubmissionStatusLabels[status] ?? status;
  if (status === "validated") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
      >
        {label}
      </Badge>
    );
  }
  if (status === "requires_correction" || status === "rejected") {
    return <Badge variant="destructive">{label}</Badge>;
  }
  if (status === "incomplete") {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
      >
        {label}
      </Badge>
    );
  }
  if (status === "submitted" || status === "under_review") {
    return <Badge variant="secondary">{label}</Badge>;
  }
  return <Badge variant="outline">{label}</Badge>;
}

function RequirementLevelBadge({
  level,
}: {
  level: string;
}): React.JSX.Element | null {
  if (level === "conditional") {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
      >
        Conditionnel
      </Badge>
    );
  }
  if (level === "optional") {
    return <Badge variant="outline">Optionnel</Badge>;
  }
  return null;
}

// ── Document rows ─────────────────────────────────────────────────────────────

function PhaseDocumentRow({
  dossierId,
  phase,
  evidence,
  definition,
  downloadingId,
  onDownload,
}: {
  dossierId: string;
  phase: AdminOmaPhase | null;
  evidence: AdminDossierDocumentEvidence | null | undefined;
  definition: PreliminaryDocumentDefinition;
  downloadingId: string;
  onDownload: (dossierId: string, documentId: string) => void;
}): React.JSX.Element {
  const documentId = phase?.[definition.field];
  const isDownloading = Boolean(documentId) && downloadingId === documentId;
  const uploadedDate = formatUploadedAt(evidence?.uploadedAt);

  return (
    <li className="flex flex-col gap-3 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {definition.label}
          </span>
          <DocumentStatusBadge
            documentId={documentId}
            optional={definition.optional}
          />
          {evidence ? (
            <VisibilityBadge visibility={evidence.visibility} />
          ) : null}
        </div>
        {evidence && uploadedDate ? (
          <p className="text-xs text-muted-foreground">
            Déposé le {uploadedDate}
          </p>
        ) : null}
        {!documentId ? (
          <p className="text-xs text-muted-foreground">
            {definition.optional
              ? "Document optionnel non joint."
              : "Aucun document lié à ce dossier pour le moment."}
          </p>
        ) : null}
      </div>

      {documentId ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full shrink-0 sm:w-auto"
          disabled={isDownloading}
          onClick={() => onDownload(dossierId, documentId)}
        >
          <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {isDownloading ? "Téléchargement..." : "Télécharger"}
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">Non disponible</span>
      )}
    </li>
  );
}

// Gate document row — uses formalState.gate for meta, gate requirement's
// submission for download (gate.formalRequestCourrierId is a Courrier ID,
// not a Document ID, so it cannot be passed to downloadDossierDocument).
function GateDocumentRow({
  dossierId,
  gate,
  gateReq,
  downloadingId,
  onDownload,
}: {
  dossierId: string;
  gate: AdminFormalRequestPhaseState["gate"];
  gateReq: AdminFormalRequestRequirement | undefined;
  downloadingId: string;
  onDownload: (dossierId: string, documentId: string) => void;
}): React.JSX.Element {
  const latestSubmission = gateReq?.submissions
    .filter((s) => s.status !== "replaced" && s.status !== "archived")
    .sort((a, b) => ((b.uploadedAt ?? "") > (a.uploadedAt ?? "") ? 1 : -1))[0];

  const receivedDate = formatUploadedAt(gate.receivedAt);
  const isDownloading =
    !!latestSubmission && downloadingId === latestSubmission.documentId;

  return (
    <li className="flex flex-col gap-3 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            Courrier de demande formelle
          </span>
          {gate.exists ? (
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
            >
              Reçu
            </Badge>
          ) : (
            <Badge variant="secondary">Manquant</Badge>
          )}
          {gate.source === "portal_upload" ? (
            <Badge
              variant="outline"
              className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200"
            >
              Portail
            </Badge>
          ) : null}
        </div>
        {gate.exists && receivedDate ? (
          <p className="text-xs text-muted-foreground">Reçu le {receivedDate}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {gate.exists
            ? "La demande formelle déclenche le circuit."
            : "La demande formelle déclenche le circuit. En attente de réception."}
        </p>
      </div>
      {gate.exists && latestSubmission ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full shrink-0 sm:w-auto"
          disabled={isDownloading}
          onClick={() => onDownload(dossierId, latestSubmission.documentId)}
        >
          <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {isDownloading ? "Téléchargement..." : "Télécharger"}
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">
          {gate.exists ? "Non disponible" : "—"}
        </span>
      )}
    </li>
  );
}

type ReviewPending = "validate" | "correction" | "incomplete" | null;

function Phase2RequirementRow({
  dossierId,
  req,
  isReviewable,
  canReview,
  downloadingId,
  onDownload,
  onReviewed,
}: {
  dossierId: string;
  req: AdminFormalRequestRequirement;
  isReviewable: boolean;
  canReview: boolean;
  downloadingId: string;
  onDownload: (dossierId: string, documentId: string) => void;
  onReviewed: () => void;
}): React.JSX.Element {
  const [reviewPending, setReviewPending] = useState<ReviewPending>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const activeSubmissions = req.submissions.filter(
    (s) => s.status !== "replaced" && s.status !== "archived",
  );
  const latestSubmission = activeSubmissions.sort((a, b) =>
    (b.uploadedAt ?? "") > (a.uploadedAt ?? "") ? 1 : -1,
  )[0];

  const handleReview = async () => {
    if (!reviewPending || !latestSubmission) return;
    const needsComment =
      reviewPending === "correction" || reviewPending === "incomplete";
    if (needsComment && !reviewComment.trim()) return;
    const statusMap = {
      validate: "validated",
      correction: "requires_correction",
      incomplete: "incomplete",
    } as const;
    setReviewBusy(true);
    setReviewError("");
    try {
      await adminReviewFormalRequestDocument(latestSubmission.submissionId, {
        status: statusMap[reviewPending],
        comment: needsComment ? reviewComment.trim() : undefined,
      });
      setReviewPending(null);
      setReviewComment("");
      onReviewed();
    } catch (err) {
      setReviewError(
        extractError(err, "Impossible d'enregistrer la décision."),
      );
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <li className="space-y-2 border-b py-3 last:border-b-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {req.label}
            </span>
            {req.formCode ? (
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                {req.formCode}
              </span>
            ) : null}
            <FormalStatusBadge status={req.status} />
            <RequirementLevelBadge level={req.requirementLevel} />
          </div>
          {activeSubmissions.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {activeSubmissions.length} dépôt
              {activeSubmissions.length !== 1 ? "s" : ""}
              {latestSubmission?.uploadedAt
                ? ` · Dernier : ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(latestSubmission.uploadedAt))}`
                : ""}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Aucun fichier déposé.
            </p>
          )}
          {isReviewable &&
          (req.status === "requires_correction" ||
            req.status === "incomplete") &&
          latestSubmission?.reviewComment ? (
            <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Note DN : {latestSubmission.reviewComment}
            </p>
          ) : null}
        </div>

        {activeSubmissions.length > 0 ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {activeSubmissions.map((s) => (
              <Button
                key={s.submissionId}
                type="button"
                size="sm"
                variant="outline"
                disabled={downloadingId === s.documentId}
                onClick={() => onDownload(dossierId, s.documentId)}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {downloadingId === s.documentId
                  ? "Téléchargement..."
                  : "Télécharger"}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {isReviewable &&
      canReview &&
      latestSubmission &&
      req.status !== "validated" ? (
        <div className="space-y-2 rounded-md border bg-muted/10 p-3">
          {reviewPending === null ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={() => setReviewPending("validate")}
                disabled={reviewBusy}
              >
                Valider
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReviewPending("correction")}
                disabled={reviewBusy}
              >
                Demander correction
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReviewPending("incomplete")}
                disabled={reviewBusy}
              >
                Marquer incomplet
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {reviewPending === "validate"
                  ? "Confirmer la validation du formulaire DN-AIR-R2-3-F-E-010"
                  : reviewPending === "correction"
                    ? "Demander une correction"
                    : "Marquer le formulaire comme incomplet"}
              </p>
              {reviewPending !== "validate" ? (
                <div className="space-y-1">
                  <Label
                    htmlFor={`review-comment-${req.requirementId}`}
                    className="text-xs"
                  >
                    Commentaire (obligatoire)
                  </Label>
                  <Textarea
                    id={`review-comment-${req.requirementId}`}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={2}
                    className="text-sm"
                    placeholder="Indiquer ce qui est attendu ou incomplet…"
                  />
                </div>
              ) : null}
              {reviewError ? (
                <p className="text-xs text-destructive">{reviewError}</p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => void handleReview()}
                  disabled={
                    reviewBusy ||
                    (reviewPending !== "validate" && !reviewComment.trim())
                  }
                >
                  {reviewBusy ? "En cours…" : "Confirmer"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReviewPending(null);
                    setReviewComment("");
                    setReviewError("");
                  }}
                  disabled={reviewBusy}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}

// ── Layout primitives ─────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: "positive" | "warning" | "destructive";
}): React.JSX.Element {
  const colorClass =
    emphasis === "destructive"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
      : emphasis === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        : emphasis === "positive"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200";
  return (
    <div className={`rounded-lg border p-3 ${colorClass}`}>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function PhaseAccordionCard({
  title,
  statusLabel,
  summaryLine,
  defaultOpen,
  children,
}: {
  title: string;
  statusLabel?: string;
  summaryLine?: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <button
        type="button"
        className="flex w-full items-start justify-between px-6 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="min-w-0 space-y-0.5 pr-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </span>
            {statusLabel ? (
              <Badge variant="secondary" className="text-xs">
                {statusLabel}
              </Badge>
            ) : null}
          </div>
          {summaryLine ? (
            <p className="text-xs text-muted-foreground">{summaryLine}</p>
          ) : null}
        </div>
        {open ? (
          <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open ? (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          {children}
        </CardContent>
      ) : null}
    </Card>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function DossierDocumentsTab({
  detail,
  dossierId,
}: {
  detail: AdminDossierDetail;
  dossierId: string;
}): React.JSX.Element {
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const canReview = hasPermission(user, "DOCUMENT_REVIEW");

  const [downloadingId, setDownloadingId] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [formalState, setFormalState] =
    useState<AdminFormalRequestPhaseState | null>(null);
  const [formalLoading, setFormalLoading] = useState(true);

  const loadFormalPhase = useCallback(async () => {
    setFormalLoading(true);
    try {
      const state = await getAdminFormalRequestPhase(dossierId);
      setFormalState(state);
    } catch {
      // Phase 2 not started — no-op
    } finally {
      setFormalLoading(false);
    }
  }, [dossierId]);

  useEffect(() => {
    void loadFormalPhase();
  }, [loadFormalPhase]);

  const preliminaryPhase = detail.preliminary?.phase ?? null;
  const documentEvidence = detail.preliminary?.documentEvidence ?? null;

  const handleDownload = async (did: string, documentId: string) => {
    setDownloadingId(documentId);
    setDownloadError("");
    try {
      const { blob, fileName } = await downloadDossierDocument(did, documentId);
      openBlobInNewTab(blob, fileName);
    } catch (err) {
      setDownloadError(
        err instanceof ApiError
          ? err.message
          : "Une erreur est survenue. Réessayez.",
      );
    } finally {
      setDownloadingId("");
    }
  };

  // ── Accordion default open state ──────────────────────────────────────────
  // Only the active/current phase opens by default.
  // formal_request_phase → Phase 2 open, Phase 1 collapsed.
  // opened / preliminary_phase → Phase 1 open.
  // All other statuses (doc eval, inspection, delivery, closed) → Phase 2 open.
  const dossierStatus = detail.dossier.status;
  const phase1DefaultOpen =
    dossierStatus === "opened" || dossierStatus === "preliminary_phase";
  const phase2DefaultOpen = !phase1DefaultOpen;

  // ── Summary stats ─────────────────────────────────────────────────────────
  const phase1Deposited = PRELIMINARY_DOCUMENTS.filter(
    (def) => !!preliminaryPhase?.[def.field],
  ).length;
  const phase1Missing = PRELIMINARY_DOCUMENTS.filter(
    (def) => !preliminaryPhase?.[def.field] && !def.optional,
  ).length;

  // Corrections: only requires_correction (not incomplete) per business rule.
  const phase2Corrections = formalState
    ? formalState.requirements.filter(
        (r) =>
          r.requirementLevel !== "gate" && r.status === "requires_correction",
      ).length
    : 0;

  const totalTracked =
    PRELIMINARY_DOCUMENTS.length + (formalState?.progress.totalTracked ?? 0);
  const totalDeposited =
    phase1Deposited + (formalState?.progress.submitted ?? 0);
  const totalMissing = phase1Missing + (formalState?.progress.missing ?? 0);

  // ── Phase 1 accordion summary ─────────────────────────────────────────────
  const phase1StatusLabel =
    (preliminaryPhase?.preliminaryStatus
      ? preliminaryStatusLabels[preliminaryPhase.preliminaryStatus]
      : null) ?? "Phase préliminaire";
  const phase1SummaryLine = `${phase1Deposited}/${PRELIMINARY_DOCUMENTS.length} documents disponibles`;

  // ── Phase 2 accordion summary ─────────────────────────────────────────────
  const phase2StatusLabel = formalState?.phase.formalRequestStatus
    ? (formalRequestStatusLabels[formalState.phase.formalRequestStatus] ??
      null)
    : null;

  const phase2SummaryParts: string[] = [];
  if (formalState) {
    phase2SummaryParts.push(
      `${formalState.progress.submitted}/${formalState.progress.totalTracked} pièces déposées`,
    );
    if (formalState.progress.missing > 0) {
      phase2SummaryParts.push(
        `${formalState.progress.missing} manquante${formalState.progress.missing !== 1 ? "s" : ""}`,
      );
    }
    if (phase2Corrections > 0) {
      phase2SummaryParts.push(
        `${phase2Corrections} correction${phase2Corrections !== 1 ? "s" : ""}`,
      );
    }
    const lastActivity = formalState.requirements
      .flatMap((r) => r.submissions.map((s) => s.uploadedAt ?? ""))
      .filter(Boolean)
      .sort()
      .at(-1);
    if (lastActivity) {
      const formatted = formatUploadedAt(lastActivity);
      if (formatted) {
        phase2SummaryParts.push(`Dernière activité : ${formatted}`);
      }
    }
  } else if (formalLoading) {
    phase2SummaryParts.push("Chargement…");
  } else {
    phase2SummaryParts.push("Non démarrée · Aucune pièce suivie pour le moment");
  }
  const phase2SummaryLine = phase2SummaryParts.join(" · ");

  // ── Phase 2 document grouping ─────────────────────────────────────────────
  // Gate download uses the gate requirement's submission documentId —
  // formalState.gate.formalRequestCourrierId is a Courrier ID, not a Document ID.
  const gateReq = formalState?.requirements.find(
    (r) => r.requirementLevel === "gate",
  );
  const nonGateReqs =
    formalState?.requirements.filter((r) => r.requirementLevel !== "gate") ??
    [];
  const omaApprovalFormReq = nonGateReqs.find(
    (r) => r.code === "oma_approval_form",
  );
  const consultationReqs = nonGateReqs.filter(
    (r) => r.code !== "oma_approval_form",
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Documents du dossier
        </h2>
        <p className="text-sm text-muted-foreground">
          Documents et preuves liés aux phases OMA du dossier.
        </p>
      </div>

      {downloadError ? <ActionError message={downloadError} /> : null}

      {/* Résumé documentaire */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatChip label="Documents suivis" value={totalTracked} />
        <StatChip
          label="Déposés"
          value={totalDeposited}
          emphasis={
            totalTracked > 0 && totalDeposited === totalTracked
              ? "positive"
              : undefined
          }
        />
        <StatChip
          label="Manquants"
          value={totalMissing}
          emphasis={totalMissing > 0 ? "warning" : undefined}
        />
        <StatChip
          label="Corrections"
          value={phase2Corrections}
          emphasis={phase2Corrections > 0 ? "destructive" : undefined}
        />
      </div>

      {/* Phase préliminaire */}
      <PhaseAccordionCard
        title="Phase préliminaire"
        statusLabel={phase1StatusLabel}
        summaryLine={phase1SummaryLine}
        defaultOpen={phase1DefaultOpen}
      >
        <ul>
          {PRELIMINARY_DOCUMENTS.map((definition) => (
            <PhaseDocumentRow
              key={definition.field}
              dossierId={detail.dossier.id}
              phase={preliminaryPhase}
              evidence={documentEvidence?.[definition.evidenceKey]}
              definition={definition}
              downloadingId={downloadingId}
              onDownload={(did, documentId) =>
                void handleDownload(did, documentId)
              }
            />
          ))}
        </ul>
      </PhaseAccordionCard>

      {/* Phase 2 — Demande formelle */}
      <PhaseAccordionCard
        title="Phase 2 — Demande formelle"
        statusLabel={phase2StatusLabel ?? undefined}
        summaryLine={phase2SummaryLine}
        defaultOpen={phase2DefaultOpen}
      >
        {formalLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Chargement des documents…
          </p>
        ) : !formalState ? (
          <p className="py-4 text-sm text-muted-foreground">
            Cette phase n'est pas encore démarrée. Aucune pièce suivie pour le
            moment.
          </p>
        ) : (
          <div className="space-y-6">
            {/* Documents de passage */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Documents de passage
              </p>
              <ul>
                <GateDocumentRow
                  dossierId={dossierId}
                  gate={formalState.gate}
                  gateReq={gateReq}
                  downloadingId={downloadingId}
                  onDownload={(did, docId) => void handleDownload(did, docId)}
                />
              </ul>
            </div>

            {/* Pièces de suivi */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pièces de suivi
              </p>
              {nonGateReqs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune pièce de suivi pour le moment.
                </p>
              ) : (
                <div className="space-y-4">
                  {omaApprovalFormReq ? (
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">
                        <FileText
                          className="mr-1 inline h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        Formulaire soumis à décision DN
                      </p>
                      <ul>
                        <Phase2RequirementRow
                          dossierId={dossierId}
                          req={omaApprovalFormReq}
                          isReviewable={true}
                          canReview={canReview}
                          downloadingId={downloadingId}
                          onDownload={(did, docId) =>
                            void handleDownload(did, docId)
                          }
                          onReviewed={() => void loadFormalPhase()}
                        />
                      </ul>
                    </div>
                  ) : null}
                  {consultationReqs.length > 0 ? (
                    <ul>
                      {consultationReqs.map((req) => (
                        <Phase2RequirementRow
                          key={req.requirementId}
                          dossierId={dossierId}
                          req={req}
                          isReviewable={false}
                          canReview={false}
                          downloadingId={downloadingId}
                          onDownload={(did, docId) =>
                            void handleDownload(did, docId)
                          }
                          onReviewed={() => void loadFormalPhase()}
                        />
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </PhaseAccordionCard>

      {/* Phase 3 — Évaluation approfondie */}
      <PhaseAccordionCard
        title="Phase 3 — Évaluation approfondie"
        summaryLine="Non démarrée · Aucun document suivi pour le moment"
        defaultOpen={false}
      >
        <p className="py-2 text-sm text-muted-foreground">
          Cette phase n'est pas encore démarrée. Aucune pièce suivie pour le
          moment.
        </p>
      </PhaseAccordionCard>

      {/* Phase 4 — Démonstration / inspection */}
      <PhaseAccordionCard
        title="Phase 4 — Démonstration / inspection"
        summaryLine="Non démarrée · Aucun document suivi pour le moment"
        defaultOpen={false}
      >
        <p className="py-2 text-sm text-muted-foreground">
          Cette phase n'est pas encore démarrée. Aucune pièce suivie pour le
          moment.
        </p>
      </PhaseAccordionCard>

      {/* Phase 5 — Délivrance */}
      <PhaseAccordionCard
        title="Phase 5 — Délivrance"
        summaryLine="Non démarrée · Aucun document suivi pour le moment"
        defaultOpen={false}
      >
        <p className="py-2 text-sm text-muted-foreground">
          Cette phase n'est pas encore démarrée. Aucune pièce suivie pour le
          moment.
        </p>
      </PhaseAccordionCard>
    </div>
  );
}
